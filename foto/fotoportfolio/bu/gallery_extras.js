/* ==================================
    ELEMENTIT
================================== */

const mainGallery = document.getElementById('gallery');
const infoGallery = document.getElementById('info-gallery');
const aboutSection = document.getElementById('about-content');
const popup = document.getElementById('popup');
const popupImg = document.getElementById('popup-img');
const commentBox = document.getElementById('comment-box');
const slideshowBtn = document.getElementById('slideshow-btn');
const fsBtn = document.getElementById('fullscreen-btn');

const catButtons = document.querySelectorAll('.categories button');
const lockLabel = document.getElementById('lock-label');
const themeBtn = document.getElementById('theme-toggle');

/* ==================================
    THEME
================================== */

if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
}

if (themeBtn) {
    themeBtn.onclick = () => {
        document.body.classList.toggle('light-mode');

        if (document.body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.setItem('theme', 'dark');
        }
    };
}

/* ==================================
    FULLSCREEN
================================== */

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

/* ==================================
    STATE
================================== */

let currentCategory = 'info';
let filteredIndexes = [];
let currentIndex = 0;
let slideshowInterval = null;

let currentZoom = 1;
let isPanning = false;
let startX, startY;
let translateX = 0, translateY = 0;

/* ==================================
    EXTRAS LOCK
================================== */

function initExtras() {
    const extrasBtn = document.querySelector('button[data-cat="extras"]');

    if (lockLabel) {
        lockLabel.innerText = '🔒';
        lockLabel.style.opacity = '1';
        lockLabel.style.cursor = 'default';
    }

    if (extrasBtn) {
        extrasBtn.style.pointerEvents = 'none';
        extrasBtn.style.cursor = 'default';
    }

    setTimeout(() => {
        if (!lockLabel) return;

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

/* ==================================
    GALLERIA
================================== */

function buildGallery() {
    if (mainGallery) mainGallery.innerHTML = '';
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
    if (mainGallery) mainGallery.appendChild(fragMain);
}

/* ==================================
    FILTER
================================== */

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
            const photoCat = img.dataset.cat;

            if (cat === 'curated') {
                img.style.display = photoCat === 'curated' ? 'block' : 'none';
            } else if (cat === 'extras') {
                img.style.display = photoCat === 'extras' ? 'block' : 'none';
            } else {
                img.style.display = photoCat === cat ? 'block' : 'none';
            }
        });
    }

    catButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === cat);
    });

    updateFilteredIndexes();
}

function updateFilteredIndexes() {
    const selector = currentCategory === 'info'
        ? '#info-gallery .gallery-img'
        : '#gallery .gallery-img';

    filteredIndexes = Array.from(document.querySelectorAll(selector))
        .filter(img => img.style.display !== 'none')
        .map(img => Number(img.dataset.index));
}

/* ==================================
    ZOOM & PAN
================================== */

function updateZoom() {
    if (popupImg) {
        popupImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
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

const startPan = (e) => {
    if (currentZoom <= 1) return;

    isPanning = true;

    const x = e.pageX || e.touches[0].pageX;
    const y = e.pageY || e.touches[0].pageY;

    startX = x - translateX;
    startY = y - translateY;

    popupImg.style.cursor = 'grabbing';
};

const movePan = (e) => {
    if (!isPanning) return;
    if (e.cancelable) e.preventDefault();

    const x = e.pageX || e.touches[0].pageX;
    const y = e.pageY || e.touches[0].pageY;

    translateX = x - startX;
    translateY = y - startY;

    updateZoom();
};

const endPan = () => {
    isPanning = false;
    if (popupImg) popupImg.style.cursor = currentZoom > 1 ? 'grab' : 'pointer';
};

popupImg.addEventListener('mousedown', startPan);
window.addEventListener('mousemove', movePan);
window.addEventListener('mouseup', endPan);

popupImg.addEventListener('touchstart', startPan);
window.addEventListener('touchmove', movePan, { passive: false });
window.addEventListener('touchend', endPan);

/* ==================================
    LIGHTBOX
================================== */

function openImage(index) {
    const found = filteredIndexes.indexOf(index);
    if (found === -1) return;

    currentIndex = found;
    resetView();
    updatePopup();

    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function updatePopup() {
    const d = photoData[filteredIndexes[currentIndex]];
    if (!d) return;

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

    setTimeout(() => {
        const storyBtn = document.getElementById('story-btn');
        const exifBtn = document.getElementById('exif-btn');

        if (storyBtn) {
            storyBtn.onclick = (e) => {
                e.stopPropagation();

                const storyBox = document.getElementById('story-box');
                const exifBox = document.getElementById('exif-box');

                storyBox.style.display = storyBox.style.display === 'none' ? 'block' : 'none';
                if (exifBox) exifBox.style.display = 'none';
            };
        }

        if (exifBtn) {
            exifBtn.onclick = (e) => {
                e.stopPropagation();

                const exifBox = document.getElementById('exif-box');
                const storyBox = document.getElementById('story-box');

                exifBox.style.display = exifBox.style.display === 'none' ? 'block' : 'none';
                if (storyBox) storyBox.style.display = 'none';
            };
        }
    }, 0);

    popupImg.onload = () => {
        popupImg.style.opacity = '1';
    };
}

function changeImage(dir) {
    if (filteredIndexes.length <= 1) return;

    resetView();
    currentIndex = (currentIndex + dir + filteredIndexes.length) % filteredIndexes.length;
    updatePopup();
}

function closePopup() {
    stopSlideshow();
    popup.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetView();
}

/* ==================================
    SLIDESHOW
================================== */

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

/* ==================================
    EVENTS
================================== */

catButtons.forEach(btn => {
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

document.getElementById('prev-btn').onclick = (e) => {
    e.stopPropagation();
    stopSlideshow();
    changeImage(-1);
};

document.getElementById('next-btn').onclick = (e) => {
    e.stopPropagation();
    stopSlideshow();
    changeImage(1);
};

document.querySelector('.close-btn').onclick = closePopup;

document.getElementById('zoom-in').onclick = (e) => {
    e.stopPropagation();
    stopSlideshow();

    currentZoom += 0.5;
    updateZoom();
};

document.getElementById('zoom-out').onclick = (e) => {
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

popup.onclick = (e) => {
    if (e.target === popup) closePopup();
};

window.onkeydown = (e) => {
    if (e.key === 'Escape') closePopup();

    if (popup.style.display === 'flex' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        stopSlideshow();
        changeImage(e.key === 'ArrowLeft' ? -1 : 1);
    }
};

/* ==================================
    INIT
================================== */

buildGallery();
filterImages('info');
initExtras();