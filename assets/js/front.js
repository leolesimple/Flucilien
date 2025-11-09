/*
* Front-end JavaScript code
* Author: Léo LESIMPLE
* Date: 2025-10-13
* Version: 1.0.0
*/


/***
 * Cursor buddy
 * Icône de train qui suit le curseur de la souris.
 * (Encore buggé)
 */
const icons = {
    mi09: "https://linventrain.leolesimple.fr/img/trains/mi09.svg",
    mi2n: "https://linventrain.leolesimple.fr/img/trains/mi2n_alteo.svg",
    mi2n_idfm: "https://linventrain.leolesimple.fr/img/trains/mi2n_idfm.svg",
    mi2n_sncf: "https://linventrain.leolesimple.fr/img/trains/mi2n_eole.svg",
    z50: "https://linventrain.leolesimple.fr/img/trains/z50000_idfm.svg",
    agc: "https://linventrain.leolesimple.fr/img/trains/z50000_carmillon.svg",
    mi84: "https://linventrain.leolesimple.fr/img/trains/mi84_79_idfm_alleged.svg",
    mi84_a: "https://linventrain.leolesimple.fr/img/trains/mi84_79_idf.svg",
    z2n_transilien: "https://linventrain.leolesimple.fr/img/trains/z2n_transilien.svg",
    z2n_idfm: "https://linventrain.leolesimple.fr/img/trains/z2n_idfm.svg",
    rer_ng: "https://linventrain.leolesimple.fr/img/trains/z58000.svg",
}

const cursorBuddy = document.createElement("img");
cursorBuddy.style.position = "absolute";
cursorBuddy.style.width = "85px";
cursorBuddy.style.height = "";
cursorBuddy.style.pointerEvents = "none";
cursorBuddy.style.zIndex = "1010";
const iconKeys = Object.keys(icons);
const randomIcon = icons[iconKeys[Math.floor(Math.random() * iconKeys.length)]];
cursorBuddy.src = randomIcon;
cursorBuddy.style.transform = "translate(10%, 10%)";
cursorBuddy.setAttribute("aria-hidden", "true");
cursorBuddy.setAttribute("alt", "");

document.body.appendChild(cursorBuddy);
let mouseX = 0;
let mouseY = 0;
let buddyX = 0;
let buddyY = 0;
const speed = 0.25;
document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

function animate() {
    const distX = mouseX - buddyX;
    const distY = mouseY - buddyY;
    buddyX += distX * speed;
    buddyY += distY * speed;

    const emojiWidth = cursorBuddy.offsetWidth;
    const emojiHeight = cursorBuddy.offsetHeight;
    const maxX = window.innerWidth - emojiWidth;
    const maxY = window.innerHeight - emojiHeight;

    buddyX = Math.max(0, Math.min(buddyX, maxX));
    buddyY = Math.max(0, Math.min(buddyY, maxY));

    cursorBuddy.style.left = `${buddyX}px`;
    cursorBuddy.style.top = `${buddyY}px`;
    requestAnimationFrame(animate);
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && !('ontouchstart' in window)) {
    animate();
}

/**
 * Hide the buddy train if user prefers reduced motion or if the scroll height is > than 10px (to avoid distraction when reading) with animation
 */

window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
        cursorBuddy.style.transition = "opacity 0.5s ease-out";
        cursorBuddy.style.opacity = "0";
        cursorBuddy.style.pointerEvents = "none";
        cursorBuddy.style.top = "-100px";
        cursorBuddy.style.left = "-100px";
    } else {
        cursorBuddy.style.transition = "opacity 0.5s ease-in";
        cursorBuddy.style.opacity = "1";
    }
});

/**
 * Navbar qui "sort" de son emplacement via une ombre.
 */
window.addEventListener('scroll', function () {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return; // protect when no navbar is present on this page
    if (window.scrollY > 0) {
        navbar.classList.add('shadow');
    } else {
        navbar.classList.remove('shadow');
    }
});


/**
 * Gestion de l'animation des portes à l'arrivée sur le site.
 */
function buttonClickEffect(event) {
    const p_button = document.querySelector("#p_button");
    const p_droite = document.querySelector("#p_droite");
    const p_gauche = document.querySelector("#p_gauche");
    const p_overlay = document.querySelector("#p_button_overlay");
    const body = document.body;

    if (!p_button || !p_droite || !p_gauche || !p_overlay) return;

    p_button.classList.add("clicked");
    p_droite.classList.add("moved-right");
    p_gauche.classList.add("moved-left");
    p_overlay.classList.add("moved-button");

    setTimeout(() => {
        p_button.remove();
        p_overlay.remove();
        p_droite.remove();
        p_gauche.remove();
        body.classList.remove("portesStage");
        localStorage.setItem("portesStageDone", "true");
    }, 3750);
}

/**
 * Fonction pour ignorer l'animation si les animations sont désactivées ou que l'utilisateur a déjà fait l'animation.
 */
function skipDoors() {
    const p_button = document.querySelector("#p_button");
    const p_droite = document.querySelector("#p_droite");
    const p_gauche = document.querySelector("#p_gauche");
    const p_overlay = document.querySelector("#p_button_overlay");
    const body = document.body;

    if (!p_button || !p_droite || !p_gauche || !p_overlay) return;

    p_button.remove();
    p_overlay.remove();
    p_droite.remove();
    p_gauche.remove();
    body.classList.remove("portesStage");
    localStorage.setItem("portesStageDone", "true");
}


