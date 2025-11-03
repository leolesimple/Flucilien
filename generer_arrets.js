const lignesCibles = ["A", "B", "C", "D", "E", "H", "J", "K", "L", "N", "P", "R", "U", "V"];

async function genererArrets() {
  try {
    const reponse = await fetch("gares-ferroviaires.json");
    if (!reponse.ok) throw new Error("Impossible de charger gares-ferroviaires.json");

    const data = await reponse.json();
    const resultat = {};
    lignesCibles.forEach(l => (resultat[l] = []));

    data.forEach(item => {
      const f = item.fields || {};
      const ligne = (f.indice_lig || "").trim().toUpperCase();
      if (!lignesCibles.includes(ligne)) return;

      const nom = f.nom_zda || f.nom_gares || f.nom_iv;
      const id = f.id_ref_zda;
      if (!nom || !id) return;

      resultat[ligne].push({
        id: `STIF:StopArea:SP:${id}:`,
        nom
      });
    });

    for (const l in resultat) {
      const uniques = new Map();
      resultat[l].forEach(a => uniques.set(a.id, a));
      resultat[l] = Array.from(uniques.values()).sort((a, b) => a.nom.localeCompare(b.nom));
    }

    const blob = new Blob([JSON.stringify(resultat, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = "arrets.json";
    lien.click();
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
  }
}

document.getElementById("generer").addEventListener("click", genererArrets);
