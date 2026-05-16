/* ==================================
   UNIFIED GALLERY ENGINE
   index.html + curated.html
================================== */

const mainGallery = document.getElementById('gallery');
const infoGallery = document.getElementById('info-gallery');
const aboutSection = document.getElementById('about-content');
const popup = document.getElementById('popup');
const popupImg = document.getElementById('popup-img');
const commentBox = document.getElementById('comment-box');
const slideshowBtn = document.getElementById('slideshow-btn');
const fsBtn = document.getElementById('fullscreen-btn');
const lockLabel = document.getElementById('lock-label');

const buttons = document.querySelectorAll('[data-cat]');
const isCuratedPage = !!document.querySelector('[data-cat="curated"]');
const isEmotionPage = !!document.querySelector('[data-cat="happiness"]');

let currentCategory = 'info';
let filteredIndexes = [];
let currentIndex = 0;
let slideshowInterval = null;

let currentZoom = 1;
let isPanning = false;
let startX, startY;
let translateX = 0;
let translateY = 0;

/* THEME */

if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
}

document.addEventListener('click', (e) => {
    const themeBtn = e.target.closest('#theme-toggle');

    if (!themeBtn) return;

    e.preventDefault();

    document.body.classList.toggle('light-mode');

    localStorage.setItem(
        'theme',
        document.body.classList.contains('light-mode') ? 'light' : 'dark'
    );
});

/* FULLSCREEN */

if (fsBtn) {
    fsBtn.onclick = (e) => {
        e.stopPropagation();

        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.log(err));
            fsBtn.innerHTML = '❐';
        } else {
            document.exitFullscreen();
            fsBtn.innerHTML = '⛶';
        }
    };
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && fsBtn) {
        fsBtn.innerHTML = '⛶';
    }
});

/* EXTRAS LOCK */

function initExtras() {
    if (!isCuratedPage || !lockLabel) return;

    const extrasBtn = document.querySelector('[data-cat="extras"]');

    lockLabel.innerText = '🔒';
    lockLabel.style.opacity = '1';
    lockLabel.style.cursor = 'default';

    if (extrasBtn) {
        extrasBtn.style.pointerEvents = 'none';
        extrasBtn.style.cursor = 'default';
    }

    setTimeout(() => {
        lockLabel.style.transition = 'opacity 2.5s ease';
        lockLabel.style.opacity = '0';

        setTimeout(() => {
            lockLabel.innerText = 'Extras for cool visitors';
            lockLabel.style.transition = 'opacity 0.2s ease';
            lockLabel.style.opacity = '1';
            lockLabel.style.cursor = 'pointer';

            lockLabel.onclick = () => {
                filterImages('extras');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };

            lockLabel.onmouseover = () => {
                lockLabel.style.opacity = '0.5';
            };

            lockLabel.onmouseout = () => {
                lockLabel.style.opacity = '1';
            };

            if (extrasBtn) {
                extrasBtn.style.pointerEvents = 'auto';
                extrasBtn.style.cursor = 'pointer';
                extrasBtn.classList.add('reveal-anim');
            }
        }, 2500);
    }, 60000);
}

/* GALLERY */

function buildGallery() {
    if (!mainGallery || typeof photoData === 'undefined') return;

    mainGallery.innerHTML = '';
    if (infoGallery) infoGallery.innerHTML = '';

    const fragMain = document.createDocumentFragment();
    const fragInfo = document.createDocumentFragment();

    photoData.forEach((photo, index) => {
        const img = document.createElement('img');

        img.src = photo.src;
        img.alt = photo.title || '';
        img.loading = 'lazy';
        img.className = 'gallery-img';
        img.dataset.index = index;
        img.dataset.cat = photo.cat;
        img.onclick = () => openImage(index);

        if (photo.cat === 'info') {
            fragInfo.appendChild(img);
        } else {
            fragMain.appendChild(img);
        }
    });

    if (infoGallery) infoGallery.appendChild(fragInfo);
    mainGallery.appendChild(fragMain);
}

