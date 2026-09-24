/**
 * TURIN SEMINAR 2026 — CLIENT EXPERIENCE & EDITORIAL EXHIBITION ENGINE
 * Lectures by Prof. Mikhail Minakov • Turin, Sept 11–13, 2026
 * Senior Creative Technologist Architecture:
 * - Editorial Showcase Grid (Top 6 Curated Featured Images per Chapter)
 * - Full Gallery Slider / Lightbox Overlay with Cross-fade, Counter, Touch Swipe & Keyboard Navigation
 * - Smooth Header Blur & Active Navigation Tracking
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollHeader();
  initScrollProgress();
  initHeroParallax();
  initMobileNavOverlay();
  initActiveNavTracking();
  initSmoothScroll();
  initDynamicMassGalleries();
});

/**
 * 1. Sticky Header behavior with luxury blur transition
 */
function initScrollHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/**
 * 1b. Minimalist Scroll Reading Progress Indicator
 * Fixed underneath the header, fills horizontally in muted bronze (#c5a880)
 */
function initScrollProgress() {
  const progressBar = document.getElementById('scrollProgress');
  if (!progressBar) return;

  let ticking = false;

  const updateProgress = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();
}

/**
 * 1c. Subtle Hero Scroll-Parallax (Zero overhead)
 * Glides hero artwork texture slightly slower than foreground typography
 */
