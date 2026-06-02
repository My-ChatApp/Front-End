/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  /** Dev only: Vite proxy target (vite.config.ts). */
  readonly VITE_DEV_API_TARGET?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WS_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
