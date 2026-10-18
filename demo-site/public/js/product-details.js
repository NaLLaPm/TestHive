/**
 * THREAD & TREND - Dedicated Product Details Page Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id') || 'tt-dr-01'; // Default fallback
  const product = getProductById(productId);

  if (!product) {
    renderNotFound();
    return;
  }

  renderProductDetails(product);
  renderRelatedProducts(product);
  renderRecentlyViewed(product);
  saveToRecentlyViewed(product.id);
});

function renderNotFound() {
  const container = document.getElementById('product-detail-container');
  if (container) {
    container.innerHTML = `
      <div class="empty-state container" style="padding: 100px 20px;">
        <h2>Product Not Found</h2>
        <p>The product you are looking for does not exist or has been discontinued.</p>
        <a href="shop.html" class="btn btn-primary" style="margin-top: 20px;">Explore Collections</a>
      </div>
    `;
  }
}

function renderProductDetails(product) {
  document.title = `${product.name} | THREAD & TREND`;

  // Update Breadcrumbs
  const crumbCategory = document.getElementById('crumb-category');
  const crumbProduct = document.getElementById('crumb-product');
  if (crumbCategory) {
    crumbCategory.textContent = product.category;
    crumbCategory.href = `shop.html?category=${encodeURIComponent(product.category)}`;
  }
  if (crumbProduct) {
    crumbProduct.textContent = product.name;
  }

  // Populate Images
  const mainImg = document.getElementById('pdp-main-image');
  const thumbsContainer = document.getElementById('pdp-thumbnails');
  if (mainImg) {
    mainImg.src = product.images[0];
    mainImg.alt = product.name;
  }

  if (thumbsContainer) {
    thumbsContainer.innerHTML = product.images.map((img, idx) => `
      <button type="button" class="pdp-thumb-item ${idx === 0 ? 'active' : ''}" data-src="${img}">
        <img src="${img}" alt="${escapeHTML(product.name)} thumbnail ${idx + 1}" onerror="this.src='${FALLBACK_IMAGE}'">
      </button>
    `).join('');

    thumbsContainer.querySelectorAll('.pdp-thumb-item').forEach(btn => {
      btn.addEventListener('click', () => {
        thumbsContainer.querySelectorAll('.pdp-thumb-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mainImg.src = btn.getAttribute('data-src');
      });
    });
  }

  // Populate Details
  const titleEl = document.getElementById('pdp-title');
  const catEl = document.getElementById('pdp-category');
  const priceEl = document.getElementById('pdp-price');
  const origPriceEl = document.getElementById('pdp-orig-price');
  const discountEl = document.getElementById('pdp-discount-badge');
  const ratingWrap = document.getElementById('pdp-rating-wrap');
  const descEl = document.getElementById('pdp-description');
  const stockEl = document.getElementById('pdp-stock-status');

  if (titleEl) titleEl.textContent = product.name;
  if (catEl) catEl.textContent = product.category;
  if (priceEl) priceEl.textContent = formatCurrency(product.price);
  
  if (origPriceEl) {
    if (product.originalPrice) {
      origPriceEl.textContent = formatCurrency(product.originalPrice);
      origPriceEl.style.display = 'inline';
    } else {
      origPriceEl.style.display = 'none';
    }
  }

  if (discountEl) {
    if (product.originalPrice) {
      const pct = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
      discountEl.textContent = `${pct}% OFF`;
      discountEl.style.display = 'inline-block';
    } else {
      discountEl.style.display = 'none';
    }
  }

  if (ratingWrap) {
    ratingWrap.innerHTML = renderRatingStars(product.rating, product.reviewCount);
  }

  if (descEl) descEl.textContent = product.fullDescription;
  if (stockEl) {
    stockEl.innerHTML = `<span class="in-stock-pill">● In Stock (${product.stock} pieces remaining)</span>`;
  }

  // Render Color Swatches
  const colorContainer = document.getElementById('pdp-color-swatches');
  const selectedColorName = document.getElementById('pdp-selected-color-name');
  if (colorContainer) {
    colorContainer.innerHTML = product.colors.map((c, idx) => `
      <button type="button" 
              class="color-swatch-btn ${idx === 0 ? 'active' : ''}" 
              style="background-color: ${c.hex};" 
              data-color-name="${escapeHTML(c.name)}" 
              title="${escapeHTML(c.name)}"
              aria-label="Color ${escapeHTML(c.name)}">
      </button>
    `).join('');

    if (selectedColorName && product.colors[0]) {
      selectedColorName.textContent = product.colors[0].name;
    }

    colorContainer.querySelectorAll('.color-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        colorContainer.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (selectedColorName) selectedColorName.textContent = btn.getAttribute('data-color-name');
      });
    });
  }

  // Render Sizes
  const sizeContainer = document.getElementById('pdp-size-selector');
  if (sizeContainer) {
    sizeContainer.innerHTML = product.sizes.map((s, idx) => `
      <button type="button" class="size-pill-btn ${idx === 0 ? 'active' : ''}" data-size="${s}">
        ${s}
      </button>
    `).join('');

    sizeContainer.querySelectorAll('.size-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sizeContainer.querySelectorAll('.size-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  // Stepper Logic
  const qtyInput = document.getElementById('pdp-qty-input');
  const minusBtn = document.getElementById('pdp-qty-minus');
  const plusBtn = document.getElementById('pdp-qty-plus');

  if (qtyInput && minusBtn && plusBtn) {
    qtyInput.max = product.stock;
    minusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });
    plusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val < product.stock) qtyInput.value = val + 1;
    });
  }

  // Wishlist Action
  const wishlistBtn = document.getElementById('pdp-wishlist-toggle');
  if (wishlistBtn) {
    const isW = WishlistStore.has(product.id);
    wishlistBtn.classList.toggle('active', isW);
    wishlistBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="${isW ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span>${isW ? 'In Wishlist' : 'Add to Wishlist'}</span>
    `;

    wishlistBtn.addEventListener('click', () => {
      const active = WishlistStore.toggle(product.id);
      wishlistBtn.classList.toggle('active', active);
      wishlistBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span>${active ? 'In Wishlist' : 'Add to Wishlist'}</span>
      `;
    });
  }

  // Add To Bag CTA
  const addToBagBtn = document.getElementById('pdp-add-to-bag');
  if (addToBagBtn) {
    addToBagBtn.addEventListener('click', () => {
      const activeSizeBtn = sizeContainer ? sizeContainer.querySelector('.size-pill-btn.active') : null;
      const activeColorBtn = colorContainer ? colorContainer.querySelector('.color-swatch-btn.active') : null;
      const size = activeSizeBtn ? activeSizeBtn.getAttribute('data-size') : null;
      const color = activeColorBtn ? activeColorBtn.getAttribute('data-color-name') : null;
      const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;

      const success = CartStore.addItem(product.id, size, color, qty);
      if (success) {
        window.cartUI.openDrawer();
      }
    });
  }

  // Buy Now CTA
  const buyNowBtn = document.getElementById('pdp-buy-now');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      const activeSizeBtn = sizeContainer ? sizeContainer.querySelector('.size-pill-btn.active') : null;
      const activeColorBtn = colorContainer ? colorContainer.querySelector('.color-swatch-btn.active') : null;
      const size = activeSizeBtn ? activeSizeBtn.getAttribute('data-size') : null;
      const color = activeColorBtn ? activeColorBtn.getAttribute('data-color-name') : null;
      const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;

      const success = CartStore.addItem(product.id, size, color, qty);
      if (success) {
        window.location.href = 'checkout.html';
      }
    });
  }

  // Accordions Logic
  initAccordions();
}

function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('active');
      
      // Close other accordions
      document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
      
      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });
}

function renderRelatedProducts(currentProduct) {
  const container = document.getElementById('related-products-grid');
  if (!container) return;

  const related = PRODUCTS.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id).slice(0, 4);
  const fallback = PRODUCTS.filter(p => p.id !== currentProduct.id).slice(0, 4);
  const finalItems = related.length > 0 ? related : fallback;

  container.innerHTML = finalItems.map(p => renderProductCard(p)).join('');
}

function saveToRecentlyViewed(productId) {
  let list = getStorage('recently_viewed', []);
  list = list.filter(id => id !== productId);
  list.unshift(productId);
  if (list.length > 8) list.pop();
  setStorage('recently_viewed', list);
}

function renderRecentlyViewed(currentProduct) {
  const container = document.getElementById('recently-viewed-grid');
  const section = document.getElementById('recently-viewed-section');
  if (!container || !section) return;

  const list = getStorage('recently_viewed', []).filter(id => id !== currentProduct.id).slice(0, 4);
  if (list.length === 0) {
    section.style.display = 'none';
    return;
  }

  const products = list.map(id => getProductById(id)).filter(Boolean);
  if (products.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  container.innerHTML = products.map(p => renderProductCard(p)).join('');
}
