const images = [
    { src: "./images/01.webp", text: "Tähän tulee ensimmäisen kuvan hiljainen ajatus." },
    { src: "./images/02.webp", text: "Tähän tulee toisen kuvan hiljainen ajatus." },
    { src: "./images/03.webp", text: "Tähän tulee kolmannen kuvan hiljainen ajatus." },
    { src: "./images/04.webp", text: "Tähän tulee neljännen kuvan hiljainen ajatus." },
    { src: "./images/05.webp", text: "Tähän tulee viidennen kuvan hiljainen ajatus." },
    { src: "./images/06.webp", text: "Tähän tulee kuudennen kuvan hiljainen ajatus." },
    { src: "./images/07.webp", text: "Tähän tulee seitsemännen kuvan hiljainen ajatus." },
    { src: "./images/08.webp", text: "Tähän tulee kahdeksannen kuvan hiljainen ajatus." },
    { src: "./images/09.webp", text: "Tähän tulee yhdeksännen kuvan hiljainen ajatus." },
    { src: "./images/10.webp", text: "Tähän tulee kymmenennen kuvan hiljainen ajatus." },
    { src: "./images/11.webp", text: "Tähän tulee yhdennentoista kuvan hiljainen ajatus." },
    { src: "./images/12.webp", text: "Tähän tulee kahdennentoista kuvan hiljainen ajatus." }
];

const intro = document.getElementById("intro");
const viewer = document.getElementById("viewer");
const ending = document.getElementById("ending");

const mainImage = document.getElementById("mainImage");
const textLayer = document.getElementById("textLayer");
const uiLayer = document.getElementById("uiLayer");

const ambientAudio = document.getElementById("ambientAudio");
const muteBtn = document.getElementById("muteBtn");

const nextZone = document.getElementById("nextZone");
const prevZone = document.getElementById("prevZone");
const restartBtn = document.getElementById("restartBtn");

let current = 0;
let secondRound = false;

let fullscreenStarted = false;
let firstInteractionConsumed = false;

let audioUnlocked = false;
let audioEnabled = true;

let viewerStarted = false;
let imageTimer = null;

/* 
   Preload first image early so that it is ready when viewer starts.
   This helps especially on mobile.
*/
const firstImagePreload = new Image();
firstImagePreload.src = images[0].src;

window.addEventListener("load", () => {
    setTimeout(() => {
        startViewer();
    }, 5200);
});

function startViewer() {
    if (viewerStarted) return;

    viewerStarted = true;
    current = 0;

    intro.classList.remove("active");
    viewer.classList.add("active");

    showImage(true);
}

document.body.addEventListener("click", (event) => {
    if (!firstInteractionConsumed) {
        firstInteractionConsumed = true;

        event.stopPropagation();

        if (!viewerStarted) {
            startViewer();
        }

        if (!fullscreenStarted) {
            fullscreenStarted = true;

            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        }

        unlockAudioSilently();

        /*
           Important:
           Do not advance to the next image on the first interaction.
           But make sure the first image is visible if the browser delayed it.
        */
        if (!mainImage.src) {
            current = 0;
            showImage(true);
        }

        return;
    }

    unlockAudioSilently();
});

function unlockAudioSilently() {
    if (!ambientAudio || audioUnlocked) return;

    ambientAudio.volume = 0;
    ambientAudio.muted = false;

    ambientAudio.play()
        .then(() => {
            audioUnlocked = true;
        })
        .catch(() => {});
}

function fadeAudioTo(targetVolume, duration) {
    if (!ambientAudio) return;

    const startVolume = ambientAudio.volume;
    const startTime = performance.now();

    function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);

        ambientAudio.volume =
            startVolume + (targetVolume - startVolume) * progress;

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}

function startSecondRoundAudio() {
    if (!ambientAudio || !audioEnabled) return;

    ambientAudio.muted = false;

    ambientAudio.play()
        .then(() => {
            audioUnlocked = true;
            fadeAudioTo(0.35, 5000);

            if (muteBtn) {
                muteBtn.innerText = "ääni pois";
            }
        })
        .catch(() => {});
}

