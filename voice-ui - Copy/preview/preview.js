/* ==========================================================================
   Voice UI — Preview harness script (preview/preview.js)
   --------------------------------------------------------------------------
   DEV ONLY. Handles the theme toggle and fills token value labels on the
   token reference page. Never shipped to WordPress.
   ========================================================================== */

(function () {
  "use strict";

  var html = document.documentElement;
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;

  var KEY = "vui-preview-theme";

  function resolveInitial() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
    if (saved === "light" || saved === "dark") return saved;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  }

  function apply(theme) {
    html.setAttribute("data-theme", theme);
    btn.textContent = theme === "dark" ? "Switch to light" : "Switch to dark";
  }

  function fillTokenValues() {
    var cs = getComputedStyle(html);
    var els = document.querySelectorAll("[data-token]");
    for (var i = 0; i < els.length; i++) {
      var name = els[i].getAttribute("data-token");
      els[i].textContent = cs.getPropertyValue(name).trim();
    }
  }

  apply(resolveInitial());
  fillTokenValues();

  btn.addEventListener("click", function () {
    var next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    apply(next);
    fillTokenValues();
    try { localStorage.setItem(KEY, next); } catch (e) { /* storage blocked */ }
  });
})();