/* FILTER */

function filterImages(cat) {
    if (cat === 'extras' && lockLabel && lockLabel.innerText === '🔒') return;

    currentCategory = cat;
    stopSlideshow();

    if (cat === 'info') {
        if (mainGallery) mainGallery.style.display = 'none';
        if (aboutSection) aboutSection.style.display = 'block';
    } else {
        if (mainGallery) mainGallery.style.display = 'grid';
        if (aboutSection) aboutSection.style.display = 'none';

        document.querySelectorAll('#gallery .gallery-img').forEach(img => {
            img.style.display =
                cat === 'all' || img.dataset.cat === cat
                    ? 'block'
                    : 'none';
        });
    }

    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === cat);
    });

    updateFilteredIndexes();
}

function updateFilteredIndexes() {
    const selector =
        currentCategory === 'info'
            ? '#info-gallery .gallery-img'
            : '#gallery .gallery-img';

    filteredIndexes = Array.from(document.querySelectorAll(selector))
        .filter(img => img.style.display !== 'none')
        .map(img => Number(img.dataset.index));
}

/* ZOOM & PAN */

function updateZoom() {
    if (popupImg) {
        popupImg.style.transform =
            `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    }
}

function resetView() {
    currentZoom = 1;
    translateX = 0;
    translateY = 0;

    if (popupImg) {
        popupImg.style.cursor = 'grab';
        updateZoom();
    }
}

function startPan(e) {
    if (currentZoom <= 1) return;

    isPanning = true;

    const x = e.pageX || e.touches[0].pageX;
    const y = e.pageY || e.touches[0].pageY;

    startX = x - translateX;
    startY = y - translateY;

    if (popupImg) popupImg.style.cursor = 'grabbing';
}

function movePan(e) {
    if (!isPanning) return;
    if (e.cancelable) e.preventDefault();

    const x = e.pageX || e.touches[0].pageX;
    const y = e.pageY || e.touches[0].pageY;

    translateX = x - startX;
    translateY = y - startY;

    updateZoom();
}

function endPan() {
    isPanning = false;

    if (popupImg) {
        popupImg.style.cursor = currentZoom > 1 ? 'grab' : 'pointer';
    }
}

if (popupImg) {
    popupImg.addEventListener('mousedown', startPan);
    popupImg.addEventListener('touchstart', startPan);

    window.addEventListener('mousemove', movePan);
    window.addEventListener('mouseup', endPan);
    window.addEventListener('touchmove', movePan, { passive: false });
    window.addEventListener('touchend', endPan);
}

/* LIGHTBOX */

function openImage(index) {
    const found = filteredIndexes.indexOf(index);
    if (found === -1) return;

    currentIndex = found;
    resetView();
    updatePopup();

    if (popup) popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function updatePopup() {
    const d = photoData[filteredIndexes[currentIndex]];
    if (!d || !popupImg || !commentBox) return;

    popupImg.style.opacity = '0';
    popupImg.src = d.src;

    const hasStory = !!d.description;
    const hasExif = !!d.exif;

    commentBox.innerHTML = `
        <div style="text-align:center;">
            <p>
                ${d.title || ''} &nbsp; | &nbsp; ${d.date || ''}

                ${hasStory ? `<button id="story-btn">🖋</button>` : ''}
                ${hasExif ? `<button id="exif-btn">ℹ</button>` : ''}

                <span style="margin-left:40px;">
                    ${currentIndex + 1} / ${filteredIndexes.length}
                </span>
            </p>

            <div id="story-box" style="display:none; margin-top:10px;">
                <p>${d.description || ''}</p>
            </div>

            <div id="exif-box" style="display:none; margin-top:10px;">
                <p>${d.exif || ''}</p>
            </div>
        </div>
    `;

    const storyBtn = document.getElementById('story-btn');
    const exifBtn = document.getElementById('exif-btn');

    if (storyBtn) {
        storyBtn.onclick = (e) => {
            e.stopPropagation();

            const storyBox = document.getElementById('story-box');
            const exifBox = document.getElementById('exif-box');

            storyBox.style.display =
                storyBox.style.display === 'none' ? 'block' : 'none';

            if (exifBox) exifBox.style.display = 'none';
        };
    }

    if (exifBtn) {
        exifBtn.onclick = (e) => {
            e.stopPropagation();

            const exifBox = document.getElementById('exif-box');
            const storyBox = document.getElementById('story-box');

            exifBox.style.display =
                exifBox.style.display === 'none' ? 'block' : 'none';

            if (storyBox) storyBox.style.display = 'none';
        };
    }

    popupImg.onload = () => {
        popupImg.style.opacity = '1';
    };
}

function changeImage(dir) {
    if (filteredIndexes.length <= 1) return;

    resetView();

    currentIndex =
        (currentIndex + dir + filteredIndexes.length) % filteredIndexes.length;

    updatePopup();
}

function closePopup() {
    stopSlideshow();

    if (popup) popup.style.display = 'none';

    document.body.style.overflow = 'auto';
    resetView();
}

/* SLIDESHOW */

function toggleSlideshow() {
    slideshowInterval ? stopSlideshow() : startSlideshow();
}

function startSlideshow() {
    if (slideshowBtn) slideshowBtn.innerHTML = '&#10074;&#10074;';
    slideshowInterval = setInterval(() => changeImage(1), 4000);
}

function stopSlideshow() {
    clearInterval(slideshowInterval);
    slideshowInterval = null;

    if (slideshowBtn) slideshowBtn.innerHTML = '&#9658;';
}

/* EVENTS */

buttons.forEach(btn => {
    btn.onclick = (e) => {
        e.preventDefault();
        filterImages(btn.dataset.cat);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
});

if (slideshowBtn) {
    slideshowBtn.onclick = (e) => {
        e.stopPropagation();
        toggleSlideshow();
    };
}

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const closeBtn = document.querySelector('.close-btn');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');

if (prevBtn) {
    prevBtn.onclick = (e) => {
        e.stopPropagation();
        stopSlideshow();
        changeImage(-1);
    };
}

if (nextBtn) {
    nextBtn.onclick = (e) => {
        e.stopPropagation();
        stopSlideshow();
        changeImage(1);
    };
}

if (closeBtn) {
    closeBtn.onclick = closePopup;
}

if (zoomInBtn) {
    zoomInBtn.onclick = (e) => {
        e.stopPropagation();
        stopSlideshow();
        currentZoom += 0.5;
        updateZoom();
    };
}

if (zoomOutBtn) {
    zoomOutBtn.onclick = (e) => {
        e.stopPropagation();

        if (currentZoom > 1) {
            currentZoom -= 0.5;

            if (currentZoom <= 1) {
                resetView();
            } else {
                updateZoom();
            }
        }
    };
}

if (popupImg) {
    popupImg.onclick = (e) => {
        e.stopPropagation();

        if (currentZoom > 1) return;

        stopSlideshow();

        const rect = popupImg.getBoundingClientRect();

        if (e.clientX - rect.left < rect.width / 2) {
            changeImage(-1);
        } else {
            changeImage(1);
        }
    };
}

if (popup) {
    popup.onclick = (e) => {
        if (e.target === popup) closePopup();
    };
}

window.onkeydown = (e) => {
    if (e.key === 'Escape') closePopup();

    if (
        popup &&
        popup.style.display === 'flex' &&
        (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
    ) {
        stopSlideshow();
        changeImage(e.key === 'ArrowLeft' ? -1 : 1);
    }
};

/* INIT */

buildGallery();
filterImages('info');
initExtras();