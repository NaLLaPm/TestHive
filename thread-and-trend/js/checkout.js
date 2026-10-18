/**
 * THREAD & TREND - Comprehensive Multi-Step Checkout & Order Processor
 */

document.addEventListener('DOMContentLoaded', () => {
  const isCheckoutPage = document.getElementById('checkout-form');
  const isConfirmationPage = document.getElementById('order-confirmation-wrapper');
  const isCartPage = document.getElementById('cart-page-table');

  if (isCartPage) initFullCartPage();
  if (isCheckoutPage) initCheckoutProcess();
  if (isConfirmationPage) initOrderConfirmation();
});

/* ==========================================================================
   Full Cart Page Controller
   ========================================================================== */
function initFullCartPage() {
  const container = document.getElementById('cart-items-tbody');
  const emptyView = document.getElementById('cart-empty-view');
  const tableWrap = document.getElementById('cart-table-wrapper');
  const summaryBox = document.getElementById('cart-page-summary');

  const render = () => {
    const items = CartStore.getItems();
    const coupon = CartStore.getAppliedCoupon();
    const totals = calculateOrderTotals(items, coupon);

    if (items.length === 0) {
      if (emptyView) emptyView.style.display = 'block';
      if (tableWrap) tableWrap.style.display = 'none';
      if (summaryBox) summaryBox.style.display = 'none';
      return;
    }

    if (emptyView) emptyView.style.display = 'none';
    if (tableWrap) tableWrap.style.display = 'block';
    if (summaryBox) summaryBox.style.display = 'block';

    if (container) {
      container.innerHTML = items.map(it => {
        const product = getProductById(it.productId);
        if (!product) return '';
        const lineTotal = product.price * it.quantity;

        return `
          <tr data-id="${product.id}" data-size="${it.size}" data-color="${it.color}">
            <td class="cart-product-cell">
              <img src="${product.images[0]}" class="cart-page-thumb" alt="${escapeHTML(product.name)}" onerror="this.src='${FALLBACK_IMAGE}'">
              <div>
                <a href="product.html?id=${encodeURIComponent(product.id)}" class="cart-page-title">${escapeHTML(product.name)}</a>
                <div class="cart-page-meta">Size: ${escapeHTML(it.size)} | Color: ${escapeHTML(it.color)}</div>
              </div>
            </td>
            <td>${formatCurrency(product.price)}</td>
            <td>
              <div class="qty-stepper">
                <button type="button" class="qty-btn" data-action="dec">&minus;</button>
                <span class="qty-val">${it.quantity}</span>
                <button type="button" class="qty-btn" data-action="inc" ${it.quantity >= product.stock ? 'disabled' : ''}>&#43;</button>
              </div>
            </td>
            <td class="cart-line-total">${formatCurrency(lineTotal)}</td>
            <td>
              <button class="cart-remove-btn" data-action="del" title="Remove item">&times;</button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Render Order Summary
    renderSummaryBreakdown(totals);
  };

  if (container) {
    container.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;

      const pId = row.getAttribute('data-id');
      const size = row.getAttribute('data-size');
      const color = row.getAttribute('data-color');
      const item = CartStore.getItems().find(i => i.productId === pId && i.size === size && i.color === color);
      if (!item) return;

      if (e.target.closest('[data-action="del"]')) {
        CartStore.removeItem(pId, size, color);
      } else if (e.target.closest('[data-action="dec"]')) {
        CartStore.updateQuantity(pId, size, color, item.quantity - 1);
      } else if (e.target.closest('[data-action="inc"]')) {
        CartStore.updateQuantity(pId, size, color, item.quantity + 1);
      }
    });
  }

  // Bind coupon on cart page
  bindCouponInputs();

  window.addEventListener('tt-cart-updated', render);
  render();
}

/* ==========================================================================
   Checkout Process Controller
   ========================================================================== */
function initCheckoutProcess() {
  const form = document.getElementById('checkout-form');
  const cartItems = CartStore.getItems();

  if (cartItems.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  // Pre-fill saved address if available
  const savedAddress = getStorage('user_saved_address', null);
  if (savedAddress) {
    Object.keys(savedAddress).forEach(key => {
      const input = document.getElementById(key);
      if (input) input.value = savedAddress[key];
    });
    const saveCheckbox = document.getElementById('save-address-opt');
    if (saveCheckbox) saveCheckbox.checked = true;
  }

  // Toggle billing address fields
  const sameBillingCheckbox = document.getElementById('same-billing-address');
  const billingFieldsWrapper = document.getElementById('billing-address-fields');
  if (sameBillingCheckbox && billingFieldsWrapper) {
    sameBillingCheckbox.addEventListener('change', () => {
      billingFieldsWrapper.style.display = sameBillingCheckbox.checked ? 'none' : 'grid';
    });
  }

  // Shipping Method Switcher
  const shippingRadios = document.querySelectorAll('input[name="shipping_method"]');
  shippingRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.selection-radio-card.shipping-card').forEach(c => c.classList.remove('active'));
      radio.closest('.selection-radio-card').classList.add('active');
      recalcSummary();
    });
  });

  // Payment Tabs Switcher
  const paymentTabs = document.querySelectorAll('.payment-tab-btn');
  const paymentPanels = document.querySelectorAll('.payment-panel');
  paymentTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const method = tab.getAttribute('data-payment-method');
      paymentTabs.forEach(t => t.classList.remove('active'));
      paymentPanels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const activePanel = document.getElementById(`panel-${method}`);
      if (activePanel) activePanel.classList.add('active');

      recalcSummary();
    });
  });

  // Credit Card formatting helper
  const cardInput = document.getElementById('card-number');
  if (cardInput) {
    cardInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      e.target.value = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    });
  }

  const expInput = document.getElementById('card-expiry');
  if (expInput) {
    expInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 2) {
        e.target.value = val.substring(0, 2) + '/' + val.substring(2);
      } else {
        e.target.value = val;
      }
    });
  }

  // Bind coupon inputs
  bindCouponInputs();

  // Initial Summary Render
  recalcSummary();

  // Form Submission
  if (form) {
    form.addEventListener('submit', handleCheckoutSubmit);
  }
}

function getSelectedShippingMethod() {
  const checked = document.querySelector('input[name="shipping_method"]:checked');
  return checked ? checked.value : 'standard';
}

function getSelectedPaymentMethod() {
  const activeTab = document.querySelector('.payment-tab-btn.active');
  return activeTab ? activeTab.getAttribute('data-payment-method') : 'card';
}

function recalcSummary() {
  const items = CartStore.getItems();
  const coupon = CartStore.getAppliedCoupon();
  const shippingMethod = getSelectedShippingMethod();
  const paymentMethod = getSelectedPaymentMethod();

  const totals = calculateOrderTotals(items, coupon, shippingMethod, paymentMethod);
  renderSummaryBreakdown(totals);
  renderCheckoutSideItems(items);
}

function renderCheckoutSideItems(items) {
  const container = document.getElementById('checkout-items-list');
  if (!container) return;

  container.innerHTML = items.map(it => {
    const p = getProductById(it.productId);
    if (!p) return '';
    return `
      <div class="summary-item">
        <img src="${p.images[0]}" class="summary-item-thumb" alt="${escapeHTML(p.name)}" onerror="this.src='${FALLBACK_IMAGE}'">
        <div class="summary-item-info">
          <h4 class="summary-item-title">${escapeHTML(p.name)}</h4>
          <div class="summary-item-meta">${escapeHTML(it.size)} | Qty: ${it.quantity}</div>
          <div class="summary-item-price">${formatCurrency(p.price * it.quantity)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderSummaryBreakdown(totals) {
  const el = (id) => document.getElementById(id);

  if (el('summary-subtotal')) el('summary-subtotal').textContent = formatCurrency(totals.subtotal);
  if (el('summary-item-count')) el('summary-item-count').textContent = totals.itemCount;

  // Coupon
  const couponRow = el('summary-coupon-row');
  const couponVal = el('summary-coupon-val');
  if (couponRow && couponVal) {
    if (totals.couponDiscount > 0) {
      couponRow.style.display = 'flex';
      couponVal.textContent = `-${formatCurrency(totals.couponDiscount)}`;
    } else {
      couponRow.style.display = 'none';
    }
  }

  // Shipping
  const shipVal = el('summary-shipping-val');
  if (shipVal) {
    if (totals.shippingFee === 0) {
      shipVal.innerHTML = '<strong style="color:var(--color-success)">FREE</strong>';
    } else {
      shipVal.textContent = formatCurrency(totals.shippingFee);
    }
  }

  // Payment Fee (COD)
  const feeRow = el('summary-fee-row');
  const feeVal = el('summary-fee-val');
  if (feeRow && feeVal) {
    if (totals.paymentFee > 0) {
      feeRow.style.display = 'flex';
      feeVal.textContent = formatCurrency(totals.paymentFee);
    } else {
      feeRow.style.display = 'none';
    }
  }

  // Grand Total
  if (el('summary-grand-total')) el('summary-grand-total').textContent = formatCurrency(totals.grandTotal);
}

function bindCouponInputs() {
  const applyBtn = document.getElementById('apply-coupon-btn');
  const input = document.getElementById('coupon-code-input');
  const activeWrap = document.getElementById('applied-coupon-wrapper');

  const updateChip = () => {
    const current = CartStore.getAppliedCoupon();
    if (!activeWrap) return;
    if (current) {
      activeWrap.innerHTML = `
        <div class="active-coupon-chip">
          <span>Coupon <strong>${escapeHTML(current)}</strong> applied</span>
          <button type="button" id="remove-coupon-btn" aria-label="Remove coupon">&times;</button>
        </div>
      `;
      const removeBtn = document.getElementById('remove-coupon-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          CartStore.removeCoupon();
          showToast('Coupon removed.', 'info');
          updateChip();
          recalcSummary();
        });
      }
    } else {
      activeWrap.innerHTML = '';
    }
  };

  if (applyBtn && input) {
    applyBtn.addEventListener('click', () => {
      const code = input.value.trim().toUpperCase();
      if (!code) {
        showToast('Please enter a coupon code.', 'error');
        return;
      }

      const couponDef = CONFIG.coupons[code];
      if (!couponDef) {
        showToast(`Coupon "${code}" is invalid. Try WELCOME10, SAVE200, or FREESHIP.`, 'error');
        return;
      }

      const items = CartStore.getItems();
      const totals = calculateOrderTotals(items);

      if (totals.subtotal < couponDef.minOrder) {
        showToast(`Minimum order of ${formatCurrency(couponDef.minOrder)} required for code "${code}".`, 'error');
        return;
      }

      CartStore.setAppliedCoupon(code);
      input.value = '';
      showToast(`Coupon "${code}" applied: ${couponDef.description}`, 'success');
      updateChip();
      recalcSummary();
    });
  }

  updateChip();
}

/**
 * Validations & Order Dispatch
 */
function handleCheckoutSubmit(e) {
  e.preventDefault();

  const items = CartStore.getItems();
  if (items.length === 0) {
    showToast('Your shopping bag is empty. Please add products first.', 'error');
    return;
  }

  // Clear previous errors
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  document.querySelectorAll('.form-error-msg').forEach(el => el.textContent = '');

  let hasError = false;

  const validateField = (id, checkFn, errorMsg) => {
    const input = document.getElementById(id);
    if (!input) return null;
    const val = input.value.trim();
    if (!checkFn(val)) {
      input.classList.add('is-invalid');
      const errSpan = document.getElementById(`${id}-error`);
      if (errSpan) errSpan.textContent = errorMsg;
      hasError = true;
      return null;
    }
    return val;
  };

  // Step 1: Contact
  const email = validateField('checkout-email', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email address.');
  const phone = validateField('checkout-phone', (v) => /^[6-9]\d{9}$/.test(v.replace(/\s+/g, '')), 'Enter a valid 10-digit Indian mobile number.');

  // Step 2: Shipping Address
  const fullName = validateField('shipping-name', (v) => v.length >= 3, 'Full name is required (min 3 chars).');
  const addressLine1 = validateField('shipping-address1', (v) => v.length >= 5, 'Address line 1 is required.');
  const addressLine2 = document.getElementById('shipping-address2')?.value.trim() || '';
  const city = validateField('shipping-city', (v) => v.length >= 2, 'City is required.');
  const state = validateField('shipping-state', (v) => v.length >= 2, 'State is required.');
  const pincode = validateField('shipping-pincode', (v) => /^\d{6}$/.test(v), 'Enter a valid 6-digit PIN code.');

  // Check terms checkbox
  const termsAgreed = document.getElementById('agree-terms')?.checked;
  if (!termsAgreed) {
    showToast('Please agree to the Terms & Privacy Policy to place your order.', 'error');
    hasError = true;
  }

  // Payment Method validations
  const paymentMethod = getSelectedPaymentMethod();
  if (paymentMethod === 'card') {
    validateField('card-name', (v) => v.length >= 3, 'Cardholder name is required.');
    validateField('card-number', (v) => v.replace(/\s+/g, '').length === 16, 'Enter a valid 16-digit card number.');
    validateField('card-expiry', (v) => /^\d{2}\/\d{2}$/.test(v), 'Format MM/YY required.');
    validateField('card-cvv', (v) => /^\d{3,4}$/.test(v), '3-digit CVV required.');
  } else if (paymentMethod === 'upi') {
    validateField('upi-id', (v) => /^[\w.-]+@[\w.-]+$/.test(v), 'Enter a valid UPI ID (e.g. name@okhdfcbank).');
  }

  if (hasError) {
    showToast('Please fix the highlighted errors before continuing.', 'error');
    // Scroll to first invalid element
    const firstInvalid = document.querySelector('.is-invalid');
    if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Save address locally if opted
  const saveOpt = document.getElementById('save-address-opt')?.checked;
  if (saveOpt) {
    setStorage('user_saved_address', {
      'shipping-name': fullName,
      'shipping-address1': addressLine1,
      'shipping-address2': addressLine2,
      'shipping-city': city,
      'shipping-state': state,
      'shipping-pincode': pincode,
      'checkout-email': email,
      'checkout-phone': phone
    });
  }

  // Generate Simulated Order
  const submitBtn = document.getElementById('place-order-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner" style="display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:8px;"></span>
      Processing Order Securely...
    `;
  }

  const orderTotals = calculateOrderTotals(
    items, 
    CartStore.getAppliedCoupon(), 
    getSelectedShippingMethod(), 
    paymentMethod
  );

  const orderRecord = {
    orderId: `TT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    customer: {
      fullName,
      email,
      phone
    },
    shippingAddress: {
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country: 'India'
    },
    shippingMethod: getSelectedShippingMethod() === 'express' ? 'Express Delivery (1-2 Days)' : 'Standard Delivery (3-5 Days)',
    paymentMethod: paymentMethod.toUpperCase(),
    items: items.map(it => {
      const p = getProductById(it.productId);
      return {
        id: it.productId,
        name: p ? p.name : 'Fashion Item',
        image: p ? p.images[0] : FALLBACK_IMAGE,
        size: it.size,
        color: it.color,
        quantity: it.quantity,
        price: p ? p.price : 0,
        total: (p ? p.price : 0) * it.quantity
      };
    }),
    totals: orderTotals
  };

  setTimeout(() => {
    // Persist demo order in localStorage
    setStorage('latest_order', orderRecord);

    let orderHistory = getStorage('order_history', []);
    orderHistory.unshift(orderRecord);
    setStorage('order_history', orderHistory);

    // Clear user shopping cart
    CartStore.clear();

    // Redirect to Order Confirmation page
    window.location.href = `order-confirmation.html?orderId=${orderRecord.orderId}`;
  }, 1400);
}

/* ==========================================================================
   Order Confirmation View Controller
   ========================================================================== */
function initOrderConfirmation() {
  const container = document.getElementById('order-confirmation-wrapper');
  if (!container) return;

  const latestOrder = getStorage('latest_order', null);

  if (!latestOrder) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No recent order found</h3>
        <p>You haven't placed an order yet in this session.</p>
        <a href="shop.html" class="btn btn-primary">Start Shopping</a>
      </div>
    `;
    return;
  }

  const el = (id) => document.getElementById(id);

  if (el('confirm-order-id')) el('confirm-order-id').textContent = latestOrder.orderId;
  if (el('confirm-order-date')) el('confirm-order-date').textContent = latestOrder.date;
  if (el('confirm-total-amount')) el('confirm-total-amount').textContent = formatCurrency(latestOrder.totals.grandTotal);
  if (el('confirm-customer-email')) el('confirm-customer-email').textContent = latestOrder.customer.email;
  if (el('confirm-shipping-method')) el('confirm-shipping-method').textContent = latestOrder.shippingMethod;
  if (el('confirm-payment-method')) el('confirm-payment-method').textContent = latestOrder.paymentMethod;

  const addr = latestOrder.shippingAddress;
  if (el('confirm-shipping-address')) {
    el('confirm-shipping-address').innerHTML = `
      <strong>${escapeHTML(latestOrder.customer.fullName)}</strong><br>
      ${escapeHTML(addr.addressLine1)}${addr.addressLine2 ? ', ' + escapeHTML(addr.addressLine2) : ''}<br>
      ${escapeHTML(addr.city)}, ${escapeHTML(addr.state)} - ${escapeHTML(addr.pincode)}<br>
      Phone: ${escapeHTML(latestOrder.customer.phone)}
    `;
  }

  const itemsList = el('confirm-order-items');
  if (itemsList) {
    itemsList.innerHTML = latestOrder.items.map(it => `
      <div class="summary-item">
        <img src="${it.image}" class="summary-item-thumb" alt="${escapeHTML(it.name)}" onerror="this.src='${FALLBACK_IMAGE}'">
        <div class="summary-item-info">
          <h4 class="summary-item-title">${escapeHTML(it.name)}</h4>
          <div class="summary-item-meta">Size: ${escapeHTML(it.size)} | Color: ${escapeHTML(it.color)} | Qty: ${it.quantity}</div>
          <div class="summary-item-price">${formatCurrency(it.total)}</div>
        </div>
      </div>
    `).join('');
  }
}
