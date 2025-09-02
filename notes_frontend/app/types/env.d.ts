/**
 * Public environment variable typings for the notes_frontend.
 * Add these variables to your deployment environment (.env).
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string; // Base URL of the backend REST API
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