function initHeroParallax() {
  const heroBg = document.querySelector('.hero-bg-image');
  const heroSection = document.querySelector('.hero-section');
  if (!heroBg || !heroSection) return;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const heroHeight = heroSection.offsetHeight;
        if (scrollY <= heroHeight) {
          const parallaxOffset = scrollY * 0.28;
          heroBg.style.transform = `translate3d(0, ${parallaxOffset.toFixed(1)}px, 0)`;
        }
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * 2. Mobile Fullscreen Overlay Navigation
 */
function initMobileNavOverlay() {
  const toggleBtn = document.getElementById('navToggle');
  const overlay = document.getElementById('mobileNav');
  if (!toggleBtn || !overlay) return;

  const openNav = () => {
    toggleBtn.classList.add('active');
    toggleBtn.setAttribute('aria-expanded', 'true');
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeNav = () => {
    toggleBtn.classList.remove('active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  toggleBtn.addEventListener('click', () => {
    const isOpen = overlay.classList.contains('active');
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  // Close when clicking any nav link in mobile overlay
  const mobileLinks = overlay.querySelectorAll('.mobile-nav-link');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeNav();
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeNav();
    }
  });
}

/**
 * 3. Active Navigation Tracking
 */
function initActiveNavTracking() {
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.desktop-nav .nav-link');
  if (!sections.length || !navLinks.length) return;

  const onScroll = () => {
    const scrollPos = window.scrollY + 140;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/**
 * 4. Offset-Aware Smooth Scroll for Anchor Links
 */
function initSmoothScroll() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerOffset = 75;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * 5. Dynamic Editorial Gallery & Lightbox Controller (Step 2)
 * Loads dynamic photos from content.json, curates top 6 in asymmetrical grid,
 * and attaches full chapter series to the interactive fullscreen lightbox.
 */
let currentChapterPhotos = [];
let currentPhotoIndex = 0;
let currentChapterMeta = null;

function initDynamicMassGalleries() {
  fetch('./content.json')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      window.seminarData = data;
      renderAllGalleries(data);
    })
    .catch(err => {
      console.info('ℹ [Turin Seminar] Static fallback active:', err.message);
      renderGalleriesFromAttributes();
    });
}

/**
 * Curated showcase images mapping for each chapter
 */
const CURATED_SHOWCASE_MAP = {
  'chapter-1': [
    'images/seminar/seminar-01.jpg',
    'images/seminar/seminar-02.jpg'
  ],
  'chapter-2': [
    'images/risorgimento/risorgimento-11.jpg',
    'images/risorgimento/risorgimento-14.jpg',
    'images/risorgimento/risorgimento-24.jpg',
    'images/risorgimento/risorgimento-33.jpg'
  ],
  'chapter-3': [
    'images/lombroso/lombroso-03.jpg',
    'images/lombroso/lombroso-04.jpg',
    'images/lombroso/lombroso-06.jpg'
  ],
  'chapter-4': [
    'images/city/city-05.jpg',
    'images/city/city-12.jpg',
    'images/city/city-16.jpg',
    'images/city/city-17.jpg',
    'images/city/city-22.jpg',
    'images/city/city-29.jpg'
  ]
};

const CHAPTER_LAYOUT_SPANS = {
  'chapter-1': ['span-6', 'span-6'],
  'chapter-2': ['span-6', 'span-6', 'span-6', 'span-6'],
  'chapter-3': ['span-4', 'span-4', 'span-4'],
  'chapter-4': ['span-7', 'span-5', 'span-4', 'span-8', 'span-6', 'span-6']
};

/**
 * Render galleries using structured content.json data
 * Curation rules:
 * - Chapter 1: 2 curated photos (seminar-01, seminar-02)
 * - Chapter 2: 4 curated photos (risorgimento-11, 14, 24, 33)
 * - Chapter 3: 3 curated photos (lombroso-03, 04, 06)
 * - Chapter 4: 6 curated photos (city-05, 12, 16, 17, 22, 29)
 * - All photos accessible via interactive lightbox
 */
function renderAllGalleries(data) {
  if (!data || !data.chapters) return;

  data.chapters.forEach(chapter => {
    const container = document.getElementById(`gallery-${chapter.id}`);
    if (!container) return;

    const totalCount = chapter.images ? chapter.images.length : (chapter.count || 0);
    const curatedSrcList = (chapter.featured_images && chapter.featured_images.length)
      ? chapter.featured_images
      : (CURATED_SHOWCASE_MAP[chapter.id] || []);

    const spans = CHAPTER_LAYOUT_SPANS[chapter.id] || ['span-6'];
    const featuredImages = curatedSrcList.map((src, idx) => {
      const existing = (chapter.images || []).find(img => img.src === src);
      const span = spans[idx % spans.length];
      if (existing) {
        return { ...existing, span };
      }
      return {
        id: `${chapter.id}-featured-${idx + 1}`,
        src,
        aspect: 'aspect-wide',
        span
      };
    });

    // Update section bar count badge if present
    const countBadge = document.getElementById(`count-${chapter.id}`);
    if (countBadge) {
      countBadge.textContent = `${totalCount} КАДРОВ`;
    }

    // Update Chapter Header Button: "Вся серия (N фото) →"
    const chapterHeaderBtn = document.querySelector(`.btn-chapter-gallery[data-chapter-id="${chapter.id}"]`);
    if (chapterHeaderBtn) {
      const textSpan = chapterHeaderBtn.querySelector('.btn-gallery-text');
      if (textSpan) {
        textSpan.textContent = `Вся серия (${totalCount} фото) →`;
      }
      chapterHeaderBtn.onclick = (e) => {
        e.preventDefault();
        openLightbox(chapter.images, 0, chapter);
      };
    }

    // Update Section Bar Pill: "Вся серия (N фото) →"
    const pillBtn = document.querySelector(`.btn-view-all-pill[data-chapter-id="${chapter.id}"]`);
    if (pillBtn) {
      const pillSpan = pillBtn.querySelector('span');
      if (pillSpan) {
        pillSpan.textContent = `Вся серия (${totalCount} фото) →`;
      }
      pillBtn.onclick = (e) => {
        e.preventDefault();
        openLightbox(chapter.images, 0, chapter);
      };
    }

    // Update Footer Browse Button: "Смотреть всю серию из N кадров →"
    const browseBtn = document.querySelector(`.btn-gallery-browse-all[data-chapter-id="${chapter.id}"]`);
    if (browseBtn) {
      const browseTitle = browseBtn.querySelector('.browse-title');
      if (browseTitle) {
        browseTitle.textContent = `Смотреть всю серию из ${totalCount} кадров в высоком разрешении →`;
      }
      browseBtn.onclick = (e) => {
        e.preventDefault();
        openLightbox(chapter.images, 0, chapter);
      };
    }

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    featuredImages.forEach((curatedImg, idx) => {
      const item = createGalleryCardElement(curatedImg, chapter, idx);
      
      // Find exact index of this photo in the full chapter series
      const targetIdx = (chapter.images || []).findIndex(i => i.src === curatedImg.src);

      // Card click opens lightbox at this specific photo in the full series
      item.onclick = () => {
        openLightbox(chapter.images, targetIdx >= 0 ? targetIdx : 0, chapter);
      };

      fragment.appendChild(item);
    });

    container.appendChild(fragment);
  });

  initIntersectionObserver();
  initLightboxModal();
}

/**
 * Fallback generator if content.json fetch is blocked by local file:// policy
 */
function renderGalleriesFromAttributes() {
  const containers = document.querySelectorAll('.gallery-grid[data-folder]');

  containers.forEach((container, chIdx) => {
    const chapterId = container.id.replace('gallery-', '');
    const folder = container.getAttribute('data-folder');
    const prefix = container.getAttribute('data-prefix');
    const totalCount = parseInt(container.getAttribute('data-count') || '15', 10);
    const chapterImages = [];

    for (let i = 1; i <= totalCount; i++) {
      const formattedNum = i < 10 ? '0' + i : String(i);
      chapterImages.push({
        id: `${prefix}${formattedNum}`,
        number: i,
        src: `${folder}${prefix}${formattedNum}.jpg`,
        aspect: 'aspect-wide'
      });
    }

    const chapterTitles = {
      'chapter-1': 'Лаборатория мысли',
      'chapter-2': 'Трон и Миф',
      'chapter-3': 'Анатомия тени',
      'chapter-4': 'Геометрия города'
    };

    const chapterMeta = {
      id: chapterId,
      number: `0${chIdx + 1}`,
      title: chapterTitles[chapterId] || `Глава 0${chIdx + 1}`,
      images: chapterImages
    };

    // Wire Chapter Buttons
    const headerBtn = document.querySelector(`.btn-chapter-gallery[data-chapter-id="${chapterId}"]`);
    if (headerBtn) {
      headerBtn.onclick = (e) => {
        e.preventDefault();
        openLightbox(chapterImages, 0, chapterMeta);
      };
    }
    const pillBtn = document.querySelector(`.btn-view-all-pill[data-chapter-id="${chapterId}"]`);
    if (pillBtn) {
      pillBtn.onclick = (e) => {
        e.preventDefault();
        openLightbox(chapterImages, 0, chapterMeta);
      };
    }
    const browseBtn = document.querySelector(`.btn-gallery-browse-all[data-chapter-id="${chapterId}"]`);
    if (browseBtn) {
      browseBtn.onclick = (e) => {
        e.preventDefault();
        openLightbox(chapterImages, 0, chapterMeta);
      };
    }

    // Curated featured photos from CURATED_SHOWCASE_MAP
    const curatedSrcList = CURATED_SHOWCASE_MAP[chapterId] || [];
    const spans = CHAPTER_LAYOUT_SPANS[chapterId] || ['span-6'];

    const featured = curatedSrcList.map((src, idx) => {
      const existing = chapterImages.find(img => img.src === src);
      const span = spans[idx % spans.length];
      if (existing) {
        return { ...existing, span };
      }
      return {
        id: `${chapterId}-featured-${idx + 1}`,
        src,
        aspect: 'aspect-wide',
        span
      };
    });

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    featured.forEach((curatedImg, idx) => {
      const item = createGalleryCardElement(curatedImg, chapterMeta, idx);
      const targetIdx = chapterImages.findIndex(i => i.src === curatedImg.src);
      item.onclick = () => {
        openLightbox(chapterImages, targetIdx >= 0 ? targetIdx : 0, chapterMeta);
      };
      fragment.appendChild(item);
    });

    container.appendChild(fragment);
  });

  initIntersectionObserver();
  initLightboxModal();
}

/**
 * Creates individual gallery article card DOM element (Clean Photographic Frame)
 */
function createGalleryCardElement(img, chapter, index) {
  const item = document.createElement('article');
  item.className = `gallery-item ${img.span || 'span-6'} reveal-on-scroll`;
  item.dataset.index = index;
  item.dataset.chapterId = chapter.id;

  // Stagger animation class
  const staggerNum = (index % 4) + 1;
  item.classList.add(`stagger-${staggerNum}`);

  item.innerHTML = `
    <div class="gallery-card">
      <div class="gallery-figure ${img.aspect || 'aspect-wide'}">
        <!-- Architectural Wireframe / Skeleton Fallback -->
        <div class="skeleton-placeholder" aria-hidden="true">
          <svg class="skeleton-art-svg" viewBox="0 0 100 100" fill="none" stroke-width="0.8">
            <rect x="18" y="18" width="64" height="64" />
            <line x1="18" y1="18" x2="82" y2="82" />
            <line x1="82" y1="18" x2="18" y2="82" />
            <circle cx="50" cy="50" r="22" />
          </svg>
        </div>

        <!-- Real Photographic Asset with Lazy Loading -->
        <img 
          class="gallery-image" 
          src="${img.src}" 
          alt="${chapter.title || 'Семинар в Турине'}" 
          loading="lazy"
          onload="this.classList.add('loaded')"
          onerror="this.style.display='none'"
        >

        <!-- Elegant Curatorial Zoom Hint on Hover -->
        <div class="gallery-hover-overlay" aria-hidden="true">
          <span class="gallery-hover-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  `;

  return item;
}

/**
 * 6. Fullscreen Exhibition Lightbox & Carousel Engine
 */
let isLightboxInitialized = false;

function openLightbox(chapterPhotos, startIndex, chapter) {
  if (!chapterPhotos || !chapterPhotos.length) return;
  const modal = document.getElementById('galleryLightbox');
  if (!modal) return;

  currentChapterPhotos = chapterPhotos;
  currentPhotoIndex = startIndex >= 0 && startIndex < chapterPhotos.length ? startIndex : 0;
  currentChapterMeta = chapter || null;

  updateLightboxContent(false);

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Set focus to modal for immediate keyboard interaction
  const viewport = document.getElementById('lightboxViewport');
  if (viewport) viewport.focus();
}

function closeLightbox() {
  const modal = document.getElementById('galleryLightbox');
  if (!modal) return;

  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function updateLightboxContent(animate = true) {
  if (!currentChapterPhotos.length) return;
  const itemData = currentChapterPhotos[currentPhotoIndex];

  const counter = document.getElementById('lightboxCounter');
  const chapterTag = document.getElementById('lightboxChapterTag');
  const imgTarget = document.getElementById('lightboxImg');
  const svgWrap = document.getElementById('lightboxSvgWrap');

  // Format clean counter: e.g. "01 / 15"
  const currentFormatted = String(currentPhotoIndex + 1).padStart(2, '0');
  const totalFormatted = String(currentChapterPhotos.length).padStart(2, '0');
  if (counter) {
    counter.textContent = `${currentFormatted} / ${totalFormatted}`;
  }

  // Update Chapter Title
  if (chapterTag && currentChapterMeta) {
    const num = currentChapterMeta.number ? `ГЛАВА ${currentChapterMeta.number}` : '';
    const title = currentChapterMeta.title ? currentChapterMeta.title.toUpperCase() : '';
    chapterTag.textContent = num && title && !title.includes(num) ? `${num} • ${title}` : (title || 'ТУРИН 2026');
  }

  // Smooth Cross-Fade Image Loading
  if (imgTarget) {
    if (animate) {
      imgTarget.classList.add('fading');
    }

    const tempImg = new Image();
    tempImg.src = itemData.src;

    tempImg.onload = () => {
      imgTarget.src = itemData.src;
      imgTarget.alt = currentChapterMeta ? (currentChapterMeta.title || 'Семинар в Турине') : 'Семинар в Турине';
      imgTarget.style.display = 'block';
      imgTarget.classList.remove('fading');
      imgTarget.classList.add('loaded');
      if (svgWrap) svgWrap.style.display = 'none';
    };

    tempImg.onerror = () => {
      imgTarget.style.display = 'none';
      if (svgWrap) {
        svgWrap.style.display = 'flex';
        svgWrap.innerHTML = `
          <svg class="skeleton-art-svg" viewBox="0 0 100 100" fill="none" stroke-width="0.8" style="width:140px; stroke:var(--accent-gold); opacity:0.6;">
            <rect x="15" y="15" width="70" height="70" />
            <circle cx="50" cy="50" r="25" />
            <line x1="15" y1="15" x2="85" y2="85" />
          </svg>
        `;
      }
    };

    preloadAdjacentImages();
  }
}

function preloadAdjacentImages() {
  if (currentChapterPhotos.length <= 1) return;
  const nextIdx = (currentPhotoIndex + 1) % currentChapterPhotos.length;
  const prevIdx = (currentPhotoIndex - 1 + currentChapterPhotos.length) % currentChapterPhotos.length;
  
  const nextImg = new Image();
  nextImg.src = currentChapterPhotos[nextIdx].src;
  
  const prevImg = new Image();
  prevImg.src = currentChapterPhotos[prevIdx].src;
}

function showPrevPhoto() {
  if (!currentChapterPhotos.length) return;
  currentPhotoIndex = (currentPhotoIndex - 1 + currentChapterPhotos.length) % currentChapterPhotos.length;
  updateLightboxContent(true);
}

function showNextPhoto() {
  if (!currentChapterPhotos.length) return;
  currentPhotoIndex = (currentPhotoIndex + 1) % currentChapterPhotos.length;
  updateLightboxContent(true);
}

function initLightboxModal() {
  if (isLightboxInitialized) return;
  isLightboxInitialized = true;

  const modal = document.getElementById('galleryLightbox');
  if (!modal) return;

  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  const backdrop = document.getElementById('lightboxBackdrop');
  const viewport = document.getElementById('lightboxViewport');

  if (prevBtn) prevBtn.addEventListener('click', showPrevPhoto);
  if (nextBtn) nextBtn.addEventListener('click', showNextPhoto);
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (backdrop) backdrop.addEventListener('click', closeLightbox);

  // Keyboard navigation: Left, Right, Escape
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showPrevPhoto();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      showNextPhoto();
    }
  });

  // Touch Swipe Gestures for touch devices
  if (viewport) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    viewport.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    viewport.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipeGesture();
    }, { passive: true });

    function handleSwipeGesture() {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const swipeThreshold = 45; // Minimum travel distance

      // Only respond if horizontal swipe is dominant
      if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) {
          // Swiped Left -> Show Next
          showNextPhoto();
        } else {
          // Swiped Right -> Show Prev
          showPrevPhoto();
        }
      }
    }
  }
}

/**
 * 7. Intersection Observer for Scroll Reveals
 */
function initIntersectionObserver() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)');
  if (!revealElements.length) return;

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.08
  });

  revealElements.forEach(el => observer.observe(el));
}
