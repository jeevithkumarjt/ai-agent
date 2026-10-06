// API base URL for the static chat/admin pages.
//
// - When the pages are served by the FastAPI backend itself (localhost/127.0.0.1),
//   use the page's own origin - same origin, no CORS needed.
// - Otherwise (file://, LAN IP, another host), point this at wherever the backend
//   is reachable. Docker Compose publishes it on port 8080.
(function () {
  var host = window.location.hostname || "";
  var API_BASE_URL = "http://localhost:8080";

  window.APP_API_BASE =
    host === "localhost" || host === "127.0.0.1"
      ? window.location.origin
      : API_BASE_URL;
})();
