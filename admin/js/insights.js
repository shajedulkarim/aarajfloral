(function () {
  "use strict";
  var A = window.A, $ = A.$, esc = A.esc;
  var st = { range: "7", from: "", to: "", host: null, token: 0 };

  function bounds() {
    var now = new Date(), m = A.muscat(now), y = m.getUTCFullYear(), mo = m.getUTCMonth(), d = m.getUTCDate();
    function startOfDay(yy, mm, dd) { return new Date(Date.UTC(yy, mm, dd) - 4 * 3600 * 1000); } /* Muscat midnight as a real instant */
    var end = startOfDay(y, mo, d + 1), start;
    if (st.range === "today") start = startOfDay(y, mo, d);
    else if (st.range === "month") start = startOfDay(y, mo, 1);
    else if (st.range === "custom" && st.from && st.to) { var f = st.from.split("-"), t = st.to.split("-"); start = startOfDay(+f[0], +f[1] - 1, +f[2]); end = startOfDay(+t[0], +t[1] - 1, +t[2] + 1); }
    else start = startOfDay(y, mo, d - (+st.range - 1));
    return { start: start, end: end };
  }
  function compute(orders, b) {
    var valid = orders.filter(function (o) { return o.status !== "cancelled"; }), rev = 0, hours = new Array(24).fill(0), days = {}, items = {};
    valid.forEach(function (o) {
      rev += Number(o.total); hours[A.muscat(o.created_at).getUTCHours()]++;
      var k = A.dayKey(o.created_at); days[k] = (days[k] || 0) + Number(o.total);
      (o.items || []).forEach(function (i) { var r = items[i.name] || (items[i.name] = { name: i.name, qty: 0, rev: 0 }); r.qty += Number(i.qty); r.rev += Number(i.qty) * Number(i.price); });
    });
    var dayList = [], cur = new Date(b.start.getTime() + 4 * 3600 * 1000 + 1000), endMs = b.end.getTime();
    for (var t = b.start.getTime(); t < endMs && dayList.length < 62; t += 86400000) { var k2 = A.dayKey(new Date(t + 1000)); dayList.push({ key: k2, v: days[k2] || 0 }); }
    return { count: valid.length, cancelled: orders.length - valid.length, revenue: rev, avg: valid.length ? rev / valid.length : 0, hours: hours, days: dayList, top: Object.keys(items).map(function (n) { return items[n]; }).sort(function (a, c) { return c.qty - a.qty || c.rev - a.rev; }).slice(0, 8) };
  }
  function bars(vals, labels, fmt) {
    var max = Math.max.apply(null, vals.concat([0.0001]));
    return '<div class="bars" role="img" aria-label="Bar chart">' + vals.map(function (v, i) { return '<div title="' + esc(labels[i] + ": " + fmt(v)) + '"><span class="b' + (v ? "" : " z") + '" style="height:' + Math.max(v ? 3 : 1, Math.round(v / max * 100)) + '%"></span><em>' + esc(labels[i]) + "</em></div>"; }).join("") + "</div>";
  }
  function render(body, data, b) {
    if (!data.count && !data.cancelled) { body.innerHTML = A.empty("No orders in this range", "Pick a longer range or wait for orders to arrive."); return; }
    var hl = data.hours.map(function (_, i) { return i % 3 === 0 ? (i % 12 || 12) + (i < 12 ? "a" : "p") : ""; });
    var dl = data.days.map(function (d, i) { var n = data.days.length; return n <= 10 || i % Math.ceil(n / 8) === 0 ? d.key.slice(8) : ""; });
    var topMax = data.top.length ? data.top[0].qty : 1;
    body.innerHTML = '<div class="kpis"><div class="kpi"><small>Revenue</small><strong>' + A.money(data.revenue) + '</strong></div><div class="kpi"><small>Orders</small><strong>' + data.count + '</strong></div><div class="kpi"><small>Average order</small><strong>' + A.money(data.avg) + '</strong></div><div class="kpi"><small>Cancelled</small><strong>' + data.cancelled + "</strong></div></div>" +
      '<div class="two-col"><section class="panel" style="margin-bottom:14px"><h3>Revenue by day</h3><p class="muted small">Cancelled orders are not counted.</p>' + bars(data.days.map(function (d) { return d.v; }), dl, A.money) + "</section>" +
      '<section class="panel" style="margin-bottom:14px"><h3>Busy hours</h3><p class="muted small">Orders by hour, Muscat time.</p>' + bars(data.hours, hl, function (v) { return v + " orders"; }) + "</section></div>" +
      '<section class="panel"><h3>Top items</h3>' + (data.top.length ? '<ol class="toplist">' + data.top.map(function (t) { return '<li><span>' + esc(t.name) + '</span><span class="mono">' + t.qty + " sold &middot; " + A.money(t.rev) + '</span><div class="bar"><i style="width:' + Math.round(t.qty / topMax * 100) + '%"></i></div></li>'; }).join("") + "</ol>" : '<p class="muted">No items sold.</p>') + "</section>";
  }
  function load() {
    var host = st.host; if (!host) return; var body = $("#insBody", host), b = bounds(), tok = ++st.token;
    body.innerHTML = '<p class="muted">Loading</p>';
    A.sb.from("orders").select("*").gte("created_at", b.start.toISOString()).lt("created_at", b.end.toISOString()).order("created_at", { ascending: true }).limit(5000).then(function (r) {
      if (tok !== st.token || !st.host) return;
      if (r.error) { body.innerHTML = A.errBox("Could not load insights", r.error, true); var rt = $("[data-retry]", body); if (rt) rt.addEventListener("click", load); return; }
      render(body, compute(r.data, b), b);
    });
  }
  A.views.insights = {
    render: function (host) {
      st.host = host;
      host.innerHTML = '<div class="page-head"><div><h2>Insights</h2><p class="muted small">Based on orders logged from the website.</p></div></div>' +
        '<div class="toolbar"><label><span class="sr">Range</span><select id="insRange" aria-label="Date range"><option value="today">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="month">This month</option><option value="custom">Custom range</option></select></label>' +
        '<span id="insCustom" class="custom-range" ' + (st.range === "custom" ? "" : "hidden") + '><label><span class="sr">From</span><input type="date" id="insFrom" value="' + esc(st.from) + '"></label><span>to</span><label><span class="sr">To</span><input type="date" id="insTo" value="' + esc(st.to) + '"></label></span></div><div id="insBody"></div>';
      $("#insRange", host).value = st.range;
      $("#insRange", host).addEventListener("change", function (e) { st.range = e.target.value; $("#insCustom", host).hidden = st.range !== "custom"; if (st.range !== "custom") load(); else { if (!st.from) { st.to = A.dayKey(new Date()); st.from = A.dayKey(new Date(Date.now() - 6 * 86400000)); $("#insFrom", host).value = st.from; $("#insTo", host).value = st.to; } load(); } });
      ["#insFrom", "#insTo"].forEach(function (s) { $(s, host).addEventListener("change", function () { st.from = $("#insFrom", host).value; st.to = $("#insTo", host).value; if (st.from && st.to && st.from <= st.to) load(); }); });
      load();
    },
    destroy: function () { st.host = null; }
  };
})();
