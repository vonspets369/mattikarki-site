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

fsBtn.onclick = (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Virhe: ${err.message}`);
        });
        fsBtn.innerHTML = '❐'; 
    } else {
        document.exitFullscreen();
        fsBtn.innerHTML = '⛶'; 
    }
};

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        fsBtn.innerHTML = '⛶';
    }
});

const catButtons = document.querySelectorAll('.categories button');
const lockLabel = document.getElementById('lock-label');
const themeBtn = document.getElementById('theme-toggle');

if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
}

themeBtn.onclick = () => {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
    } else {
        localStorage.setItem('theme', 'dark');
    }
};

/* ==================================
    STATE
================================== */

let currentCategory = 'info';
let filteredIndexes = [];
let currentIndex = 0;
let slideshowInterval = null;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;

/* ==================================
    EXTRAS (60s viive & Lukko)
================================== */

function initExtras() {
    const extrasBtn = document.querySelector('button[data-cat="extras"]');
    if (lockLabel) {
        lockLabel.innerText = '🔒';
        lockLabel.style.opacity = '1';
        if (extrasBtn) extrasBtn.style.pointerEvents = 'none';
    }

    setTimeout(() => {
        if (lockLabel) {
            lockLabel.style.transition = 'all 2.5s ease';
            lockLabel.style.opacity = '0';

            setTimeout(() => {
                lockLabel.innerText = 'Extras for cool visitors';
                if (extrasBtn) {
                    extrasBtn.style.pointerEvents = 'auto';
                    extrasBtn.style.cursor = 'pointer';
                    extrasBtn.classList.add('reveal-anim');
                }
                lockLabel.style.opacity = '1';
            }, 2500);
        }
    }, 60000);
}

/* ==================================
    GALLERIAN RAKENNUS
================================== */

function buildGallery() {
    const fragMain = document.createDocumentFragment();
    const fragInfo = document.createDocumentFragment();

    photoData.forEach((photo, index) => {
        const img = document.createElement('img');
        img.src = photo.src;
        img.alt = photo.title || '';
        img.loading = "lazy"; 
        img.className = "gallery-img";
        img.dataset.index = index;
        img.dataset.cat = photo.cat;
        (photo.cat === 'info' ? fragInfo : fragMain).appendChild(img);
    });

    infoGallery.appendChild(fragInfo);
    mainGallery.appendChild(fragMain);
}

/* ==================================
    KATEGORIAHALLINTA
================================== */

function filterImages(cat) {
    if (cat === 'extras' && lockLabel && lockLabel.innerText === '🔒') return;

    currentCategory = cat;
    stopSlideshow();

    if (cat === 'info') {
        mainGallery.style.display = 'none';
        aboutSection.style.display = 'block';
    } else {
        mainGallery.style.display = 'grid';
        aboutSection.style.display = 'none';

        document.querySelectorAll('#gallery .gallery-img').forEach(img => {
            const photoCat = img.dataset.cat;
            if (cat === 'curated') {
                img.style.display = (photoCat !== 'info' && photoCat !== 'extras') ? 'block' : 'none';
            } else {
                img.style.display = (photoCat === cat) ? 'block' : 'none';
            }
        });
    }

    document.querySelectorAll('[data-cat]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === cat);
    });
    updateFilteredIndexes();
}

function updateFilteredIndexes() {
    const selector = currentCategory === 'info' ? '#info-gallery .gallery-img' : '#gallery .gallery-img';
    filteredIndexes = Array.from(document.querySelectorAll(selector))
        .filter(img => img.style.display !== 'none')
        .map(img => Number(img.dataset.index));
}

/* ==================================
    LIGHTBOX & EXIF & STORY
================================== */

function openImage(index) {
    const found = filteredIndexes.indexOf(index);
    if (found === -1) return;
    currentIndex = found;
    updatePopup();
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function updatePopup() {
    const data = photoData[filteredIndexes[currentIndex]];
    if (!data) return;

    translateX = 0;
    translateY = 0;
    popupImg.style.transform = `translate(0px, 0px) scale(1)`; 
    popupImg.style.opacity = "0"; 
    popupImg.src = data.src;

    const counter = `${currentIndex + 1} / ${filteredIndexes.length}`;
    const hasStory = !!data.description;

    commentBox.innerHTML = `
        <div style="text-align: center;">
            <p style="margin: 0; display: inline-block;">
                ${data.title || ''} &nbsp; | &nbsp; ${data.date || ''}
                
                ${hasStory ? `<button id="story-toggle-btn" style="color: inherit; background: none; border: none; padding: 0 8px; font-size: 14px; cursor: pointer; opacity: 0.7;" title="Show Story">🖋</button>` : ''}
                
                <button id="info-toggle-btn" style="color: inherit; background: none; border: none; padding: 0 8px; font-size: 11px; cursor: pointer; opacity: 0.7;" title="Show EXIF">ℹ</button>
                
                <span style="margin-left: 40px;">${counter}</span>
            </p>

            <div id="story-display" style="display: none; margin-top: 10px; max-width: 500px; margin-left: auto; margin-right: auto;">
                <p style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase; line-height: 1.6; color: inherit; margin: 0;">${data.description || ''}</p>
            </div>

            <div id="exif-display" style="display: none; margin-top: 10px; color: inherit;">
                <p id="exif-data-text" style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Loading EXIF...</p>
            </div>
        </div>
    `;

    popupImg.onload = function() {
        popupImg.style.opacity = "1";
        
        EXIF.getData(popupImg, function() {
            const f = EXIF.getTag(this, "FNumber");
            const s = EXIF.getTag(this, "ExposureTime");
            const iso = EXIF.getTag(this, "ISOSpeedRatings");
            const model = EXIF.getTag(this, "Model");

            let exifString = "";
            if (f || s || iso) {
                const shutter = s ? (s < 1 ? `1/${Math.round(1/s)}s` : `${s}s`) : "";
                const aperture = f ? `f/${f}` : "";
                const camera = model ? `${model}` : "";
                exifString = `${camera} &nbsp; | &nbsp; ${aperture} &nbsp; | &nbsp; ${shutter} &nbsp; | &nbsp; ISO ${iso}`;
            } else {
                exifString = "No EXIF data found";
            }
            const target = document.getElementById('exif-data-text');
            if(target) target.innerHTML = exifString;
        });
    };

    const storyBtn = document.getElementById('story-toggle-btn');
    if (storyBtn) {
        storyBtn.onclick = (e) => {
            e.stopPropagation();
            const storyDiv = document.getElementById('story-display');
            const exifDiv = document.getElementById('exif-display');
            storyDiv.style.display = storyDiv.style.display === 'none' ? 'block' : 'none';
            if (storyDiv.style.display === 'block') exifDiv.style.display = 'none';
        };
    }

    document.getElementById('info-toggle-btn').onclick = (e) => {
        e.stopPropagation();
        const exifDiv = document.getElementById('exif-display');
        const storyDiv = document.getElementById('story-display');
        exifDiv.style.display = exifDiv.style.display === 'none' ? 'block' : 'none';
        if (exifDiv.style.display === 'block' && storyDiv) storyDiv.style.display = 'none';
    };
}

function closePopup() {
    stopSlideshow();
    popup.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function changeImage(direction) {
    if (filteredIndexes.length <= 1) return;
    currentIndex = (currentIndex + direction + filteredIndexes.length) % filteredIndexes.length;
    updatePopup();
}

/* ==================================
    SLIDESHOW & EVENTS
================================== */

function toggleSlideshow() { slideshowInterval ? stopSlideshow() : startSlideshow(); }
function startSlideshow() {
    slideshowBtn.innerHTML = '&#10074;&#10074;';
    slideshowInterval = setInterval(() => changeImage(1), 4000);
}
function stopSlideshow() {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
    slideshowBtn.innerHTML = '&#9658;';
}

catButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        filterImages(btn.dataset.cat);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

[mainGallery, infoGallery].forEach(gal => {
    gal.addEventListener('click', (e) => {
        if (e.target.classList.contains('gallery-img')) openImage(Number(e.target.dataset.index));
    });
});

popupImg.addEventListener('click', (e) => {
    if (!isDragging) {
        const rect = popupImg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        changeImage(x < rect.width / 2 ? -1 : 1);
    }
});

popupImg.addEventListener('mousemove', (e) => {
    const rect = popupImg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const scale = parseFloat(popupImg.style.transform.split('scale(')[1]?.replace(')', '') || 1);
    if (scale > 1) {
        popupImg.style.cursor = 'move';
    } else {
        popupImg.style.cursor = (x < rect.width / 2) ? 'w-resize' : 'e-resize';
    }
});

slideshowBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSlideshow(); });

// Zoom & Drag
document.getElementById('zoom-in').onclick = (e) => {
    e.stopPropagation();
    const currentScale = parseFloat(popupImg.style.transform.split('scale(')[1]?.replace(')', '') || 1);
    popupImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale + 0.2})`;
};

