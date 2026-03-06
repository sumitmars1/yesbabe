import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import path from "path";
import AutoImport from "unplugin-auto-import/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
import UnoCSS from "unocss/vite";
import { HttpsProxyAgent } from 'https-proxy-agent' // 注意是大写 H
// 设置代理指向你的 Clash
const agent = new HttpsProxyAgent('http://127.0.0.1:7890')
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: true, // 也可以写成 '0.0.0.0'
      port: Number(env.VITE_APP_PORT) || 5173,
      // 根据环境变量决定是否自动打开浏览器
      open: env.VITE_APP_OPEN_BROWSER === "true",
      // 添加API代理配置
      //   proxy: {
      //     [env.VITE_API_PREFIX]: {
      //       target: env.VITE_API_BASE_URL,
      //       changeOrigin: true,
      //       rewrite: (path) =>
      //         path.replace(new RegExp(`^${env.VITE_API_PREFIX}`), "/api"),
      //     },
      //   },
      proxy: {
        ["/api"]: {
          target: "https://yesbabeabc.com/api",
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^/api`), ""),
          agent
        },
        // 代理静态资源请求
        ["/s/"]: {
          target: "https://yesbabeabc.com",
          changeOrigin: true,
          agent,
          rewrite: (path) => path.replace(new RegExp(`^/s/`), "/s/"),
        },
      },
      // 解决history模式刷新404问题
      historyApiFallback: true,
    },
    build: {
      // 指定输出路径（默认dist）
      outDir: "dist",
      // 指定生成静态资源的存放路径（相对于outDir）
      assetsDir: "assets",
      // 小于此阈值的导入或引用资源将内联为base64编码，以避免额外的http请求
      // assetsInlineLimit: 4096,
      // 启用/禁用CSS代码拆分
      cssCodeSplit: true,
      // 构建后是否生成source map文件
      sourcemap: env.VITE_APP_ENV === "development",
      // 调整chunk大小警告阈值（默认500KB）
      chunkSizeWarningLimit: 2000,
      // rollup打包配置
      rollupOptions: {
        output: {
          // 静态资源分类打包
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const originalName = assetInfo.name ?? "";
            const ext = path.extname(originalName).slice(1).toLowerCase() || "assets";
            return `assets/${ext}/[name]-[hash][extname]`;
          },
          // 手动分包配置，优化chunk大小
        },
      },
    },
    plugins: [
      vue(),
      UnoCSS(),
      createSvgIconsPlugin({
        // 指定需要缓存的图标文件夹
        iconDirs: [
          // path.resolve(path.resolve(__dirname, "../src"), "assets/icons/svg"),
          path.resolve(process.cwd(), "src/assets/icons/svg"),
        ],
        // 指定symbolId格式
        symbolId: "icon-[dir]-[name]",
      }),
      AutoImport({
        imports: [
          "vue",
          {
            "naive-ui": [
              "useDialog",
              "useMessage",
              "useNotification",
              "useLoadingBar",
            ],
          },
        ],
      }),
      Components({
        resolvers: [NaiveUiResolver()],
      }),
    ],
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./"),
        "@": path.resolve(__dirname, "./src"),
      },
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
    },
  };
});
