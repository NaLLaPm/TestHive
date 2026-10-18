/**
 * THREAD & TREND - Global Application Shell & Shared Component Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initAnnouncementBar();
  initStickyHeader();
  initMobileNavigation();
  initQuickViewModal();
  initQuickAddModal();
  initGlobalCardListeners();
  initNewsletterForms();
  initAccountModal();
});

/**
 * Announcement bar rotator
 */
function initAnnouncementBar() {
  const messages = [
    "Free shipping on orders over ₹1,499",
    "New season collection is here — Use code WELCOME10 for 10% off",
    "Easy 15-day complimentary exchanges on all items",
    "Extra ₹200 off on orders above ₹1,200 with code SAVE200"
  ];

  const barText = document.getElementById('announcement-text');
  if (!barText) return;

  let currentIdx = 0;
  setInterval(() => {
    barText.style.opacity = '0';
    setTimeout(() => {
      currentIdx = (currentIdx + 1) % messages.length;
      barText.textContent = messages[currentIdx];
      barText.style.opacity = '1';
    }, 400);
  }, 4500);
}

/**
 * Sticky header with scroll elevation
 */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
    lastScrollY = window.scrollY;
  }, { passive: true });
}

/**
 * Mobile hamburger navigation drawer
 */
function initMobileNavigation() {
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const navDrawer = document.querySelector('.mobile-nav-drawer');
  const overlay = document.querySelector('.mobile-nav-overlay');
  const closeBtn = document.querySelector('.mobile-nav-close');

  if (!toggleBtn || !navDrawer) return;

  const openNav = () => {
    navDrawer.classList.add('is-open');
    if (overlay) overlay.classList.add('is-visible');
    document.body.classList.add('nav-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
  };

  const closeNav = () => {
    navDrawer.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-visible');
    document.body.classList.remove('nav-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
  };

  toggleBtn.addEventListener('click', openNav);
  if (closeBtn) closeBtn.addEventListener('click', closeNav);
  if (overlay) overlay.addEventListener('click', closeNav);

  // Close when clicking internal navigation links
  navDrawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });
}

/**
 * Global card click delegation (Wishlist, Quick View, Quick Add)
 */
function initGlobalCardListeners() {
  document.addEventListener('click', (e) => {
    // Wishlist Toggle button
    const wishlistBtn = e.target.closest('.wishlist-btn');
    if (wishlistBtn) {
      e.preventDefault();
      e.stopPropagation();
      const pId = wishlistBtn.getAttribute('data-wishlist-id');
      if (pId) {
        WishlistStore.toggle(pId);
      }
      return;
    }

    // Quick View button
    const quickViewBtn = e.target.closest('.quick-view-btn');
    if (quickViewBtn) {
      e.preventDefault();
      e.stopPropagation();
      const pId = quickViewBtn.getAttribute('data-quickview-id');
      if (pId) {
        openQuickView(pId);
      }
      return;
    }

    // Quick Add button
    const quickAddBtn = e.target.closest('.quick-add-btn');
    if (quickAddBtn) {
      e.preventDefault();
      e.stopPropagation();
      const pId = quickAddBtn.getAttribute('data-quickadd-id');
      if (pId) {
        openQuickAdd(pId);
      }
      return;
    }
  });
}

/**
 * Quick View Modal System
 */
let quickViewModalEl = null;

