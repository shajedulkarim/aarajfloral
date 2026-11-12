(function () {
  "use strict";
  var A = window.A = { views: {}, state: {}, cfg: window.AARAJ_CONFIG || {} };

  A.$ = function (s, r) { return (r || document).querySelector(s); };
  A.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  A.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  A.money = function (n) { return "OMR " + Number(n || 0).toFixed(3); };
  A.uid = function () { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2); };
  A.asset = function (u) { return !u ? "" : (/^(https?:|data:|blob:|\/)/.test(u) ? u : "../" + u); };
  A.debounce = function (fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; };

  /* Oman has no DST: UTC+4 all year. Shift, then read with UTC getters. */
  A.muscat = function (d) { return new Date(new Date(d).getTime() + 4 * 3600 * 1000); };
  A.pad = function (n) { return (n < 10 ? "0" : "") + n; };
  A.dayKey = function (d) { var m = A.muscat(d); return m.getUTCFullYear() + "-" + A.pad(m.getUTCMonth() + 1) + "-" + A.pad(m.getUTCDate()); };
  A.fmtTime = function (d) { var m = A.muscat(d), h = m.getUTCHours(); return (h % 12 || 12) + ":" + A.pad(m.getUTCMinutes()) + (h >= 12 ? " pm" : " am"); };
  A.fmtDate = function (d) { var m = A.muscat(d); return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][m.getUTCDay()] + " " + m.getUTCDate() + " " + ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m.getUTCMonth()]; };
  A.ago = function (d) {
    var s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return "just now"; if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago"; return A.fmtDate(d);
  };

  var ICONS = {
    orders: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    avail: '<path d="M5 12l4 4 10-10"/>',
    photos: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    insights: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>', chev: '<path d="M6 9l6 6 6-6"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>',
    print: '<path d="M7 9V3h10v6M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2"/><rect x="7" y="14" width="10" height="7"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>', rotate: '<path d="M20 11a8 8 0 10-2.3 6M20 4v7h-7"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', drag: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 6.1A10 10 0 0112 6c6 0 10 6 10 6a17 17 0 01-3.3 4M6.5 6.9A17 17 0 002 12s4 7 10 7a9 9 0 004-1"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    dup: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>',
    up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', undo: '<path d="M4 9h11a5 5 0 010 10H8M4 9l4-4M4 9l4 4"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9zM17 8a5 5 0 010 8"/>', upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    logout: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>', users: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0112 0M17 5a3 3 0 010 6M21 20a6 6 0 00-4-5.6"/>'
  };
  A.icon = function (n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || "") + "</svg>"; };

  /* toast */
  A.toast = function (msg, o) {
    o = o || {};
    var root = A.$("#toasts"), el = document.createElement("div");
    el.className = "toast" + (o.bad ? " bad" : "");
    el.innerHTML = "<span>" + A.esc(msg) + "</span>" + (o.action ? '<button type="button">' + A.esc(o.action.label) + "</button>" : "");
    if (o.action) A.$("button", el).addEventListener("click", function () { el.remove(); o.action.fn(); });
    root.appendChild(el);
    setTimeout(function () { el.remove(); }, o.ms || (o.action ? 9000 : o.bad ? 6000 : 3200));
    return el;
  };

  /* modal: body is an HTML string. Returns { el, close }. */
  A.modal = function (o) {
    var root = A.$("#modalRoot"), prev = document.activeElement;
    var scrim = document.createElement("div"); scrim.className = "scrim";
    scrim.innerHTML = '<div class="modal ' + (o.wide ? "wide" : "") + '" role="dialog" aria-modal="true" aria-label="' + A.esc(o.title) + '"><div class="modal-head"><h3>' + A.esc(o.title) + '</h3><button type="button" class="icon-btn" data-close aria-label="Close">' + A.icon("x") + "</button></div><div class=\"modal-body\">" + o.body + "</div>" + (o.foot ? '<div class="modal-foot">' + o.foot + "</div>" : "") + "</div>";
    root.appendChild(scrim);
    function close() { scrim.remove(); document.removeEventListener("keydown", onKey); if (prev && prev.focus) try { prev.focus(); } catch (e) {} if (o.onClose) o.onClose(); }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    scrim.addEventListener("mousedown", function (e) { if (e.target === scrim) close(); });
    A.$$("[data-close]", scrim).forEach(function (b) { b.addEventListener("click", close); });
    var first = A.$("input:not([type=hidden]),select,textarea,button:not([data-close])", scrim); if (first && !o.noFocus) first.focus();
    return { el: scrim, close: close, $: function (s) { return A.$(s, scrim); }, $$: function (s) { return A.$$(s, scrim); } };
  };
  A.confirm = function (title, text, okLabel, danger) {
    return new Promise(function (res) {
      var done = false, m = A.modal({
        title: title, body: "<p>" + A.esc(text) + "</p>",
        foot: '<button class="btn" data-close type="button">Cancel</button><button class="btn ' + (danger ? "btn-danger" : "btn-primary") + '" data-ok type="button">' + A.esc(okLabel || "Confirm") + "</button>",
        noFocus: true, onClose: function () { if (!done) res(false); }
      });
      m.$("[data-ok]").addEventListener("click", function () { done = true; m.close(); res(true); });
      m.$("[data-ok]").focus();
    });
  };

  /* optimistic update: apply now, run the remote call, roll back and tell the user if it fails */
  A.opt = function (apply, rollback, remote, o) {
    o = o || {};
    apply();
    return Promise.resolve().then(remote).then(function (r) {
      if (r && r.error) throw r.error;
      if (o.ok) A.toast(o.ok, o.okOpts);
      return r;
    }).catch(function (e) {
      rollback();
      A.toast((o.fail || "Could not save") + ". " + A.errText(e), { bad: true });
      return null;
    });
  };

  A.isMissing = function (e) { return !!e && (e.code === "42P01" || e.code === "PGRST205" || e.code === "PGRST202" || e.code === "42883" || /does not exist|schema cache|Could not find the (table|function)/i.test(e.message || "")); };
  A.errText = function (e) {
    if (!e) return "";
    if (A.isMissing(e)) return "A database migration has not been applied yet. See supabase/README.";
    if (e.code === "42501" || /permission|row-level security|not allowed/i.test(e.message || "")) return "You do not have permission for this.";
    return e.message || String(e);
  };
  A.errBox = function (title, e, retry) {
    return '<div class="err"><strong>' + A.esc(title) + "</strong><p>" + A.esc(A.errText(e)) + "</p>" + (retry ? '<p style="margin-top:10px"><button class="btn btn-sm" data-retry type="button">Try again</button></p>' : "") + "</div>";
  };
  A.empty = function (title, text) { return '<div class="empty"><strong>' + A.esc(title) + "</strong>" + A.esc(text || "") + "</div>"; };

  /* phone helpers */
  A.digits = function (p) {
    var d = String(p || "").replace(/[^\d+]/g, ""), plus = d[0] === "+"; d = d.replace(/\+/g, "");
    if (!plus && d.slice(0, 2) === "00") d = d.slice(2);
    else if (!plus && d.length === 8) d = "968" + d;
    return d;
  };

  /* sound: generated with WebAudio, no files */
  A.sound = {
    prefs: function () { try { return Object.assign({ on: true, kind: "chime", vol: 0.6 }, JSON.parse(localStorage.getItem("aaraj_sound") || "{}")); } catch (e) { return { on: true, kind: "chime", vol: 0.6 }; } },
    save: function (p) { try { localStorage.setItem("aaraj_sound", JSON.stringify(p)); } catch (e) {} },
    play: function (force) {
      var p = A.sound.prefs(); if ((!p.on && !force) || p.kind === "off") return;
      try {
        var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
        A.sound.ctx = A.sound.ctx || new C(); var ctx = A.sound.ctx; if (ctx.state === "suspended") ctx.resume();
        var seqs = { chime: [[880, 0, .18], [1318, .16, .3]], bell: [[1046, 0, .5], [784, .0, .6]], soft: [[523, 0, .25], [659, .22, .25], [784, .44, .35]] };
        (seqs[p.kind] || seqs.chime).forEach(function (n) {
          var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + n[1];
          o.type = p.kind === "bell" ? "triangle" : "sine"; o.frequency.value = n[0];
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.01, p.vol * .5), t + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + n[2]);
          o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + n[2] + .05);
        });
      } catch (e) {}
    }
  };

  /* supabase */
  A.configured = function () { return !!(A.cfg.supabaseUrl && A.cfg.supabasePublishableKey && window.supabase && window.supabase.createClient); };
  A.connect = function () {
    if (!A.configured()) return null;
    A.sb = window.supabase.createClient(A.cfg.supabaseUrl, A.cfg.supabasePublishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    return A.sb;
  };

  /* permissions */
  A.PERMS = [
    { key: "orders", label: "Orders", hint: "See and update orders" },
    { key: "availability", label: "Availability", hint: "Mark items sold out or back in stock" },
    { key: "menu", label: "Menu", hint: "Add, edit, price, hide and delete items" },
    { key: "insights", label: "Insights", hint: "Revenue, busy hours, top items" },
    { key: "photos", label: "Photos", hint: "Upload and edit photos" },
    { key: "settings", label: "Settings", hint: "Banner, hours, rating, backup" }
  ];
  A.can = function (p) { var pr = A.state.profile; return !!pr && pr.active !== false && (pr.role === "owner" || !!(pr.perms && pr.perms[p])); };
  A.isOwner = function () { return !!A.state.profile && A.state.profile.role === "owner"; };

  /* settings upsert helper */
  A.saveSetting = function (key, value) {
    return A.sb.from("settings").upsert({ key: key, value: value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  };
  A.genPassword = function () {
    var chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789", out = "", a = new Uint32Array(14);
    crypto.getRandomValues(a); for (var i = 0; i < a.length; i++) out += chars[a[i] % chars.length];
    return out;
  };
  A.copy = function (text) {
    return (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : Promise.reject()).catch(function () {
      var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) {} t.remove();
    });
  };
  A.download = function (name, mime, text) {
    var b = new Blob([text], { type: mime }), a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
})();
