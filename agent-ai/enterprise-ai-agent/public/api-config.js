// API base URL for the static chat/admin pages.
// - When served by the FastAPI backend (localhost/127.0.0.1), use the page's own origin.
// - Otherwise (file://, GitHub Pages, LAN IP), point at the ngrok tunnel that
//   forwards to the local backend (this PC). Requires this PC + ngrok to be on.
(function () {
  var host = window.location.hostname || "";
  window.APP_API_BASE =
    host === "localhost" || host === "127.0.0.1"
      ? window.location.origin
      : "https://zigzagged-jaws-atom.ngrok-free.dev";
})();