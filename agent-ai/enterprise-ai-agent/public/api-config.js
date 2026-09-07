// API base URL for the static chat/admin pages.
// - When served by the FastAPI backend (same origin), use the page's own origin.
// - When opened directly from disk (file://), fall back to the local backend.
window.APP_API_BASE = (window.location.protocol === "file:")
  ? "http://127.0.0.1:8000"
  : window.location.origin;