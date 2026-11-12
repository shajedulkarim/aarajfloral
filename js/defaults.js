/* Bundled defaults. Used when the database is unreachable and as the seed for supabase/001_schema.sql.
   Prices are placeholders until the owner sets real ones in the admin. */
window.AARAJ_DEFAULTS = {
  placeholderPrices: true,
  categories: [
    { id: "hand", name_en: "Hand bouquets", name_ar: "باقات يدوية", sort: 1 },
    { id: "bag", name_en: "Bag bouquets", name_ar: "باقات الحقيبة", sort: 2 },
    { id: "arrangements", name_en: "Arrangements", name_ar: "تنسيقات", sort: 3 }
  ],
  items: [
    { id: "d-lily", category_id: "hand", name_en: "Lily bouquet", name_ar: "باقة زنبق",
      desc_en: "Pink lilies in clear wrap with a satin bow.", desc_ar: "زنبق وردي بتغليف شفاف وشريط ساتان.",
      price: 18, image_url: "assets/img/lily-bouquet.jpg", sort: 1 },
    { id: "d-pastel", category_id: "hand", name_en: "Pastel wrap bouquet", name_ar: "باقة بألوان الباستيل",
      desc_en: "Roses, carnations and eucalyptus in blush paper.", desc_ar: "ورد وقرنفل وأوكالبتوس بورق وردي فاتح.",
      price: 22, image_url: "assets/img/pink-wrap.jpg", sort: 2 },
    { id: "d-tulip", category_id: "hand", name_en: "Tulips and baby's breath", name_ar: "توليب وجيبسوفيلا",
      desc_en: "Purple tulips with white baby's breath.", desc_ar: "توليب بنفسجي مع جيبسوفيلا بيضاء.",
      price: 16, image_url: "assets/img/tulips.jpg", sort: 3 },
    { id: "d-red", category_id: "hand", name_en: "Red rose bouquet, 100 stems", name_ar: "باقة ورد أحمر، 100 وردة",
      desc_en: "One hundred red roses in white paper.", desc_ar: "مئة وردة حمراء بورق أبيض.",
      price: 120, image_url: "assets/img/red-roses.jpg", sort: 4 },
    { id: "d-bag-lily", category_id: "bag", name_en: "Bag bouquet, lilies", name_ar: "باقة حقيبة بالزنبق",
      desc_en: "Lilies, roses and chrysanthemum in the Aaraj gift bag.", desc_ar: "زنبق وورد وأقحوان في حقيبة أعراج.",
      price: 28, image_url: "assets/img/bag-lilies.jpg", sort: 1 },
    { id: "d-bag-mix", category_id: "bag", name_en: "Bag bouquet, mixed", name_ar: "باقة حقيبة مشكلة",
      desc_en: "Seasonal mixed stems in a white gift box.", desc_ar: "ورد موسمي مشكل في علبة هدية بيضاء.",
      price: 30, image_url: "assets/img/bag-mixed.jpg", sort: 2 },
    { id: "d-tray", category_id: "arrangements", name_en: "Tray arrangement", name_ar: "تنسيق صينية",
      desc_en: "Low, dense arrangement on a stone-lined tray.", desc_ar: "تنسيق منخفض كثيف على صينية بالحصى.",
      price: 45, image_url: "assets/img/arrangement-tray.jpg", sort: 1 },
    { id: "d-hydrangea", category_id: "arrangements", name_en: "Hydrangea basket", name_ar: "سلة هيدرانجيا",
      desc_en: "Pink hydrangea in a woven basket.", desc_ar: "هيدرانجيا وردية في سلة منسوجة.",
      price: 38, image_url: "assets/img/hydrangea-basket.jpg", sort: 2 },
    { id: "d-anthurium", category_id: "arrangements", name_en: "Gift box with anthurium", name_ar: "علبة هدية مع أنثوريوم",
      desc_en: "Anthurium and lilies around a gift box. Box not included.", desc_ar: "أنثوريوم وزنبق حول علبة هدية. العلبة غير مشمولة.",
      price: 55, image_url: "assets/img/gift-box-anthurium.jpg", sort: 3 }
  ],
  photos: [
    { id: "p-hero1", section: "hero", url: "assets/img/bag-lilies.jpg", alt_en: "Lily and rose bag bouquet", alt_ar: "باقة حقيبة بالزنبق والورد", sort: 1 },
    { id: "p-hero2", section: "hero", url: "assets/img/red-roses.jpg", alt_en: "One hundred red roses", alt_ar: "مئة وردة حمراء", sort: 2 },
    { id: "p-hero3", section: "hero", url: "assets/img/pink-wrap.jpg", alt_en: "Pink wrapped bouquet", alt_ar: "باقة بتغليف وردي", sort: 3 },
    { id: "p-shop1", section: "shop", url: "assets/img/shop-sign.jpg", alt_en: "Aaraj Floral Shop sign", alt_ar: "لافتة أعراج للزهور", sort: 1 },
    { id: "p-shop2", section: "shop", url: "assets/img/shop-interior.jpg", alt_en: "Inside the shop", alt_ar: "داخل المحل", sort: 2 },
    { id: "p-g1", section: "gallery", url: "assets/img/hydrangea-basket.jpg", alt_en: "Hydrangea basket", alt_ar: "سلة هيدرانجيا", sort: 1 },
    { id: "p-g2", section: "gallery", url: "assets/img/arrangement-tray.jpg", alt_en: "Tray arrangement", alt_ar: "تنسيق صينية", sort: 2 },
    { id: "p-g3", section: "gallery", url: "assets/img/lily-bouquet.jpg", alt_en: "Lily bouquet", alt_ar: "باقة زنبق", sort: 3 },
    { id: "p-g4", section: "gallery", url: "assets/img/tulips.jpg", alt_en: "Tulips and baby's breath", alt_ar: "توليب وجيبسوفيلا", sort: 4 },
    { id: "p-g5", section: "gallery", url: "assets/img/gift-box-anthurium.jpg", alt_en: "Anthurium gift arrangement", alt_ar: "تنسيق أنثوريوم", sort: 5 },
    { id: "p-g6", section: "gallery", url: "assets/img/bag-mixed.jpg", alt_en: "Mixed bag bouquet", alt_ar: "باقة حقيبة مشكلة", sort: 6 }
  ],
  settings: {
    banner: { active: false, text_en: "", text_ar: "" },
    hours: {
      days: [
        { day: 0, open: true, slots: [["10:00", "13:00"], ["16:00", "22:00"]] },
        { day: 1, open: true, slots: [["10:00", "13:00"], ["16:00", "22:00"]] },
        { day: 2, open: true, slots: [["10:00", "13:00"], ["16:00", "22:00"]] },
        { day: 3, open: true, slots: [["10:00", "13:00"], ["16:00", "22:00"]] },
        { day: 4, open: true, slots: [["10:00", "13:00"], ["16:00", "22:00"]] },
        { day: 5, open: false, slots: [] },
        { day: 6, open: true, slots: [["10:00", "13:00"], ["16:00", "22:00"]] }
      ]
    },
    rating: { show: false, value: 0, count: 0 },
    contact: {
      whatsapp: "96877399377",
      phone: "+968 7739 9377",
      address_en: "Al Maha Street, Bosher, Muscat, Oman",
      address_ar: "شارع المها، بوشر، مسقط، سلطنة عُمان",
      maps_url: "https://www.google.com/maps/search/?api=1&query=Aaraj+Floral+Shop+Bosher+Muscat",
      instagram: "aaraj.om"
    }
  }
};
/* day index: 0 = Sunday ... 6 = Saturday (matches Date.getDay) */
