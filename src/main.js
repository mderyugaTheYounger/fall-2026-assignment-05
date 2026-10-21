import products from './data/products.json';

// Pagination state constants
const ITEMS_PER_PAGE = 5;
let currentPage = 1;

/**
 * Escapes HTML characters to prevent XSS.
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Replaces Magic symbol notation (e.g. {R}, {1}, {T}) with local SVG images.
 * Uses relative pathing (./symbols/{CODE}.svg) loaded from local storage (public/symbols/).
 */
function renderManaSymbols(text) {
  if (!text) return '';
  return text.replace(/\{([A-Za-z0-9/]+)\}/g, (match, rawCode) => {
    const cleanCode = rawCode.replace('/', '').toUpperCase();
    return `<img src="./symbols/${cleanCode}.svg" alt="${escapeHtml(match)}" class="mana-symbol" title="${escapeHtml(match)}" loading="lazy" />`;
  });
}

/**
 * Formats card description text into paragraphs with rendered mana symbols.
 */
function formatCardDescription(text) {
  if (!text) return '';
  return text
    .split('\n')
    .map((paragraph) => {
      const escaped = escapeHtml(paragraph);
      const withSymbols = renderManaSymbols(escaped);
      return `<p>${withSymbols}</p>`;
    })
    .join('');
}

/**
 * Formats price to standard USD currency display ($X.XX).
 */
function formatPrice(price) {
  const num = typeof price === 'number' ? price : parseFloat(price) || 0;
  return `$${num.toFixed(2)}`;
}

/**
 * Renders the slice of product cards for the given page.
 */
function renderProductGrid(page) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = products.slice(startIndex, endIndex);

  grid.innerHTML = currentProducts
    .map(
      (product) => `
      <article class="product-card" data-id="${product.id}">
        <div class="product-image-wrap">
          <img 
            src="${product.imageUrl}" 
            alt="${escapeHtml(product.name)}" 
            loading="lazy" 
          />
        </div>
        <div class="product-details">
          <div class="product-header-row">
            <h2 class="product-title">${escapeHtml(product.name)}</h2>
            <span class="product-price">${formatPrice(product.price)}</span>
          </div>
          <span class="product-category-badge">${escapeHtml(product.category)}</span>
          <div class="product-description">${formatCardDescription(product.description)}</div>
        </div>
      </article>
    `,
    )
    .join('');
}

/**
 * Updates pagination buttons state and page indicator label.
 */
function updatePaginationControls(totalPages) {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const indicator = document.getElementById('page-indicator');

  if (indicator) {
    indicator.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
  }

  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages;
  }
}

/**
 * Initializes store page pagination and event handlers.
 */
function initStorePage() {
  const productGrid = document.getElementById('product-grid');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  // Only run pagination logic if on store page
  if (!productGrid) return;

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  // Initial render for Page 1
  renderProductGrid(currentPage);
  updatePaginationControls(totalPages);

  // Event handler for Previous button
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderProductGrid(currentPage);
        updatePaginationControls(totalPages);
        productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Event handler for Next button
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderProductGrid(currentPage);
        updatePaginationControls(totalPages);
        productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

/**
 * Parallax scrolling effect for banner images.
 * Smoothly shifts images at a slower rate than page scrolling,
 * inspired by horr.framer.website.
 */
function initParallax() {
  const parallaxItems = document.querySelectorAll('.parallax-wrap');
  if (!parallaxItems.length) return;

  // Respect user preference for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  let ticking = false;

  function updateParallax() {
    const viewportHeight = window.innerHeight;

    parallaxItems.forEach((wrap) => {
      const rect = wrap.getBoundingClientRect();
      // Only compute and transform when container is visible in viewport
      if (rect.bottom > 0 && rect.top < viewportHeight) {
        const img = wrap.querySelector('.parallax-img');
        if (img) {
          const elementCenter = rect.top + rect.height / 2;
          const viewportCenter = viewportHeight / 2;
          // Normalizes distance from screen center: -1 (top) to +1 (bottom)
          const scrollProgress =
            (elementCenter - viewportCenter) / (viewportHeight / 2);
          // Pronounced, smooth 75px translation offset for a strong parallax feel
          const translateY = -scrollProgress * 75;
          img.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0) scale(1.15)`;
        }
      }
    });

    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    },
    { passive: true },
  );

  window.addEventListener(
    'resize',
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    },
    { passive: true },
  );

  // Initial calculation on load
  updateParallax();
}

function init() {
  initStorePage();
  initParallax();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
