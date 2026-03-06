import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { createDiscreteApi } from "naive-ui";
import { login } from "@/api/auth/index";
import qs from "qs"; // 添加 qs 库用于序列化表单数据
import { generateFingerprintHeader } from "@/utils/fingerprint"; // 导入指纹生成函数
import { renderHtmlResponseOverlay, renderRegionRestrictionOverlay } from "@/utils/htmlResponse";

// 从环境变量获取配置
const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 50000;
const IS_DEVELOPMENT = import.meta.env.VITE_APP_ENV === "development";

// 是否显示重新登录
export const isRelogin = { show: false };

// 是否正在执行登出操作，防止死循环
export const isLoggingOut = { value: false };

// 获取token - 直接从 localStorage 读取，避免循环依赖
const getToken = () => {
  return localStorage.getItem("token");
};

// 清除token
const removeToken = () => {
  localStorage.removeItem("token");
};

// 支持的语言列表（与 i18n.ts 保持一致，中文已禁用）
const SUPPORTED_LANGUAGES = {
  // 'zh-CN': 'zh-CN',
  'en-US': 'en-US',
  'vi-VN': 'vi-VN',
  'pt-PT': 'pt-PT',
  'ja-JP': 'ja-JP',
  'hi-IN': 'hi-IN'
} as const;

type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// 浏览器语言到支持语言的映射（与 i18n.ts 保持一致）
const BROWSER_LANG_MAP: Record<string, SupportedLanguage> = {
  'zh': 'en-US',       // 中文浏览器显示英文
  'zh-CN': 'en-US',
  'zh-TW': 'en-US',
  'zh-HK': 'en-US',
  'en': 'en-US',
  'en-US': 'en-US',
  'en-GB': 'en-US',
  'vi': 'vi-VN',
  'vi-VN': 'vi-VN',
  'pt': 'pt-PT',
  'pt-PT': 'pt-PT',
  'pt-BR': 'pt-PT',
  'ja': 'ja-JP',
  'ja-JP': 'ja-JP',
  'hi': 'hi-IN',
  'hi-IN': 'hi-IN'
};

// 检测浏览器语言（与 i18n.ts 保持一致）
const detectBrowserLanguage = (): SupportedLanguage | null => {
  if (typeof navigator === 'undefined') {
    return null;
  }

  const browserLanguages = navigator.languages || [navigator.language];

  for (const lang of browserLanguages) {
    // 完全匹配
    if (SUPPORTED_LANGUAGES[lang as SupportedLanguage]) {
      return lang as SupportedLanguage;
    }

    // 映射匹配
    const mappedLang = BROWSER_LANG_MAP[lang];
    if (mappedLang) {
      return mappedLang;
    }

    // 前缀匹配
    const prefix = lang.split('-')[0];
    if (BROWSER_LANG_MAP[prefix]) {
      return BROWSER_LANG_MAP[prefix];
    }
  }

  return null;
};

// 获取语言设置（与 i18n.ts 保持一致）
const USER_LANGUAGE_KEY = 'user_selected_language';

const getLanguage = (): SupportedLanguage => {
  // 1. 检查用户手动选择的语言
  const userSelectedLang = localStorage.getItem(USER_LANGUAGE_KEY) as SupportedLanguage;
  if (userSelectedLang && SUPPORTED_LANGUAGES[userSelectedLang]) {
    return userSelectedLang;
  }

  // 2. 检测浏览器语言
  const browserLang = detectBrowserLanguage();
  if (browserLang) {
    return browserLang;
  }

  // 3. 兜底英语
  return 'en-US';
};

// 获取Accept-Language格式的语言设置
const getAcceptLanguage = () => {
  const language = getLanguage();
  // 将语言代码转换为Accept-Language格式
  const languageMap: { [key: string]: string } = {
    "en-US": "en",
    "vi-VN": "vi",
    "pt-PT": "pt",
    "ja-JP": "ja",
    "hi-IN": "hi",
  };
  return languageMap[language] || "en";
};

// 参数序列化
const tansParams = (params: any) => {
  let result = "";
  for (const propName of Object.keys(params)) {
    const value = params[propName];
    const part = encodeURIComponent(propName) + "=";
    if (value !== null && value !== "" && typeof value !== "undefined") {
      if (typeof value === "object") {
        for (const key of Object.keys(value)) {
          if (
            value[key] !== null &&
            value[key] !== "" &&
            typeof value[key] !== "undefined"
          ) {
            const params = propName + "[" + key + "]";
            const subPart = encodeURIComponent(params) + "=";
            result += subPart + encodeURIComponent(value[key]) + "&";
          }
        }
      } else {
        result += part + encodeURIComponent(value) + "&";
      }
    }
  }
  return result;
};
interface ResponseData<T> {
  code: number;
  message: string;
  data: T;
}
// 用于存储正在进行的请求
const pendingRequests = new Map<string, AbortController>();

