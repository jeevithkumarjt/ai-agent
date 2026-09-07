// API base URL for the static chat/admin pages.
// - When served by the FastAPI backend (localhost/127.0.0.1), use the page's own origin.
// - Otherwise (file://, GitHub Pages, LAN IP), point at the local backend. The
//   backend is NOT deployed anywhere, so only http://127.0.0.1:8000 can serve the API.
(function () {
  var host = window.location.hostname || "";
  window.APP_API_BASE =
    host === "localhost" || host === "127.0.0.1"
      ? window.location.origin
      : "http://127.0.0.1:8000";
})();