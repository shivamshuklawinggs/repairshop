/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_INDEX_DB_STORAGE: string;
  // Add other environment variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 