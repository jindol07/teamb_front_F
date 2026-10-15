
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BOOT_API_BASE_URL_A: string;
  readonly VITE_BOOT_API_BASE_URL_U: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
