(function () {
  "use strict";
  var A = window.A, $ = A.$, esc = A.esc;
  var STATUS = ["new", "preparing", "ready", "done", "cancelled"];
  var LABEL = { new: "New", preparing: "Preparing", ready: "Ready", done: "Done", cancelled: "Cancelled" };
  var NEXT = { new: ["preparing", "Start preparing"], preparing: ["ready", "Mark ready"], ready: ["done", "Mark done"] };
  var st = { orders: [], filter: "open", q: "", range: "7", loaded: false, error: null, host: null, fresh: {}, timer: null, channel: null, started: false };

  function matchFilter(o) {
    if (st.filter === "open") return o.status === "new" || o.status === "preparing" || o.status === "ready";
    return st.filter === "all" || o.status === st.filter;
  }
  function rangeStart() {
    if (st.range === "all") return 0;
    var d = new Date(); d.setUTCHours(d.getUTCHours() + 4); d.setUTCHours(0, 0, 0, 0); d.setUTCHours(d.getUTCHours() - 4);
    return d.getTime() - (st.range === "today" ? 0 : (+st.range - 1) * 86400000);
  }
  function visible() {
    var q = st.q.trim().toLowerCase(), from = rangeStart();
    return st.orders.filter(function (o) {
      if (!matchFilter(o)) return false;
      if (st.filter !== "open" && new Date(o.created_at).getTime() < from) return false;
      if (!q) return true;
      var hay = ("#" + o.id + " " + (o.customer_name || "") + " " + (o.phone || "") + " " + (o.note || "") + " " + (o.items || []).map(function (i) { return i.name; }).join(" ")).toLowerCase();
      return hay.indexOf(q) > -1;
    });
  }
  function newCount() { return st.orders.filter(function (o) { return o.status === "new"; }).length; }

  function load(silent) {
    return A.sb.from("orders").select("*").order("created_at", { ascending: false }).limit(1000).then(function (r) {
      if (r.error) throw r.error;
      var known = {}; st.orders.forEach(function (o) { known[o.id] = 1; });
      var added = st.loaded ? r.data.filter(function (o) { return !known[o.id]; }) : [];
      st.orders = r.data; st.loaded = true; st.error = null;
      if (added.length) { added.forEach(function (o) { st.fresh[o.id] = 1; }); A.sound.play(); A.toast(added.length === 1 ? "New order #" + added[0].id : added.length + " new orders"); }
      A.updateBadge(newCount()); draw();
    }).catch(function (e) { st.error = e; if (!silent || !st.loaded) draw(); });
  }
  function onInsert(row) {
    if (!row || st.orders.some(function (o) { return o.id === row.id; })) return;
    st.orders.unshift(row); st.fresh[row.id] = 1; A.sound.play(); A.toast("New order #" + row.id); A.updateBadge(newCount()); draw();
  }
  var orders = {
    start: function () {
      if (st.started) return; st.started = true;
      load(true);
      try {
        st.channel = A.sb.channel("orders-live").on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, function (p) { onInsert(p.new); }).subscribe();
      } catch (e) {}
      st.timer = setInterval(function () { load(true); }, 20000);
    },
    stop: function () { st.started = false; clearInterval(st.timer); if (st.channel && A.sb.removeChannel) A.sb.removeChannel(st.channel); st.channel = null; st.orders = []; st.loaded = false; }
  };
  A.orders = orders;

  function chips() {
    var counts = { open: 0, all: st.orders.length };
    STATUS.forEach(function (s) { counts[s] = 0; });
    st.orders.forEach(function (o) { counts[o.status]++; if (o.status === "new" || o.status === "preparing" || o.status === "ready") counts.open++; });
    var list = [["open", "Open"]].concat(STATUS.map(function (s) { return [s, LABEL[s]]; })).concat([["all", "All"]]);
    return list.map(function (c) { return '<button type="button" class="chip" data-f="' + c[0] + '" aria-pressed="' + (st.filter === c[0]) + '">' + c[1] + ' <span class="n">' + counts[c[0]] + "</span></button>"; }).join("");
  }

  function card(o) {
    var items = (o.items || []).map(function (i) { return '<li><span>' + esc(i.qty) + " &times; " + esc(i.name) + '</span><span class="mono">' + A.money(i.price * i.qty) + "</span></li>"; }).join("");
    var d = A.digits(o.phone), nx = NEXT[o.status];
    var who = '<div class="who"><strong>' + esc(o.customer_name || "No name") + "</strong>" +
      (o.phone ? '<a href="tel:' + esc(o.phone) + '" aria-label="Call ' + esc(o.phone) + '">' + A.icon("phone") + esc(o.phone) + "</a>" + (d ? '<a href="https://wa.me/' + esc(d) + '" target="_blank" rel="noopener" aria-label="WhatsApp ' + esc(o.phone) + '">' + A.icon("chat") + "WhatsApp</a>" : "") : '<span class="muted small">No phone</span>') + "</div>";
    return '<article class="ocard' + (st.fresh[o.id] ? " fresh" : "") + '" data-id="' + o.id + '" data-status="' + o.status + '">' +
      '<div class="ohead"><div><div class="oid">#' + o.id + ' <span class="tag">' + (o.fulfilment === "delivery" ? "Delivery" : "Pickup") + '</span></div><div class="otime">' + A.fmtDate(o.created_at) + ", " + A.fmtTime(o.created_at) + " &middot; " + A.ago(o.created_at) + '</div></div><span class="status" data-s="' + o.status + '">' + LABEL[o.status] + "</span></div>" +
      who + '<ul class="olines">' + items + "</ul>" + '<div class="otot"><span>Total</span><span class="mono">' + A.money(o.total) + "</span></div>" +
      (o.note ? '<div class="onote">' + esc(o.note) + "</div>" : "") +
      '<div class="oact">' +
      (nx ? '<button type="button" class="btn btn-primary btn-sm" data-set="' + nx[0] + '">' + nx[1] + "</button>" : "") +
      ((o.status === "done" || o.status === "cancelled") ? '<button type="button" class="btn btn-sm" data-set="new">Reopen</button>' : "") +
      (o.status !== "cancelled" && o.status !== "done" ? '<button type="button" class="btn btn-sm btn-danger" data-set="cancelled">Cancel order</button>' : "") +
      '<button type="button" class="btn btn-sm btn-ghost" data-print aria-label="Print order ' + o.id + '">' + A.icon("print") + "Print</button></div></article>";
  }

  function draw() {
    var host = st.host; if (!host || !$("#ordersBody", host)) return;
    $("#ordChips", host).innerHTML = chips();
    var body = $("#ordersBody", host);
    if (st.error && !st.loaded) { body.innerHTML = A.errBox("Could not load orders", st.error, true); var r = $("[data-retry]", body); if (r) r.addEventListener("click", function () { body.innerHTML = '<p class="muted">Loading</p>'; load(); }); return; }
    var list = visible();
    $("#ordCount", host).textContent = list.length + (list.length === 1 ? " order" : " orders");
    body.innerHTML = list.length ? '<div class="grid">' + list.map(card).join("") + "</div>" : A.empty(st.orders.length ? "No orders match" : "No orders yet", st.orders.length ? "Try another filter or search." : "New orders from the website appear here with a sound.");
    st.fresh = {};
    var banner = $("#ordBanner", host); if (banner) banner.innerHTML = st.error ? '<div class="notice">Connection problem. Showing the last loaded orders. ' + esc(A.errText(st.error)) + "</div>" : "";
  }

  function setStatus(id, status) {
    var o = st.orders.filter(function (x) { return String(x.id) === String(id); })[0]; if (!o) return;
    var prev = o.status;
    A.opt(function () { o.status = status; A.updateBadge(newCount()); draw(); },
      function () { o.status = prev; A.updateBadge(newCount()); draw(); },
      function () { return A.sb.from("orders").update({ status: status }).eq("id", o.id); },
      { ok: "Order #" + o.id + ": " + LABEL[status].toLowerCase(), fail: "Order #" + o.id + " was not updated" });
  }

  function ticket(o) {
    return '<div class="pticket"><h1>Aaraj Floral Shop</h1><p><b>Order #' + o.id + "</b> &middot; " + (o.fulfilment === "delivery" ? "Delivery" : "Pickup") + "<br>" + A.fmtDate(o.created_at) + ", " + A.fmtTime(o.created_at) + "</p>" +
      "<p>" + esc(o.customer_name || "No name") + (o.phone ? " &middot; " + esc(o.phone) : "") + "</p><table>" +
      (o.items || []).map(function (i) { return "<tr><td>" + esc(i.qty) + " x " + esc(i.name) + '</td><td style="text-align:right">' + A.money(i.price * i.qty) + "</td></tr>"; }).join("") +
      '<tr><td><b>Total</b></td><td style="text-align:right"><b>' + A.money(o.total) + "</b></td></tr></table>" + (o.note ? "<p>Notes: " + esc(o.note) + "</p>" : "") + "</div>";
  }
  function doPrint(list) {
    if (!list.length) return A.toast("Nothing to print", { bad: true });
    $("#printArea").innerHTML = list.map(ticket).join(""); setTimeout(function () { window.print(); }, 50);
  }
  function csv() {
    var list = visible(); if (!list.length) return A.toast("Nothing to export", { bad: true });
    var q = function (v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var rows = [["Order", "Date", "Time", "Status", "Fulfilment", "Name", "Phone", "Items", "Total OMR", "Notes"]].concat(list.map(function (o) {
      return [o.id, A.dayKey(o.created_at), A.fmtTime(o.created_at), o.status, o.fulfilment, o.customer_name, o.phone, (o.items || []).map(function (i) { return i.qty + " x " + i.name; }).join("; "), Number(o.total).toFixed(3), o.note];
    }));
    A.download("aaraj-orders-" + A.dayKey(new Date()) + ".csv", "text/csv;charset=utf-8", "﻿" + rows.map(function (r) { return r.map(q).join(","); }).join("\r\n"));
    A.toast("Exported " + list.length + " orders");
  }

  A.views.orders = {
    render: function (host) {
      st.host = host;
      var sp = A.sound.prefs();
      host.innerHTML = '<div class="page-head"><div><h2>Orders</h2><p class="muted small" id="ordCount"></p></div><div class="tools">' +
        '<button type="button" class="btn btn-sm ico" id="ordSound" aria-label="Toggle sound" aria-pressed="' + sp.on + '">' + A.icon("sound") + '<span>Sound ' + (sp.on ? "on" : "off") + "</span></button>" +
        '<button type="button" class="btn btn-sm ico" id="ordPrint" aria-label="Print list">' + A.icon("print") + "<span>Print list</span></button>" +
        '<button type="button" class="btn btn-sm ico" id="ordCsv" aria-label="Export CSV">' + A.icon("download") + "<span>Export CSV</span></button></div></div>" +
        '<div id="ordBanner"></div><div class="toolbar"><label class="search"><span class="sr">Search orders</span>' + A.icon("search") + '<input type="search" id="ordQ" placeholder="Search name, phone, item or number" value="' + esc(st.q) + '"></label>' +
        '<label><span class="sr">Date range</span><select id="ordRange" aria-label="Date range"><option value="today">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All time</option></select></label></div>' +
        '<div class="chips" id="ordChips" style="margin-bottom:14px" role="group" aria-label="Filter by status"></div><div id="ordersBody"><p class="muted">Loading</p></div>';
      $("#ordRange", host).value = st.range;
      $("#ordQ", host).addEventListener("input", A.debounce(function (e) { st.q = e.target.value; draw(); }, 150));
      $("#ordRange", host).addEventListener("change", function (e) { st.range = e.target.value; draw(); });
      $("#ordSound", host).addEventListener("click", function () { var p = A.sound.prefs(); p.on = !p.on; A.sound.save(p); var b = $("#ordSound", host); b.setAttribute("aria-pressed", p.on); $("span", b).textContent = "Sound " + (p.on ? "on" : "off"); if (p.on) A.sound.play(true); });
      $("#ordPrint", host).addEventListener("click", function () { doPrint(visible()); });
      $("#ordCsv", host).addEventListener("click", csv);
      host.addEventListener("click", function (e) {
        var c = e.target.closest("[data-f]"); if (c) { st.filter = c.getAttribute("data-f"); draw(); return; }
        var s = e.target.closest("[data-set]"), card = e.target.closest(".ocard");
        if (s && card) { var id = card.getAttribute("data-id"), to = s.getAttribute("data-set"); if (to === "cancelled") { A.confirm("Cancel order #" + id + "?", "The customer is not notified. You can reopen the order later.", "Cancel order", true).then(function (ok) { if (ok) setStatus(id, to); }); } else setStatus(id, to); return; }
        if (e.target.closest("[data-print]") && card) { var o = st.orders.filter(function (x) { return String(x.id) === card.getAttribute("data-id"); })[0]; if (o) doPrint([o]); }
      });
      if (!st.loaded) { if (!st.started) orders.start(); else load(); } else { A.updateBadge(newCount()); draw(); }
      draw();
    },
    destroy: function () { st.host = null; }
  };
})();
