/**
 * THREAD & TREND - Cart & Wishlist State Management
 */

const CartStore = {
  KEY: 'cart_items',
  COUPON_KEY: 'applied_coupon',

  getItems() {
    return getStorage(this.KEY, []);
  },

  setItems(items) {
    setStorage(this.KEY, items);
    this.broadcastUpdate();
  },

  getAppliedCoupon() {
    return getStorage(this.COUPON_KEY, null);
  },

  setAppliedCoupon(code) {
    setStorage(this.COUPON_KEY, code);
    this.broadcastUpdate();
  },

  removeCoupon() {
    localStorage.removeItem(`tt_${this.COUPON_KEY}`);
    this.broadcastUpdate();
  },

  addItem(productId, size, color, quantity = 1) {
    const product = getProductById(productId);
    if (!product) {
      showToast('Product not found.', 'error');
      return false;
    }

    if (!size) {
      showToast('Please select a size first.', 'error');
      return false;
    }

    const items = this.getItems();
    // Unique key combination for distinct variations
    const existingIndex = items.findIndex(
      it => it.productId === productId && it.size === size && it.color === color
    );

    const currentQtyInCart = existingIndex > -1 ? items[existingIndex].quantity : 0;
    const nextTotalQty = currentQtyInCart + quantity;

    if (nextTotalQty > product.stock) {
      showToast(`Only ${product.stock} items in stock. Cannot add more.`, 'error');
      return false;
    }

    if (existingIndex > -1) {
      items[existingIndex].quantity = nextTotalQty;
    } else {
      items.push({
        productId,
        size,
        color: color || (product.colors[0] ? product.colors[0].name : 'Default'),
        quantity
      });
    }

    this.setItems(items);
    showToast(`Added "${product.name}" (${size}) to your shopping bag!`, 'success');
    return true;
  },

  updateQuantity(productId, size, color, newQuantity) {
    const product = getProductById(productId);
    if (!product) return;

    let items = this.getItems();
    const index = items.findIndex(
      it => it.productId === productId && it.size === size && it.color === color
    );

    if (index === -1) return;

    if (newQuantity <= 0) {
      this.removeItem(productId, size, color);
      return;
    }

    if (newQuantity > product.stock) {
      showToast(`Maximum available stock is ${product.stock}.`, 'error');
      items[index].quantity = product.stock;
    } else {
      items[index].quantity = newQuantity;
    }

    this.setItems(items);
  },

  removeItem(productId, size, color) {
    let items = this.getItems();
    const product = getProductById(productId);
    const initialLen = items.length;
    items = items.filter(
      it => !(it.productId === productId && it.size === size && it.color === color)
    );

    if (items.length !== initialLen) {
      this.setItems(items);
      const name = product ? product.name : 'Item';
      showToast(`Removed "${name}" from your bag.`, 'info');
    }
  },

  clear() {
    setStorage(this.KEY, []);
    this.removeCoupon();
    this.broadcastUpdate();
  },

  getCount() {
    const items = this.getItems();
    return items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  },

  broadcastUpdate() {
    window.dispatchEvent(new CustomEvent('tt-cart-updated', {
      detail: {
        count: this.getCount(),
        items: this.getItems(),
        coupon: this.getAppliedCoupon()
      }
    }));
  }
};

const WishlistStore = {
  KEY: 'wishlist_items',

  getItems() {
    return getStorage(this.KEY, []);
  },

  has(productId) {
    const items = this.getItems();
    return items.includes(productId);
  },

  toggle(productId) {
    let items = this.getItems();
    const exists = items.includes(productId);
    const product = getProductById(productId);
    const name = product ? product.name : 'Item';

    if (exists) {
      items = items.filter(id => id !== productId);
      setStorage(this.KEY, items);
      showToast(`Removed "${name}" from your wishlist.`, 'info');
    } else {
      items.push(productId);
      setStorage(this.KEY, items);
      showToast(`Saved "${name}" to your wishlist!`, 'success');
    }

    this.broadcastUpdate();
    return !exists;
  },

  remove(productId) {
    let items = this.getItems();
    items = items.filter(id => id !== productId);
    setStorage(this.KEY, items);
    this.broadcastUpdate();
  },

  getCount() {
    return this.getItems().length;
  },

  broadcastUpdate() {
    window.dispatchEvent(new CustomEvent('tt-wishlist-updated', {
      detail: {
        count: this.getCount(),
        items: this.getItems()
      }
    }));
  }
};

