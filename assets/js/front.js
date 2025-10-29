/*
* Front-end JavaScript code
* Author: Léo LESIMPLE
* Date: 2025-10-13
* Version: 1.0.0
*/

/* Navbar shadow when user scrolling */
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return; // protect when no navbar is present on this page
    if (window.scrollY > 0) {
        navbar.classList.add('shadow');
    } else {
        navbar.classList.remove('shadow');
    }
});

/* Portes */
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


document.addEventListener("DOMContentLoaded", function() {
    const svgButton = document.querySelector("#p_button");
    const overlayButton = document.querySelector("#p_button_overlay");

    if (svgButton) svgButton.addEventListener("click", buttonClickEffect);
    if (overlayButton) overlayButton.addEventListener("click", buttonClickEffect);
});

/* Init cards */
function initIncidentsCards() {
    const cardsContainer = document.querySelector('#incidentCardsWrapper');

    fetch('../data/front/incidents.json')
        .then(response => response.json())
        .then(data => {
            data.cards.forEach(cardData => {
                const card = document.createElement('div');
                card.classList.add('card');

                card.innerHTML = `
                    <img src="${cardData.image.src}" alt="${cardData.image.alt}">
                    <div class="cardText">
                        <h4>${cardData.title}</h4>
                        <span>${cardData.duration}</span>
                        <p>${cardData.description}</p>
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
        cardsWrapper.scrollBy({ left: 300, behavior: 'smooth' });
    });

    prevButton.addEventListener('click', () => {
        cardsWrapper.scrollBy({ left: -300, behavior: 'smooth' });
    });
}

if (localStorage.getItem("portesStageDone") === "true") {
    document.addEventListener("DOMContentLoaded", skipDoors);
}
document.addEventListener('DOMContentLoaded', initIncidentsCards);
document.addEventListener('DOMContentLoaded', leftRightIncidentsCards);
