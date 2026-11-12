(function () {
  "use strict";
  var A = window.A, $ = A.$, esc = A.esc;
  var app = function () { return $("#app"); };
  var current = null;

  var TABS = [
    { id: "orders", label: "Orders", icon: "orders", show: function () { return A.can("orders"); } },
    { id: "menu", label: "Menu", icon: "menu", show: function () { return A.can("menu"); } },
    { id: "avail", label: "Availability", icon: "avail", show: function () { return !A.can("menu") && A.can("availability"); } },
    { id: "photos", label: "Photos", icon: "photos", show: function () { return A.can("photos"); } },
    { id: "insights", label: "Insights", icon: "insights", show: function () { return A.can("insights"); } },
    { id: "settings", label: "Settings", icon: "settings", show: function () { return true; } }
  ];
  function tabs() { return TABS.filter(function (t) { return t.show(); }); }

  /* ---------- auth screens ---------- */
  function logoBlock() { return '<div class="logo"><img src="../assets/logo.svg" width="48" height="48" alt=""><span>Aaraj<small>Staff sign in</small></span></div>'; }
  function showNotConfigured() {
    app().innerHTML = '<div class="login"><div class="box">' + logoBlock() + '<div class="err"><strong>Not connected to a database</strong><p>Set <code>supabaseUrl</code> and <code>supabasePublishableKey</code> in <code>js/config.js</code>, then reload.</p></div></div></div>';
  }
  function showLogin(msg) {
    app().innerHTML = '<div class="login"><form class="box" id="loginForm" novalidate>' + logoBlock() +
      (msg ? '<div class="notice" role="alert">' + esc(msg) + "</div>" : "") +
      '<label class="field"><span>Email</span><input type="email" name="email" autocomplete="username" required></label>' +
      '<label class="field"><span>Password</span><input type="password" name="password" autocomplete="current-password" required></label>' +
      '<button class="btn btn-primary" style="width:100%" type="submit">Sign in</button>' +
      '<div class="links"><button type="button" class="link-btn" id="forgot">Forgot password</button><a href="../">Back to site</a></div></form></div>';
    $("#loginForm").addEventListener("submit", function (e) {
      e.preventDefault(); var f = e.target, b = $("button[type=submit]", f); b.disabled = true; b.textContent = "Signing in";
      A.sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value }).then(function (r) {
        if (r.error) { showLogin(/invalid/i.test(r.error.message) ? "Email or password is wrong." : r.error.message); return; }
        start(r.data.session);
      }).catch(function (er) { showLogin(er.message || "Could not sign in"); });
    });
    $("#forgot").addEventListener("click", showForgot);
    var em = $("#loginForm input[name=email]"); if (em) em.focus();
  }
  function showForgot() {
    app().innerHTML = '<div class="login"><form class="box" id="fgForm">' + logoBlock() + "<p class=\"muted\" style=\"margin-bottom:14px\">Enter your email. We send a link to set a new password.</p>" +
      '<label class="field"><span>Email</span><input type="email" name="email" autocomplete="username" required></label>' +
      '<button class="btn btn-primary" style="width:100%" type="submit">Send reset link</button><div class="links"><button type="button" class="link-btn" id="back">Back to sign in</button></div></form></div>';
    $("#back").addEventListener("click", function () { showLogin(); });
    $("#fgForm").addEventListener("submit", function (e) {
      e.preventDefault();
      A.sb.auth.resetPasswordForEmail(e.target.email.value.trim(), { redirectTo: location.origin + location.pathname }).then(function (r) {
        if (r.error) A.toast(r.error.message, { bad: true }); else { showLogin("If that email has an account, a reset link is on its way."); }
      });
    });
  }
  function showRecovery() {
    app().innerHTML = '<div class="login"><form class="box" id="rcForm">' + logoBlock() + "<p class=\"muted\" style=\"margin-bottom:14px\">Choose a new password.</p>" +
      '<label class="field"><span>New password</span><input type="password" name="p1" minlength="8" autocomplete="new-password" required><small>At least 8 characters.</small></label>' +
      '<label class="field"><span>Repeat password</span><input type="password" name="p2" autocomplete="new-password" required></label>' +
      '<button class="btn btn-primary" style="width:100%" type="submit">Save password</button></form></div>';
    $("#rcForm").addEventListener("submit", function (e) {
      e.preventDefault(); var f = e.target;
      if (f.p1.value.length < 8) return A.toast("Use at least 8 characters.", { bad: true });
      if (f.p1.value !== f.p2.value) return A.toast("The two passwords differ.", { bad: true });
      A.sb.auth.updateUser({ password: f.p1.value }).then(function (r) {
        if (r.error) return A.toast(r.error.message, { bad: true });
        A.toast("Password saved"); history.replaceState(null, "", location.pathname); A.sb.auth.getSession().then(function (s) { start(s.data.session); });
      });
    });
  }
  function showDenied(text) {
    app().innerHTML = '<div class="login"><div class="box">' + logoBlock() + '<div class="err"><strong>No access</strong><p>' + esc(text) + '</p></div><p style="margin-top:14px"><button class="btn" id="so" type="button">Sign out</button></p></div></div>';
    $("#so").addEventListener("click", signOut);
  }
  function signOut() { A.orders && A.orders.stop && A.orders.stop(); A.sb.auth.signOut().then(function () { A.state.profile = null; showLogin(); }); }
  A.signOut = signOut;

  /* ---------- profile ---------- */
  var ALL = { orders: true, availability: true, menu: true, insights: true, photos: true, settings: true };
  function loadProfile(user) {
    return A.sb.from("staff_profiles").select("*").eq("user_id", user.id).maybeSingle().then(function (r) {
      if (r.error) {
        if (A.isMissing(r.error)) return { role: "owner", perms: ALL, active: true, email: user.email, name: "", legacy: true };
        throw r.error;
      }
      if (!r.data) return null;
      return r.data;
    });
  }

  /* ---------- shell ---------- */
  function start(session) {
    if (!session) return showLogin();
    var user = session.user; A.state.user = user;
    app().innerHTML = '<p class="boot">Loading</p>';
    loadProfile(user).then(function (p) {
      if (!p) return showDenied("This account is not set up as staff. Ask the owner to add you, or run migration 002 if you are the owner.");
      if (p.active === false) return showDenied("This account has been switched off. Ask the owner.");
      A.state.profile = p; mountShell();
    }).catch(function (e) { app().innerHTML = '<div class="login"><div class="box">' + logoBlock() + A.errBox("Could not load your account", e, true) + "</div></div>"; var r = $("[data-retry]"); if (r) r.addEventListener("click", function () { start(session); }); });
  }
  function navHtml(kind) {
    return tabs().map(function (t) {
      return '<button type="button" data-tab="' + t.id + '"' + (current === t.id ? ' aria-current="page"' : "") + ">" + A.icon(t.icon) + "<span>" + esc(t.label) + "</span>" + (t.id === "orders" ? '<i class="badge-n" id="badge-' + kind + '" hidden>0</i>' : "") + "</button>";
    }).join("");
  }
  function mountShell() {
    var pr = A.state.profile;
    app().innerHTML = '<div class="shell"><aside class="side"><div class="brand"><img src="../assets/logo.svg" alt=""><span>Aaraj</span></div><nav aria-label="Sections">' + navHtml("side") + "</nav>" +
      '<div class="me"><b>' + esc(pr.name || pr.email || A.state.user.email) + "</b>" + ((pr.name || "").toLowerCase() === (pr.role === "owner" ? "owner" : "staff") ? "" : (pr.role === "owner" ? "Owner" : "Staff")) + '<br><button type="button" data-signout>Sign out</button></div></aside>' +
      '<main class="main" id="view" tabindex="-1"></main><nav class="tabbar" aria-label="Sections">' + navHtml("bar") + "</nav></div>";
    app().addEventListener("click", function (e) {
      var t = e.target.closest("[data-tab]"); if (t) { location.hash = "#/" + t.getAttribute("data-tab"); return; }
      if (e.target.closest("[data-signout]")) signOut();
    });
    if (A.can("orders") && A.orders) A.orders.start();
    route();
  }
  A.updateBadge = function (n) {
    ["side", "bar"].forEach(function (k) { var b = $("#badge-" + k); if (b) { b.hidden = !n; b.textContent = n > 99 ? "99+" : n; } });
    document.title = (n ? "(" + n + ") " : "") + "Aaraj Admin";
  };
  function route() {
    if (!A.state.profile) return;
    var id = (location.hash.replace(/^#\/?/, "") || "").split("?")[0], allowed = tabs();
    if (!allowed.some(function (t) { return t.id === id; })) { location.hash = "#/" + allowed[0].id; return; }
    if (current && A.views[current] && A.views[current].destroy) A.views[current].destroy();
    current = id;
    A.$$("[data-tab]").forEach(function (b) { b.toggleAttribute("aria-current", b.getAttribute("data-tab") === id); if (b.getAttribute("data-tab") === id) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    var v = A.views[id], old = $("#view"), host = old.cloneNode(false); old.replaceWith(host); window.scrollTo(0, 0);
    v.render(host);
  }
  window.addEventListener("hashchange", route);

  /* ---------- boot ---------- */
  function boot() {
    if (!A.connect()) return showNotConfigured();
    A.sb.auth.onAuthStateChange(function (ev, session) {
      if (ev === "PASSWORD_RECOVERY") showRecovery();
      else if (ev === "SIGNED_OUT" && !A.state.profile) showLogin();
    });
    if (/type=recovery/.test(location.hash + location.search)) return;
    A.sb.auth.getSession().then(function (r) { if (!$(".login #rcForm")) start(r.data && r.data.session); }).catch(function () { showLogin(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
