/**
 * THREAD & TREND - Wishlist Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  renderWishlistPage();

  window.addEventListener('tt-wishlist-updated', () => {
    renderWishlistPage();
  });
});

function renderWishlistPage() {
  const container = document.getElementById('wishlist-grid-container');
  const emptyState = document.getElementById('wishlist-empty-state');
  const countHeader = document.getElementById('wishlist-page-count');

  if (!container) return;

  const savedIds = WishlistStore.getItems();
  const validProducts = savedIds.map(id => getProductById(id)).filter(Boolean);

  if (countHeader) countHeader.textContent = validProducts.length;

  if (validProducts.length === 0) {
    container.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  container.style.display = 'grid';

  container.innerHTML = validProducts.map(p => {
    return `
      <div class="wishlist-item-card" data-product-id="${p.id}">
        <div class="wishlist-thumb-wrap">
          <img src="${p.images[0]}" alt="${escapeHTML(p.name)}" onerror="this.src='${FALLBACK_IMAGE}'">
          <button class="remove-wishlist-item-btn" data-action="remove-wishlist" data-id="${p.id}" title="Remove item">&times;</button>
        </div>
        <div class="wishlist-item-body">
          <span class="product-category">${escapeHTML(p.category)}</span>
          <h3 class="product-title"><a href="product.html?id=${encodeURIComponent(p.id)}">${escapeHTML(p.name)}</a></h3>
          <div class="product-price-row">
            <span class="price-current">${formatCurrency(p.price)}</span>
            ${p.originalPrice ? `<span class="price-original">${formatCurrency(p.originalPrice)}</span>` : ''}
          </div>
          <button class="btn btn-primary btn-block btn-sm mt-2" data-action="move-to-cart" data-id="${p.id}">
            Select Size &amp; Add to Bag
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach card event listeners
  container.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-action="remove-wishlist"]');
    if (removeBtn) {
      const pId = removeBtn.getAttribute('data-id');
      WishlistStore.remove(pId);
      return;
    }

    const moveBtn = e.target.closest('[data-action="move-to-cart"]');
    if (moveBtn) {
      const pId = moveBtn.getAttribute('data-id');
      openQuickAdd(pId);
      return;
    }
  });
}
