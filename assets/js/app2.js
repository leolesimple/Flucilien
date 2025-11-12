async function fetchAndMergeData() {
    // je mets la liste de mes fichiers (un par trimestre)
    const trimestreFiles = [
        {
            file: 'https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/nb_validation_Q1_2024.json',
            idField: 'ida',
            annee: '2024',
            trimestre: '1erTrimestre'
        },
        {
            file: 'https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/nb_validation_Q2_2024.json',
            idField: 'id_zdc',
            annee: '2024',
            trimestre: '2emeTrimestre'
        },
        {
            file: 'https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/nb_validation_Q3_2024.json',
            idField: 'id_zdc',
            annee: '2024',
            trimestre: '3emeTrimestre'
        },
        {
            file: 'https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/nb_validation_Q4_2024.json',
            idField: 'id_zdc',
            annee: '2024',
            trimestre: '4emeTrimestre'
        },
        {
            file: 'https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/nb_validation_Q1_2025.json',
            idField: 'ida',
            annee: '2025',
            trimestre: '1erTrimestre'
        },
        {
            file: 'https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/nb_validation_Q2_2025.json',
            idField: 'id_zdc',
            annee: '2025',
            trimestre: '2emeTrimestre'
        }
    ];

    // je vais chercher le fichier sur les informations des gares (use safe fetch)
    const dataGares = await safeFetchJson('https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/info_gares.json');

    // ici je fais un objet ou je range les gares avec leur id
    const gareById = {};

    // Dans cette boucle, je range toutes les infos des gares dans mon objet gareById pour après y ajouter les validations dans une autre boucle
    for (let i = 0; i < dataGares.length; i++) {
        const g = dataGares[i]; // la gare actuelle
        const id = String(g.id_ref_zdc); // je récupère son id (je le force en texte sinon ça bug)
        const nom = g.nom_long; // le nom long genre "Paris Gare de Lyon"
        const coords = g.geo_point_2d; // les coordonnées lat lon

        // structuration de l'objet gare
        gareById[id] = {
            nom: nom,
            Coordonnees: {
                // je check si c’est un objet ou un tableau pour récupérer les coordonnées
                lat: coords.lat ?? coords[1],
                lon: coords.lon ?? coords[0]
            },
            Validations: {} // ici je mettrai les validations par année et trimestre par la suite
        };
    }

    // maintenant je vais chercher les fichiers de validation un par un
    for (let i = 0; i < trimestreFiles.length; i++) {
        const info = trimestreFiles[i]; // trimestre courant
        let data;
        try {
            data = await safeFetchJson(info.file);
        } catch (err) {
            console.warn(`Warning: unable to load ${info.file}:`, err.message);
            continue; // skip this quarter if it fails
        }

        // je passe sur chaque ligne du fichier
        for (let j = 0; j < data.length; j++) {
            // j'initialise des variables
            const ligne = data[j]; // la ligne actuelle du fichier
            const id = String(ligne[info.idField] ?? ''); // id de la gare (safe)
            const nb = Number(ligne.nb_vald) || 0; // coerce to number, default 0
            const gare = gareById[id];

            // si la gare existe et qu'il y a des validations
            if (gare && nb > 0) {
                // si l'objet année n'existe pas encore dans la gare, je le crée
                if (!gare.Validations[info.annee]) {
                    gare.Validations[info.annee] = {};
                }

                // si l'objet trimestre n'existe pas encore dans l'année, je le crée
                if (!gare.Validations[info.annee][info.trimestre]) {
                    gare.Validations[info.annee][info.trimestre] = 0;
                }

                // j’ajoute le nombre de validations dans la bonne année / trimestre
                gare.Validations[info.annee][info.trimestre] += nb;
            }
        }
    }

    // preparation du résultat final (por affichage)
    const resultat = {gares: []};

    // je passe sur toutes les gares pour voir celles qui ont des validations
    for (let id in gareById) {
        const g = gareById[id];
        const hasValidations = Object.keys(g.Validations).length > 0;

        // si y a au moins une validation, je l’ajoute au résultat
        if (hasValidations) {

            const validations2025 = g.Validations["2025"];
            let total2025 = 0;

            if (validations2025) {
                for (const trimestre in validations2025) {
                    total2025 += validations2025[trimestre];
                }

                // on ajoute une petite ligne avec le total 2025
                g.Validations["2025"].Total = total2025;
            }

            resultat.gares.push({
                infos: g
            });
        }
    }

//console.log(JSON.stringify(resultat, null, 2)); // J'affiche le résultat dans la console, je mets les paramètres
    // null : pour ne pas filtrer
    // 2 : pour avoir une indentation de 2 espaces
    return resultat;
}

// Add a small helper to safely fetch JSON and surface useful errors
async function safeFetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Network error while fetching ${url} — ${res.status} ${res.statusText}`);
    }
    try {
        return await res.json();
    } catch (err) {
        throw new Error(`Failed to parse JSON from ${url}: ${err.message}`);
    }
}

async function Top5Gares() { // Récupération du top 5 des gares avec le plus de validation du 2ème trimestre 2025. (trimestre recent)
                             // Récupérer les données fusionnées
    let data;
    try {
        data = await fetchAndMergeData();
    } catch (err) {
        console.error('Top5Gares: failed to load merged data:', err);
        return []; // fail gracefully
    }
    const gares = data.gares || [];

    // Calcul le total des validations
    const garesWithValidations = gares.map(gare => {
        const validations = gare.infos?.Validations?.['2025']?.['2emeTrimestre'] || 0;
        return {
            nom: gare.infos?.nom || 'Nom inconnu',
            validations: validations
        };
    });

    // Tri
    garesWithValidations.sort((a, b) => b.validations - a.validations);


    const top5Gares = garesWithValidations.slice(0, 5);
    return top5Gares;
}

//affichage du top 5

async function afficheTop5() {
    const top5 = await Top5Gares();


    for (let i = 0; i < 5; i++) {
        const placeNumber = i + 1;
        const section = document.getElementById(`place${placeNumber}`);

        const gare = top5[i];

        if (gare) {
            // bloc de texte
            const textHtml = `
        <div class="textContainer">
          <h3>${gare.nom}</h3>
          <p>${gare.validations.toLocaleString()} validations</p>
        </div>
      `;

            // ajout svg
            const imgHtml = `
        <div class="imgContainer">
          <img src="https://raw.githubusercontent.com/leolesimple/dataTchoo/main/assets/img/handmade_img/classement/${placeNumber}.svg" alt="Gare numéro ${placeNumber} — ${gare.nom}">
        </div>
      `;

            // structuration
            section.innerHTML = imgHtml + textHtml;
        }
    }
}

// Lancer l'affichage — catch errors to avoid Unhandled Promise Rejection
afficheTop5().catch(err => {
    console.error('afficheTop5 failed:', err);
});
