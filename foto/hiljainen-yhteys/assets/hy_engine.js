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

let current = 0;
let secondRound = false;

let fullscreenStarted = false;
let firstInteractionConsumed = false;

let audioUnlocked = false;
let audioEnabled = true;

window.addEventListener("load", () => {
    showOpeningQuestion();
});

function showOpeningQuestion() {
    const title = document.querySelector(".title");

    title.innerHTML = "hiljainen yhteytesi?";
    title.style.animation = "none";
    title.style.transition = "opacity 2s ease";
    title.style.opacity = 0;

    setTimeout(() => {
        title.style.opacity = 1;
    }, 300);

    setTimeout(() => {
        title.style.opacity = 0;
    }, 3600);

    setTimeout(() => {
        intro.classList.remove("active");
        viewer.classList.add("active");
        showImage();
    }, 6200);
}

document.body.addEventListener("click", (event) => {
    if (!firstInteractionConsumed) {
        firstInteractionConsumed = true;

        event.stopPropagation();

        if (!fullscreenStarted) {
            fullscreenStarted = true;

            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
        }

        unlockAudioSilently();
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

function showImage() {
    const item = images[current];

    textLayer.style.opacity = 0;
    textLayer.innerHTML = "";

    mainImage.style.opacity = 0;

    setTimeout(() => {
        mainImage.src = item.src;

        mainImage.onload = () => {
            setTimeout(() => {
                mainImage.style.opacity = 1;
            }, 300);
        };

        if (secondRound) {
            uiLayer.classList.remove("hidden");

            setTimeout(() => {
                textLayer.innerHTML = item.text;
                textLayer.style.opacity = 1;
            }, 2600);
        } else {
            uiLayer.classList.add("hidden");
        }
    }, 2000);
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
        const restartBtn = document.getElementById("restartBtn");
        const credit = document.getElementById("credit");

        endingVideo.pause();
        endingVideo.currentTime = 0;
        endingVideo.style.opacity = 0;

        endingText.innerHTML = "";
        endingText.style.opacity = 0;
        endingText.style.transition = "opacity 2s ease";

        restartBtn.style.opacity = 0;
        restartBtn.style.pointerEvents = "none";

        credit.innerHTML = "";
        credit.style.opacity = 0;
        credit.style.transition = "opacity 2s ease";

        setTimeout(() => {
            endingVideo.play();

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    endingVideo.style.opacity = 0.45;
                });
            });
        }, 300);

        setTimeout(() => {
            showReflectionQuestion(endingText, credit, restartBtn);
        }, 6000);

    }, 2000);
}

function showReflectionQuestion(endingText, credit, restartBtn) {
    endingText.innerHTML = `
        <div style="margin-bottom: 2.2rem;">hiljainen yhteytesi?</div>

        <button class="reflection-choice" data-choice="ihminen">○ ihminen</button>
        <button class="reflection-choice" data-choice="paikka">○ paikka</button>
        <button class="reflection-choice" data-choice="muisto">○ muisto</button>
        <button class="reflection-choice" data-choice="aika">○ aika</button>
        <button class="reflection-choice" data-choice="minä">○ minä</button>
    `;

    endingText.style.opacity = 1;

    const buttons = endingText.querySelectorAll(".reflection-choice");

    buttons.forEach((button) => {
        button.style.display = "block";
        button.style.margin = "0.55rem auto";
        button.style.background = "transparent";
        button.style.border = "none";
        button.style.color = "rgba(255,255,255,0.86)";
        button.style.font = "inherit";
        button.style.fontSize = "1rem";
        button.style.letterSpacing = "0.04em";
        button.style.cursor = "pointer";
        button.style.padding = "0.2rem 0.6rem";

        button.addEventListener("click", (event) => {
            event.stopPropagation();
            handleReflectionChoice(endingText, credit, restartBtn);
        }, { once: true });
    });
}

function handleReflectionChoice(endingText, credit, restartBtn) {
    endingText.style.transition = "opacity 2s ease";
    endingText.style.opacity = 0;

    setTimeout(() => {
        endingText.innerHTML = "yhteys syntyy joskus hiljaa";
        endingText.style.opacity = 1;
    }, 2200);

    setTimeout(() => {
        endingText.style.opacity = 0;
    }, 7200);

    setTimeout(() => {
        credit.innerHTML = `
            <div>hiljainen yhteys</div>
            <div style="margin-top: 1.2rem;">matti kärki</div>
            <div style="margin-top: 0.4rem;">2026</div>
        `;

        credit.style.opacity = 1;
    }, 9500);

    setTimeout(() => {
        restartBtn.style.opacity = 1;
        restartBtn.style.pointerEvents = "auto";
    }, 13500);
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

document.getElementById("nextZone").addEventListener("click", nextImage);
document.getElementById("prevZone").addEventListener("click", prevImage);

document.getElementById("restartBtn").addEventListener("click", (event) => {
    event.stopPropagation();

    current = 0;
    secondRound = false;

    ending.classList.remove("active");
    intro.classList.add("active");

    viewer.classList.remove("active");
    uiLayer.classList.add("hidden");

    textLayer.innerHTML = "";
    textLayer.style.opacity = 0;

    if (ambientAudio) {
        ambientAudio.pause();
        ambientAudio.currentTime = 0;
        ambientAudio.volume = 0;
        audioUnlocked = false;
    }

    firstInteractionConsumed = false;
    fullscreenStarted = false;

    showOpeningQuestion();
});