(function () {
  "use strict";
  var A = window.A, $ = A.$, esc = A.esc;
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], ORDER = [6, 0, 1, 2, 3, 4, 5];
  var DEF = (window.AARAJ_DEFAULTS || {}).settings;
  var st = { s: {}, loaded: false, host: null, team: null, teamErr: null };

  function load() {
    return A.sb.from("settings").select("key,value").then(function (r) {
      if (r.error) throw r.error; st.s = {}; r.data.forEach(function (x) { st.s[x.key] = x.value; }); st.loaded = true; st.error = null;
    }).catch(function (e) { st.error = e; });
  }
  function val(k) { return st.s[k] || (DEF && DEF[k]) || {}; }

  /* ---------- sections ---------- */
  function secAccount() {
    var sp = A.sound.prefs();
    return '<section class="panel"><h3>Your account</h3><p class="muted small" style="margin:4px 0 12px">' + esc(A.state.profile.email || A.state.user.email) + " &middot; " + (A.isOwner() ? "Owner" : "Staff") + "</p>" +
      '<form id="pwForm"><div class="row2"><label class="field"><span>New password</span><input type="password" name="p1" autocomplete="new-password" minlength="8"></label><label class="field"><span>Repeat password</span><input type="password" name="p2" autocomplete="new-password"></label></div><button class="btn btn-sm" type="submit">Change password</button></form>' +
      '<h3 style="margin-top:22px">New order alert</h3><p class="muted small" style="margin:4px 0 10px">Saved on this device only.</p><div class="row2"><label class="field"><span>Sound</span><select id="sndKind"><option value="chime">Chime</option><option value="bell">Bell</option><option value="soft">Soft</option><option value="off">Off</option></select></label>' +
      '<label class="field"><span>Volume</span><input type="range" id="sndVol" min="0.1" max="1" step="0.1" value="' + sp.vol + '" style="width:100%;min-height:44px"></label></div><button class="btn btn-sm" type="button" id="sndTest">' + A.icon("sound") + 'Play sound</button>' +
      '<div style="margin-top:22px"><button class="btn btn-sm btn-danger" type="button" data-signout2>' + A.icon("logout") + "Sign out</button></div></section>";
  }
  function secBanner() {
    var b = val("banner");
    return '<section class="panel"><h3>Announcement banner</h3><p class="muted small" style="margin:4px 0 12px">A line shown at the top of the website. Use it for holidays and cut-off dates.</p><form id="bannerForm"><label class="check"><input type="checkbox" name="active" ' + (b.active ? "checked" : "") + "> Show the banner</label>" +
      '<label class="field"><span>Text (English)</span><input type="text" name="text_en" maxlength="160" value="' + esc(b.text_en) + '"></label><label class="field"><span>Text (Arabic)</span><input type="text" name="text_ar" dir="rtl" maxlength="160" value="' + esc(b.text_ar) + '"></label><button class="btn btn-primary btn-sm" type="submit">Save banner</button></form></section>';
  }
  function secHours() {
    var h = val("hours"), map = {}; (h.days || []).forEach(function (d) { map[d.day] = d; });
    return '<section class="panel full"><h3>Opening hours</h3><p class="muted small" style="margin:4px 0 8px">Up to two time slots a day, in Muscat time.</p><form id="hoursForm">' + ORDER.map(function (di) {
      var d = map[di] || { day: di, open: false, slots: [] }, s1 = d.slots[0] || ["", ""], s2 = d.slots[1] || ["", ""];
      return '<div class="hrow" data-day="' + di + '"><label class="check"><input type="checkbox" name="open" ' + (d.open ? "checked" : "") + "> " + DAYS[di] + '</label><div class="slots"><input type="time" name="a1" aria-label="' + DAYS[di] + ' opens" value="' + s1[0] + '"><span>to</span><input type="time" name="b1" aria-label="' + DAYS[di] + ' closes" value="' + s1[1] + '"><span class="muted">and</span><input type="time" name="a2" aria-label="' + DAYS[di] + ' second slot opens" value="' + s2[0] + '"><span>to</span><input type="time" name="b2" aria-label="' + DAYS[di] + ' second slot closes" value="' + s2[1] + '"></div></div>';
    }).join("") + '<button class="btn btn-primary btn-sm" style="margin-top:14px" type="submit">Save hours</button></form></section>';
  }
  function secShop() {
    var c = val("contact"), r = val("rating");
    return '<section class="panel"><h3>Shop details</h3><form id="shopForm" style="margin-top:10px"><div class="row2"><label class="field"><span>WhatsApp number (digits, with country code)</span><input type="text" name="whatsapp" inputmode="numeric" value="' + esc(c.whatsapp) + '"></label><label class="field"><span>Phone shown on site</span><input type="text" name="phone" value="' + esc(c.phone) + '"></label></div>' +
      '<label class="field"><span>Address (English)</span><input type="text" name="address_en" value="' + esc(c.address_en) + '"></label><label class="field"><span>Address (Arabic)</span><input type="text" name="address_ar" dir="rtl" value="' + esc(c.address_ar) + '"></label>' +
      '<label class="field"><span>Google Maps link</span><input type="text" name="maps_url" value="' + esc(c.maps_url) + '"></label><label class="field"><span>Instagram handle</span><input type="text" name="instagram" value="' + esc(c.instagram) + '"></label>' +
      '<h3 style="margin:18px 0 8px">Rating</h3><label class="check"><input type="checkbox" name="rshow" ' + (r.show ? "checked" : "") + '> Show rating on the website</label><div class="row2"><label class="field"><span>Rating (0 to 5)</span><input type="number" name="rvalue" min="0" max="5" step="0.1" value="' + esc(r.value || 0) + '"></label><label class="field"><span>Number of reviews</span><input type="number" name="rcount" min="0" step="1" value="' + esc(r.count || 0) + '"></label></div>' +
      '<button class="btn btn-primary btn-sm" type="submit">Save details</button></form></section>';
  }
  function secBackup() {
    return '<section class="panel"><h3>Backup</h3><p class="muted small" style="margin:4px 0 12px">Downloads a JSON file with everything your account can read: menu, photos list, settings and orders.</p><button class="btn btn-sm" type="button" id="bkBtn">' + A.icon("download") + "Download backup</button></section>";
  }
  function secTeam() {
    return '<section class="panel full" id="teamSec"><div class="page-head" style="margin-bottom:8px"><div><h3>Team</h3><p class="muted small">Staff only see the tabs you allow. The rules are also enforced in the database.</p></div><button class="btn btn-primary btn-sm" type="button" id="tmAdd">' + A.icon("plus") + 'Add person</button></div><div id="teamBody"><p class="muted">Loading</p></div></section>';
  }

  /* ---------- team ---------- */
  function permChips(p, owner) { return owner ? '<span class="tag">All access</span>' : (A.PERMS.filter(function (x) { return p && p[x.key]; }).map(function (x) { return '<span class="tag">' + x.label + "</span>"; }).join("") || '<span class="muted small">No access</span>'); }
  function loadTeam() {
    var body = $("#teamBody", st.host); if (!body) return;
    if (A.state.profile.legacy) { body.innerHTML = '<div class="notice">Team permissions need migration 002 (and 003 to add people). Until then every signed-in user has full access.</div>'; return; }
    A.sb.rpc("admin_list_team").then(function (r) {
      if (r.error) { st.teamErr = r.error; body.innerHTML = A.isMissing(r.error) ? '<div class="notice">Migration 003 has not been applied, so people cannot be added here yet. Run supabase/003_user_management.sql.</div>' : A.errBox("Could not load the team", r.error, true); var rt = $("[data-retry]", body); if (rt) rt.addEventListener("click", loadTeam); return; }
      st.team = r.data; body.innerHTML = r.data.map(function (u) {
        return '<div class="team-row" data-uid="' + u.user_id + '"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><div><strong>' + esc(u.name || u.email) + "</strong> " + (u.role === "owner" ? '<span class="tag">Owner</span>' : "") + (u.active ? "" : ' <span class="tag" style="background:var(--st-cancel-bg);color:var(--st-cancel)">Off</span>') + '<div class="muted small">' + esc(u.email) + (u.last_sign_in_at ? " &middot; last seen " + A.ago(u.last_sign_in_at) : " &middot; never signed in") + '</div></div><div style="display:flex;gap:6px">' +
          (u.role === "owner" ? "" : '<button class="btn btn-sm" data-tm="edit">Permissions</button><button class="btn btn-sm" data-tm="pw">New password</button><button class="btn btn-sm btn-danger" data-tm="del">Remove</button>') + '</div></div><div class="perm-chips">' + permChips(u.perms, u.role === "owner") + "</div></div>";
      }).join("") || A.empty("No team members", "");
    });
  }
  function permBoxes(p) { return A.PERMS.map(function (x) { return '<label class="check"><input type="checkbox" name="' + x.key + '" ' + (p && p[x.key] ? "checked" : "") + '> <span><b>' + x.label + '</b><br><span class="muted small">' + x.hint + "</span></span></label>"; }).join(""); }
  function readPerms(f) { var o = {}; A.PERMS.forEach(function (x) { o[x.key] = !!f[x.key].checked; }); return o; }
  function showCreds(email, pw, title) {
    var url = location.origin + location.pathname, text = "Aaraj admin\nAddress: " + url + "\nEmail: " + email + "\nPassword: " + pw;
    var m = A.modal({ title: title || "Share these details", body: '<p class="muted small" style="margin-bottom:8px">Send them privately. The password is shown only now. The person can change it under Settings.</p><div class="cred" id="credBox">' + esc(text) + "</div>", foot: '<button class="btn btn-primary" id="credCopy" type="button">' + A.icon("copy") + 'Copy details</button><button class="btn" data-close type="button">Done</button>' });
    m.$("#credCopy").addEventListener("click", function () { A.copy(text).then(function () { A.toast("Copied"); }); });
  }
  function addPerson() {
    var pw = A.genPassword();
    var m = A.modal({ title: "Add person", wide: true, body: '<form id="tmForm"><div class="row2"><label class="field"><span>Name</span><input type="text" name="name" maxlength="80" required></label><label class="field"><span>Email</span><input type="email" name="email" required autocomplete="off"></label></div><label class="field"><span>Password</span><div style="display:flex;gap:8px"><input type="text" name="pw" value="' + pw + '" minlength="8" autocomplete="off"><button type="button" class="btn btn-sm" id="regen">New</button></div><small>Generated for you. Edit it if you prefer.</small></label><h3 style="margin:8px 0">Can use</h3>' + permBoxes({ orders: true, availability: true }) + "</form>", foot: '<button class="btn" data-close type="button">Cancel</button><button class="btn btn-primary" id="tmSave" type="button">Create login</button>' });
    var f = m.$("#tmForm"); m.$("#regen").addEventListener("click", function () { f.pw.value = A.genPassword(); });
    m.$("#tmSave").addEventListener("click", function () {
      var email = f.email.value.trim(), name = f.name.value.trim(), pass = f.pw.value; if (!name || !email) return A.toast("Enter a name and an email", { bad: true }); if (pass.length < 8) return A.toast("Password needs 8 or more characters", { bad: true });
      var b = m.$("#tmSave"); b.disabled = true; b.textContent = "Creating";
      A.sb.rpc("admin_create_user", { p_email: email, p_name: name, p_password: pass, p_perms: readPerms(f) }).then(function (r) {
        if (r.error) { b.disabled = false; b.textContent = "Create login"; return A.toast(A.isMissing(r.error) ? "Run migration 003 first." : r.error.message, { bad: true }); }
        m.close(); showCreds(email, pass, "Login created"); loadTeam();
      });
    });
  }
  function editPerson(id) {
    var u = st.team.filter(function (x) { return x.user_id === id; })[0];
    var m = A.modal({ title: "Permissions for " + (u.name || u.email), body: '<form id="pmForm"><label class="field"><span>Name</span><input type="text" name="name" value="' + esc(u.name) + '"></label>' + permBoxes(u.perms) + '<label class="check"><input type="checkbox" name="active" ' + (u.active ? "checked" : "") + "> Account is switched on</label></form>", foot: '<button class="btn" data-close type="button">Cancel</button><button class="btn btn-primary" id="pmSave" type="button">Save</button>' });
    m.$("#pmSave").addEventListener("click", function () {
      var f = m.$("#pmForm"); m.close();
      A.sb.rpc("admin_update_staff", { p_user: id, p_name: f.name.value.trim(), p_perms: readPerms(f), p_active: f.active.checked }).then(function (r) { if (r.error) A.toast("Could not save. " + A.errText(r.error), { bad: true }); else { A.toast("Permissions saved"); loadTeam(); } });
    });
  }
  function resetPw(id) {
    var u = st.team.filter(function (x) { return x.user_id === id; })[0];
    A.confirm("New password for " + (u.name || u.email) + "?", "The old password stops working straight away.", "Generate password").then(function (ok) {
      if (!ok) return; var pw = A.genPassword();
      A.sb.rpc("admin_set_password", { p_user: id, p_password: pw }).then(function (r) { if (r.error) A.toast("Could not change it. " + A.errText(r.error), { bad: true }); else showCreds(u.email, pw, "New password set"); });
    });
  }
  function removePerson(id) {
    var u = st.team.filter(function (x) { return x.user_id === id; })[0];
    A.confirm("Remove " + (u.name || u.email) + "?", "Their login is deleted and cannot be undone. To keep the account but block it, switch it off under Permissions.", "Remove person", true).then(function (ok) {
      if (!ok) return; A.sb.rpc("admin_remove_user", { p_user: id }).then(function (r) { if (r.error) A.toast("Could not remove. " + A.errText(r.error), { bad: true }); else { A.toast("Removed"); loadTeam(); } });
    });
  }

  /* ---------- saves ---------- */
  function saveKey(key, value, okMsg) {
    var prev = st.s[key];
    return A.opt(function () { st.s[key] = value; }, function () { st.s[key] = prev; }, function () { return A.saveSetting(key, value); }, { ok: okMsg, fail: "Not saved" });
  }
  function backup() {
    var tables = ["menu_categories", "menu_items", "photos", "settings"]; if (A.can("orders") || A.can("insights")) tables.push("orders");
    Promise.all(tables.map(function (t) { return A.sb.from(t).select("*").then(function (r) { return [t, r.error ? { error: r.error.message } : r.data]; }); })).then(function (rs) {
      var out = { exported_at: new Date().toISOString(), site: "Aaraj Floral Shop" }; rs.forEach(function (r) { out[r[0]] = r[1]; });
      A.download("aaraj-backup-" + A.dayKey(new Date()) + ".json", "application/json", JSON.stringify(out, null, 2)); A.toast("Backup downloaded");
    });
  }

  function bind(host) {
    var f;
    if ((f = $("#pwForm", host))) f.addEventListener("submit", function (e) { var f = e.target;
      e.preventDefault(); if (f.p1.value.length < 8) return A.toast("Use at least 8 characters", { bad: true }); if (f.p1.value !== f.p2.value) return A.toast("The two passwords differ", { bad: true });
      A.sb.auth.updateUser({ password: f.p1.value }).then(function (r) { if (r.error) A.toast(r.error.message, { bad: true }); else { A.toast("Password changed"); f.reset(); } });
    });
    var sk = $("#sndKind", host); if (sk) { sk.value = A.sound.prefs().kind; sk.addEventListener("change", function () { var p = A.sound.prefs(); p.kind = sk.value; A.sound.save(p); if (sk.value !== "off") A.sound.play(true); }); $("#sndVol", host).addEventListener("change", function (e) { var p = A.sound.prefs(); p.vol = +e.target.value; A.sound.save(p); A.sound.play(true); }); $("#sndTest", host).addEventListener("click", function () { A.sound.play(true); }); }
    if ((f = $("#bannerForm", host))) f.addEventListener("submit", function (e) { var f = e.target; e.preventDefault(); saveKey("banner", { active: f.active.checked, text_en: f.text_en.value.trim(), text_ar: f.text_ar.value.trim() }, "Banner saved"); });
    if ((f = $("#hoursForm", host))) f.addEventListener("submit", function (e) { var f = e.target;
      e.preventDefault(); var days = [], bad = null;
      A.$$(".hrow", f).forEach(function (r) {
        var open = r.querySelector("[name=open]").checked, g = function (n) { return r.querySelector("[name=" + n + "]").value; }, slots = [];
        [["a1", "b1"], ["a2", "b2"]].forEach(function (p) { if (g(p[0]) && g(p[1])) { if (g(p[1]) <= g(p[0])) bad = DAYS[+r.getAttribute("data-day")]; slots.push([g(p[0]), g(p[1])]); } });
        days.push({ day: +r.getAttribute("data-day"), open: open && slots.length > 0, slots: open ? slots : [] });
      });
      if (bad) return A.toast(bad + ": closing time must be after opening time", { bad: true });
      saveKey("hours", { days: days.sort(function (a, b) { return a.day - b.day; }) }, "Hours saved");
    });
    if ((f = $("#shopForm", host))) f.addEventListener("submit", function (e) { var f = e.target;
      e.preventDefault(); var wa = f.whatsapp.value.replace(/\D/g, ""); if (wa.length < 8) return A.toast("Enter the WhatsApp number with country code", { bad: true });
      saveKey("contact", { whatsapp: wa, phone: f.phone.value.trim(), address_en: f.address_en.value.trim(), address_ar: f.address_ar.value.trim(), maps_url: f.maps_url.value.trim(), instagram: f.instagram.value.trim().replace(/^@/, "") }, "Details saved")
        .then(function () { return saveKey("rating", { show: f.rshow.checked, value: Math.min(5, Math.max(0, +f.rvalue.value || 0)), count: Math.max(0, parseInt(f.rcount.value, 10) || 0) }, "Rating saved"); });
    });
    if ((f = $("#bkBtn", host))) f.addEventListener("click", backup);
    host.addEventListener("click", function (e) {
      if (e.target.closest("[data-signout2]")) return A.signOut();
      if (e.target.closest("#tmAdd")) return addPerson();
      var t = e.target.closest("[data-tm]"), row = e.target.closest(".team-row"); if (!t || !row) return;
      var id = row.getAttribute("data-uid"), a = t.getAttribute("data-tm"); if (a === "edit") editPerson(id); else if (a === "pw") resetPw(id); else if (a === "del") removePerson(id);
    });
  }

  A.views.settings = {
    render: function (host) {
      st.host = host;
      host.innerHTML = '<div class="page-head"><div><h2>Settings</h2></div></div><div id="setBody"><p class="muted">Loading</p></div>';
      var go = function () {
        var site = A.can("settings"), html = '<div class="sgrid">';
        if (st.error && site) html = '<div class="notice">Site settings could not be loaded: ' + esc(A.errText(st.error)) + " Showing defaults.</div>" + html;
        html += secAccount() + (site ? secBanner() + secShop() + secBackup() + secHours() : "") + (A.isOwner() ? secTeam() : "") + "</div>";
        $("#setBody", host).innerHTML = html; bind(host); if (A.isOwner()) loadTeam();
      };
      if (A.can("settings") && !st.loaded) load().then(go); else go();
    },
    destroy: function () { st.host = null; }
  };
})();
