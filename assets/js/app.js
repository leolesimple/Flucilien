async function fetchAndMergeData() {
  // je mets la liste de mes fichiers (un par trimestre)
  const trimestreFiles = [
    { file: 'https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/nb_validation_Q1_2024.json', idField: 'ida', annee: '2024', trimestre: '1erTrimestre' },
    { file: 'https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/nb_validation_Q2_2024.json', idField: 'id_zdc', annee: '2024', trimestre: '2emeTrimestre' },
    { file: 'https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/nb_validation_Q3_2024.json', idField: 'id_zdc', annee: '2024', trimestre: '3emeTrimestre' },
    { file: 'https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/nb_validation_Q4_2024.json', idField: 'id_zdc', annee: '2024', trimestre: '4emeTrimestre' },
    { file: 'https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/nb_validation_Q1_2025.json', idField: 'ida', annee: '2025', trimestre: '1erTrimestre' },
    { file: 'https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/nb_validation_Q2_2025.json', idField: 'id_zdc', annee: '2025', trimestre: '2emeTrimestre' }
  ];

  // je vais chercher le fichier sur les informations des gares 
  const resGares = await fetch('https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/info_gares.json');
  const dataGares = await resGares.json();

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
    const res = await fetch(info.file);
    const data = await res.json();

    // je passe sur chaque ligne du fichier
    for (let j = 0; j < data.length; j++) {
      // j'initialise des variables
      const ligne = data[j]; // la ligne actuelle du fichier
      const id = String(ligne[info.idField]); // id de la gare
      const nb = parseInt(ligne.nb_vald); // le nombre de validations (parseInt pour convertir en nombre)
      const gare = gareById[id];

      // si la gare existe et qu'il y a des validations
      if (gare && nb > 0) {
        // si l'objet année n'existe pas encore dans la gare, je le crée
        if (!gare.Validations[info.annee]) {
          gare.Validations[info.annee] = {};
        }
    ];

    // je vais chercher le fichier sur les informations des gares
    const resGares = await fetch('https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/info_gares.json');
    const dataGares = await resGares.json();

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
        const res = await fetch(info.file);
        const data = await res.json();

        // je passe sur chaque ligne du fichier
        for (let j = 0; j < data.length; j++) {
            // j'initialise des variables
            const ligne = data[j]; // la ligne actuelle du fichier
            const id = String(ligne[info.idField]); // id de la gare
            const nb = parseInt(ligne.nb_vald); // le nombre de validations (parseInt pour convertir en nombre)
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
            resultat.gares.push({infos: g});
        }
    }

    //console.log(JSON.stringify(resultat, null, 2)); // J'affiche le résultat dans la console, je mets les paramètres
    // null : pour ne pas filtrer
    // 2 : pour avoir une indentation de 2 espaces
    return resultat;
}

// et là je lance la fonction pour que tout ça se fasse
//fetchAndMergeData();
