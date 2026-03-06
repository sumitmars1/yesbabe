/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_ENV: 'development' | 'production';
  readonly VITE_APP_PORT: string;
  readonly VITE_APP_OPEN_BROWSER: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_API_PREFIX: string;
  readonly VITE_APP_DEBUG: string;
  readonly VITE_APP_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}