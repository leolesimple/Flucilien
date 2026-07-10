let _fetchAndMergeCache = null;

async function fetchAndMergeData() {
  if (_fetchAndMergeCache) return _fetchAndMergeCache;
  _fetchAndMergeCache = (async () => {
  // je vais chercher le fichier sur les informations des gares (use safe fetch)
  const dataGares = await safeFetchJson('https://raw.githubusercontent.com/leolesimple/Flucilien/main/data/info_gares.json');

  // je vais chercher les validations pré-agrégées (fichier compact ~150 Ko au lieu de 680 Mo)
  const aggregated = await safeFetchJson('https://raw.githubusercontent.com/leolesimple/Flucilien/main/data/validations_aggregated.json');

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

  // maintenant j'injecte les validations pré-agrégées dans les gares correspondantes
  for (const id in aggregated) {
    const gare = gareById[id];
    if (gare) {
      gare.Validations = aggregated[id];
    }
  }

  // preparation du résultat final (por affichage)
  const resultat = { gares: [] };

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
  })();
  return _fetchAndMergeCache;
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
    throw new Error(`Invalid JSON from ${url} — ${err.message}`);
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
    const validations = gare.infos?.Validations?.['2025']?.['3emeTrimestre'] || 0;
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
          <img src="https://raw.githubusercontent.com/leolesimple/Flucilien/main/assets/img/handmade_img/classement/${placeNumber}.svg" alt="Gare numéro ${placeNumber} — ${gare.nom}">
        </div>
      `;


      // structuration
      section.innerHTML = imgHtml + textHtml;
      }
    }

    // Signaler que l'affichage du Top5 est terminé (permet aussi de fermer le loader)
    try { if (window.notifyDataLoaded) window.notifyDataLoaded(); } catch (e) { /* ignore */ }
}

// Lancer l'affichage — catch errors to avoid Unhandled Promise Rejection
afficheTop5().catch(err => {
  console.error('afficheTop5 ne marche pas:', err);
});