function showImage(immediate = false) {
    const item = images[current];
    if (!item) return;

    if (imageTimer) {
        clearTimeout(imageTimer);
        imageTimer = null;
    }

    textLayer.style.opacity = 0;
    textLayer.innerHTML = "";

    mainImage.style.opacity = 0;

    const delay = immediate ? 80 : 2000;

    imageTimer = setTimeout(() => {
        /*
           Set onload before changing src.
           This is more reliable on mobile and with cached images.
        */
        mainImage.onload = () => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    mainImage.style.opacity = 1;
                });
            });
        };

        mainImage.onerror = () => {
            console.warn("Kuvaa ei voitu ladata:", item.src);
        };

        mainImage.src = item.src;
        mainImage.alt = item.text || "hiljainen yhteys - valokuva";

        /*
           If the image is already cached, onload may not always behave
           consistently across browsers. This ensures visibility anyway.
        */
        if (mainImage.complete && mainImage.naturalWidth > 0) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    mainImage.style.opacity = 1;
                });
            });
        }

        if (secondRound) {
            uiLayer.classList.remove("hidden");

            setTimeout(() => {
                textLayer.innerHTML = item.text;
                textLayer.style.opacity = 1;
            }, 2600);
        } else {
            uiLayer.classList.add("hidden");
        }
    }, delay);
}

function nextImage() {
    if (!firstInteractionConsumed) return;

    unlockAudioSilently();

    current++;

    if (current >= images.length) {
        if (!secondRound) {
            secondRound = true;
            current = 0;

            startSecondRoundAudio();
            showImage();
            return;
        }

        showEnding();
        return;
    }

    showImage();
}

function prevImage() {
    if (!firstInteractionConsumed) return;

    unlockAudioSilently();

    current--;

    if (current < 0) {
        current = 0;
    }

    showImage();
}

function showEnding() {
    textLayer.style.opacity = 0;
    textLayer.innerHTML = "";

    uiLayer.classList.add("hidden");

    if (ambientAudio) {
        fadeAudioTo(0, 4000);
    }

    mainImage.style.opacity = 0;

    setTimeout(() => {
        viewer.classList.remove("active");
        ending.classList.add("active");

        const endingVideo = document.getElementById("endingVideo");
        const endingText = document.getElementById("endingText");
        const credit = document.getElementById("credit");

        endingVideo.pause();
        endingVideo.currentTime = 0;
        endingVideo.style.opacity = 0;

        endingText.innerHTML = "";
        endingText.style.opacity = 0;

        restartBtn.style.opacity = 0;
        restartBtn.style.pointerEvents = "none";

        credit.style.opacity = 0;

        setTimeout(() => {
            endingVideo.play().catch(() => {});

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    endingVideo.style.opacity = 0.45;
                });
            });
        }, 300);

        setTimeout(() => {
            endingText.innerHTML = "yhteys syntyy joskus hiljaa";

            setTimeout(() => {
                endingText.style.opacity = 1;
            }, 50);
        }, 6000);

        setTimeout(() => {
            credit.style.opacity = 1;
        }, 11500);

        setTimeout(() => {
            restartBtn.style.opacity = 1;
            restartBtn.style.pointerEvents = "auto";
        }, 14500);
    }, 2000);
}

if (muteBtn && ambientAudio) {
    muteBtn.innerText = "ääni pois";

    muteBtn.addEventListener("click", (event) => {
        event.stopPropagation();

        audioEnabled = !audioEnabled;

        if (audioEnabled) {
            ambientAudio.play().catch(() => {});
            fadeAudioTo(0.35, 1200);
            muteBtn.innerText = "ääni pois";
        } else {
            fadeAudioTo(0, 1200);
            muteBtn.innerText = "ääni päälle";
        }
    });
}

if (nextZone) {
    nextZone.addEventListener("click", nextImage);
}

if (prevZone) {
    prevZone.addEventListener("click", prevImage);
}

if (restartBtn) {
    restartBtn.addEventListener("click", (event) => {
        event.stopPropagation();

        current = 0;
        secondRound = false;

        ending.classList.remove("active");
        viewer.classList.add("active");

        uiLayer.classList.add("hidden");

        textLayer.innerHTML = "";
        textLayer.style.opacity = 0;

        mainImage.src = "";
        mainImage.style.opacity = 0;

        if (ambientAudio) {
            ambientAudio.pause();
            ambientAudio.currentTime = 0;
            ambientAudio.volume = 0;
            audioUnlocked = false;
        }

        firstInteractionConsumed = false;
        fullscreenStarted = false;
        viewerStarted = true;

        showImage(true);
    });
}