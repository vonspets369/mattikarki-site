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

let filteredIndexes = [];
let currentIndex = 0;
let currentCategory = 'info';

/* ===============================
   GALLERIAN RAKENNUS
================================ */

function buildGallery() {
    if (mainGallery) mainGallery.innerHTML = '';
    if (infoGallery) infoGallery.innerHTML = '';

    const fragMain = document.createDocumentFragment();
    const fragInfo = document.createDocumentFragment();

    photoData.forEach((photo, index) => {
        const img = document.createElement('img');
        img.src = photo.src;
        img.alt = photo.title;
        img.loading = "lazy";
        img.decoding = "async";
        img.className = "gallery-img";
        img.dataset.index = index;
        img.dataset.cat = photo.cat;

        // 🔥 Tarkistetaan onko kuva olemassa, jos ei, poistetaan se
        img.onerror = function() {
            this.remove();
            updateFilteredIndexes();
        };

        img.onclick = (e) => {
            e.preventDefault();
            openImage(index);
        };

        (photo.cat === 'info' ? fragInfo : fragMain).appendChild(img);
    });

    if (infoGallery) infoGallery.appendChild(fragInfo);
    if (mainGallery) mainGallery.appendChild(fragMain);
}

/* ===============================
   SUODATUS
================================ */

function filterImages(cat) {
    currentCategory = cat;

    if (cat === 'info') {
        if (mainGallery) mainGallery.style.display = 'none';
        if (aboutSection) aboutSection.style.display = 'block';
    } else {
        if (mainGallery) mainGallery.style.display = 'grid';
        if (aboutSection) aboutSection.style.display = 'none';

        document.querySelectorAll('#gallery .gallery-img').forEach(img => {
            const show = (cat === 'all' || img.dataset.cat === cat);
            img.style.display = show ? 'block' : 'none';
        });
    }

    buttons.forEach(btn =>
        btn.classList.toggle('active', btn.dataset.cat === cat)
    );

    updateFilteredIndexes();
}

function updateFilteredIndexes() {
    const selector =
        currentCategory === 'info'
            ? '#info-gallery .gallery-img'
            : '#gallery .gallery-img';

    filteredIndexes = Array.from(document.querySelectorAll(selector))
        .filter(img => img.style.display !== 'none')
        .map(img => parseInt(img.dataset.index));
}

/* ===============================
   PRELOAD
================================ */

function preloadImage(index) {
    const src = photoData[index]?.src;
    if (!src) return;

    const img = new Image();
    img.src = src;
}

/* ===============================
   LIGHTBOX
================================ */

function openImage(index) {
    currentIndex = filteredIndexes.indexOf(index);
    if (currentIndex === -1) return;

    updatePopup();
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function updatePopup() {
    const d = photoData[filteredIndexes[currentIndex]];
    if (!d) return;

    popupImg.style.opacity = "0";
    popupImg.src = d.src;
    popupImg.alt = d.title;

    commentBox.innerHTML = `<p>${d.title} &nbsp; | &nbsp; ${d.date}</p>`;

    popupImg.onload = () => { popupImg.style.opacity = "1"; };
    if (popupImg.complete) popupImg.style.opacity = "1";

    // 🔥 preload seuraava + edellinen
    if (filteredIndexes.length > 1) {
        const next =
            filteredIndexes[(currentIndex + 1) % filteredIndexes.length];
        const prev =
            filteredIndexes[(currentIndex - 1 + filteredIndexes.length) % filteredIndexes.length];

        preloadImage(next);
        preloadImage(prev);
    }
}

function changeImage(dir) {
    if (filteredIndexes.length <= 1) return;

    currentIndex =
        (currentIndex + dir + filteredIndexes.length) % filteredIndexes.length;

    updatePopup();
}

function closePopup() {
    popup.style.display = 'none';
    document.body.style.overflow = 'auto';
    popupImg.src = "";
}

/* ===============================
   TAPAHTUMAT
================================ */

document.getElementById('prev-btn').onclick = (e) => {
    e.stopPropagation();
    changeImage(-1);
};

document.getElementById('next-btn').onclick = (e) => {
    e.stopPropagation();
    changeImage(1);
};

document.querySelector('.close-btn').onclick = (e) => {
    e.stopPropagation();
    closePopup();
};

popupImg.onclick = (e) => {
    e.stopPropagation();

    const rect = popupImg.getBoundingClientRect();
    const x = e.clientX - rect.left;

    if (x < rect.width / 2) {
        changeImage(-1);
    } else {
        changeImage(1);
    }
};

popup.onclick = (e) => {
    if (e.target === popup) closePopup();
};

window.onkeydown = (e) => {
    if (e.key === "Escape") closePopup();

    if (popup.style.display === 'flex') {
        if (e.key === "ArrowLeft") changeImage(-1);
        if (e.key === "ArrowRight") changeImage(1);
    }
};

buttons.forEach(btn => {
    btn.onclick = (e) => {
        e.preventDefault();
        filterImages(btn.dataset.cat);
    };
});

/* ===============================
   KÄYNNISTYS
================================ */

buildGallery();
filterImages('info');