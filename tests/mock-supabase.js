/* Test-only in-memory stand-in for @supabase/supabase-js. Injected by tests/harness.js. Not shipped to the site. */
(function () {
  var D = null, listeners = [], channels = [], nextOrderId = 100;
  function uuid() { return "m-" + Math.random().toString(16).slice(2) + Date.now().toString(16); }
  function seed() {
    var d = window.AARAJ_DEFAULTS, now = Date.now(), H = 3600000;
    var db = { menu_categories: d.categories.map(function (c) { return Object.assign({ hidden: false }, c); }), menu_items: d.items.map(function (i, k) { return Object.assign({ hidden: false, sold_out: false }, i, { id: "i-" + (k + 1) }); }), photos: d.photos.map(function (p, k) { return Object.assign({ original_url: null, storage_path: null, alt_ar: "" }, p, { id: "ph-" + (k + 1) }); }), settings: Object.keys(d.settings).map(function (k) { return { key: k, value: d.settings[k] }; }), orders: [], staff_profiles: [] };
    var all = { orders: true, availability: true, menu: true, insights: true, photos: true, settings: true };
    db.staff_profiles.push({ user_id: "u-owner", email: "owner@aaraj.test", name: "Owner", role: "owner", perms: all, active: true, created_at: new Date(now - 90 * 86400000).toISOString(), last_sign_in_at: new Date(now - 3600000).toISOString() });
    db.staff_profiles.push({ user_id: "u-staff", email: "staff@aaraj.test", name: "Maryam", role: "staff", perms: { orders: true, availability: true, menu: false, insights: false, photos: false, settings: false }, active: true, created_at: new Date(now - 30 * 86400000).toISOString(), last_sign_in_at: null });
    var names = ["Salma", "Khalid", "", "Fatma", "Yousuf", "Aisha", "", "Hamad", "Noor", "Said", "Layla", "", "Rashid", "Maha"], items = db.menu_items, st = ["new", "new", "preparing", "ready", "done", "done", "done", "cancelled", "done", "done", "done", "done", "done", "done"];
    for (var k = 0; k < 14; k++) {
      var a = items[k % items.length], b = items[(k * 3 + 1) % items.length], q = 1 + (k % 3), hrsAgo = k < 4 ? k * 0.7 + 0.2 : k * 9 + 1;
      db.orders.push({ id: 100 + k, created_at: new Date(now - hrsAgo * H).toISOString(), customer_name: names[k] || null, phone: names[k] ? (k % 2 ? "+968 9" + (100000 + k * 311) : "9" + (1234000 + k * 17)) : null, items: [{ id: a.id, name: a.name_en, qty: q, price: a.price }, { id: b.id, name: b.name_en, qty: 1, price: b.price }], total: a.price * q + b.price, fulfilment: k % 3 === 0 ? "delivery" : "pickup", note: k % 4 === 0 ? "Card message: happy birthday" : null, lang: "en", status: st[k] });
    }
    nextOrderId = 200; return db;
  }
  function Q(table) { this.t = table; this.op = "select"; this.fl = []; this.ord = null; this.lim = null; this.payload = null; this.one = false; this.conf = null; }
  Q.prototype.select = function () { if (this.op === "select") this.op = "select"; return this; };
  ["eq", "gte", "lt", "lte", "in"].forEach(function (m) { Q.prototype[m] = function (c, v) { this.fl.push([m, c, v]); return this; }; });
  Q.prototype.order = function (c, o) { this.ord = [c, !(o && o.ascending === false)]; return this; };
  Q.prototype.limit = function (n) { this.lim = n; return this; };
  Q.prototype.insert = function (r) { this.op = "insert"; this.payload = r; return this; };
  Q.prototype.update = function (r) { this.op = "update"; this.payload = r; return this; };
  Q.prototype.upsert = function (r, o) { this.op = "upsert"; this.payload = r; this.conf = o && o.onConflict; return this; };
  Q.prototype.delete = function () { this.op = "delete"; return this; };
  Q.prototype.maybeSingle = function () { this.one = true; return this; };
  Q.prototype.single = Q.prototype.maybeSingle;
  function pass(row, f) { var x = row[f[1]], v = f[2]; if (f[0] === "eq") return String(x) === String(v); if (f[0] === "in") return v.indexOf(x) > -1; if (f[0] === "gte") return x >= v; if (f[0] === "lt") return x < v; if (f[0] === "lte") return x <= v; return true; }
  Q.prototype.run = function () {
    var self = this, rows = D[this.t];
    if (!rows) return { data: null, error: { code: "42P01", message: 'relation "public.' + this.t + '" does not exist' } };
    if (window.__mock.failTables && window.__mock.failTables[this.t] && this.op !== "select") return { data: null, error: { code: "XX000", message: "simulated failure" } };
    if (window.__mock.failSelect && window.__mock.failSelect[this.t] && this.op === "select") return { data: null, error: { code: "XX000", message: "simulated outage" } };
    var match = function (r) { return self.fl.every(function (f) { return pass(r, f); }); };
    if (this.op === "insert") {
      var arr = Array.isArray(this.payload) ? this.payload : [this.payload];
      arr.forEach(function (r) {
        r = JSON.parse(JSON.stringify(r));
        if (self.t === "orders") { r.id = nextOrderId++; r.status = "new"; r.created_at = new Date().toISOString(); var tot = 0; r.items = r.items.map(function (l) { var m = D.menu_items.filter(function (i) { return i.id === l.id; })[0]; var p = m ? m.price : Math.min(l.price, 1000); tot += p * l.qty; return { id: l.id, name: m ? m.name_en : l.name, qty: l.qty, price: p }; }); r.total = tot; channels.forEach(function (c) { c.handlers.forEach(function (h) { if (h.t.table === "orders") h.cb({ new: r }); }); }); }
        if (!r.id && self.t !== "settings") r.id = uuid(); if (!r.created_at) r.created_at = new Date().toISOString();
        if (D[self.t].some(function (x) { return x.id === r.id && r.id; })) { rows = null; return; }
        D[self.t].push(r);
      });
      return rows === null ? { data: null, error: { code: "23505", message: "duplicate key" } } : { data: null, error: null };
    }
    if (this.op === "upsert") { var a2 = Array.isArray(this.payload) ? this.payload : [this.payload], key = this.conf || "id"; a2.forEach(function (r) { var ex = rows.filter(function (x) { return x[key] === r[key]; })[0]; if (ex) Object.assign(ex, r); else rows.push(Object.assign({}, r)); }); return { data: null, error: null }; }
    if (this.op === "update") { rows.filter(match).forEach(function (r) { Object.assign(r, JSON.parse(JSON.stringify(self.payload))); }); return { data: null, error: null }; }
    if (this.op === "delete") { D[this.t] = rows.filter(function (r) { return !match(r); }); return { data: null, error: null }; }
    var out = rows.filter(match).map(function (r) { return JSON.parse(JSON.stringify(r)); });
    if (this.ord) { var c = this.ord[0], asc = this.ord[1]; out.sort(function (a, b) { return (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1); }); }
    if (this.lim) out = out.slice(0, this.lim);
    if (this.one) return { data: out[0] || null, error: null };
    return { data: out, error: null };
  };
  Q.prototype.then = function (res, rej) { var self = this; return new Promise(function (ok) { setTimeout(function () { ok(self.run()); }, window.__mock.latency || 15); }).then(res, rej); };

  var USERS = [{ id: "u-owner", email: "owner@aaraj.test", password: "owner-pass-1" }, { id: "u-staff", email: "staff@aaraj.test", password: "staff-pass-1" }];
  function me() { try { return JSON.parse(sessionStorage.getItem("mock_user")); } catch (e) { return null; } }
  function isOwner() { var u = me(); return !!u && D.staff_profiles.some(function (s) { return s.user_id === u.id && s.role === "owner"; }); }
  var RPC = {
    set_availability: function (a) { D.menu_items.forEach(function (i) { if (i.id === a.p_id) i.sold_out = a.p_sold_out; }); return null; },
    bulk_set_prices: function (a) { a.p.forEach(function (x) { D.menu_items.forEach(function (i) { if (i.id === x.id) i.price = x.price; }); }); return a.p.length; },
    reorder_items: function (a) { a.p.forEach(function (x) { D.menu_items.forEach(function (i) { if (i.id === x.id) i.sort = x.sort; }); }); return null; },
    admin_list_team: function () { if (!isOwner()) throw { message: "owner only", code: "42501" }; return D.staff_profiles; },
    admin_create_user: function (a) { if (!isOwner()) throw { message: "owner only", code: "42501" }; var id = uuid(); USERS.push({ id: id, email: a.p_email, password: a.p_password }); D.staff_profiles.push({ user_id: id, email: a.p_email, name: a.p_name, role: "staff", perms: a.p_perms, active: true, created_at: new Date().toISOString(), last_sign_in_at: null }); return id; },
    admin_set_password: function (a) { USERS.forEach(function (u) { if (u.id === a.p_user) u.password = a.p_password; }); return null; },
    admin_update_staff: function (a) { D.staff_profiles.forEach(function (s) { if (s.user_id === a.p_user) { s.name = a.p_name; s.perms = a.p_perms; s.active = a.p_active; } }); return null; },
    admin_remove_user: function (a) { D.staff_profiles = D.staff_profiles.filter(function (s) { return s.user_id !== a.p_user; }); return null; }
  };
  window.__mock = { latency: 15, failTables: {}, failSelect: {}, missing: {}, get db() { return D; }, insertOrder: function (r) { return new Q("orders").insert(r).run(); } };
  Object.assign(window.__mock, window.__preMock || {});
  window.supabase = {
    createClient: function () {
      D = D || (window.__mockDb = seed());
      if (window.__mock.dropTables) window.__mock.dropTables.forEach(function (t) { delete D[t]; });
      return {
        from: function (t) { return new Q(t); },
        rpc: function (name, args) { return new Promise(function (ok) { setTimeout(function () { if (window.__mock.dropRpc && window.__mock.dropRpc.indexOf(name) > -1) return ok({ data: null, error: { code: "PGRST202", message: "Could not find the function public." + name } }); try { ok({ data: RPC[name](args || {}), error: null }); } catch (e) { ok({ data: null, error: e }); } }, 15); }); },
        channel: function () { var c = { handlers: [], on: function (ev, t, cb) { c.handlers.push({ t: t, cb: cb }); return c; }, subscribe: function () { channels.push(c); return c; } }; return c; },
        removeChannel: function () { channels = []; },
        storage: { from: function () { return { upload: function (path) { return Promise.resolve({ data: { path: path }, error: null }); }, getPublicUrl: function (p) { return { data: { publicUrl: "../assets/img/" + (p.indexOf("rot") > -1 ? "tulips" : "lily-bouquet") + ".jpg?mock=" + encodeURIComponent(p) } }; } }; } },
        auth: {
          getSession: function () { var u = me(); return Promise.resolve({ data: { session: u ? { user: u } : null } }); },
          signInWithPassword: function (c) { return new Promise(function (ok) { setTimeout(function () { var u = USERS.filter(function (x) { return x.email === c.email && x.password === c.password; })[0]; if (!u) return ok({ data: {}, error: { message: "Invalid login credentials" } }); sessionStorage.setItem("mock_user", JSON.stringify({ id: u.id, email: u.email })); ok({ data: { session: { user: { id: u.id, email: u.email } } }, error: null }); }, 20); }); },
          signOut: function () { sessionStorage.removeItem("mock_user"); listeners.forEach(function (l) { l("SIGNED_OUT", null); }); return Promise.resolve({ error: null }); },
          updateUser: function () { return Promise.resolve({ data: {}, error: null }); },
          resetPasswordForEmail: function () { return Promise.resolve({ data: {}, error: null }); },
          onAuthStateChange: function (cb) { listeners.push(cb); return { data: { subscription: { unsubscribe: function () {} } } }; }
        }
      };
    }
  };
})();