document.getElementById('zoom-out').onclick = (e) => {
    e.stopPropagation();
    const currentScale = parseFloat(popupImg.style.transform.split('scale(')[1]?.replace(')', '') || 1);
    if (currentScale > 0.4) popupImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale - 0.2})`;
};

const startDrag = (e) => {
    const scale = parseFloat(popupImg.style.transform.split('scale(')[1]?.replace(')', '') || 1);
    if (scale <= 1) return;
    isDragging = true;
    startX = (e.pageX || e.touches[0].pageX) - translateX;
    startY = (e.pageY || e.touches[0].pageY) - translateY;
    popupImg.style.cursor = 'grabbing';
};

const moveDrag = (e) => {
    if (!isDragging) return;
    translateX = (e.pageX || e.touches[0].pageX) - startX;
    translateY = (e.pageY || e.touches[0].pageY) - startY;
    const scale = parseFloat(popupImg.style.transform.split('scale(')[1]?.replace(')', '') || 1);
    popupImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
};

const endDrag = () => {
    setTimeout(() => { isDragging = false; }, 100);
    popupImg.style.cursor = 'pointer';
};

popupImg.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', moveDrag);
window.addEventListener('mouseup', endDrag);
popupImg.addEventListener('touchstart', startDrag);
window.addEventListener('touchmove', moveDrag, { passive: false });
window.addEventListener('touchend', endDrag);

document.getElementById('prev-btn').onclick = () => { stopSlideshow(); changeImage(-1); };
document.getElementById('next-btn').onclick = () => { stopSlideshow(); changeImage(1); };
popup.addEventListener('click', (e) => { if (e.target === popup) closePopup(); });
document.querySelector('.close-btn').onclick = closePopup;

document.addEventListener('keydown', (e) => {
    if (popup.style.display === 'flex') {
        if (e.key === "Escape") closePopup();
        if (e.key === "ArrowRight") changeImage(1);
        if (e.key === "ArrowLeft") changeImage(-1);
    }
});

/* ==================================
    INIT
================================== */
buildGallery();
filterImages('info');
initExtras();