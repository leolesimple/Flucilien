// Ajoute des loaders très simples
function loaderData() {
  var loaders = [];

  // Créé un loader basique dans un élément
  function createLoader(element) {
    var div = document.createElement('div');
    div.className = 'mon-loader';

    var spinner = document.createElement('div');
    spinner.className = 'loader_spinner';
    div.appendChild(spinner);

    var sr = document.createElement('span');
    sr.textContent = 'Chargement des données';
    sr.className = 'sr-only';
    div.appendChild(sr);

    element.appendChild(div);

    loaders.push(div); 
  }

  // On recupere les elements où placer les loaders
  var mapEl = document.getElementById('map');
  var place5 = document.getElementById('place5');

  createLoader(mapEl);
  createLoader(place5);


// si notifié que les données sont chargées, on enlève les loaders
  window.notifyDataLoaded = function () {
    for (var i = 0; i < loaders.length; i++) {
      var loader = loaders[i];
      loader.parentNode.removeChild(loader);
    }
  };

  // Enlève tout au bout de 10 secondes
  setTimeout(function() {
    window.notifyDataLoaded();
  }, 15000);
}

// Lance le script quand le DOM est prêt
  loaderData();