function initQuickViewModal() {
  const modal = document.createElement('div');
  modal.id = 'quick-view-modal';
  modal.className = 'modal-backdrop';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'qv-product-title');

  modal.innerHTML = `
    <div class="modal-box quick-view-box">
      <button class="modal-close-btn" data-action="close-modal" aria-label="Close modal">&times;</button>
      <div class="quick-view-content" id="quick-view-content">
        <!-- Rendered dynamically -->
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  quickViewModalEl = modal;

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-action="close-modal"]')) {
      closeQuickView();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeQuickView();
    }
  });
}

function openQuickView(productId) {
  const product = getProductById(productId);
  if (!product || !quickViewModalEl) return;

  const content = quickViewModalEl.querySelector('#quick-view-content');
  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  content.innerHTML = `
    <div class="qv-grid">
      <div class="qv-gallery">
        <div class="qv-main-image-wrap">
          <img id="qv-main-img" src="${product.images[0]}" alt="${escapeHTML(product.name)}" onerror="this.src='${FALLBACK_IMAGE}'">
        </div>
        <div class="qv-thumbs">
          ${product.images.map((img, idx) => `
            <button type="button" class="qv-thumb-btn ${idx === 0 ? 'active' : ''}" data-img-src="${img}">
              <img src="${img}" alt="Thumbnail ${idx + 1}" onerror="this.src='${FALLBACK_IMAGE}'">
            </button>
          `).join('')}
        </div>
      </div>

      <div class="qv-details">
        <span class="qv-category">${escapeHTML(product.category)}</span>
        <h2 id="qv-product-title" class="qv-title">${escapeHTML(product.name)}</h2>
        
        <div class="qv-price-rating">
          <div class="qv-pricing">
            <span class="qv-current-price">${formatCurrency(product.price)}</span>
            ${product.originalPrice ? `<span class="qv-orig-price">${formatCurrency(product.originalPrice)}</span>` : ''}
            ${discountPercent > 0 ? `<span class="qv-discount">${discountPercent}% OFF</span>` : ''}
          </div>
          ${renderRatingStars(product.rating, product.reviewCount)}
        </div>

        <p class="qv-desc">${escapeHTML(product.shortDescription)}</p>

        <!-- Color Selection -->
        <div class="qv-option-group">
          <label class="qv-option-label">Color: <strong id="qv-selected-color">${escapeHTML(product.colors[0]?.name || '')}</strong></label>
          <div class="color-swatches" id="qv-color-swatches">
            ${product.colors.map((c, idx) => `
              <button type="button" 
                      class="color-swatch-btn ${idx === 0 ? 'active' : ''}" 
                      style="background-color: ${c.hex};" 
                      data-color-name="${escapeHTML(c.name)}" 
                      title="${escapeHTML(c.name)}"
                      aria-label="Color ${escapeHTML(c.name)}">
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Size Selection -->
        <div class="qv-option-group">
          <div class="qv-size-header">
            <label class="qv-option-label">Select Size:</label>
            <span class="stock-indicator in-stock">● In Stock (${product.stock} left)</span>
          </div>
          <div class="size-selector" id="qv-size-selector">
            ${product.sizes.map((s, idx) => `
              <button type="button" class="size-pill-btn ${idx === 0 ? 'active' : ''}" data-size="${s}">
                ${s}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Quantity & Add to Cart -->
        <div class="qv-actions-row">
          <div class="qty-stepper large">
            <button type="button" class="qty-btn" id="qv-qty-minus">&minus;</button>
            <input type="number" id="qv-qty-input" value="1" min="1" max="${product.stock}" readonly>
            <button type="button" class="qty-btn" id="qv-qty-plus">&#43;</button>
          </div>
          <button type="button" class="btn btn-primary btn-block" id="qv-add-cart-btn">
            Add to Shopping Bag
          </button>
        </div>

        <div class="qv-footer-links">
          <a href="product.html?id=${encodeURIComponent(product.id)}" class="qv-full-details-link">
            View Complete Product Specifications &rarr;
          </a>
        </div>
      </div>
    </div>
  `;

  // Bind thumbnails
  const mainImg = content.querySelector('#qv-main-img');
  content.querySelectorAll('.qv-thumb-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      content.querySelectorAll('.qv-thumb-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mainImg.src = btn.getAttribute('data-img-src');
    });
  });

  // Bind color selection
  const selectedColorEl = content.querySelector('#qv-selected-color');
  content.querySelectorAll('.color-swatch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      content.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (selectedColorEl) selectedColorEl.textContent = btn.getAttribute('data-color-name');
    });
  });

  // Bind size selection
  content.querySelectorAll('.size-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      content.querySelectorAll('.size-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Stepper
  const qtyInput = content.querySelector('#qv-qty-input');
  content.querySelector('#qv-qty-minus').addEventListener('click', () => {
    let val = parseInt(qtyInput.value) || 1;
    if (val > 1) qtyInput.value = val - 1;
  });
  content.querySelector('#qv-qty-plus').addEventListener('click', () => {
    let val = parseInt(qtyInput.value) || 1;
    if (val < product.stock) qtyInput.value = val + 1;
  });

  // Add to Bag CTA
  content.querySelector('#qv-add-cart-btn').addEventListener('click', () => {
    const activeSizeBtn = content.querySelector('.size-pill-btn.active');
    const activeColorBtn = content.querySelector('.color-swatch-btn.active');
    const size = activeSizeBtn ? activeSizeBtn.getAttribute('data-size') : null;
    const color = activeColorBtn ? activeColorBtn.getAttribute('data-color-name') : null;
    const quantity = parseInt(qtyInput.value) || 1;

    const added = CartStore.addItem(product.id, size, color, quantity);
    if (added) {
      closeQuickView();
      window.cartUI.openDrawer();
    }
  });

  quickViewModalEl.classList.add('is-open');
  document.body.classList.add('modal-open');
}

function closeQuickView() {
  if (quickViewModalEl) {
    quickViewModalEl.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }
}

/**
 * Quick Add Variant Selector Modal
 */
let quickAddModalEl = null;

function initQuickAddModal() {
  const modal = document.createElement('div');
  modal.id = 'quick-add-modal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal-box quick-add-box">
      <button class="modal-close-btn" data-action="close-modal">&times;</button>
      <div id="quick-add-content"></div>
    </div>
  `;
  document.body.appendChild(modal);
  quickAddModalEl = modal;

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-action="close-modal"]')) {
      closeQuickAdd();
    }
  });
}

