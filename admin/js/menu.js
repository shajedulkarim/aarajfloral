(function () {
  "use strict";
  var A = window.A, $ = A.$, esc = A.esc;
  var st = { cats: [], items: [], loaded: false, error: null, q: "", filter: "all", collapsed: {}, mode: "manage", host: null, dragId: null };
  try { st.collapsed = JSON.parse(localStorage.getItem("aaraj_collapsed") || "{}"); } catch (e) {}

  function byId(id) { return st.items.filter(function (i) { return i.id === id; })[0]; }
  function catItems(cid) { return st.items.filter(function (i) { return i.category_id === cid; }).sort(function (a, b) { return a.sort - b.sort; }); }
  function sortedCats() { return st.cats.slice().sort(function (a, b) { return a.sort - b.sort; }); }

  function load() {
    return Promise.all([A.sb.from("menu_categories").select("*").order("sort", { ascending: true }), A.sb.from("menu_items").select("*").order("sort", { ascending: true })]).then(function (r) {
      if (r[0].error) throw r[0].error; if (r[1].error) throw r[1].error;
      st.cats = r[0].data; st.items = r[1].data; st.loaded = true; st.error = null; draw();
    }).catch(function (e) { st.error = e; draw(); });
  }

  function matches(i) {
    var q = st.q.trim().toLowerCase();
    if (st.filter === "visible" && i.hidden) return false;
    if (st.filter === "hidden" && !i.hidden) return false;
    if (st.filter === "out" && !i.sold_out) return false;
    if (!q) return true;
    return (i.name_en + " " + i.name_ar + " " + i.desc_en + " " + i.price).toLowerCase().indexOf(q) > -1;
  }
  function saveCollapsed() { try { localStorage.setItem("aaraj_collapsed", JSON.stringify(st.collapsed)); } catch (e) {} }

  /* ---------- draw ---------- */
  function chips() {
    var c = { all: st.items.length, visible: 0, hidden: 0, out: 0 };
    st.items.forEach(function (i) { if (i.hidden) c.hidden++; else c.visible++; if (i.sold_out) c.out++; });
    return [["all", "All"], ["visible", "Visible"], ["hidden", "Hidden"], ["out", "Sold out"]].map(function (x) { return '<button type="button" class="chip" data-f="' + x[0] + '" aria-pressed="' + (st.filter === x[0]) + '">' + x[1] + ' <span class="n">' + c[x[0]] + "</span></button>"; }).join("");
  }
  function itemRow(i, idx, total) {
    return '<div class="mitem" data-id="' + i.id + '" data-hidden="' + !!i.hidden + '" draggable="false">' +
      (i.image_url ? '<img class="mthumb" src="' + esc(A.asset(i.image_url)) + '" alt="" loading="lazy" width="56" height="56">' : '<div class="mthumb"></div>') +
      '<div><div class="mname"><span>' + esc(i.name_en) + "</span>" + (i.hidden ? '<span class="tag">Hidden</span>' : "") + (i.sold_out ? '<span class="tag" style="background:var(--st-cancel-bg);color:var(--st-cancel)">Sold out</span>' : "") + '</div><div class="mprice">' + A.money(i.price) + (i.name_ar ? ' &middot; <span class="ar" dir="rtl">' + esc(i.name_ar) + "</span>" : "") + "</div></div>" +
      '<div class="mact"><label class="sold"><span class="switch"><input type="checkbox" data-act="sold" ' + (i.sold_out ? "checked" : "") + ' aria-label="Sold out: ' + esc(i.name_en) + '"><i></i></span>Sold out</label>' +
      '<span class="drag icon-btn sm" data-drag title="Drag to reorder" aria-hidden="true">' + A.icon("drag") + "</span>" +
      '<button type="button" class="icon-btn sm" data-act="up" aria-label="Move up" ' + (idx === 0 ? "disabled" : "") + ">" + A.icon("up") + "</button>" +
      '<button type="button" class="icon-btn sm" data-act="down" aria-label="Move down" ' + (idx === total - 1 ? "disabled" : "") + ">" + A.icon("down") + "</button>" +
      '<button type="button" class="icon-btn sm" data-act="hide" aria-label="' + (i.hidden ? "Show on site" : "Hide from site") + '">' + A.icon(i.hidden ? "eyeoff" : "eye") + "</button>" +
      '<button type="button" class="icon-btn sm" data-act="dup" aria-label="Duplicate">' + A.icon("dup") + "</button>" +
      '<button type="button" class="icon-btn sm" data-act="edit" aria-label="Edit">' + A.icon("edit") + "</button>" +
      '<button type="button" class="icon-btn sm" data-act="del" aria-label="Delete">' + A.icon("trash") + "</button></div></div>";
  }
  function drawManage(body) {
    var cats = sortedCats(), filtering = st.filter !== "all" || !!st.q.trim(), html = "", any = false;
    cats.forEach(function (c, ci) {
      var all = catItems(c.id), list = all.filter(matches);
      if (filtering && !list.length) return;
      any = true;
      var open = !st.collapsed[c.id] || filtering;
      html += '<section class="msec" data-cat="' + esc(c.id) + '" data-open="' + open + '"><div class="msec-head"><button type="button" class="tg" data-sec="toggle" aria-expanded="' + open + '">' + A.icon("chev") + esc(c.name_en) + ' <span class="muted small" style="font-family:var(--font-body);font-weight:400">' + all.length + (c.hidden ? " &middot; hidden" : "") + "</span></button>" +
        '<button type="button" class="icon-btn sm" data-sec="up" aria-label="Move section up" ' + (ci === 0 ? "disabled" : "") + ">" + A.icon("up") + "</button>" +
        '<button type="button" class="icon-btn sm" data-sec="down" aria-label="Move section down" ' + (ci === cats.length - 1 ? "disabled" : "") + ">" + A.icon("down") + "</button>" +
        '<button type="button" class="icon-btn sm" data-sec="hide" aria-label="' + (c.hidden ? "Show section" : "Hide section") + '">' + A.icon(c.hidden ? "eyeoff" : "eye") + "</button>" +
        '<button type="button" class="icon-btn sm" data-sec="edit" aria-label="Rename section">' + A.icon("edit") + "</button>" +
        '<button type="button" class="icon-btn sm" data-sec="del" aria-label="Delete section">' + A.icon("trash") + "</button></div>" +
        '<div class="mitems">' + (list.length ? list.map(function (i, idx) { return itemRow(i, idx, list.length); }).join("") : '<p class="muted" style="padding:14px">No items in this section. Use Add item.</p>') + "</div></section>";
    });
    body.innerHTML = any ? html : (st.cats.length ? A.empty("Nothing matches", "Clear the search or filter.") : A.empty("The menu is empty", "Add a section, then add items to it."));
  }
  function drawAvail(body) {
    var cats = sortedCats(), html = "", any = false, q = st.q.trim().toLowerCase();
    cats.forEach(function (c) {
      var list = catItems(c.id).filter(function (i) { return !q || (i.name_en + " " + i.name_ar).toLowerCase().indexOf(q) > -1; });
      if (!list.length) return; any = true;
      html += '<section class="msec" data-cat="' + esc(c.id) + '"><div class="msec-head"><h3>' + esc(c.name_en) + '</h3></div><div>' +
        list.map(function (i) { return '<div class="avail-row" data-id="' + i.id + '" data-out="' + !!i.sold_out + '"><span class="nm">' + esc(i.name_en) + (i.hidden ? ' <span class="tag">Hidden</span>' : "") + '</span><span class="small muted">' + (i.sold_out ? "Sold out" : "Available") + '</span><label class="switch"><span class="sr">Available: ' + esc(i.name_en) + '</span><input type="checkbox" data-act="avail" ' + (i.sold_out ? "" : "checked") + "><i></i></label></div>"; }).join("") + "</div></section>";
    });
    body.innerHTML = any ? html : A.empty("No items", q ? "Nothing matches that search." : "The menu is empty.");
  }
  function draw() {
    var host = st.host; if (!host || !$("#menuBody", host)) return;
    var body = $("#menuBody", host);
    if (st.error && !st.loaded) { body.innerHTML = A.errBox("Could not load the menu", st.error, true); var r = $("[data-retry]", body); if (r) r.addEventListener("click", function () { load(); }); return; }
    var ch = $("#menuChips", host); if (ch) ch.innerHTML = chips();
    if (st.mode === "avail") drawAvail(body); else drawManage(body);
  }

  /* ---------- mutations ---------- */
  function renumber(cid, order) {
    var changed = []; order.forEach(function (it, idx) { if (it.sort !== idx + 1) { changed.push({ id: it.id, sort: idx + 1, old: it.sort }); } });
    return changed;
  }
  function applyOrder(cid, order) {
    var changed = renumber(cid, order); if (!changed.length) return;
    A.opt(function () { changed.forEach(function (c) { byId(c.id).sort = c.sort; }); draw(); },
      function () { changed.forEach(function (c) { byId(c.id).sort = c.old; }); draw(); },
      function () { return A.sb.rpc("reorder_items", { p: changed.map(function (c) { return { id: c.id, sort: c.sort }; }) }); },
      { fail: "Order was not saved" });
  }
  function moveItem(id, dir) {
    var it = byId(id), list = catItems(it.category_id), i = list.indexOf(it), j = i + dir;
    if (j < 0 || j >= list.length) return; list.splice(i, 1); list.splice(j, 0, it); applyOrder(it.category_id, list);
  }
  function dropItem(dragId, targetId, before) {
    var d = byId(dragId), t = byId(targetId); if (!d || !t || d.category_id !== t.category_id || d === t) return;
    var list = catItems(d.category_id).filter(function (x) { return x !== d; }), ti = list.indexOf(t);
    list.splice(before ? ti : ti + 1, 0, d); applyOrder(d.category_id, list);
  }
  function toggleSold(id, val) {
    var it = byId(id), prev = it.sold_out;
    A.opt(function () { it.sold_out = val; draw(); }, function () { it.sold_out = prev; draw(); },
      function () { return A.sb.rpc("set_availability", { p_id: id, p_sold_out: val }); },
      { ok: it.name_en + (val ? " marked sold out" : " back in stock"), fail: "Availability was not saved" });
  }
  function toggleHidden(id) {
    var it = byId(id), prev = it.hidden;
    A.opt(function () { it.hidden = !prev; draw(); }, function () { it.hidden = prev; draw(); },
      function () { return A.sb.from("menu_items").update({ hidden: !prev }).eq("id", id); },
      { ok: it.name_en + (prev ? " is visible on the site" : " is hidden from the site"), fail: "Change was not saved" });
  }
  function duplicate(id) {
    var src = byId(id), list = catItems(src.category_id), copy = Object.assign({}, src, { id: A.uid(), name_en: src.name_en + " copy", sort: src.sort + 1, hidden: true });
    delete copy.created_at; delete copy.updated_at;
    var shifted = list.filter(function (x) { return x.sort > src.sort; });
    A.opt(function () { shifted.forEach(function (x) { x.sort++; }); st.items.push(copy); draw(); },
      function () { shifted.forEach(function (x) { x.sort--; }); st.items = st.items.filter(function (x) { return x.id !== copy.id; }); draw(); },
      function () { return A.sb.from("menu_items").insert(copy).then(function (r) { if (r.error) return r; return shifted.length ? A.sb.rpc("reorder_items", { p: shifted.map(function (x) { return { id: x.id, sort: x.sort }; }) }) : r; }); },
      { ok: "Duplicated. The copy is hidden until you edit it.", fail: "Could not duplicate" });
  }
  function removeItem(id) {
    var it = byId(id), snapshot = Object.assign({}, it), idx = st.items.indexOf(it);
    A.opt(function () { st.items.splice(idx, 1); draw(); },
      function () { st.items.splice(idx, 0, it); draw(); },
      function () { return A.sb.from("menu_items").delete().eq("id", id); },
      { ok: "Deleted " + snapshot.name_en, okOpts: { action: { label: "Undo", fn: function () { undoDelete(snapshot); } } }, fail: "Could not delete" });
  }
  function undoDelete(row) {
    A.opt(function () { st.items.push(row); draw(); }, function () { st.items = st.items.filter(function (x) { return x.id !== row.id; }); draw(); },
      function () { var r = Object.assign({}, row); delete r.updated_at; return A.sb.from("menu_items").insert(r); }, { ok: "Restored " + row.name_en, fail: "Could not restore" });
  }

  /* ---------- item modal ---------- */
  function openItem(id, catId) {
    var it = id ? byId(id) : { id: A.uid(), category_id: catId || (sortedCats()[0] || {}).id, name_en: "", name_ar: "", desc_en: "", desc_ar: "", price: 0, image_url: "", hidden: false, sold_out: false, sort: 0 };
    if (!it.category_id) return A.toast("Add a section first", { bad: true });
    var isNew = !id;
    var m = A.modal({
      title: isNew ? "Add item" : "Edit item", wide: true,
      body: '<form id="itemForm" novalidate><div class="row2"><label class="field"><span>Name (English)</span><input type="text" name="name_en" required maxlength="120" value="' + esc(it.name_en) + '"></label><label class="field"><span>Name (Arabic)</span><input type="text" name="name_ar" dir="rtl" maxlength="120" value="' + esc(it.name_ar) + '"></label></div>' +
        '<div class="row2"><label class="field"><span>Description (English)</span><textarea name="desc_en" maxlength="300">' + esc(it.desc_en) + '</textarea></label><label class="field"><span>Description (Arabic)</span><textarea name="desc_ar" dir="rtl" maxlength="300">' + esc(it.desc_ar) + "</textarea></label></div>" +
        '<div class="row2"><label class="field"><span>Section</span><select name="category_id">' + sortedCats().map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === it.category_id ? " selected" : "") + ">" + esc(c.name_en) + "</option>"; }).join("") + '</select></label><label class="field"><span>Price (OMR)</span><input type="number" name="price" min="0" step="0.001" inputmode="decimal" required value="' + Number(it.price).toFixed(3) + '"></label></div>' +
        '<div class="field"><span>Photo</span><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><img id="itemPrev" class="mthumb" alt="" width="56" height="56" src="' + esc(A.asset(it.image_url)) + '" ' + (it.image_url ? "" : "hidden") + '><input type="hidden" name="image_url" value="' + esc(it.image_url || "") + '"><button type="button" class="btn btn-sm" id="pickPhoto">Choose from photos</button><label class="btn btn-sm" style="cursor:pointer">Upload new<input type="file" id="upPhoto" accept="image/*" hidden></label><button type="button" class="btn btn-sm btn-ghost" id="noPhoto">Remove photo</button></div></div>' +
        '<label class="check"><input type="checkbox" name="hidden" ' + (it.hidden ? "checked" : "") + "> Hide from the website</label>" +
        '<label class="check"><input type="checkbox" name="sold_out" ' + (it.sold_out ? "checked" : "") + "> Sold out</label></form>",
      foot: '<button class="btn" data-close type="button">Cancel</button><button class="btn btn-primary" id="saveItem" type="button">Save item</button>'
    });
    var form = m.$("#itemForm");
    function setImg(u) { form.image_url.value = u || ""; var p = m.$("#itemPrev"); p.hidden = !u; p.src = A.asset(u || ""); }
    m.$("#noPhoto").addEventListener("click", function () { setImg(""); });
    m.$("#pickPhoto").addEventListener("click", function () { A.photoLib && A.photoLib.pick(function (url) { setImg(url); }); });
    m.$("#upPhoto").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return; A.toast("Uploading photo");
      A.photoLib.upload(f, "catalogue").then(function (r) { setImg(r.url); A.toast("Photo uploaded"); }).catch(function (er) { A.toast("Upload failed. " + A.errText(er), { bad: true }); });
    });
    m.$("#saveItem").addEventListener("click", function () {
      var name = form.name_en.value.trim(), price = parseFloat(form.price.value);
      if (!name) { form.name_en.focus(); return A.toast("Enter an English name", { bad: true }); }
      if (!(price >= 0)) { form.price.focus(); return A.toast("Enter a valid price", { bad: true }); }
      var row = { id: it.id, category_id: form.category_id.value, name_en: name, name_ar: form.name_ar.value.trim(), desc_en: form.desc_en.value.trim(), desc_ar: form.desc_ar.value.trim(), price: Math.round(price * 1000) / 1000, image_url: form.image_url.value || null, hidden: form.hidden.checked, sold_out: form.sold_out.checked };
      m.close();
      if (isNew) {
        row.sort = catItems(row.category_id).length + 1;
        A.opt(function () { st.items.push(row); draw(); }, function () { st.items = st.items.filter(function (x) { return x.id !== row.id; }); draw(); },
          function () { return A.sb.from("menu_items").insert(row); }, { ok: "Added " + row.name_en, fail: "Could not add the item" });
      } else {
        var prev = Object.assign({}, it);
        if (row.category_id !== it.category_id) row.sort = catItems(row.category_id).length + 1; else row.sort = it.sort;
        A.opt(function () { Object.assign(it, row); draw(); }, function () { Object.assign(it, prev); draw(); },
          function () { var u = Object.assign({}, row); delete u.id; return A.sb.from("menu_items").update(u).eq("id", it.id); }, { ok: "Saved " + row.name_en, fail: "Could not save the item" });
      }
    });
  }

  /* ---------- sections ---------- */
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "section"; }
  function openCat(id) {
    var c = id ? st.cats.filter(function (x) { return x.id === id; })[0] : { id: "", name_en: "", name_ar: "", sort: st.cats.length + 1, hidden: false };
    var m = A.modal({
      title: id ? "Rename section" : "Add section",
      body: '<form id="catForm"><label class="field"><span>Name (English)</span><input type="text" name="name_en" required maxlength="60" value="' + esc(c.name_en) + '"></label><label class="field"><span>Name (Arabic)</span><input type="text" name="name_ar" dir="rtl" maxlength="60" value="' + esc(c.name_ar) + '"></label></form>',
      foot: '<button class="btn" data-close type="button">Cancel</button><button class="btn btn-primary" id="saveCat" type="button">Save</button>'
    });
    m.$("#saveCat").addEventListener("click", function () {
      var f = m.$("#catForm"), n = f.name_en.value.trim(); if (!n) return A.toast("Enter a name", { bad: true });
      m.close();
      if (id) { var prev = Object.assign({}, c); A.opt(function () { c.name_en = n; c.name_ar = f.name_ar.value.trim(); draw(); }, function () { Object.assign(c, prev); draw(); }, function () { return A.sb.from("menu_categories").update({ name_en: c.name_en, name_ar: c.name_ar }).eq("id", id); }, { ok: "Section saved", fail: "Could not save" }); }
      else {
        var nid = slug(n); while (st.cats.some(function (x) { return x.id === nid; })) nid += "-" + Math.floor(Math.random() * 90 + 10);
        var row = { id: nid, name_en: n, name_ar: f.name_ar.value.trim(), sort: st.cats.length + 1, hidden: false };
        A.opt(function () { st.cats.push(row); draw(); }, function () { st.cats = st.cats.filter(function (x) { return x.id !== nid; }); draw(); }, function () { return A.sb.from("menu_categories").insert(row); }, { ok: "Section added", fail: "Could not add the section" });
      }
    });
  }
  function moveCat(id, dir) {
    var list = sortedCats(), c = list.filter(function (x) { return x.id === id; })[0], i = list.indexOf(c), j = i + dir; if (j < 0 || j >= list.length) return;
    list.splice(i, 1); list.splice(j, 0, c); var old = list.map(function (x) { return x.sort; });
    A.opt(function () { list.forEach(function (x, k) { x.sort = k + 1; }); draw(); }, function () { list.forEach(function (x, k) { x.sort = old[k]; }); draw(); },
      function () { return Promise.all(list.map(function (x, k) { return A.sb.from("menu_categories").update({ sort: k + 1 }).eq("id", x.id); })).then(function (rs) { return rs.filter(function (r) { return r.error; })[0] || rs[0]; }); }, { fail: "Order was not saved" });
  }
  function hideCat(id) {
    var c = st.cats.filter(function (x) { return x.id === id; })[0], prev = c.hidden;
    A.opt(function () { c.hidden = !prev; draw(); }, function () { c.hidden = prev; draw(); }, function () { return A.sb.from("menu_categories").update({ hidden: !prev }).eq("id", id); }, { ok: c.name_en + (prev ? " is visible" : " is hidden from the site"), fail: "Change was not saved" });
  }
  function delCat(id) {
    var c = st.cats.filter(function (x) { return x.id === id; })[0], its = catItems(id);
    A.confirm("Delete " + c.name_en + "?", its.length ? "This also deletes its " + its.length + " item" + (its.length === 1 ? "" : "s") + ". This cannot be undone." : "This section is empty.", "Delete section", true).then(function (ok) {
      if (!ok) return; var ci = st.cats.indexOf(c);
      A.opt(function () { st.cats.splice(ci, 1); st.items = st.items.filter(function (x) { return x.category_id !== id; }); draw(); },
        function () { st.cats.splice(ci, 0, c); st.items = st.items.concat(its); draw(); },
        function () { return A.sb.from("menu_categories").delete().eq("id", id); }, { ok: "Section deleted", fail: "Could not delete the section" });
    });
  }

  /* ---------- bulk price adjust ---------- */
  function calc(old, mode, val, round) {
    var n = mode === "percent" ? old * (1 + val / 100) : old + val;
    if (round > 0) n = Math.round(n / round) * round;
    return Math.max(0, Math.round(n * 1000) / 1000);
  }
  function openBulk() {
    var m = A.modal({
      title: "Adjust prices", wide: true,
      body: '<div class="row2"><label class="field"><span>Apply to</span><select id="bScope"><option value="*">All sections</option>' + sortedCats().map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name_en) + "</option>"; }).join("") + '</select></label>' +
        '<label class="field"><span>Change by</span><select id="bMode"><option value="percent">Percent</option><option value="amount">Amount in OMR</option></select></label></div>' +
        '<div class="row2"><label class="field"><span>Value (negative lowers prices)</span><input type="number" id="bVal" step="0.001" value="10"></label><label class="field"><span>Round to</span><select id="bRound"><option value="0">No rounding</option><option value="0.05">0.050</option><option value="0.5">0.500</option><option value="1">1.000</option></select></label></div>' +
        '<div class="panel" style="max-height:34dvh;overflow:auto;padding:8px 12px"><table style="width:100%;border-collapse:collapse" id="bTable"></table></div><p class="muted small" id="bSum" style="margin-top:8px"></p>',
      foot: '<button class="btn" data-close type="button">Cancel</button><button class="btn btn-primary" id="bApply" type="button">Apply changes</button>'
    });
    var plan = [];
    function preview() {
      var sc = m.$("#bScope").value, mode = m.$("#bMode").value, val = parseFloat(m.$("#bVal").value) || 0, rd = parseFloat(m.$("#bRound").value);
      plan = st.items.filter(function (i) { return sc === "*" || i.category_id === sc; }).map(function (i) { return { it: i, old: Number(i.price), next: calc(Number(i.price), mode, val, rd) }; }).filter(function (p) { return p.old !== p.next; });
      m.$("#bTable").innerHTML = plan.length ? '<tr class="small muted"><th align="left">Item</th><th align="right">Now</th><th align="right">After</th></tr>' + plan.map(function (p) { return '<tr><td style="padding:6px 0;border-top:1px solid var(--line)">' + esc(p.it.name_en) + '</td><td align="right" class="mono">' + p.old.toFixed(3) + '</td><td align="right" class="mono"><b>' + p.next.toFixed(3) + "</b></td></tr>"; }).join("") : '<tr><td class="muted" style="padding:10px">No prices would change.</td></tr>';
      m.$("#bSum").textContent = plan.length + " price" + (plan.length === 1 ? "" : "s") + " will change. You can undo right after.";
      m.$("#bApply").disabled = !plan.length;
    }
    ["#bScope", "#bMode", "#bVal", "#bRound"].forEach(function (s) { m.$(s).addEventListener("input", preview); }); preview();
    m.$("#bApply").addEventListener("click", function () {
      var snap = plan.map(function (p) { return { it: p.it, old: p.old, next: p.next }; }); m.close();
      function setAll(useNext) { snap.forEach(function (p) { p.it.price = useNext ? p.next : p.old; }); draw(); }
      function remote(useNext) { return function () { return A.sb.rpc("bulk_set_prices", { p: snap.map(function (p) { return { id: p.it.id, price: useNext ? p.next : p.old }; }) }); }; }
      A.opt(function () { setAll(true); }, function () { setAll(false); }, remote(true),
        { ok: "Updated " + snap.length + " prices", okOpts: { action: { label: "Undo", fn: function () { A.opt(function () { setAll(false); }, function () { setAll(true); }, remote(false), { ok: "Prices restored", fail: "Could not restore prices" }); } } }, fail: "Prices were not changed" });
    });
  }

  /* ---------- view ---------- */
  function renderView(host, mode) {
    st.host = host; st.mode = mode;
    var manage = mode === "manage" && A.can("menu");
    host.innerHTML = '<div class="page-head"><div><h2>' + (manage ? "Menu" : "Availability") + '</h2><p class="muted small">' + (manage ? "What customers see on the website." : "Switch items off when they run out.") + "</p></div>" +
      (manage ? '<div class="tools"><button type="button" class="btn btn-sm" id="mAvail">' + A.icon("avail") + 'Availability view</button><button type="button" class="btn btn-sm" id="mBulk">Adjust prices</button><button type="button" class="btn btn-sm" id="mCat">' + A.icon("plus") + 'Add section</button><button type="button" class="btn btn-primary btn-sm" id="mAdd">' + A.icon("plus") + "Add item</button></div>" : (A.can("menu") ? '<div class="tools"><button type="button" class="btn btn-sm" id="mManage">Back to full menu</button></div>' : "")) + "</div>" +
      '<div class="toolbar"><label class="search"><span class="sr">Search items</span>' + A.icon("search") + '<input type="search" id="mQ" placeholder="Search items" value="' + esc(st.q) + '"></label></div>' +
      (manage ? '<div class="chips" id="menuChips" style="margin-bottom:14px" role="group" aria-label="Filter items"></div>' : "") + '<div id="menuBody"><p class="muted">Loading</p></div>';
    $("#mQ", host).addEventListener("input", A.debounce(function (e) { st.q = e.target.value; draw(); }, 120));
    var b;
    if ((b = $("#mAdd", host))) b.addEventListener("click", function () { openItem(null); });
    if ((b = $("#mCat", host))) b.addEventListener("click", function () { openCat(null); });
    if ((b = $("#mBulk", host))) b.addEventListener("click", openBulk);
    if ((b = $("#mAvail", host))) b.addEventListener("click", function () { renderView(host, "avail"); });
    if ((b = $("#mManage", host))) b.addEventListener("click", function () { renderView(host, "manage"); });
    host.addEventListener("click", function (e) {
      var f = e.target.closest("[data-f]"); if (f) { st.filter = f.getAttribute("data-f"); draw(); return; }
      var s = e.target.closest("[data-sec]"), sec = e.target.closest(".msec");
      if (s && sec) { var cid = sec.getAttribute("data-cat"), a = s.getAttribute("data-sec");
        if (a === "toggle") { st.collapsed[cid] = !st.collapsed[cid]; saveCollapsed(); draw(); } else if (a === "up") moveCat(cid, -1); else if (a === "down") moveCat(cid, 1); else if (a === "hide") hideCat(cid); else if (a === "edit") openCat(cid); else if (a === "del") delCat(cid); return; }
      var btn = e.target.closest("[data-act]"), row = e.target.closest("[data-id]"); if (!btn || !row) return;
      var id = row.getAttribute("data-id"), act = btn.getAttribute("data-act");
      if (act === "up") moveItem(id, -1); else if (act === "down") moveItem(id, 1); else if (act === "hide") toggleHidden(id); else if (act === "dup") duplicate(id); else if (act === "edit") openItem(id); else if (act === "del") removeItem(id);
    });
    host.addEventListener("change", function (e) {
      var inp = e.target.closest("[data-act]"), row = e.target.closest("[data-id]"); if (!inp || !row) return;
      if (inp.getAttribute("data-act") === "sold") toggleSold(row.getAttribute("data-id"), inp.checked);
      if (inp.getAttribute("data-act") === "avail") toggleSold(row.getAttribute("data-id"), !inp.checked);
    });
    /* drag and drop reorder (desktop) */
    host.addEventListener("pointerdown", function (e) { var h = e.target.closest("[data-drag]"); var r = e.target.closest(".mitem"); if (r) r.setAttribute("draggable", h ? "true" : "false"); });
    host.addEventListener("dragstart", function (e) { var r = e.target.closest && e.target.closest(".mitem"); if (!r || r.getAttribute("draggable") !== "true") return; st.dragId = r.getAttribute("data-id"); r.classList.add("dragging"); try { e.dataTransfer.setData("text/plain", st.dragId); e.dataTransfer.effectAllowed = "move"; } catch (er) {} });
    host.addEventListener("dragover", function (e) { var r = e.target.closest(".mitem"); if (!r || !st.dragId) return; e.preventDefault(); A.$$(".drag-over", host).forEach(function (x) { x.classList.remove("drag-over"); }); r.classList.add("drag-over"); });
    host.addEventListener("drop", function (e) { var r = e.target.closest(".mitem"); if (!r || !st.dragId) return; e.preventDefault(); var id = st.dragId; st.dragId = null; dropItem(id, r.getAttribute("data-id"), true); });
    host.addEventListener("dragend", function () { st.dragId = null; A.$$(".dragging,.drag-over", host).forEach(function (x) { x.classList.remove("dragging", "drag-over"); }); });
    if (st.loaded) draw(); else load();
  }
  A.views.menu = { render: function (h) { renderView(h, "manage"); }, destroy: function () { st.host = null; } };
  A.views.avail = { render: function (h) { renderView(h, "avail"); }, destroy: function () { st.host = null; } };
  A.menuData = { reload: function () { st.loaded = false; } };
})();
