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

// Check for saved user preference
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
}

themeBtn.onclick = () => {
    document.body.classList.toggle('light-mode');
    
    // Save preference
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
    if (lockLabel) {
        lockLabel.innerText = '🔒';
        lockLabel.style.opacity = '1';
    }

    setTimeout(() => {
        if (lockLabel) {
            // Aloitetaan 5 sekunnin häivytys
            lockLabel.style.transition = 'opacity 2.5s ease';
            lockLabel.style.opacity = '0';

            setTimeout(() => {
                lockLabel.innerText = 'Extras for cool visitors';
                lockLabel.style.cursor = 'pointer';
                // Häivytetään uusi teksti takaisin näkyviin
                lockLabel.style.opacity = '1';
                
                // Lisätään animaatioluokka huomiota varten
                const parentBtn = lockLabel.closest('button');
                if (parentBtn) parentBtn.classList.add('reveal-anim');
            }, 2500); // Puolivälissä vaihdetaan teksti (2.5s + 2.5s = 5s)
        }
    }, 60000);
}

/* ==================================
    GALLERIAN RAKENNUS (LAZY LOADING)
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

function updateButtons(activeCat) {

    const allButtons = document.querySelectorAll('[data-cat]');

    allButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === activeCat);
    });
}


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

    updateButtons(cat);
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
    LIGHTBOX (NOPEUTETTU VERSIO)
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

    // 1. Nollataan koordinaatit ja skaalaus
    translateX = 0;
    translateY = 0;
    popupImg.style.transform = `translate(0px, 0px) scale(1)`; 
    popupImg.src = data.src;
    popupImg.style.opacity = "1";

    const counter = `${currentIndex + 1} / ${filteredIndexes.length}`;

    // 2. Sijoitetaan info-nappi heti vuosiluvun jälkeen
    commentBox.innerHTML = `
        <div style="text-align: center;">
            <p style="margin: 0; display: inline-block;">
                ${data.title || ''} &nbsp; | &nbsp; ${data.date || ''}
                <button id="info-toggle-btn" 
                        style="color: inherit; background: none; border: none; padding: 0 0 0 8px; font-size: 11px; cursor: pointer; opacity: 0.7; font-family: inherit; vertical-align: middle;" 
                        title="Show EXIF">ℹ</button>
                <span style="margin-left: 40px;">${counter}</span>
            </p>
            <div id="exif-display" style="display: none; margin-top: 10px; color: inherit;">
                <p style="font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">${data.exif || 'No EXIF data available'}</p>
            </div>
        </div>
    `;

    // 3. Tapahtumankuuntelija infonapille
    document.getElementById('info-toggle-btn').onclick = (e) => {
        e.stopPropagation();
        const display = document.getElementById('exif-display');
        display.style.display = display.style.display === 'none' ? 'block' : 'none';
    };
}



function closePopup() {
    stopSlideshow();
    popup.style.display = 'none';
    document.body.style.overflow = 'auto';
    // Varmistetaan että exif on piilossa seuraavalla kerralla
    const exifDiv = document.getElementById('exif-display');
    if(exifDiv) exifDiv.style.display = 'none';
}

function changeImage(direction) {

    if (filteredIndexes.length <= 1) return;

    currentIndex =
        (currentIndex + direction + filteredIndexes.length) %
        filteredIndexes.length;

    updatePopup();
}

function closePopup() {

    stopSlideshow();
    popup.style.display = 'none';
    document.body.style.overflow = 'auto';
}

/* ==================================
    SLIDESHOW
================================== */

function toggleSlideshow() {
    slideshowInterval ? stopSlideshow() : startSlideshow();
}

function startSlideshow() {
    slideshowBtn.innerHTML = '&#10074;&#10074;';
    slideshowInterval = setInterval(() => changeImage(1), 4000);
}

function stopSlideshow() {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
    slideshowBtn.innerHTML = '&#9658;';
}

/* ==================================
    EVENT LISTENERS
================================== */

catButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        filterImages(btn.dataset.cat);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

mainGallery.addEventListener('click', (e) => {
    if (e.target.classList.contains('gallery-img')) {
        openImage(Number(e.target.dataset.index));
    }
});

infoGallery.addEventListener('click', (e) => {
    if (e.target.classList.contains('gallery-img')) {
        openImage(Number(e.target.dataset.index));
    }
});

popupImg.addEventListener('click', (e) => {
    if (!isDragging) {
        // Lasketaan klikkauksen kohta suhteessa kuvan leveyteen
        const rect = popupImg.getBoundingClientRect();
        const x = e.clientX - rect.left; // Klikkauskohta kuvan sisällä
        
        if (x < rect.width / 2) {
            // Vasen puoli -> edellinen kuva
            changeImage(-1);
        } else {
            // Oikea puoli -> seuraava kuva
            changeImage(1);
        }
    }
});

slideshowBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSlideshow();
});

document.getElementById('zoom-in').onclick = (e) => {
    e.stopPropagation();
    const currentScale = parseFloat(popupImg.style.transform.split('scale(')[1]?.replace(')', '') || 1);
    popupImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale + 0.2})`;
};

document.getElementById('zoom-out').onclick = (e) => {
    e.stopPropagation();
    const currentScale = parseFloat(popupImg.style.transform.split('scale(')[1]?.replace(')', '') || 1);
    if (currentScale > 0.4) {
        popupImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale - 0.2})`;
    }
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
    if (e.cancelable) e.preventDefault();
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

document.getElementById('prev-btn').onclick = () => {
    stopSlideshow();
    changeImage(-1);
};

document.getElementById('next-btn').onclick = () => {
    stopSlideshow();
    changeImage(1);
};

popup.addEventListener('click', (e) => {
    if (e.target === popup) closePopup();
});

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