function openQuickAdd(productId) {
  const product = getProductById(productId);
  if (!product || !quickAddModalEl) return;

  const content = quickAddModalEl.querySelector('#quick-add-content');
  content.innerHTML = `
    <div class="quick-add-head">
      <img src="${product.images[0]}" class="quick-add-thumb" alt="${escapeHTML(product.name)}" onerror="this.src='${FALLBACK_IMAGE}'">
      <div>
        <h4>${escapeHTML(product.name)}</h4>
        <div class="price-current">${formatCurrency(product.price)}</div>
      </div>
    </div>
    <div class="quick-add-body">
      <label class="form-label">Select Available Size:</label>
      <div class="size-selector" id="qa-size-selector">
        ${product.sizes.map((s, idx) => `
          <button type="button" class="size-pill-btn ${idx === 0 ? 'active' : ''}" data-size="${s}">${s}</button>
        `).join('')}
      </div>
      <button type="button" class="btn btn-primary btn-block mt-3" id="qa-confirm-btn">Add to Bag</button>
    </div>
  `;

  content.querySelectorAll('.size-pill-btn').forEach(b => {
    b.addEventListener('click', () => {
      content.querySelectorAll('.size-pill-btn').forEach(btn => btn.classList.remove('active'));
      b.classList.add('active');
    });
  });

  content.querySelector('#qa-confirm-btn').addEventListener('click', () => {
    const activeBtn = content.querySelector('.size-pill-btn.active');
    const size = activeBtn ? activeBtn.getAttribute('data-size') : product.sizes[0];
    const color = product.colors[0] ? product.colors[0].name : 'Default';

    const ok = CartStore.addItem(product.id, size, color, 1);
    if (ok) {
      closeQuickAdd();
      window.cartUI.openDrawer();
    }
  });

  quickAddModalEl.classList.add('is-open');
  document.body.classList.add('modal-open');
}

function closeQuickAdd() {
  if (quickAddModalEl) {
    quickAddModalEl.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }
}

/**
 * Newsletter Form Simulation
 */
function initNewsletterForms() {
  document.querySelectorAll('form.newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const email = input ? input.value.trim() : '';

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }

      showToast(`Thank you! Subscription confirmed for ${email}. (Demo only)`, 'success');
      form.reset();
    });
  });
}

/**
 * Account / Profile Modal (Demo information & quick access)
 */
function initAccountModal() {
  const modal = document.createElement('div');
  modal.id = 'account-modal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal-box account-box">
      <button class="modal-close-btn" data-action="close-modal">&times;</button>
      <div class="account-modal-header">
        <div class="account-avatar-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <h3>Welcome to THREAD & TREND</h3>
        <p class="demo-tag-note">Local Demo Mode (No backend account required)</p>
      </div>

      <div class="account-modal-links">
        <a href="wishlist.html" class="account-nav-card">
          <div class="card-icon">♡</div>
          <div>
            <strong>My Wishlist</strong>
            <span>Saved items (<span class="wishlist-count-badge">0</span>)</span>
          </div>
        </a>
        <a href="cart.html" class="account-nav-card">
          <div class="card-icon">🛍️</div>
          <div>
            <strong>My Shopping Bag</strong>
            <span>Review bag (<span class="cart-count-badge">0</span>)</span>
          </div>
        </a>
        <a href="order-confirmation.html" class="account-nav-card">
          <div class="card-icon">📦</div>
          <div>
            <strong>Latest Order Status</strong>
            <span>View recent demo order & receipts</span>
          </div>
        </a>
      </div>

      <div class="account-demo-disclaimer">
        <p><strong>Demo Note:</strong> User state, bag items, and saved wishlist are securely persisted in your browser's local storage. In a full production store, this connects to customer OAuth and cloud databases.</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="open-account"]')) {
      e.preventDefault();
      modal.classList.add('is-open');
      document.body.classList.add('modal-open');
    }
    if (e.target === modal || e.target.closest('[data-action="close-modal"]')) {
      modal.classList.remove('is-open');
      document.body.classList.remove('modal-open');
    }
  });
}
