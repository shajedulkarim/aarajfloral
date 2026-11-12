(function () {
  "use strict";
  var A = window.A, $ = A.$, esc = A.esc;
  var SECTIONS = [
    { id: "hero", title: "Home page top", hint: "The first photo is the large one. Up to three are shown." },
    { id: "shop", title: "The shop", hint: "Shown beside opening hours." },
    { id: "gallery", title: "Gallery", hint: "The grid on the home page." },
    { id: "catalogue", title: "Menu photos", hint: "Photos available for menu items." }
  ];
  var st = { photos: [], loaded: false, error: null, host: null };
  var BUCKET = "photos";

  /* ---------- image helpers ---------- */
  function loadImg(src) { return new Promise(function (res, rej) { var i = new Image(); i.crossOrigin = "anonymous"; i.onload = function () { res(i); }; i.onerror = function () { rej(new Error("Could not read the image")); }; i.src = src; }); }
  function fileToImg(f) { return new Promise(function (res, rej) { var u = URL.createObjectURL(f); loadImg(u).then(function (i) { res(i); }, rej); }); }
  function toBlob(img, rotate, max) {
    var w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, (max || 1800) / Math.max(w, h)); w = Math.round(w * s); h = Math.round(h * s);
    var c = document.createElement("canvas"), q = (rotate / 90) % 2 !== 0; c.width = q ? h : w; c.height = q ? w : h;
    var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.translate(c.width / 2, c.height / 2); x.rotate(rotate * Math.PI / 180); x.drawImage(img, -w / 2, -h / 2, w, h);
    return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error("Could not encode the image")); }, "image/jpeg", 0.88); });
  }
  function putBlob(blob, folder) {
    var path = folder + "/" + A.uid() + ".jpg";
    return A.sb.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false, cacheControl: "31536000" }).then(function (r) {
      if (r.error) throw r.error;
      var u = A.sb.storage.from(BUCKET).getPublicUrl(path); return { path: path, url: u.data.publicUrl };
    });
  }

  /* upload a File, create a photos row when allowed. Returns { url, row } */
  function upload(file, section) {
    return fileToImg(file).then(function (img) { return toBlob(img, 0, 1800); }).then(function (b) { return putBlob(b, "originals"); }).then(function (o) {
      var row = { id: A.uid(), section: section, url: o.url, original_url: o.url, storage_path: o.path, alt_en: "", alt_ar: "", sort: nextSort(section) };
      return A.sb.from("photos").insert(row).then(function (r) { if (r.error) return { url: o.url, row: null }; st.photos.push(row); return { url: o.url, row: row }; });
    });
  }
  function nextSort(section) { return st.photos.filter(function (p) { return p.section === section; }).reduce(function (m, p) { return Math.max(m, p.sort || 0); }, 0) + 1; }

  function loadAll() {
    return A.sb.from("photos").select("*").order("sort", { ascending: true }).then(function (r) { if (r.error) throw r.error; st.photos = r.data; st.loaded = true; st.error = null; draw(); }).catch(function (e) { st.error = e; draw(); });
  }
  A.photoLib = {
    upload: upload,
    pick: function (cb) {
      function show() {
        var m = A.modal({ title: "Choose a photo", wide: true, body: '<div class="pgrid">' + st.photos.map(function (p) { return '<button type="button" class="ph" data-url="' + esc(p.url) + '"><img src="' + esc(A.asset(p.url)) + '" alt="' + esc(p.alt_en) + '" loading="lazy"></button>'; }).join("") + "</div>" + (st.photos.length ? "" : A.empty("No photos yet", "Upload one from the Photos tab.")) });
        m.el.addEventListener("click", function (e) { var b = e.target.closest("[data-url]"); if (b) { cb(b.getAttribute("data-url")); m.close(); } });
      }
      if (st.loaded) show(); else loadAll().then(show);
    }
  };

  /* ---------- draw ---------- */
  function draw() {
    var host = st.host; if (!host || !$("#photoBody", host)) return;
    var body = $("#photoBody", host);
    if (st.error && !st.loaded) { body.innerHTML = A.errBox("Could not load photos", st.error, true); var r = $("[data-retry]", body); if (r) r.addEventListener("click", loadAll); return; }
    body.innerHTML = SECTIONS.map(function (s) {
      var list = st.photos.filter(function (p) { return p.section === s.id; }).sort(function (a, b) { return a.sort - b.sort; });
      return '<section class="panel" style="margin-bottom:16px" data-section="' + s.id + '"><div class="page-head" style="margin-bottom:10px"><div><h3>' + s.title + '</h3><p class="muted small">' + s.hint + '</p></div><label class="btn btn-sm" style="cursor:pointer">' + A.icon("upload") + 'Upload<input type="file" accept="image/*" multiple hidden data-up></label></div>' +
        '<div class="drop" data-drop>Drop photos here to add them to ' + s.title.toLowerCase() + ".</div>" +
        (list.length ? '<div class="pgrid">' + list.map(function (p) { return '<button type="button" class="ph" data-open="' + p.id + '" aria-label="Open photo ' + esc(p.alt_en || "") + '"><img src="' + esc(A.asset(p.url)) + '" alt="' + esc(p.alt_en) + '" loading="lazy"></button>'; }).join("") + "</div>" : A.empty("No photos here", "Upload some to show them on the site.")) + "</section>";
    }).join("");
  }
  function files(fl, section) {
    var arr = Array.prototype.slice.call(fl).filter(function (f) { return /^image\//.test(f.type); });
    if (!arr.length) return A.toast("Choose image files", { bad: true });
    var done = 0; A.toast("Uploading " + arr.length + (arr.length === 1 ? " photo" : " photos"));
    arr.reduce(function (p, f) { return p.then(function () { return upload(f, section).then(function () { done++; draw(); }).catch(function (e) { A.toast(f.name + " failed. " + A.errText(e), { bad: true }); }); }); }, Promise.resolve()).then(function () { if (done) A.toast("Uploaded " + done + (done === 1 ? " photo" : " photos")); });
  }

  /* ---------- viewer ---------- */
  function openViewer(id) {
    var p = st.photos.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    var m = A.modal({
      title: "Photo", wide: true,
      body: '<div class="viewer"><img id="vImg" alt="' + esc(p.alt_en) + '" src="' + esc(A.asset(p.url)) + '"></div>' +
        '<div class="chips" style="justify-content:center;margin:12px 0"><label class="btn btn-sm" style="cursor:pointer">' + A.icon("upload") + 'Replace<input type="file" accept="image/*" hidden id="vRep"></label><button type="button" class="btn btn-sm" id="vRot">' + A.icon("rotate") + 'Rotate</button><button type="button" class="btn btn-sm" id="vDl">' + A.icon("download") + 'Download</button><button type="button" class="btn btn-sm" id="vRes" ' + (p.original_url && p.original_url !== p.url ? "" : "disabled") + '>' + A.icon("undo") + 'Restore original</button><button type="button" class="btn btn-sm" id="vL" aria-label="Move earlier">' + A.icon("up") + 'Earlier</button><button type="button" class="btn btn-sm" id="vR" aria-label="Move later">' + A.icon("down") + 'Later</button></div>' +
        '<div class="row2"><label class="field"><span>Description (English)</span><input type="text" id="vAe" maxlength="140" value="' + esc(p.alt_en) + '"></label><label class="field"><span>Description (Arabic)</span><input type="text" id="vAa" dir="rtl" maxlength="140" value="' + esc(p.alt_ar) + '"></label></div>' +
        '<label class="field"><span>Section</span><select id="vSec">' + SECTIONS.map(function (s) { return '<option value="' + s.id + '"' + (s.id === p.section ? " selected" : "") + ">" + s.title + "</option>"; }).join("") + "</select></label>",
      foot: '<button class="btn btn-danger" id="vDel" type="button" style="margin-inline-end:auto">' + A.icon("trash") + 'Delete</button><button class="btn" data-close type="button">Close</button><button class="btn btn-primary" id="vSave" type="button">Save details</button>'
    });
    function swapUrl(newUrl, path, okMsg) {
      var prev = { url: p.url, original_url: p.original_url, storage_path: p.storage_path };
      var orig = p.original_url || p.url;
      A.opt(function () { p.url = newUrl; p.original_url = orig; if (path) p.storage_path = path; draw(); m.$("#vImg").src = A.asset(newUrl); m.$("#vRes").disabled = orig === newUrl; },
        function () { Object.assign(p, prev); draw(); m.$("#vImg").src = A.asset(p.url); },
        function () { return A.sb.from("photos").update({ url: newUrl, original_url: orig, storage_path: path || p.storage_path }).eq("id", p.id); }, { ok: okMsg, fail: "Photo was not changed" });
    }
    m.$("#vRep").addEventListener("change", function (e) { var f = e.target.files[0]; if (!f) return; fileToImg(f).then(function (i) { return toBlob(i, 0, 1800); }).then(function (b) { return putBlob(b, "edited"); }).then(function (o) { swapUrl(o.url, o.path, "Photo replaced"); }).catch(function (er) { A.toast("Replace failed. " + A.errText(er), { bad: true }); }); });
    m.$("#vRot").addEventListener("click", function () { loadImg(A.asset(p.url)).then(function (i) { return toBlob(i, 90, 2400); }).then(function (b) { return putBlob(b, "edited"); }).then(function (o) { swapUrl(o.url, o.path, "Photo rotated"); }).catch(function (er) { A.toast("Rotate failed. " + A.errText(er), { bad: true }); }); });
    m.$("#vDl").addEventListener("click", function () { fetch(A.asset(p.url)).then(function (r) { return r.blob(); }).then(function (b) { var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "aaraj-" + p.section + "-" + p.id.slice(0, 6) + ".jpg"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }).catch(function () { window.open(A.asset(p.url), "_blank"); }); });
    m.$("#vRes").addEventListener("click", function () { swapUrl(p.original_url, p.storage_path, "Original restored"); });
    function move(dir) {
      var list = st.photos.filter(function (x) { return x.section === p.section; }).sort(function (a, b) { return a.sort - b.sort; }), i = list.indexOf(p), j = i + dir; if (j < 0 || j >= list.length) return;
      var o = list[j], a = p.sort, b = o.sort; if (a === b) b = a + dir;
      A.opt(function () { p.sort = b; o.sort = a; draw(); }, function () { p.sort = a; o.sort = b; draw(); },
        function () { return Promise.all([A.sb.from("photos").update({ sort: b }).eq("id", p.id), A.sb.from("photos").update({ sort: a }).eq("id", o.id)]).then(function (rs) { return rs[0].error ? rs[0] : rs[1]; }); }, { ok: "Moved", fail: "Could not reorder" });
    }
    m.$("#vL").addEventListener("click", function () { move(-1); }); m.$("#vR").addEventListener("click", function () { move(1); });
    m.$("#vSave").addEventListener("click", function () {
      var prev = Object.assign({}, p), upd = { alt_en: m.$("#vAe").value.trim(), alt_ar: m.$("#vAa").value.trim(), section: m.$("#vSec").value };
      if (upd.section !== p.section) upd.sort = nextSort(upd.section);
      m.close(); A.opt(function () { Object.assign(p, upd); draw(); }, function () { Object.assign(p, prev); draw(); }, function () { return A.sb.from("photos").update(upd).eq("id", p.id); }, { ok: "Saved", fail: "Could not save" });
    });
    m.$("#vDel").addEventListener("click", function () {
      var snap = Object.assign({}, p), idx = st.photos.indexOf(p); m.close();
      A.opt(function () { st.photos.splice(idx, 1); draw(); }, function () { st.photos.splice(idx, 0, p); draw(); }, function () { return A.sb.from("photos").delete().eq("id", snap.id); },
        { ok: "Photo removed", okOpts: { action: { label: "Undo", fn: function () { A.opt(function () { st.photos.push(snap); draw(); }, function () { st.photos = st.photos.filter(function (x) { return x.id !== snap.id; }); draw(); }, function () { var r = Object.assign({}, snap); delete r.created_at; return A.sb.from("photos").insert(r); }, { ok: "Photo restored", fail: "Could not restore" }); } } }, fail: "Could not delete" });
    });
  }

  A.views.photos = {
    render: function (host) {
      st.host = host;
      host.innerHTML = '<div class="page-head"><div><h2>Photos</h2><p class="muted small">Photos are shrunk to 1800 px and saved as JPEG. The first upload is kept so you can restore it.</p></div></div><div id="photoBody"><p class="muted">Loading</p></div>';
      host.addEventListener("click", function (e) { var o = e.target.closest("[data-open]"); if (o) openViewer(o.getAttribute("data-open")); });
      host.addEventListener("change", function (e) { var u = e.target.closest("[data-up]"); if (u) { var sec = e.target.closest("[data-section]").getAttribute("data-section"); files(u.files, sec); u.value = ""; } });
      host.addEventListener("dragover", function (e) { var d = e.target.closest("[data-drop]"); if (d) { e.preventDefault(); d.classList.add("over"); } });
      host.addEventListener("dragleave", function (e) { var d = e.target.closest("[data-drop]"); if (d) d.classList.remove("over"); });
      host.addEventListener("drop", function (e) { var d = e.target.closest("[data-drop]"); if (d) { e.preventDefault(); d.classList.remove("over"); files(e.dataTransfer.files, e.target.closest("[data-section]").getAttribute("data-section")); } });
      if (st.loaded) draw(); else loadAll();
    },
    destroy: function () { st.host = null; }
  };
})();
