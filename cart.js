// ====== Fungsi bantu ======
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// ====== Tombol Beli di produk.html ======
document.addEventListener("DOMContentLoaded", function () {
  const buyButtons = document.querySelectorAll(".buy-btn");
  buyButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const name = this.dataset.name;
      const price = parseInt(this.dataset.price);
      const image = this.dataset.image;
      const stock = parseInt(this.dataset.stock);

      let cart = getCart();
      const existing = cart.find((item) => item.name === name);

      if (existing) {
        if (existing.quantity < stock) {
          existing.quantity++;
        } else {
          alert("Stok habis!");
          return;
        }
      } else {
        cart.push({
          name,
          price,
          image,
          stock,
          quantity: 1,
        });
      }

      saveCart(cart);
      alert(`${name} telah ditambahkan ke keranjang!`);
    });
  });
});
