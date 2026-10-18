/**
 * THREAD & TREND - Live Search & Autocomplete Engine
 */

class SearchManager {
  constructor() {
    this.modal = null;
    this.input = null;
    this.resultsContainer = null;
    this.debounceTimer = null;
    this.init();
  }

  init() {
    this.createSearchModal();
    this.bindEvents();
  }

  createSearchModal() {
    const modal = document.createElement('div');
    modal.id = 'search-overlay';
    modal.className = 'search-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Product Search');

    modal.innerHTML = `
      <div class="search-modal-container">
        <div class="search-modal-header">
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="search" 
                   id="global-search-input" 
                   placeholder="Search dresses, linen shirts, denim trousers..." 
                   autocomplete="off" 
                   spellcheck="false"
                   aria-autocomplete="list"
                   aria-controls="search-live-results">
            <button class="clear-search-btn" id="clear-search-btn" aria-label="Clear search text" style="display:none;">&times;</button>
          </div>
          <button class="close-search-btn" id="close-search-btn" aria-label="Close search">&times;</button>
        </div>

        <div class="search-modal-content">
          <div class="popular-searches" id="popular-searches">
            <h4>Popular Suggestions</h4>
            <div class="popular-tags">
              <button class="search-tag-btn" data-search="Linen">Linen</button>
              <button class="search-tag-btn" data-search="Floral Dress">Floral Dress</button>
              <button class="search-tag-btn" data-search="Denim">Denim</button>
              <button class="search-tag-btn" data-search="Kurta">Kurta Set</button>
              <button class="search-tag-btn" data-search="Cargo">Cargo Trousers</button>
              <button class="search-tag-btn" data-search="Blazer">Blazer</button>
            </div>
          </div>

          <div class="search-results-wrapper" id="search-live-results">
            <!-- Dynamic search results render here -->
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;
    this.input = modal.querySelector('#global-search-input');
    this.resultsContainer = modal.querySelector('#search-live-results');
    this.popularSearches = modal.querySelector('#popular-searches');
    this.clearBtn = modal.querySelector('#clear-search-btn');
  }

  bindEvents() {
    // Open trigger
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="open-search"]')) {
        e.preventDefault();
        this.open();
      }
      if (e.target.closest('#close-search-btn') || e.target === this.modal) {
        this.close();
      }
      const tagBtn = e.target.closest('.search-tag-btn');
      if (tagBtn) {
        const query = tagBtn.getAttribute('data-search');
        this.input.value = query;
        this.executeSearch(query);
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('is-open')) {
        this.close();
      }
    });

    // Input events with debouncing
    this.input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      this.clearBtn.style.display = query.length > 0 ? 'inline-flex' : 'none';

      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.executeSearch(query);
      }, 250);
    });

    this.clearBtn.addEventListener('click', () => {
      this.input.value = '';
      this.clearBtn.style.display = 'none';
      this.resultsContainer.innerHTML = '';
      this.popularSearches.style.display = 'block';
      this.input.focus();
    });

    // Enter press leads to full shop page with search query
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = this.input.value.trim();
        if (query) {
          window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }

  open() {
    this.modal.classList.add('is-open');
    document.body.classList.add('search-open');
    setTimeout(() => this.input.focus(), 150);
  }

  close() {
    this.modal.classList.remove('is-open');
    document.body.classList.remove('search-open');
  }

  executeSearch(rawQuery) {
    const query = rawQuery.trim().toLowerCase();
    if (!query) {
      this.resultsContainer.innerHTML = '';
      this.popularSearches.style.display = 'block';
      return;
    }

    this.popularSearches.style.display = 'none';

    // Search against Product Name, Category, Description, Tags, and Colors
    const matches = PRODUCTS.filter(p => {
      return (
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.shortDescription.toLowerCase().includes(query) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(query))) ||
        (p.colors && p.colors.some(c => c.name.toLowerCase().includes(query))) ||
        (p.material && p.material.toLowerCase().includes(query))
      );
    });

    if (matches.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="search-empty-state">
          <p class="search-empty-title">No products found matching "<strong>${escapeHTML(rawQuery)}</strong>"</p>
          <p class="search-empty-hint">Check your spelling, try more general terms, or explore our curated categories.</p>
          <a href="shop.html" class="btn btn-outline" onclick="window.searchManager.close()">Browse All Collections</a>
        </div>
      `;
      return;
    }

    const limited = matches.slice(0, 8);
    this.resultsContainer.innerHTML = `
      <div class="search-results-header">
        <span>Found <strong>${matches.length}</strong> matching style${matches.length > 1 ? 's' : ''}</span>
        ${matches.length > 8 ? `<a href="shop.html?search=${encodeURIComponent(rawQuery)}" class="view-all-results">View all ${matches.length} results &rarr;</a>` : ''}
      </div>
      <div class="search-results-grid">
        ${limited.map(p => `
          <a href="product.html?id=${encodeURIComponent(p.id)}" class="search-result-card">
            <img src="${p.images[0]}" alt="${escapeHTML(p.name)}" class="search-thumb" onerror="this.src='${FALLBACK_IMAGE}'">
            <div class="search-card-meta">
              <span class="search-card-cat">${escapeHTML(p.category)}</span>
              <h5 class="search-card-name">${escapeHTML(p.name)}</h5>
              <div class="search-card-price">
                <span class="current">${formatCurrency(p.price)}</span>
                ${p.originalPrice ? `<span class="original">${formatCurrency(p.originalPrice)}</span>` : ''}
              </div>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  }
}

// Instantiate global search manager
window.searchManager = new SearchManager();
