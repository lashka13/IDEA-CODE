/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute API root, e.g. http://localhost:8000/api — if unset, relative /api */
  readonly VITE_API_BASE?: string;
}