// 生成请求的唯一标识
const generateReqKey = (config: AxiosRequestConfig) => {
  const { method, url, params, data } = config;
  return [method, url, qs.stringify(params), qs.stringify(data)].join("&");
};

// HTTP状态码
const HttpStatus = {
  SUCCESS: 200,
  WARN: 601,
  SERVER_ERROR: 500,
};

// 错误码映射
const errorCode: { [key: string]: string } = {
  "401": "认证失败，无法访问系统资源",
  "403": "当前操作没有权限",
  "404": "访问资源不存在",
  default: "系统未知错误，请反馈给管理员",
};

/**
 * HTTP请求类
 */
class HttpRequest {
  private instance: AxiosInstance;
  private message: any;
  private recentMessages: Map<string, number> = new Map(); // 存储最近的错误消息和时间戳
  private hasDisplayedHtmlResponse = false;

  constructor() {
    const { message } = createDiscreteApi(["message"]);
    this.message = message;
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_PREFIX,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        clientid: import.meta.env.VITE_APP_CLIENT_ID,
      },
    });

    this.setupInterceptors();
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 对应国际化资源文件后缀
        config.headers["Content-Language"] = getLanguage();
        // 添加Accept-Language请求头
        config.headers["Accept-Language"] = getAcceptLanguage();
        // 添加X-Fingerprint请求头
        config.headers["X-Fingerprint"] = generateFingerprintHeader();
        // 添加Account标识头，用于标识需要刷新账户信息的请求
        config.headers["X-Account-Refresh"] = "true";
        const isToken = config.headers?.isToken === false;
        // 是否需要防止数据重复提交
        const isRepeatSubmit = config.headers?.repeatSubmit === false;

        if (getToken() && !isToken) {
          config.headers["Authorization"] = "Bearer " + getToken();
        }
        // get请求映射params参数
        if (config.method === "get" && config.params) {
          let url = config.url + "?" + tansParams(config.params);
          url = url.slice(0, -1);
          config.params = {};
          config.url = url;
        }
        // 处理 application/x-www-form-urlencoded 格式
        if (
          config.headers["Content-Type"] ===
          "application/x-www-form-urlencoded" &&
          config.data &&
          typeof config.data === "object"
        ) {
          config.data = qs.stringify(config.data);
        }

        if (!isRepeatSubmit) {
          const requestKey = generateReqKey(config);
          if (pendingRequests.has(requestKey)) {
            const controller = pendingRequests.get(requestKey);
            controller?.abort();
            pendingRequests.delete(requestKey);
            console.log(`取消了重复的请求: ${requestKey}`);
          }

          const controller = new AbortController();
          config.signal = controller.signal;
          pendingRequests.set(requestKey, controller);
        }
        // FormData数据去请求头Content-Type
        if (config.data instanceof FormData) {
          delete config.headers["Content-Type"];
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (res: AxiosResponse) => {
        // 清理已完成的请求
        const requestKey = generateReqKey(res.config);
        if (pendingRequests.has(requestKey)) {
          pendingRequests.delete(requestKey);
        }

        if (this.shouldRenderHtmlResponse(res)) {
          this.renderHtmlResponse(res);
          const htmlError = new Error("HTML response received");
          (htmlError as any).isHtmlResponse = true;
          return Promise.reject(htmlError);
        }

        // 获取HTTP状态码和响应体中的业务状态码
        const httpStatus = res.status;
        const code = res.data?.code || HttpStatus.SUCCESS;
        if (code === 5000) {
          renderRegionRestrictionOverlay();
          return Promise.reject(new Error("IP address restricted"));
        }
        // 获取错误信息
        // 二进制数据则直接返回
        if (
          res.request.responseType === "blob" ||
          res.request.responseType === "arraybuffer"
        ) {
          return res.data;
        }
        // 处理成功状态
        if (httpStatus === 200 && code === HttpStatus.SUCCESS) {
          // 检查是否为消耗钻石的接口，如果是则自动刷新账户信息
          this.handleAccountRefresh(res);
          return Promise.resolve(res.data);
        }
      },
      (error: AxiosError) => {
        // 清理失败的请求
        if (error.config) {
          const requestKey = generateReqKey(error.config);
          if (pendingRequests.has(requestKey)) {
            pendingRequests.delete(requestKey);
          }
        }

        const payload: any = error.response?.data;
        if (payload && typeof payload === "object" && payload.code === 5000) {
          renderRegionRestrictionOverlay();
          return Promise.reject(error);
        }

        // 根据用户反馈调整：401只报错不弹窗，403弹窗
        if (error.response?.status === 401) {
          // 防止logout死循环：只有在非登出状态时才调用logout
          if (!isLoggingOut.value) {
            // 401状态码：认证失败，只清除token并报错，不弹出登录窗口，不刷新页面
            // 使用动态导入避免循环依赖
            import("@/stores/auth").then(({ useAuthStore }) => {
              const authStore = useAuthStore();
              // 标记本次注册来源为 "被动注册（401 弹窗）"
              authStore.setRegisterSource('auth_redirect');
              authStore.logoutSilently();
            });
          }
        }
        // 处理HTTP 403状态码
        if (error.response?.status === 403) {
          // 403状态码：禁止访问，需要弹出登录窗口
          if (!isRelogin.show) {
            isRelogin.show = true;
          }
          // 清除auth store中的权限信息，但不刷新页面
          // 使用动态导入避免循环依赖
          import("@/stores/auth").then(({ useAuthStore }) => {
            const authStore = useAuthStore();
            authStore.logoutSilently();
          });
        }
        return this.handleError(error as AxiosError<ResponseData<any>>);
      }
    );
  }

  private shouldRenderHtmlResponse(response: AxiosResponse): boolean {
    if (this.hasDisplayedHtmlResponse) {
      return false;
    }

    const headers = response.headers || {};
    const contentType =
      (headers["content-type"] || headers["Content-Type"] || "").toString().toLowerCase();

    if (contentType.includes("text/html")) {
      return true;
    }

    if (typeof response.data === "string") {
      const trimmed = response.data.trim().toLowerCase();
      return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
    }

    return false;
  }

  private renderHtmlResponse(response: AxiosResponse): void {
    if (this.hasDisplayedHtmlResponse) {
      return;
    }

    const html = typeof response.data === "string" ? response.data : "";
    if (!html) {
      return;
    }

    renderHtmlResponseOverlay(html);
    this.hasDisplayedHtmlResponse = true;
  }

  /**
   * 处理账户信息刷新
   * @param response
   */
  private handleAccountRefresh(response: AxiosResponse): void {
    // 需要自动刷新账户信息的接口列表（消耗钻石的接口）
    const DIAMOND_CONSUMING_APIS = [
      '/api/ai-generator', // AI生成图片接口
      '/api/chat/send', // 聊天发送消息接口
      '/api/voice/generate', // 语音生成接口
      // 可以根据实际需要添加更多消耗钻石的接口
    ];

    const url = response.config?.url || '';
    const isDiamondConsumingAPI = DIAMOND_CONSUMING_APIS.some(api => url.includes(api));

    if (isDiamondConsumingAPI) {
      try {
        // 异步刷新账户信息，不阻塞原始响应
        // 使用动态导入避免循环依赖
        setTimeout(async () => {
          try {
            const { useAuthStore } = await import("@/stores/auth");
            const authStore = useAuthStore();
            if (authStore.isLoggedIn) {
              await authStore.handleGetAccountInfo();
            }
          } catch (error) {
            console.warn('自动刷新账户信息失败:', error);
          }
        }, 100); // 延迟100ms执行，确保原始请求完全处理完毕
      } catch (error) {
        console.warn('自动刷新账户信息失败:', error);
      }
    }
  }

  /**
   * 错误处理
   * @param error
   */
  private handleError(error: AxiosError<ResponseData<any>>): Promise<never> {
    if (error.response?.data?.message) {
      const errorMessage = error.response.data.message;
      const currentTime = Date.now();
      const lastShowTime = this.recentMessages.get(errorMessage);

      // 如果2秒内没有显示过相同的错误消息，则显示
      if (!lastShowTime || currentTime - lastShowTime > 2000) {
        this.message.error(errorMessage, {
          duration: 5000,
        });
        this.recentMessages.set(errorMessage, currentTime);

        // 清理超过2秒的旧消息记录，避免内存泄漏
        for (const [msg, time] of this.recentMessages.entries()) {
          if (currentTime - time > 2000) {
            this.recentMessages.delete(msg);
          }
        }
      }
    } else {
      // Per user request, only display backend messages.
      // For network errors etc., log to console without showing a UI message.
      // console.error("HTTP Request Error:", error);
    }
    return Promise.reject(error);
  }

  /**
   * 发送请求的通用方法
   * @param config 请求配置
   */
  public request<T = any>(config: AxiosRequestConfig): Promise<T> {
    // 默认使用 application/json
    if (!config.headers) {
      config.headers = {};
    }

    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json;charset=UTF-8";
    }

    return this.instance.request<any, T>(config);
  }

  /**
   * 上传文件
   * @param url 上传地址
   * @param formData 表单数据
   * @param config 额外配置
   */
  public upload<T = any>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({
      ...config,
      method: "post",
      url,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  /**
   * 下载文件
   * @param url 下载地址
   * @param params 请求参数
   * @param config 额外配置
   */
  public download(
    url: string,
    params?: any,
    config?: AxiosRequestConfig
  ): Promise<Blob> {
    return this.request<Blob>({
      ...config,
      method: "get",
      url,
      params,
      responseType: "blob",
    });
  }
}

// 导出实例
export const http = new HttpRequest();
export default http;
