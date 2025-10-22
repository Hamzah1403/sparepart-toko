/* cart.js
   Versi: 1.0
   Cara kerja:
   - Tombol "add-to-cart" perlu atribut data-id, data-name, data-price, data-img (img optional)
   - Menyimpan cart di localStorage key = "sparepart_cart"
   - Render badge jumlah item otomatis jika ada elemen dengan id="cart-count"
   - Halaman keranjang harus punya container dengan id="cart-items" dan elemen id="cart-total"
*/

(() => {
  const STORAGE_KEY = "sparepart_cart";

  /* util */
  const q = sel => Array.from(document.querySelectorAll(sel));
  const $(sel) => document.querySelector(sel);

  function formatRupiah(num) {
    // aman untuk angka atau string angka
    const n = Number(num) || 0;
    return 'Rp ' + n.toLocaleString('id-ID');
  }

  /* load / save */
  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse cart:", e);
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    renderCartCount();
  }

  /* cart operations */
  function findItem(cart, id) {
    return cart.find(i => String(i.id) === String(id));
  }

  function addToCart(item, qty = 1) {
    const cart = loadCart();
    const existing = findItem(cart, item.id);
    if (existing) {
      existing.qty = Math.max(1, existing.qty + qty);
    } else {
      cart.push({
        id: String(item.id),
        name: item.name || "Unnamed",
        price: Number(item.price) || 0,
        qty: Math.max(1, Number(qty) || 1),
        img: item.img || ""
      });
    }
    saveCart(cart);
    // optional small feedback
    flashMessage(`${item.name} ditambahkan ke keranjang`);
  }

  function updateQty(id, newQty) {
    const cart = loadCart();
    const it = findItem(cart, id);
    if (!it) return;
    it.qty = Math.max(0, Math.floor(newQty) || 0);
    const filtered = cart.filter(x => x.qty > 0);
    saveCart(filtered);
  }

  function removeItem(id) {
    let cart = loadCart();
    cart = cart.filter(i => String(i.id) !== String(id));
    saveCart(cart);
  }

  function clearCart() {
    localStorage.removeItem(STORAGE_KEY);
    renderCartCount();
  }

  /* UI helpers */
  function renderCartCount() {
    const countEl = document.getElementById("cart-count");
    if (!countEl) return;
    const cart = loadCart();
    const totalCount = cart.reduce((s, i) => s + (i.qty || 0), 0);
    countEl.textContent = totalCount;
    // jika totalCount 0, sembunyikan badge
    countEl.style.display = totalCount ? "inline-block" : "none";
  }

  function renderCartPage() {
    // dipanggil di keranjang.html
    const container = document.getElementById("cart-items");
    const totalEl = document.getElementById("cart-total");
    if (!container || !totalEl) return;

    const cart = loadCart();
    container.innerHTML = "";

    if (!cart.length) {
      container.innerHTML = `<div class="empty-cart">Keranjang kosong.</div>`;
      totalEl.textContent = formatRupiah(0);
      return;
    }

    let grandTotal = 0;
    cart.forEach(item => {
      const lineTotal = (item.price || 0) * (item.qty || 0);
      grandTotal += lineTotal;

      const row = document.createElement("div");
      row.className = "cart-row";
      row.dataset.id = item.id;
      row.innerHTML = `
        <div class="cart-row-left">
          ${item.img ? `<img src="${item.img}" alt="${escapeHtml(item.name)}" class="cart-thumb">` : ''}
        </div>
        <div class="cart-row-mid">
          <div class="cart-name">${escapeHtml(item.name)}</div>
          <div class="cart-price">${formatRupiah(item.price)}</div>
        </div>
        <div class="cart-row-right">
          <input class="cart-qty" type="number" min="1" value="${item.qty}" style="width:64px">
          <div class="cart-line-total">${formatRupiah(lineTotal)}</div>
          <button class="cart-remove">Hapus</button>
        </div>
      `;
      container.appendChild(row);
    });

    totalEl.textContent = formatRupiah(grandTotal);

    // attach events (delegation)
    container.querySelectorAll(".cart-qty").forEach(inp => {
      inp.addEventListener("change", e => {
        const newQty = Number(e.target.value) || 1;
        const id = e.target.closest(".cart-row").dataset.id;
        updateQty(id, newQty);
        renderCartPage(); // re-render untuk update totals
      });
    });
    container.querySelectorAll(".cart-remove").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = e.target.closest(".cart-row").dataset.id;
        removeItem(id);
        renderCartPage();
      });
    });
  }

  function escapeHtml(s='') {
    return String(s).replace(/[&<>"']/g, function(m) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[m];
    });
  }

  function flashMessage(msg, time = 1200) {
    // simple toast at bottom-right
    let el = document.getElementById("cart-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "cart-toast";
      el.style.position = "fixed";
      el.style.right = "20px";
      el.style.bottom = "20px";
      el.style.background = "rgba(0,0,0,0.8)";
      el.style.color = "white";
      el.style.padding = "10px 14px";
      el.style.borderRadius = "8px";
      el.style.zIndex = 9999;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.style.opacity = "0";
    }, time);
  }

  /* bind add-to-cart buttons on any page */
  function bindAddButtons() {
    const buttons = document.querySelectorAll(".add-to-cart");
    if (!buttons.length) return;
    buttons.forEach(btn => {
      btn.addEventListener("click", e => {
        // data attributes fallback to DOM traversal if needed
        const id = btn.dataset.id || btn.getAttribute("data-id");
        const name = btn.dataset.name || btn.getAttribute("data-name") || (btn.closest(".product") && btn.closest(".product").querySelector(".product-name")?.textContent);
        const price = btn.dataset.price || btn.getAttribute("data-price") || (btn.closest(".product") && btn.closest(".product").dataset.price);
        const img = btn.dataset.img || btn.getAttribute("data-img") || (btn.closest(".product") && btn.closest(".product").querySelector("img")?.src);
        if (!id) {
          console.warn("Tombol add-to-cart tidak memiliki data-id:", btn);
          flashMessage("Produk tidak valid");
          return;
        }
        addToCart({id, name, price, img}, 1);
      });
    });
  }

  /* Expose some functions to window for console/test */
  window.Cart = {
    loadCart,
    saveCart,
    addToCart,
    removeItem,
    updateQty,
    clearCart,
    renderCartPage,
    renderCartCount,
  };

  /* on DOM ready */
  document.addEventListener("DOMContentLoaded", () => {
    bindAddButtons();
    renderCartCount();

    // If on keranjang.html (presence of cart-items container) render full page
    if (document.getElementById("cart-items")) {
      renderCartPage();

      // bind clear / checkout if exists
      const clearBtn = document.getElementById("cart-clear");
      if (clearBtn) clearBtn.addEventListener("click", () => {
        if (confirm("Kosongkan keranjang?")) {
          clearCart();
          renderCartPage();
        }
      });
      const checkoutBtn = document.getElementById("cart-checkout");
      if (checkoutBtn) checkoutBtn.addEventListener("click", () => {
        // untuk demo hanya kosongkan dan tampilkan pesan
        const c = loadCart();
        if (!c.length) { alert("Keranjang kosong"); return; }
        alert("Checkout (demo) — total: " + document.getElementById("cart-total").textContent);
        clearCart();
        renderCartPage();
      });
    }
  });

})();
