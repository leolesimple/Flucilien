function loaderData() {
  // Création du fond
  const overlay = document.createElement('div');
  overlay.id = 'site-loader';

  // Création du spinner
  const spinner = document.createElement('div');
  spinner.className = 'loader_spinner';
  overlay.appendChild(spinner);

  // Ajoute le loader dans le body
  if (document.body) {
    document.body.appendChild(overlay);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(overlay);
    });
  }

  // cacher le loader quand les données sont prêtes 
  function hideLoader() {
    overlay.style.transition = 'opacity 0.3s';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }

  // signaler que les données sont prêtes
  window.notifyDataLoaded = hideLoader;

  // timeout de sécurité (ex. 10 secondes)
  const loaderTimeout = 10000; // 10 000 ms = 10s
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      hideLoader();
    }
  }, loaderTimeout);
}

// On affiche le loader
loaderData();