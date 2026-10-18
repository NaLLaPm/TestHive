/**
 * THREAD & TREND - Utility Functions & Centralized State Engine
 */

// Global Configuration
const CONFIG = {
  currencyLocale: 'en-IN',
  currencyCode: 'INR',
  freeShippingThreshold: 1499,
  standardShippingFee: 49,
  expressShippingFee: 99,
  codFee: 49,
  taxRate: 0.05, // 5% GST (demo calculation)
  coupons: {
    'WELCOME10': { type: 'percentage', value: 10, minOrder: 500, description: '10% off on all eligible items' },
    'SAVE200': { type: 'fixed', value: 200, minOrder: 1200, description: '₹200 off on orders above ₹1,200' },
    'FREESHIP': { type: 'free_shipping', value: 0, minOrder: 0, description: 'Free standard delivery on your order' }
  }
};

/**
 * Format raw integer or float as INR currency (e.g. ₹1,499)
 */
function formatCurrency(amount) {
  const numeric = Math.max(0, Number(amount) || 0);
  try {
    return new Intl.NumberFormat(CONFIG.currencyLocale, {
      style: 'currency',
      currency: CONFIG.currencyCode,
      maximumFractionDigits: 0
    }).format(numeric);
  } catch (e) {
    return `₹${Math.round(numeric).toLocaleString('en-IN')}`;
  }
}

/**
 * Safe local storage reader
 */
function getStorage(key, defaultValue) {
  try {
    const item = localStorage.getItem(`tt_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn(`[Storage] Failed to read key: tt_${key}`, e);
    return defaultValue;
  }
}

/**
 * Safe local storage writer
 */
function setStorage(key, value) {
  try {
    localStorage.setItem(`tt_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`[Storage] Failed to save key: tt_${key}`, e);
  }
}

