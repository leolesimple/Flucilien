const CLE_API = "yO17ObAKRT7PM0BNiqOPUZwh6uEIcjbN";

async function chargerArrets() {
  try {
    const reponse = await fetch("arrets.json");
    if (!reponse.ok) throw new Error("arrets.json non trouvé");
    const donnees = await reponse.json();
    const select = document.getElementById("selectArret");

    Object.keys(donnees).forEach(ligne => {
      const group = document.createElement("optgroup");
      group.label = `Ligne ${ligne}`;
      donnees[ligne].forEach(arret => {
        const option = document.createElement("option");
        option.value = arret.id;
        option.textContent = arret.nom;
        group.appendChild(option);
      });
      select.appendChild(group);
    });

    select.addEventListener("change", e => {
      if (e.target.value) obtenirHoraires(e.target.value);
    });
  } catch (err) {
    alert("Fichier arrets.json introuvable. Cliquez sur « Générer » pour le créer.");
    console.error(err);
  }
}

async function obtenirHoraires(idArret) {
  const url = `https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=${encodeURIComponent(idArret)}`;

  try {
    const reponse = await fetch(url, { headers: { apiKey: CLE_API } });
    if (!reponse.ok) throw new Error("Erreur API");
    const donnees = await reponse.json();
    const resultat = { lines: {} };

    const visites = donnees?.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]?.MonitoredStopVisit || [];
    visites.forEach(v => {
      const trajet = v.MonitoredVehicleJourney;
      const ligne = trajet?.LineRef?.value || trajet?.LineRef || "Inconnue";
      const direction = trajet?.DestinationName?.[0]?.value || trajet?.DestinationName || "Inconnue";
      const depart = trajet?.MonitoredCall?.ExpectedDepartureTime;

      if (depart) {
        const minutes = Math.round((new Date(depart) - new Date()) / 60000);
        if (minutes >= 0) {
          if (!resultat.lines[ligne]) resultat.lines[ligne] = {};
          const dirLabel = `Vers ${direction}`;
          if (!resultat.lines[ligne][dirLabel]) resultat.lines[ligne][dirLabel] = [];
          resultat.lines[ligne][dirLabel].push(minutes);
        }
      }
    });

    for (const l in resultat.lines)
      for (const d in resultat.lines[l])
        resultat.lines[l][d] = resultat.lines[l][d].sort((a, b) => a - b).slice(0, 3);

    document.getElementById("resultat").textContent = JSON.stringify(resultat, null, 2);
  } catch (err) {
    console.error(err);
    document.getElementById("resultat").textContent = JSON.stringify({ error: "Aucun horaire trouvé pour cet arrêt" }, null, 2);
  }
}

chargerArrets();
