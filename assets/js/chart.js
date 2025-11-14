/**
 * Affiche les détails dans la sidebar pour une gare donnée.
 * @param gareData
 * @param sidebar
 */
function sidebarDetails(gareData, sidebar) {
    const gare = gareData.infos;
    const nom = gare.nom;
    const validations2024 = gare.Validations["2024"] || {};
    const validations2025 = gare.Validations["2025"] || {};

    const trimestres = ["1erTrimestre", "2emeTrimestre", "3emeTrimestre", "4emeTrimestre"];
    const valeurs2024 = trimestres.map(t => validations2024[t] || 0);
    const valeurs2025 = trimestres.map(t => validations2025[t] || 0);
    const labels = [
        "T1 2024", "T2 2024", "T3 2024", "T4 2024",
        "T1 2025", "T2 2025", "T3 2025", "T4 2025"
    ];
    const values = [...valeurs2024, ...valeurs2025];

    new Chart(document.getElementById('chart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Validations - ${nom}`,
                data: values,
                backgroundColor: 'rgba(38,122,189,0.7)',
                borderColor: '#143353',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    document.getElementById('chart-desc').textContent = `De deux-mille-vingt-quatre à deux-mille-vingt-cinq, la gare de ${nom} a enregistré ${valeurs2024[0]} validations au premier trimestre 2024, ${valeurs2024[1]} au deuxième, ${valeurs2024[2]} au troisième, ${valeurs2024[3]} au quatrième, puis ${valeurs2025[0]} au premier trimestre 2025 et ${valeurs2025[1]} au deuxième.`;
}

function hideSidebar() {
    // remove show class to hide sidebar
    document.getElementById('details').classList.remove('show');
}



/*
 * Insère un graphique du total des validations trimestrielles au-dessus de la carte.
 */
async function TotalValidationChart() {
    // Charger les données
    const res = await fetch('data/total_validation.json');
    const data = await res.json();

    // labels et valeurs manuellement
    const labels = [
        "T1 2024", "T2 2024", "T3 2024", "T4 2024",
        "T1 2025", "T2 2025"
    ];

    const values = [
        data["2024"].Q1, data["2024"].Q2, data["2024"].Q3, data["2024"].Q4,
        data["2025"].Q1, data["2025"].Q2
    ];

    // créer le container HTML qui sera placer avant la map => peut être bougé dans le main (éviter conflit)
    const container = document.createElement("section");
    container.innerHTML = `
        <div style="height:280px;width:100%;">
            <canvas id="totalValidationChart"></canvas>
        </div>
    `;
    document.getElementById("mapSection").before(container);


    // créer le graphique à l'aide de chart.js
    new Chart(document.getElementById("totalValidationChart"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Total validations (par trimestre)",
                data: values,
                borderColor: "rgba(38,122,189,0.9)",
                backgroundColor: "rgba(38,122,189,0.15)",
                fill: true,
                tension: 0.4
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false //mieux  voir la différence entre les points avec hauteur de graphique qui s'adapte aux données
        }
    });
}

TotalValidationChart();