/**
 * Cart Drawer Slide-Over & Global Badge Sync
 */
class CartUIController {
  constructor() {
    this.initBadgeListeners();
    this.initCartDrawer();
  }

  initBadgeListeners() {
    const updateBadges = () => {
      const cartCount = CartStore.getCount();
      const wishlistCount = WishlistStore.getCount();

      document.querySelectorAll('.cart-count-badge').forEach(badge => {
        badge.textContent = cartCount;
        badge.style.display = cartCount > 0 ? 'inline-flex' : 'none';
      });

      document.querySelectorAll('.wishlist-count-badge').forEach(badge => {
        badge.textContent = wishlistCount;
        badge.style.display = wishlistCount > 0 ? 'inline-flex' : 'none';
      });
    };

    window.addEventListener('tt-cart-updated', () => {
      updateBadges();
      this.renderDrawer();
    });

    window.addEventListener('tt-wishlist-updated', () => {
      updateBadges();
      // Update any active wishlist buttons on page
      document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const id = btn.getAttribute('data-wishlist-id');
        if (id) {
          const isW = WishlistStore.has(id);
          btn.classList.toggle('active', isW);
          const svg = btn.querySelector('svg');
          if (svg) svg.setAttribute('fill', isW ? 'currentColor' : 'none');
        }
      });
    });

    document.addEventListener('DOMContentLoaded', updateBadges);
  }

  initCartDrawer() {
    // Drawer element will be rendered dynamically if not on cart/checkout page
    document.addEventListener('click', (e) => {
      const cartTrigger = e.target.closest('[data-action="open-cart-drawer"]');
      if (cartTrigger) {
        e.preventDefault();
        this.openDrawer();
      }

      const closeTrigger = e.target.closest('[data-action="close-cart-drawer"]');
      if (closeTrigger) {
        this.closeDrawer();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDrawer();
      }
    });
  }

  openDrawer() {
    let drawer = document.getElementById('cart-drawer');
    if (!drawer) {
      drawer = this.createDrawerElement();
    }
    this.renderDrawer();
    drawer.classList.add('is-open');
    document.body.classList.add('drawer-open');
  }

  closeDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) {
      drawer.classList.remove('is-open');
      document.body.classList.remove('drawer-open');
    }
  }

  createDrawerElement() {
    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.className = 'cart-drawer-overlay';
    drawer.innerHTML = `
      <div class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
        <div class="cart-drawer-header">
          <h2 id="cart-drawer-title">Your Shopping Bag (<span id="drawer-item-count">0</span>)</h2>
          <button class="drawer-close-btn" data-action="close-cart-drawer" aria-label="Close cart">&times;</button>
        </div>
        <div class="cart-drawer-body" id="cart-drawer-items">
          <!-- Items inserted here -->
        </div>
        <div class="cart-drawer-footer" id="cart-drawer-footer">
          <!-- Order subtotal and CTAs inserted here -->
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) {
        this.closeDrawer();
      }
    });

    return drawer;
  }

  renderDrawer() {
    const itemsContainer = document.getElementById('cart-drawer-items');
    const footerContainer = document.getElementById('cart-drawer-footer');
    const countBadge = document.getElementById('drawer-item-count');
    if (!itemsContainer || !footerContainer) return;

    const items = CartStore.getItems();
    const coupon = CartStore.getAppliedCoupon();
    const totals = calculateOrderTotals(items, coupon);

    if (countBadge) countBadge.textContent = totals.itemCount;

    if (items.length === 0) {
      itemsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <h3>Your shopping bag is empty</h3>
          <p>Discover our latest summer arrivals and classic collections.</p>
          <a href="shop.html" class="btn btn-primary" onclick="window.cartUI.closeDrawer()">Start Shopping</a>
        </div>
      `;
      footerContainer.style.display = 'none';
      return;
    }

    footerContainer.style.display = 'block';

    // Free shipping tracker progress
    const freeShippingGap = CONFIG.freeShippingThreshold - totals.subtotal;
    const progressPercent = Math.min(100, Math.round((totals.subtotal / CONFIG.freeShippingThreshold) * 100));

    let shippingBanner = '';
    if (freeShippingGap > 0) {
      shippingBanner = `
        <div class="free-shipping-progress">
          <p>Add <strong>${formatCurrency(freeShippingGap)}</strong> more to get <strong>FREE Delivery</strong>!</p>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
          </div>
        </div>
      `;
    } else {
      shippingBanner = `
        <div class="free-shipping-progress qualified">
          <p>🎉 <strong>Congratulations!</strong> You qualify for <strong>FREE Standard Delivery</strong>.</p>
        </div>
      `;
    }

    itemsContainer.innerHTML = shippingBanner + items.map(item => {
      const product = getProductById(item.productId);
      if (!product) return '';
      const lineTotal = product.price * item.quantity;

      return `
        <div class="cart-drawer-item" data-id="${product.id}" data-size="${item.size}" data-color="${item.color}">
          <a href="product.html?id=${encodeURIComponent(product.id)}" class="cart-item-thumb">
            <img src="${product.images[0]}" alt="${escapeHTML(product.name)}" onerror="this.src='${FALLBACK_IMAGE}'">
          </a>
          <div class="cart-item-info">
            <div class="cart-item-head">
              <h4 class="cart-item-title">
                <a href="product.html?id=${encodeURIComponent(product.id)}">${escapeHTML(product.name)}</a>
              </h4>
              <button class="cart-item-remove" data-action="remove-item" title="Remove item">&times;</button>
            </div>
            <div class="cart-item-variants">
              <span>Size: <strong>${escapeHTML(item.size)}</strong></span>
              <span>•</span>
              <span>Color: <strong>${escapeHTML(item.color)}</strong></span>
            </div>
            <div class="cart-item-pricing">
              <div class="qty-stepper">
                <button type="button" class="qty-btn minus" data-action="decrease-qty" aria-label="Decrease">&minus;</button>
                <span class="qty-val">${item.quantity}</span>
                <button type="button" class="qty-btn plus" data-action="increase-qty" aria-label="Increase" ${item.quantity >= product.stock ? 'disabled' : ''}>&#43;</button>
              </div>
              <span class="cart-item-total">${formatCurrency(lineTotal)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    footerContainer.innerHTML = `
      <div class="cart-summary-line">
        <span>Estimated Subtotal</span>
        <strong class="summary-subtotal">${formatCurrency(totals.subtotal)}</strong>
      </div>
      <p class="cart-tax-notice">Taxes and delivery calculated at checkout.</p>
      <div class="cart-drawer-actions">
        <a href="checkout.html" class="btn btn-primary btn-block checkout-btn">Proceed to Checkout &rarr;</a>
        <a href="cart.html" class="btn btn-outline btn-block view-bag-btn" onclick="window.cartUI.closeDrawer()">View Full Shopping Bag</a>
      </div>
    `;

    // Attach drawer line item action listeners
    this.bindDrawerActions(itemsContainer);
  }

  bindDrawerActions(container) {
    container.addEventListener('click', (e) => {
      const itemEl = e.target.closest('.cart-drawer-item');
      if (!itemEl) return;

      const pId = itemEl.getAttribute('data-id');
      const size = itemEl.getAttribute('data-size');
      const color = itemEl.getAttribute('data-color');
      const item = CartStore.getItems().find(i => i.productId === pId && i.size === size && i.color === color);
      if (!item) return;

      if (e.target.closest('[data-action="remove-item"]')) {
        CartStore.removeItem(pId, size, color);
      } else if (e.target.closest('[data-action="decrease-qty"]')) {
        CartStore.updateQuantity(pId, size, color, item.quantity - 1);
      } else if (e.target.closest('[data-action="increase-qty"]')) {
        CartStore.updateQuantity(pId, size, color, item.quantity + 1);
      }
    });
  }
}

// Initialize Cart UI Controller
window.cartUI = new CartUIController();