/**
 * Toast Notification Dispatcher
 */
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type} toast-enter`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${escapeHTML(message)}</span>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  const dismiss = () => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-leave');
    setTimeout(() => toast.remove(), 300);
  };

  closeBtn.addEventListener('click', dismiss);
  container.appendChild(toast);

  // Auto remove
  setTimeout(dismiss, duration);
}

/**
 * Escape HTML strings to protect against XSS injection
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

/**
 * Get product by unique ID
 */
function getProductById(id) {
  if (typeof PRODUCTS === 'undefined') return null;
  return PRODUCTS.find(p => p.id === id) || null;
}

/**
 * Centralized Price Calculation
 * Calculates subtotal, item discount savings, coupon deduction, shipping, tax, and final total
 */
function calculateOrderTotals(cartItems, couponCode = null, shippingMethod = 'standard', paymentMethod = 'card') {
  let subtotal = 0;
  let originalSubtotal = 0;
  let totalItemsCount = 0;

  cartItems.forEach(item => {
    const product = getProductById(item.productId);
    if (product) {
      const qty = Number(item.quantity) || 1;
      const unitPrice = product.price;
      const originalUnitPrice = product.originalPrice || product.price;

      subtotal += unitPrice * qty;
      originalSubtotal += originalUnitPrice * qty;
      totalItemsCount += qty;
    }
  });

  const productSavings = Math.max(0, originalSubtotal - subtotal);
  let couponDiscount = 0;
  let freeShippingAppliedByCoupon = false;
  let validCoupon = null;

  if (couponCode && typeof couponCode === 'string') {
    const cleanCode = couponCode.trim().toUpperCase();
    const couponDef = CONFIG.coupons[cleanCode];

    if (couponDef) {
      if (subtotal >= couponDef.minOrder) {
        validCoupon = { code: cleanCode, ...couponDef };
        if (couponDef.type === 'percentage') {
          couponDiscount = Math.round((subtotal * couponDef.value) / 100);
        } else if (couponDef.type === 'fixed') {
          couponDiscount = Math.min(couponDef.value, subtotal);
        } else if (couponDef.type === 'free_shipping') {
          freeShippingAppliedByCoupon = true;
        }
      }
    }
  }

  // Calculate Shipping
  let shippingFee = 0;
  if (cartItems.length > 0) {
    if (shippingMethod === 'express') {
      shippingFee = CONFIG.expressShippingFee;
    } else {
      // standard
      if (subtotal >= CONFIG.freeShippingThreshold || freeShippingAppliedByCoupon) {
        shippingFee = 0;
      } else {
        shippingFee = CONFIG.standardShippingFee;
      }
    }
  }

  // Payment method additional fees (e.g. COD fee)
  let paymentFee = 0;
  if (paymentMethod === 'cod' && cartItems.length > 0) {
    paymentFee = CONFIG.codFee;
  }

  // Tax calculation (demo GST 5% included or added - we show it transparently)
  const taxableAmount = Math.max(0, subtotal - couponDiscount);
  const estimatedTax = Math.round(taxableAmount * CONFIG.taxRate);

  const grandTotal = Math.max(0, taxableAmount + shippingFee + paymentFee);

  return {
    itemCount: totalItemsCount,
    originalSubtotal,
    subtotal,
    productSavings,
    couponCode: validCoupon ? validCoupon.code : null,
    couponDiscount,
    shippingFee,
    paymentFee,
    estimatedTax,
    grandTotal,
    qualifiesForFreeShipping: subtotal >= CONFIG.freeShippingThreshold || freeShippingAppliedByCoupon
  };
}

/**
 * Generate standard star rating SVG icons
 */
function renderRatingStars(rating, reviewCount = null) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.4;
  let html = '<div class="star-rating" aria-label="' + rating + ' out of 5 stars">';
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      html += '<span class="star filled">★</span>';
    } else if (i === fullStars && hasHalfStar) {
      html += '<span class="star half">★</span>';
    } else {
      html += '<span class="star empty">☆</span>';
    }
  }

  if (reviewCount !== null) {
    html += `<span class="rating-count">(${reviewCount})</span>`;
  }
  html += '</div>';
  return html;
}

/**
 * Universal HTML Product Card Generator
 */
function renderProductCard(product) {
  const isWishlisted = WishlistStore.has(product.id);
  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const badgeHtml = product.tags && product.tags.length > 0 
    ? `<span class="product-badge badge-${product.tags[0].toLowerCase().replace(/\s+/g, '-')}">${escapeHTML(product.tags[0])}</span>`
    : '';

  const secondaryImage = product.images[1] || product.images[0];

  return `
    <article class="product-card" data-product-id="${product.id}">
      <div class="product-card-media">
        ${badgeHtml}
        <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" 
                data-wishlist-id="${product.id}" 
                aria-label="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
                title="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        <a href="product.html?id=${encodeURIComponent(product.id)}" class="product-img-link" tabindex="-1">
          <img src="${product.images[0]}" 
               alt="${escapeHTML(product.name)}" 
               class="product-img primary-img" 
               loading="lazy" 
               onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';">
          <img src="${secondaryImage}" 
               alt="${escapeHTML(product.name)} alternate" 
               class="product-img secondary-img" 
               loading="lazy" 
               onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';">
        </a>
        <div class="product-card-actions">
          <button class="btn-card-action quick-view-btn" data-quickview-id="${product.id}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Quick View
          </button>
          <button class="btn-card-action quick-add-btn" data-quickadd-id="${product.id}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            Add to Bag
          </button>
        </div>
      </div>

      <div class="product-card-body">
        <span class="product-category">${escapeHTML(product.category)}</span>
        <h3 class="product-title">
          <a href="product.html?id=${encodeURIComponent(product.id)}">${escapeHTML(product.name)}</a>
        </h3>
        <div class="product-price-row">
          <span class="price-current">${formatCurrency(product.price)}</span>
          ${product.originalPrice ? `<span class="price-original">${formatCurrency(product.originalPrice)}</span>` : ''}
          ${discountPercent > 0 ? `<span class="price-discount">${discountPercent}% OFF</span>` : ''}
        </div>
        ${renderRatingStars(product.rating, product.reviewCount)}
      </div>
    </article>
  `;
}
