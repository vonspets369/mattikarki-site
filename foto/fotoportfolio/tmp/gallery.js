/* ===============================
   ELEMENTIT
================================ */
const mainGallery = document.getElementById('gallery');
const infoGallery = document.getElementById('info-gallery');
const aboutSection = document.getElementById('about-content');
const popup = document.getElementById('popup');
const popupImg = document.getElementById('popup-img');
const commentBox = document.getElementById('comment-box');
const buttons = document.querySelectorAll('[data-cat]');
const slideshowBtn = document.getElementById('slideshow-btn');
const fsBtn = document.getElementById('fullscreen-btn');
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

/* ===============================
   FULLSCREEN
================================ */
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
    if (!document.fullscreenElement && fsBtn) fsBtn.innerHTML = '⛶';
});

/* ===============================
   STATE
============================== */
let filteredIndexes = [];
let currentIndex = 0;
let currentCategory = 'info';
let slideshowInterval = null; 

let currentZoom = 1;
let isPanning = false;
let startX, startY;
let translateX = 0, translateY = 0;

/* ===============================
   GALLERIA & SUODATUS
================================ */
function buildGallery() {
    if (mainGallery) mainGallery.innerHTML = '';
    if (infoGallery) infoGallery.innerHTML = '';
    const fragMain = document.createDocumentFragment();
    const fragInfo = document.createDocumentFragment();

    photoData.forEach((photo, index) => {
        const img = document.createElement('img');
        img.src = photo.src;
        img.className = "gallery-img";
        img.dataset.index = index;
        img.dataset.cat = photo.cat;
        img.onclick = () => openImage(index);
        (photo.cat === 'info' ? fragInfo : fragMain).appendChild(img);
    });
    if (infoGallery) infoGallery.appendChild(fragInfo);
    if (mainGallery) mainGallery.appendChild(fragMain);
}

function filterImages(cat) {
    currentCategory = cat;
    stopSlideshow(); 
    if (cat === 'info') {
        if (mainGallery) mainGallery.style.display = 'none';
        if (aboutSection) aboutSection.style.display = 'block';
    } else {
        if (mainGallery) mainGallery.style.display = 'grid';
        if (aboutSection) aboutSection.style.display = 'none';
        document.querySelectorAll('#gallery .gallery-img').forEach(img => {
            img.style.display = (cat === 'all' || img.dataset.cat === cat) ? 'block' : 'none';
        });
    }
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.cat === cat));
    updateFilteredIndexes();
}

function updateFilteredIndexes() {
    const selector = currentCategory === 'info' ? '#info-gallery .gallery-img' : '#gallery .gallery-img';
    filteredIndexes = Array.from(document.querySelectorAll(selector))
        .filter(img => img.style.display !== 'none')
        .map(img => parseInt(img.dataset.index));
}

/* ===============================
   ZOOM & PANNING (SIIRTO)
================================ */
function updateZoom() {
    if (popupImg) {
        popupImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
    }
}

function resetView() {
    currentZoom = 1; translateX = 0; translateY = 0;
    if (popupImg) {
        popupImg.style.cursor = 'grab';
        updateZoom();
    }
}

// Panning-tapahtumat
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

/* ===============================
   LIGHTBOX TOIMINNOT
================================ */
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

    popupImg.style.opacity = "0";
    popupImg.src = d.src;

    const hasStory = !!d.description;
    const hasExif = !!d.exif;

    commentBox.innerHTML = `
        <div style="text-align:center;">
            <p>
                ${d.title} &nbsp; | &nbsp; ${d.date}

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

    // napit toimintaan
    setTimeout(() => {
        const storyBtn = document.getElementById("story-btn");
        const exifBtn = document.getElementById("exif-btn");

        if (storyBtn) {
            storyBtn.onclick = () => {
                const box = document.getElementById("story-box");
                box.style.display = box.style.display === "none" ? "block" : "none";
            };
        }

        if (exifBtn) {
            exifBtn.onclick = () => {
                const box = document.getElementById("exif-box");
                box.style.display = box.style.display === "none" ? "block" : "none";
            };
        }
    }, 0);

    popupImg.onload = () => popupImg.style.opacity = "1";
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

/* ===============================
   SLIDESHOW
================================ */
function toggleSlideshow() { slideshowInterval ? stopSlideshow() : startSlideshow(); }
function startSlideshow() {
    if (slideshowBtn) slideshowBtn.innerHTML = '&#10074;&#10074;';
    slideshowInterval = setInterval(() => changeImage(1), 4000); 
}
function stopSlideshow() {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
    if (slideshowBtn) slideshowBtn.innerHTML = '&#9658;';
}

/* ===============================
   KLIKKAUKSET
================================ */
if (slideshowBtn) slideshowBtn.onclick = (e) => { e.stopPropagation(); toggleSlideshow(); };
document.getElementById('prev-btn').onclick = (e) => { e.stopPropagation(); stopSlideshow(); changeImage(-1); };
document.getElementById('next-btn').onclick = (e) => { e.stopPropagation(); stopSlideshow(); changeImage(1); };
document.querySelector('.close-btn').onclick = closePopup;

document.getElementById('zoom-in').onclick = (e) => {
    e.stopPropagation(); stopSlideshow();
    currentZoom += 0.5; updateZoom();
};
document.getElementById('zoom-out').onclick = (e) => {
    e.stopPropagation();
    if (currentZoom > 1) {
        currentZoom -= 0.5;
        currentZoom <= 1 ? resetView() : updateZoom();
    }
};

popupImg.onclick = (e) => {
    e.stopPropagation();
    if (currentZoom > 1) return; 
    stopSlideshow(); 
    const rect = popupImg.getBoundingClientRect();
    (e.clientX - rect.left < rect.width / 2) ? changeImage(-1) : changeImage(1);
};

popup.onclick = (e) => { if (e.target === popup) closePopup(); };
window.onkeydown = (e) => {
    if (e.key === "Escape") closePopup();
    if (popup.style.display === 'flex' && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        stopSlideshow(); changeImage(e.key === "ArrowLeft" ? -1 : 1);
    }
};

buttons.forEach(btn => btn.onclick = (e) => { e.preventDefault(); filterImages(btn.dataset.cat); });

buildGallery();
filterImages('info');