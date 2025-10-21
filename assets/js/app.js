async function fetchAndMergeData() {
  const trimestreFiles = [
    { file: '../data/nb_validation_Q1_2024.json', idField: 'ida', annee: '2024', trimestre: '1erTrimestre' },
    { file: '../data/nb_validation_Q2_2024.json', idField: 'id_zdc', annee: '2024', trimestre: '2emeTrimestre' },
    { file: '../data/nb_validation_Q3_2024.json', idField: 'id_zdc', annee: '2024', trimestre: '3emeTrimestre' },
    { file: '../data/nb_validation_Q4_2024.json', idField: 'id_zdc', annee: '2024', trimestre: '4emeTrimestre' },
    { file: '../data/nb_validation_Q1_2025.json', idField: 'ida', annee: '2025', trimestre: '1erTrimestre' },
    { file: '../data/nb_validation_Q2_2025.json', idField: 'id_zdc', annee: '2025', trimestre: '2emeTrimestre' }
  ];

  const responseGares = await fetch('../data/info_gares.json');
  const stationList = await responseGares.json();

  const gareById = {};

  for (const station of stationList) {
    const id = String(station.id_ref_zdc);
    const nom = station.nom_long;
    const coords = station.geo_point_2d;

    gareById[id] = {
      nom,
      Coordonnees: {
        lat: coords?.lat || coords[1],
        lon: coords?.lon || coords[0]
      },
      Validations: {}
    };
  }

  for (const trimestreInfo of trimestreFiles) {
    const responseData = await fetch(trimestreInfo.file);
    const data = await responseData.json();

    for (const ligne of data) {
      const id = String(ligne[trimestreInfo.idField]);
      const nb = parseInt(ligne.nb_vald);
      const gare = gareById[id];

      if (gare && nb > 0) {
        const { annee, trimestre } = trimestreInfo;

        if (!gare.Validations[annee]) {
          gare.Validations[annee] = {};
        }

        gare.Validations[annee][trimestre] = nb;
      }
    }
  }

  console.log(gareById);
}
fetchAndMergeData();