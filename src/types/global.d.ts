declare global {
  interface BaseQueryListParams {
    size: number; // 每页数量
    page: number; // 页码（从1开始）
  }

  interface Window {
    $message: any;
    $loadingBar: {
      start: () => void;
      finish: () => void;
      error: () => void;
    };
    $headerLoadingBar: {
      start: () => void;
      finish: () => void;
      error: () => void;
    };
    fbq?: (...args: unknown[]) => void;
  }
}

export {};
