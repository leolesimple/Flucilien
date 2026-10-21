/**
 * Affiche les détails dans la sidebar pour une gare donnée.
 * @param gareData
 * @param sidebar
 */
function sidebarDetails(gareData, sidebar) {
    const gare = gareData.infos;
    const nom = gare.nom;
    // null (et pas 0) quand le trimestre n'est pas disponible : Chart.js n'affiche alors pas de barre
    const labels = TRIMESTRES.map(t => t.label);
    const values = TRIMESTRES.map(t => gare.Validations[t.annee]?.[t.trimestre] ?? null);

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

    const desc = TRIMESTRES.map((t, i) => values[i] === null
        ? `${t.long} : donnée indisponible`
        : `${t.long} : ${values[i].toLocaleString('fr-FR')} validations`);
    document.getElementById('chart-desc').textContent = `Validations de la gare de ${nom} par trimestre. ${desc.join(', ')}.`;
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
        "T1 2025", "T2 2025", "T3 2025", "T4 2025"
    ];

    const values = [
        data["2024"].Q1, data["2024"].Q2, data["2024"].Q3, data["2024"].Q4,
        data["2025"].Q1, data["2025"].Q2, data["2025"].Q3, data["2025"].Q4
    ];

    // créer le container HTML qui sera placé avant la map => peut être bougé dans le main (éviter conflit)
    const container = document.createElement("section");
    container.className =" horizontalHero chart";
    container.innerHTML = `
        <div class="textContainer">
            <h2>Total des validations trimestrielles (2024-2025)</h2>
            <p>Ci-dessous, l'évolution du nombre total de validations sur le réseau ferré, trimestre par trimestre. Le creux de l'été (3e trimestre) revient chaque année, et la fréquentation 2025 dépasse celle de 2024 sur chaque trimestre.</p>
        </div>
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
                borderColor: "rgb(0,44,79)",
                backgroundColor: "rgba(38,122,189,0.15)",
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointHoverRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, //mieux voir la différence entre les points avec hauteur de graphique qui s'adapte aux données
            scales: {
                x: {
                    grid: {
                        color: 'rgba(200,200,200,0.2)'
                    },
                    ticks: {
                        color: '#143353'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(200,200,200,0.2)'
                    },
                    ticks: {
                        color: '#143353'
                    }
                }
            }
        }
    });
}

TotalValidationChart();