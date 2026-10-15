/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PEER_SECURE: string
  readonly VITE_PEER_HOST: string
  readonly VITE_PEER_PORT: string
  readonly VITE_PEER_PATH: string
  readonly VITE_ICE_SERVERS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** 建置日期（YYYY-MM-DD），由 vite.config.ts 注入 */
declare const __BUILD_DATE__: string;