document.addEventListener("DOMContentLoaded", function () {
    const svgButton = document.querySelector("#p_button");
    const overlayButton = document.querySelector("#p_button_overlay");

    if (svgButton) svgButton.addEventListener("click", buttonClickEffect);
    if (overlayButton) overlayButton.addEventListener("click", buttonClickEffect);
});

/**
 * Affichage des cartes d'incidents avec explication.
 */
function initIncidentsCards() {
    const cardsContainer = document.querySelector('#incidentCardsWrapper');

    fetch('https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/front/incidents.json')
        .then(response => response.json())
        .then(data => {
            data.cards.forEach(cardData => {
                const card = document.createElement('div');
                card.classList.add('card');

                card.innerHTML = `
                    <img src="${cardData.image.src}" alt="${cardData.image.alt}">
                    <div class="cardContent">
                        <div class="cardText">
                            <h4>${cardData.title}</h4>
                            <span>${cardData.duration}</span>
                            <p>${cardData.description}</p>
                        </div>
                        <a href="${cardData.link.url}" target="${cardData.link.target}" rel="${cardData.link.rel}">
                            ${cardData.link.text}
                            <span class="sr-only">${cardData.link.sr_only}</span>
                        </a>
                    </div>
                `;

                cardsContainer.appendChild(card);
            });
        })
        .catch(error => console.error('Erreur lors du chargement des incidents :', error));
}

function leftRightIncidentsCards() {
    const nextButton = document.querySelector('#nextIncidentCard');
    const prevButton = document.querySelector('#prevIncidentCard');
    const cardsWrapper = document.querySelector('#incidentCardsWrapper');

    if (!nextButton || !prevButton || !cardsWrapper) return;
    nextButton.addEventListener('click', () => {
        cardsWrapper.scrollBy({left: 300, behavior: 'smooth'});
    });

    prevButton.addEventListener('click', () => {
        cardsWrapper.scrollBy({left: -300, behavior: 'smooth'});
    });
}

/* load data/front/projets.json and display projects cards like incidents cards */
function initProjectsCards() {
    console.log("Loading projects cards...");
    const cardsContainer = document.querySelector('#idfProjectsCardsWrapper');

    fetch('data/front/projets.json')
        .then(response => response.json())
        .then(data => {
            data.cards.forEach(cardData => {
                const card = document.createElement('div');
                card.classList.add('card');

                card.innerHTML = `
                    <img src="${cardData.image.src}" alt="${cardData.image.alt}">
                    <div class="cardContent">
                        <div class="cardText">
                            <h4>${cardData.title}</h4>
                            <span>${cardData.duration}</span>
                            <p>${cardData.description}</p>
                        </div>
                        <a href="${cardData.link.url}" target="${cardData.link.target}" rel="${cardData.link.rel}">
                            ${cardData.link.text}
                            <span class="sr-only">${cardData.link.sr_only}</span>
                        </a>
                    </div>
                `;

                cardsContainer.appendChild(card);
            });
        })
        .catch(error => console.error('Erreur lors du chargement des projets :', error));
}

function leftRightProjectsCards() {
    const nextButton = document.querySelector('#nextProjectsCard');
    const prevButton = document.querySelector('#prevProjectsCard');
    const cardsWrapper = document.querySelector('#idfProjectsCardsWrapper');

    if (!nextButton || !prevButton || !cardsWrapper) return;
    nextButton.addEventListener('click', () => {
        cardsWrapper.scrollBy({left: 300, behavior: 'smooth'});
    });

    prevButton.addEventListener('click', () => {
        cardsWrapper.scrollBy({left: -300, behavior: 'smooth'});
    });
}


/**
 * Detect when the map section is in the middle of the viewport, in order to trigger CSS animations.
 * Adds/removes the 'mapZone' class to/from the body element.
 */
const body = document.body
const target = document.getElementById('mapSection')

window.addEventListener('scroll', () => {
    const rect = target.getBoundingClientRect()
    const visible = rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2
    document.body.classList.toggle('mapZone', visible);
});

/**
 * Detect when each gare section is in the middle of the viewport, in order to change the background.
 * Adds/removes the corresponding background class to/from the body element.
 */
const sections = document.querySelectorAll('.gareSection')

window.addEventListener('scroll', () => {
    sections.forEach(section => {
        const rect = section.getBoundingClientRect()
        const visible = rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2
        document.body.classList.toggle(section.dataset.bg, visible)
    })
})


/**
 * Function to skip the door animation if already done or if user doens’t want animations.
 */
if (localStorage.getItem("portesStageDone") === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.addEventListener("DOMContentLoaded", skipDoors);
}



/**
 * Initialize incidents cards and their left/right navigation buttons when the DOM is fully loaded.
 * */
document.addEventListener('DOMContentLoaded', initIncidentsCards);
document.addEventListener('DOMContentLoaded', leftRightIncidentsCards);
document.addEventListener('DOMContentLoaded', initProjectsCards);
document.addEventListener('DOMContentLoaded', leftRightProjectsCards);
