(function () {
  "use strict";
  var CFG = window.AARAJ_CONFIG || {};
  var DEF = window.AARAJ_DEFAULTS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var STR = {
    en: {
      skip: "Skip to menu", brandSub: "Floral Shop", navOffer: "What we make", navMenu: "Menu", navGallery: "Gallery", navVisit: "Visit", navContact: "Contact", navOrder: "Order",
      heroEyebrow: "Aaraj Floral Shop. Bosher, Muscat", heroTitle: "Flowers, arranged by hand in Bosher.",
      heroSub: "Hand bouquets, bag bouquets and box arrangements, made to order. Choose from the menu or message us on WhatsApp.",
      ctaBuild: "Build an order", ctaWa: "Message on WhatsApp",
      offerTitle: "What we make",
      o1t: "Hand bouquets", o1d: "Wrapped in paper and ribbon. Roses, lilies, tulips or a seasonal mix.",
      o2t: "Bag bouquets", o2d: "Stems arranged in an Aaraj gift bag. Ready to carry and set down.",
      o3t: "Box and tray arrangements", o3d: "Low, dense arrangements in boxes, trays and baskets. Suited to tables and gifts.",
      o4t: "Weddings and occasions", o4d: "Bridal bouquets, wreaths and event flowers. Tell us the date and the colours.",
      deliveryNote: "Delivery is available. Ask on WhatsApp for areas, fees and times.",
      menuTitle: "Menu", menuSub: "Prices in Omani rial. Each piece is made to order and stems vary by season.",
      orderTitle: "Your order", total: "Total", pickup: "Pickup", delivery: "Delivery",
      fName: "Name (optional)", fPhone: "Phone (optional)", fNote: "Notes: occasion, card message, delivery area",
      send: "Send on WhatsApp", orderNote: "We confirm the price and time with you on WhatsApp.",
      items: "items", review: "Review order",
      galTitle: "From the workshop", galSub: "Recent work and the shop on Al Maha Street.",
      visitTitle: "Visit", map: "Open in Maps", hours: "Opening hours",
      contactTitle: "Contact", contactSub: "For custom pieces, weddings and delivery, message us. We reply during opening hours.",
      cWa: "WhatsApp", cCall: "Call", footLoc: "Bosher, Muscat, Oman", staff: "Staff sign in",
      add: "Add", soldOut: "Sold out", closedDay: "Closed", empty: "Nothing added yet. Choose items from the menu.",
      noItems: "No items in this category.", remove: "Remove one", addOne: "Add one",
      openUntil: "Open now, until ", closedOpens: "Closed. Opens ", closedToday: "Closed today. Opens ",
      reopenToday: "Closed for now. Reopens today at ", tomorrow: "tomorrow",
      rating: "Rated ", ratingOf: " from ", ratingReviews: " reviews",
      waIntro: "Hello Aaraj, I would like to order:", waName: "Name", waPhone: "Phone", waNote: "Notes", waTotal: "Total",
      waPickup: "Pickup", waDelivery: "Delivery", waNeedItems: "Add at least one item first.",
      toastLogFail: "Order sent to WhatsApp. We could not save it to our system, please keep the chat open.",
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    ar: {
      skip: "انتقل إلى القائمة", brandSub: "للزهور", navOffer: "ما نصنعه", navMenu: "القائمة", navGallery: "المعرض", navVisit: "زيارتنا", navContact: "تواصل", navOrder: "اطلب",
      heroEyebrow: "أعراج للزهور. بوشر، مسقط", heroTitle: "ورد منسّق يدويًا في بوشر.",
      heroSub: "باقات يدوية، وباقات حقيبة، وتنسيقات في علب وصواني، تُحضَّر عند الطلب. اختر من القائمة أو راسلنا على واتساب.",
      ctaBuild: "ابدأ طلبك", ctaWa: "راسلنا على واتساب",
      offerTitle: "ما نصنعه",
      o1t: "باقات يدوية", o1d: "تغليف بالورق والشريط. ورد وزنبق وتوليب أو تشكيلة موسمية.",
      o2t: "باقات الحقيبة", o2d: "ورد منسّق داخل حقيبة هدية من أعراج. جاهز للحمل والإهداء.",
      o3t: "تنسيقات العلب والصواني", o3d: "تنسيقات منخفضة وكثيفة في علب وصواني وسلال. تناسب الطاولات والهدايا.",
      o4t: "الأعراس والمناسبات", o4d: "باقات العروس والأكاليل وورد الفعاليات. أخبرنا بالتاريخ والألوان.",
      deliveryNote: "التوصيل متاح. اسألنا على واتساب عن المناطق والرسوم والمواعيد.",
      menuTitle: "القائمة", menuSub: "الأسعار بالريال العُماني. كل قطعة تُحضَّر عند الطلب وتختلف الأزهار حسب الموسم.",
      orderTitle: "طلبك", total: "المجموع", pickup: "استلام", delivery: "توصيل",
      fName: "الاسم (اختياري)", fPhone: "الهاتف (اختياري)", fNote: "ملاحظات: المناسبة، نص البطاقة، منطقة التوصيل",
      send: "أرسل عبر واتساب", orderNote: "نؤكد السعر والموعد معك على واتساب.",
      items: "عناصر", review: "مراجعة الطلب",
      galTitle: "من الورشة", galSub: "أعمال حديثة والمحل في شارع المها.",
      visitTitle: "زيارتنا", map: "افتح في الخرائط", hours: "ساعات العمل",
      contactTitle: "تواصل", contactSub: "للطلبات الخاصة والأعراس والتوصيل، راسلنا. نرد خلال ساعات العمل.",
      cWa: "واتساب", cCall: "اتصال", footLoc: "بوشر، مسقط، سلطنة عُمان", staff: "دخول الموظفين",
      add: "أضف", soldOut: "نفد", closedDay: "مغلق", empty: "لم تضف شيئًا بعد. اختر من القائمة.",
      noItems: "لا توجد عناصر في هذا القسم.", remove: "أزل واحدًا", addOne: "أضف واحدًا",
      openUntil: "مفتوح الآن حتى ", closedOpens: "مغلق. نفتح ", closedToday: "مغلق اليوم. نفتح ",
      reopenToday: "مغلق حاليًا. نفتح اليوم الساعة ", tomorrow: "غدًا",
      rating: "التقييم ", ratingOf: " من ", ratingReviews: " تقييم",
      waIntro: "مرحبًا أعراج، أود طلب:", waName: "الاسم", waPhone: "الهاتف", waNote: "ملاحظات", waTotal: "المجموع",
      waPickup: "استلام", waDelivery: "توصيل", waNeedItems: "أضف عنصرًا واحدًا على الأقل.",
      toastLogFail: "تم فتح واتساب. تعذر حفظ الطلب في نظامنا، يرجى إبقاء المحادثة مفتوحة.",
      days: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
    }
  };

  var state = {
    lang: "en", source: "defaults", cart: {},
    content: { categories: DEF.categories, items: DEF.items, photos: DEF.photos, settings: DEF.settings }
  };
  try { var saved = localStorage.getItem("aaraj_lang"); if (saved === "ar" || saved === "en") state.lang = saved; } catch (e) {}

  function t(k) { return (STR[state.lang] || STR.en)[k] || STR.en[k] || k; }
  function pick(o, f) { return (state.lang === "ar" && o[f + "_ar"]) ? o[f + "_ar"] : (o[f + "_en"] || ""); }
  function money(n) { return "OMR " + Number(n || 0).toFixed(3); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmtTime(hhmm) {
    var p = hhmm.split(":"), h = +p[0], m = p[1];
    var suffix = h >= 12 ? (state.lang === "ar" ? " م" : " pm") : (state.lang === "ar" ? " ص" : " am");
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ":" + m + suffix;
  }
  function toast(msg) {
    var el = $("#toast"); el.textContent = msg; el.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { el.hidden = true; }, 5000);
  }

  /* ---------- data ---------- */
  function configured() { return CFG.supabaseUrl && CFG.supabasePublishableKey && window.supabase && window.supabase.createClient; }
  var sb = null;
  function client() {
    if (sb || !configured()) return sb;
    try { sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabasePublishableKey, { auth: { persistSession: false } }); } catch (e) { sb = null; }
    return sb;
  }
  function withTimeout(p, ms) {
    return new Promise(function (res, rej) { var to = setTimeout(function () { rej(new Error("timeout")); }, ms); p.then(function (v) { clearTimeout(to); res(v); }, function (e) { clearTimeout(to); rej(e); }); });
  }
  function loadContent() {
    var c = client();
    if (!c) return Promise.resolve();
    var q = function (tbl, order) { return c.from(tbl).select("*").order(order || "sort", { ascending: true }).then(function (r) { if (r.error) throw r.error; return r.data; }); };
    return withTimeout(Promise.all([q("menu_categories"), q("menu_items"), q("photos"), c.from("settings").select("key,value").then(function (r) { if (r.error) throw r.error; return r.data; })]), 4500)
      .then(function (r) {
        var cats = r[0].filter(function (x) { return !x.hidden; });
        var items = r[1].filter(function (x) { return !x.hidden; });
        if (!cats.length || !items.length) throw new Error("empty");
        var settings = JSON.parse(JSON.stringify(DEF.settings));
        r[3].forEach(function (row) { settings[row.key] = row.value; });
        state.content = { categories: cats, items: items, photos: r[2].length ? r[2] : DEF.photos, settings: settings };
        state.source = "database";
      }).catch(function () { state.source = "defaults"; });
  }

  /* ---------- hours ---------- */
  function muscatNow() {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Muscat", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    var dayIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(o.weekday);
    var hh = +o.hour % 24;
    return { day: dayIdx, minutes: hh * 60 + (+o.minute) };
  }
  function toMin(s) { var p = s.split(":"); return +p[0] * 60 + +p[1]; }
  function renderStatus() {
    var el = $("#openStatus"), hrs = state.content.settings.hours.days, now = muscatNow();
    var today = hrs.filter(function (d) { return d.day === now.day; })[0];
    var cls = "open-status", txt = "";
    if (today && today.open) {
      for (var i = 0; i < today.slots.length; i++) {
        if (now.minutes >= toMin(today.slots[i][0]) && now.minutes < toMin(today.slots[i][1])) { txt = t("openUntil") + fmtTime(today.slots[i][1]); cls += " is-open"; break; }
      }
      if (!txt) {
        var next = today.slots.filter(function (s) { return toMin(s[0]) > now.minutes; })[0];
        if (next) { txt = t("reopenToday") + fmtTime(next[0]); cls += " is-closed"; }
      }
    }
    if (!txt) {
      cls += " is-closed";
      for (var k = 1; k <= 7; k++) {
        var d = hrs.filter(function (x) { return x.day === (now.day + k) % 7; })[0];
        if (d && d.open && d.slots.length) {
          txt = (k === 1 ? (state.lang === "ar" ? "مغلق. نفتح غدًا الساعة " : "Closed. Opens tomorrow at ") : t("closedOpens") + t("days")[d.day] + (state.lang === "ar" ? " الساعة " : " at ")) + fmtTime(d.slots[0][0]);
          break;
        }
      }
    }
    el.className = cls; el.textContent = txt;
  }
  function renderHours() {
    var tb = $("#hoursTable tbody"), now = muscatNow(), order = [6, 0, 1, 2, 3, 4, 5];
    var map = {}; state.content.settings.hours.days.forEach(function (d) { map[d.day] = d; });
    tb.innerHTML = order.map(function (di) {
      var d = map[di], txt = (!d || !d.open || !d.slots.length) ? t("closedDay") : d.slots.map(function (s) { return esc(fmtTime(s[0]) + " – " + fmtTime(s[1])); }).join("<br>");
      return '<tr class="' + (di === now.day ? "today" : "") + '"><td>' + esc(t("days")[di]) + "</td><td>" + (txt === t("closedDay") ? esc(txt) : txt) + "</td></tr>";
    }).join("");
  }

  /* ---------- render ---------- */
  function applyLang() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
    $$("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    $("#langBtn").textContent = state.lang === "ar" ? "English" : "العربية";
    document.title = state.lang === "ar" ? "أعراج للزهور | ورد منسّق يدويًا في بوشر، مسقط" : "Aaraj Floral Shop | Hand-arranged flowers in Bosher, Muscat";
    renderAll();
  }
  function renderBanner() {
    var b = state.content.settings.banner, el = $("#banner"), txt = b && b.active ? pick(b, "text") : "";
    el.hidden = !txt; el.textContent = txt;
  }
  function photosBy(sec) { return state.content.photos.filter(function (p) { return p.section === sec; }).sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); }); }
  function renderHero() {
    var ph = photosBy("hero"); if (!ph.length) ph = DEF.photos.filter(function (p) { return p.section === "hero"; });
    $("#heroMedia").innerHTML = ph.slice(0, 3).map(function (p, i) {
      return '<figure class="m' + (i + 1) + '"><img src="' + esc(p.url) + '" alt="' + esc(pick(p, "alt")) + '"' + (i === 0 ? ' fetchpriority="high"' : ' loading="lazy"') + ' width="800" height="' + (i === 0 ? 700 : 400) + '"></figure>';
    }).join("");
  }
  function renderMenu() {
    var cats = state.content.categories.slice().sort(function (a, b) { return a.sort - b.sort; });
    var items = state.content.items;
    $("#cats").innerHTML = cats.map(function (c, i) { return '<a href="#cat-' + esc(c.id) + '" data-cat="' + esc(c.id) + '"' + (i === 0 ? ' class="on"' : "") + ">" + esc(pick(c, "name")) + "</a>"; }).join("");
    $("#menuList").innerHTML = cats.map(function (c) {
      var list = items.filter(function (i) { return i.category_id === c.id; }).sort(function (a, b) { return a.sort - b.sort; });
      return '<section class="cat-block" id="cat-' + esc(c.id) + '"><h3>' + esc(pick(c, "name")) + "</h3>" +
        (list.length ? '<div class="cards">' + list.map(cardHtml).join("") + "</div>" : '<p class="empty">' + esc(t("noItems")) + "</p>") + "</section>";
    }).join("");
    syncCards();
  }
  function cardHtml(i) {
    var out = !!i.sold_out;
    return '<article class="card' + (out ? " out" : "") + '" data-id="' + esc(i.id) + '">' +
      '<div class="card-img">' + (i.image_url ? '<img src="' + esc(i.image_url) + '" alt="" loading="lazy" width="400" height="440">' : "") + "</div>" +
      '<div class="card-body"><h4>' + esc(pick(i, "name")) + "</h4><p>" + esc(pick(i, "desc")) + "</p>" +
      '<div class="card-foot"><span class="price"><small>OMR</small>' + Number(i.price).toFixed(3) + "</span>" +
      (out ? '<span class="tag-out">' + esc(t("soldOut")) + "</span>" : '<span class="ctl"></span>') + "</div></div></article>";
  }
  function stepperHtml(id, q) {
    return '<span class="stepper"><button type="button" data-act="dec" data-id="' + esc(id) + '" aria-label="' + esc(t("remove")) + '">&minus;</button><output>' + q + '</output><button type="button" data-act="inc" data-id="' + esc(id) + '" aria-label="' + esc(t("addOne")) + '">+</button></span>';
  }
  function syncCards() {
    $$(".card").forEach(function (card) {
      var ctl = $(".ctl", card); if (!ctl) return;
      var id = card.getAttribute("data-id"), q = state.cart[id] || 0;
      ctl.innerHTML = q ? stepperHtml(id, q) : '<button type="button" class="btn btn-line add" data-act="inc" data-id="' + esc(id) + '">' + esc(t("add")) + "</button>";
    });
  }
  function cartLines() {
    return Object.keys(state.cart).map(function (id) {
      var it = state.content.items.filter(function (i) { return String(i.id) === id; })[0];
      return it ? { item: it, qty: state.cart[id] } : null;
    }).filter(Boolean);
  }
  function renderOrder() {
    var lines = cartLines(), total = 0, count = 0;
    $("#orderLines").innerHTML = lines.length ? lines.map(function (l) {
      total += l.item.price * l.qty; count += l.qty;
      return '<div class="line"><span class="nm">' + esc(pick(l.item, "name")) + '</span>' + stepperHtml(l.item.id, l.qty) + '<span class="lp">' + money(l.item.price) + " &times; " + l.qty + "</span><span></span></div>";
    }).join("") : '<p class="empty">' + esc(t("empty")) + "</p>";
    $("#orderTotal").textContent = money(total);
    $("#barCount").textContent = count; $("#barTotal").textContent = money(total);
    $("#orderBar").hidden = !count || window.matchMedia("(min-width:1024px)").matches;
    $("#sendBtn").disabled = !count;
    try { sessionStorage.setItem("aaraj_cart", JSON.stringify(state.cart)); } catch (e) {}
  }
  function renderGallery() {
    var ph = photosBy("gallery");
    $("#galleryGrid").innerHTML = ph.map(function (p) {
      return '<button type="button" data-src="' + esc(p.url) + '" data-alt="' + esc(pick(p, "alt")) + '" aria-label="' + esc(pick(p, "alt")) + '"><img src="' + esc(p.url) + '" alt="' + esc(pick(p, "alt")) + '" loading="lazy" width="400" height="500"></button>';
    }).join("");
  }
  function renderVisit() {
    var c = state.content.settings.contact, r = state.content.settings.rating;
    $("#addr").textContent = pick(c, "address"); $("#mapLink").href = c.maps_url || "#";
    var rt = $("#rating");
    if (r && r.show && r.value) { rt.hidden = false; rt.textContent = t("rating") + r.value + (r.count ? t("ratingOf") + r.count + t("ratingReviews") : ""); } else rt.hidden = true;
    var shop = photosBy("shop")[0];
    $("#shopFig").innerHTML = shop ? '<img src="' + esc(shop.url) + '" alt="' + esc(pick(shop, "alt")) + '" loading="lazy" width="600" height="450">' : "";
    var wa = "https://wa.me/" + (c.whatsapp || CFG.whatsapp);
    $("#heroWa").href = wa; $("#cWa").href = wa; $("#cWa").textContent = c.phone; $("#cCall").href = "tel:" + String(c.phone).replace(/\s/g, ""); $("#cCall").textContent = c.phone;
    $("#cIg").href = "https://www.instagram.com/" + c.instagram + "/"; $("#cIg").textContent = "@" + c.instagram;
    renderHours();
  }
  function renderAll() { renderBanner(); renderHero(); renderMenu(); renderOrder(); renderGallery(); renderVisit(); renderStatus(); }

  /* ---------- order ---------- */
  function openOrder(open) {
    var o = $("#order"), isDesk = window.matchMedia("(min-width:1024px)").matches;
    if (isDesk) return;
    o.classList.toggle("open", open);
    var s = $(".scrim");
    if (open && !s) { s = document.createElement("div"); s.className = "scrim"; s.addEventListener("click", function () { openOrder(false); }); document.body.appendChild(s); }
    if (!open && s) s.remove();
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $("#orderClose").focus();
  }
  function buildMessage(f) {
    var lines = cartLines(), total = 0;
    var msg = t("waIntro") + "\n\n" + lines.map(function (l) { total += l.item.price * l.qty; return "- " + l.qty + " x " + pick(l.item, "name") + " (" + money(l.item.price * l.qty) + ")"; }).join("\n");
    msg += "\n\n" + t("waTotal") + ": " + money(total) + "\n" + (f.fulfil === "delivery" ? t("waDelivery") : t("waPickup"));
    if (f.name) msg += "\n" + t("waName") + ": " + f.name;
    if (f.phone) msg += "\n" + t("waPhone") + ": " + f.phone;
    if (f.note) msg += "\n" + t("waNote") + ": " + f.note;
    return { text: msg, total: total };
  }
  function logOrder(f, total) {
    var c = client(); if (!c || state.source !== "database") return Promise.reject(new Error("offline"));
    var rows = cartLines().map(function (l) { return { id: l.item.id, name: l.item.name_en, qty: l.qty, price: Number(l.item.price) }; });
    return withTimeout(c.from("orders").insert({ customer_name: f.name || null, phone: f.phone || null, items: rows, total: total, fulfilment: f.fulfil, note: f.note || null, lang: state.lang }).then(function (r) { if (r.error) throw r.error; }), 5000);
  }
  function submitOrder(e) {
    e.preventDefault();
    if (!cartLines().length) { toast(t("waNeedItems")); return; }
    var fd = new FormData(e.target), f = { name: (fd.get("name") || "").trim(), phone: (fd.get("phone") || "").trim(), note: (fd.get("note") || "").trim(), fulfil: fd.get("fulfil") };
    var m = buildMessage(f);
    var wa = state.content.settings.contact.whatsapp || CFG.whatsapp;
    var url = "https://wa.me/" + wa + "?text=" + encodeURIComponent(m.text);
    /* open WhatsApp synchronously so popup blockers allow it; logging never blocks it */
    var w = window.open(url, "_blank", "noopener");
    if (!w) window.location.href = url;
    logOrder(f, m.total).catch(function () { if (state.source === "database") toast(t("toastLogFail")); });
  }

  /* ---------- events ---------- */
  function bind() {
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (b) {
        var id = b.getAttribute("data-id"), q = state.cart[id] || 0;
        q += b.getAttribute("data-act") === "inc" ? 1 : -1;
        if (q <= 0) delete state.cart[id]; else state.cart[id] = Math.min(q, 99);
        syncCards(); renderOrder();
        if (!Object.keys(state.cart).length) openOrder(false);
        return;
      }
      var g = e.target.closest(".gallery button");
      if (g) { $("#lbImg").src = g.getAttribute("data-src"); $("#lbImg").alt = g.getAttribute("data-alt"); $("#lightbox").showModal(); }
    });
    $("#lbClose").addEventListener("click", function () { $("#lightbox").close(); });
    $("#lightbox").addEventListener("click", function (e) { if (e.target.id === "lightbox") e.target.close(); });
    $("#orderOpen").addEventListener("click", function () { openOrder(true); });
    $("#orderClose").addEventListener("click", function () { openOrder(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") openOrder(false); });
    $("#orderForm").addEventListener("submit", submitOrder);
    $("#langBtn").addEventListener("click", function () { state.lang = state.lang === "ar" ? "en" : "ar"; try { localStorage.setItem("aaraj_lang", state.lang); } catch (e) {} applyLang(); });
    window.addEventListener("resize", renderOrder);
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { $$(".cats a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-cat") === en.target.id.replace("cat-", "")); }); } });
    }, { rootMargin: "-30% 0px -60% 0px" }) : null;
    new MutationObserver(function () { if (io) $$(".cat-block").forEach(function (s) { io.observe(s); }); }).observe($("#menuList"), { childList: true });
  }

  function init() {
    $("#year").textContent = new Date().getFullYear();
    try { state.cart = JSON.parse(sessionStorage.getItem("aaraj_cart") || "{}") || {}; } catch (e) { state.cart = {}; }
    bind(); applyLang();
    loadContent().then(function () {
      var valid = {}; state.content.items.forEach(function (i) { valid[String(i.id)] = 1; });
      Object.keys(state.cart).forEach(function (k) { if (!valid[k]) delete state.cart[k]; });
      applyLang();
      document.documentElement.setAttribute("data-source", state.source);
    });
    setInterval(renderStatus, 60000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
