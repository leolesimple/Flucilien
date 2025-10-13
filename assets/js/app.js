function fetchStations() {
  fetch('../data/info_gares.json')
    .then(function(reponse) {
      return reponse.json()
    })
    .then(function(stations) {
      stations.forEach(function(station) {
        console.log(
          'Nom:', station.nom_long, 
          'Latitude:', station.geo_point_2d.lat, 
          'Longitude:', station.geo_point_2d.lon
        )
      })
    })
}




function fetchValidations() {
  fetch('../data/nb_validation.json')
    .then(function(reponse) {
      return reponse.json()
    })

    .then(function(donnees) {
      // Créer un tableau pour stocker les résultats
      var totalParStation = {}

      donnees.forEach(function(ligne) {
      
        var nomStation = ligne.libelle_arret
  
        var compte = +ligne.nb_vald 


        if (!totalParStation[nomStation]) {
          totalParStation[nomStation] = 0
        }

        totalParStation[nomStation] = totalParStation[nomStation] + compte // On ajoute le nombre de validations au total existant
      })

  
      // On parcourt chaque nom de station dans le tableau
      for (var nom in totalParStation) {
        // On affiche le nom et le total de validations
        console.log(
          'Station:', nom, 
          'Validations au total:', totalParStation[nom]
        )
      }
    })
}

fetchStations()
fetchValidations()