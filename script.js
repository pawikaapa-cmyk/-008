/* ==========================================================
   ผึ้งสีเหลือง — script.js (ใช้ร่วมกันทุกหน้า)
   - product.html : #filter-bar, #product-list
   - order.html   : #orderForm, #customerName, #contact, #items, #total, #note
   - admin.html   : #ordersTable tbody
   ========================================================== */

const ORDER_API_URL =
  "https://script.google.com/macros/s/AKfycbw5seEhzk_Y32h_5pwXsFFsKQtW0Bua64v8J_3vtPY1EtYFUXSdlX4uvkjQA-wZaQgQ/exec";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRR8N0m045oogisByMeGIs5HPbX07f3iKlNbyMeKQHlCxV8eJi0MOxcqsgIEt_Qrg0az_WqqZz8jbdd/pub?gid=966977702&single=true&output=csv";

const MOODS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "fresh", label: "Fresh" },
  { key: "sweet", label: "Sweet" },
  { key: "confident", label: "Confident" },
  { key: "romance", label: "Romance" },
];

/* ---------- helpers ---------- */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatPrice(value) {
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n.toLocaleString("th-TH") : String(value);
}

/* ==========================================================
   1) product.html
   ========================================================== */
function initProductPage() {
  const filterBar = document.getElementById("filter-bar");
  const list = document.getElementById("product-list");
  if (!filterBar || !list) return;

  let products = [];
  let activeMood = "all";

  function buildCard(p) {
    const card = el("article", "product-card");
    card.dataset.mood = p.mood;

    const media = el("div", "product-card__media");
    const img = document.createElement("img");
    img.src = p.image;
    img.alt = p.name;
    img.loading = "lazy";
    media.appendChild(img);

    const body = el("div", "product-card__body");

    const mood = el("div", "product-card__mood");
    mood.appendChild(el("span", "dot"));
    mood.appendChild(el("span", "", p.mood));

    const name = el("h3", "product-card__name", p.name);

    const foot = el("div", "product-card__foot");
    const price = el("span", "product-card__price", formatPrice(p.price));
    price.appendChild(el("small", "", "บาท"));
    foot.appendChild(price);
    foot.appendChild(el("span", "product-card__size", p.size));

    const buy = el("a", "btn btn--sm btn--gold", "สั่งซื้อ");
    buy.style.marginTop = "1.5rem";
    buy.style.textAlign = "center";
    buy.href =
      "order.html?item=" + encodeURIComponent(p.name) +
      "&price=" + encodeURIComponent(p.price);

    body.append(mood, name, foot, buy);
    card.append(media, body);
    return card;
  }

  function render() {
    list.replaceChildren();
    const shown =
      activeMood === "all"
        ? products
        : products.filter((p) => p.mood === activeMood);

    if (!shown.length) {
      list.appendChild(el("p", "text-center", "ยังไม่มีสินค้าในหมวดนี้"));
      return;
    }
    shown.forEach((p) => list.appendChild(buildCard(p)));
  }

  function setMood(key) {
    activeMood = key;
    filterBar.querySelectorAll(".filter__item").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mood === key);
    });
    render();
  }

  function buildFilterBar() {
    filterBar.replaceChildren();
    filterBar.classList.add("filter");
    MOODS.forEach((m) => {
      const btn = el("button", "filter__item");
      btn.type = "button";
      btn.dataset.mood = m.key;
      if (m.key !== "all") {
        const dot = el("span", "dot");
        btn.dataset.accentMood = m.key;
        dot.style.setProperty("--accent", "var(--mood-" + m.key + ")");
        btn.appendChild(dot);
      }
      btn.appendChild(document.createTextNode(m.label));
      btn.addEventListener("click", () => setMood(m.key));
      filterBar.appendChild(btn);
    });
  }

  buildFilterBar();

  fetch("products.json")
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then((data) => {
      products = data;
      const param = new URLSearchParams(window.location.search).get("mood");
      const valid = MOODS.some((m) => m.key === param);
      setMood(valid ? param : "all");
    })
    .catch((err) => {
      console.error(err);
      list.replaceChildren(
        el("p", "text-center", "ไม่สามารถโหลดรายการสินค้าได้ กรุณาลองใหม่อีกครั้ง")
      );
    });
}

/* ==========================================================
   2) order.html
   ========================================================== */
function initOrderPage() {
  const form = document.getElementById("orderForm");
  if (!form) return;

  // เติม item และ price จาก URL parameter ทันทีที่โหลดหน้า
  const params = new URLSearchParams(window.location.search);
  const itemInput = document.getElementById("items");
  const totalInput = document.getElementById("total");
  const item = params.get("item");
  const price = params.get("price");
  if (itemInput && item !== null) itemInput.value = item;
  if (totalInput && price !== null) totalInput.value = price;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const val = (id) => {
      const node = document.getElementById(id);
      return node ? node.value : "";
    };

    const payload = {
      customerName: val("customerName"),
      contact: val("contact"),
      items: val("items"),
      total: val("total"),
      note: val("note"),
    };

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    // ไม่ตั้ง headers เอง และไม่ใช้ mode: 'no-cors'
    fetch(ORDER_API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then(() => {
        window.location.href = "thankyou.html";
      })
      .catch((error) => {
        console.error(error);
        alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}

/* ==========================================================
   3) admin.html
   ========================================================== */

// parse CSV เอง: รองรับ "..." , "" (escape), ขึ้นบรรทัดใหม่ในเซลล์, CRLF
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // ตัด BOM

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function initAdminPage() {
  const tbody = document.querySelector("#ordersTable tbody");
  if (!tbody) return;

  const COLS = 6; // วันเวลา, ชื่อลูกค้า, เบอร์โทร/Line, รายการสินค้า, จำนวนเงินรวม, หมายเหตุ

  function message(text) {
    const tr = document.createElement("tr");
    const td = el("td", "", text);
    td.colSpan = COLS;
    td.style.textAlign = "center";
    tr.appendChild(td);
    tbody.replaceChildren(tr);
  }

  message("กำลังโหลดข้อมูล...");

  // กันแคชของ Google Sheets ที่เผยแพร่เป็น CSV
  const url = CSV_URL + "&_=" + Date.now();

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then((text) => {
      const rows = parseCSV(text);
      const data = rows.slice(1); // ข้ามแถวหัวตาราง

      if (!data.length) {
        message("ยังไม่มีรายการสั่งซื้อ");
        return;
      }

      // Sheet เพิ่มแถวใหม่ต่อท้ายเสมอ → กลับลำดับให้ล่าสุดขึ้นก่อน
      data.reverse();

      const frag = document.createDocumentFragment();
      data.forEach((r) => {
        const tr = document.createElement("tr");
        for (let c = 0; c < COLS; c++) {
          let v = (r[c] || "").trim();
          if (c === 4 && v !== "") v = formatPrice(v);
          tr.appendChild(el("td", "", v)); // textContent ป้องกัน HTML injection
        }
        frag.appendChild(tr);
      });
      tbody.replaceChildren(frag);
    })
    .catch((err) => {
      console.error(err);
      message("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    });
}

/* ---------- start ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initProductPage();
  initOrderPage();
  initAdminPage();
});
