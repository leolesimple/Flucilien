/**
 * Agrège tous les fichiers nb_validation_Q*_*.json en un seul fichier compact.
 * Sortie : data/validations_aggregated.json (~200 Ko au lieu de 680 Mo)
 * Usage : node scripts/aggregate_validations.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');

const QUARTERS = [
  { file: 'nb_validation_Q1_2024.json', idField: 'ida', annee: '2024', trimestre: '1erTrimestre' },
  { file: 'nb_validation_Q2_2024.json', idField: 'id_zdc', annee: '2024', trimestre: '2emeTrimestre' },
  { file: 'nb_validation_Q3_2024.json', idField: 'id_zdc', annee: '2024', trimestre: '3emeTrimestre' },
  { file: 'nb_validation_Q4_2024.json', idField: 'id_zdc', annee: '2024', trimestre: '4emeTrimestre' },
  { file: 'nb_validation_Q1_2025.json', idField: 'ida', annee: '2025', trimestre: '1erTrimestre' },
  { file: 'nb_validation_Q2_2025.json', idField: 'id_zdc', annee: '2025', trimestre: '2emeTrimestre' },
  { file: 'nb_validation_Q3_2025.json', idField: 'id_zdc', annee: '2025', trimestre: '3emeTrimestre' },
  { file: 'nb_validation_Q4_2025.json', idField: 'id_zdc', annee: '2025', trimestre: '4emeTrimestre' },
];

const aggregated = {};

for (const q of QUARTERS) {
  const filePath = resolve(DATA_DIR, q.file);
  console.error(`Traitement de ${q.file}...`);
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  for (const row of data) {
    const id = String(row[q.idField] ?? '');
    if (!id) continue;
    const nb = parseInt(row.nb_vald, 10) || 0;
    if (nb <= 0) continue;

    if (!aggregated[id]) {
      aggregated[id] = {};
    }
    if (!aggregated[id][q.annee]) {
      aggregated[id][q.annee] = {};
    }
    if (!aggregated[id][q.annee][q.trimestre]) {
      aggregated[id][q.annee][q.trimestre] = 0;
    }
    aggregated[id][q.annee][q.trimestre] += nb;
  }
}

const outPath = resolve(DATA_DIR, 'validations_aggregated.json');
writeFileSync(outPath, JSON.stringify(aggregated));
console.error(`\nFichier généré : ${outPath}`);

const sizeMB = (Buffer.byteLength(JSON.stringify(aggregated)) / 1024 / 1024).toFixed(2);
const nbStations = Object.keys(aggregated).length;
console.error(`Stations : ${nbStations}`);
console.error(`Taille : ${sizeMB} Mo`);
