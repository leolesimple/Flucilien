function fetchStations() {
  fetch('../data/info_gares.json')
    .then(function(response) {
      return response.json()
    })
    .then(function(stations) {
      for (var i = 0; i < stations.length; i++) {
        var station = stations[i]
        console.log('Station:', station.nom, 'Location:', station.latitude, station.longitude)
      }
    })
}

function fetchValidations() {
  fetch('../data/nb_validation_Q1_2024.json')
    .then(function(response) {
      return response.json()
    })
    .then(function(data) {
      var totalByStation = {}

      for (var i = 0; i < data.length; i++) {
        var item = data[i]
        var stationName = item.libelle_arret
        var count = item.nb_vald

        if (!totalByStation[stationName]) {
          totalByStation[stationName] = 0
        }

        totalByStation[stationName] = totalByStation[stationName] + count
      }

      for (var name in totalByStation) {
        console.log('Station:', name, 'Validations:', totalByStation[name])
      }
    })
}

fetchStations()
fetchValidations()
