(function () {
  "use strict";
  var EP = "/api/utm-capture", K = "_utm_capture_id", DIAS = 30;
  function q(n) { var m = new RegExp("[?&]" + n + "=([^&#]+)").exec(location.search); try { return m ? decodeURIComponent(m[1]) : ""; } catch (e) { return ""; } }
  function bueno(g) { return /^[A-Za-z0-9_-]{20,200}$/.test(g || ""); }
  var g = q("gclid");
  if (bueno(g)) { try { localStorage.setItem(K, JSON.stringify({ g: g, t: Date.now() })); } catch (e) {} }
  function gclid() {
    if (bueno(g)) return g;
    try { var o = JSON.parse(localStorage.getItem(K) || "null"); if (o && bueno(o.g) && Date.now() - o.t < DIAS * 864e5) return o.g; } catch (e) {}
    var c = /(?:^|;\s*)_gcl_aw=GCL\.\d+\.([A-Za-z0-9_-]+)/.exec(document.cookie || "");
    return c && bueno(c[1]) ? c[1] : "";
  }
  function esWa(h) { h = String(h || "").toLowerCase(); return /^(https?:)?\/\/(www\.)?wa\.me\//.test(h) || /^(https?:)?\/\/(api|web)\.whatsapp\.com\//.test(h) || h.indexOf("whatsapp://") === 0; }
  var ultimo = 0;
  document.addEventListener("click", function (e) {
    if (!e.isTrusted || navigator.webdriver) return;
    var el = e.target;
    while (el && el !== document && !(el.tagName === "A" && esWa(el.href || el.getAttribute("href")))) el = el.parentNode;
    if (!el || el === document) return;
    var gc = gclid(); if (!gc) return;
    if (Date.now() - ultimo < 3000) return; ultimo = Date.now();
    var body = JSON.stringify({ g: gc, d: location.hostname, p: location.pathname.slice(0, 200), w: String(el.href || "").slice(0, 300) });
    try { if (navigator.sendBeacon && navigator.sendBeacon(EP, new Blob([body], { type: "text/plain" }))) return; } catch (e) {}
    try { fetch(EP, { method: "POST", body: body, keepalive: true, headers: { "Content-Type": "text/plain" } }); } catch (e) {}
  }, true);
})();
