/**
 * Agrège les fichiers nb_validation_*.json / *.txt (historique PRIM) en un seul fichier compact.
 * Sorties :
 *   - data/validations_aggregated.json (~200 Ko au lieu de 680 Mo), par gare (id ZdC)
 *   - data/total_validation.json, total réseau par trimestre (null si donnée indisponible)
 * Usage : node scripts/aggregate_validations.mjs
 *
 * - Les lignes dont la date ne correspond pas au trimestre attendu sont ignorées
 *   (protège contre un fichier copié sous le mauvais nom).
 * - Si un fichier source est absent, les valeurs déjà présentes dans l'agrégat
 *   existant pour ce trimestre sont conservées.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');
const OUT_PATH = resolve(DATA_DIR, 'validations_aggregated.json');
const TOTAL_PATH = resolve(DATA_DIR, 'total_validation.json');

const QUARTERS = [
  // Le 1er semestre 2024 n'existe qu'en fichier semestriel (historique PRIM) : le filtre par mois le découpe
  { file: 'nb_validation_S1_2024.txt', idField: 'id_zdc', annee: '2024', trimestre: '1erTrimestre', q: 'Q1', mois: ['01', '02', '03'] },
  { file: 'nb_validation_S1_2024.txt', idField: 'id_zdc', annee: '2024', trimestre: '2emeTrimestre', q: 'Q2', mois: ['04', '05', '06'] },
  { file: 'nb_validation_Q3_2024.json', idField: 'id_zdc', annee: '2024', trimestre: '3emeTrimestre', q: 'Q3', mois: ['07', '08', '09'] },
  { file: 'nb_validation_Q4_2024.json', idField: 'id_zdc', annee: '2024', trimestre: '4emeTrimestre', q: 'Q4', mois: ['10', '11', '12'] },
  { file: 'nb_validation_Q1_2025.json', idField: 'ida', annee: '2025', trimestre: '1erTrimestre', q: 'Q1', mois: ['01', '02', '03'] },
  { file: 'nb_validation_Q2_2025.json', idField: 'id_zdc', annee: '2025', trimestre: '2emeTrimestre', q: 'Q2', mois: ['04', '05', '06'] },
  { file: 'nb_validation_Q3_2025.json', idField: 'id_zdc', annee: '2025', trimestre: '3emeTrimestre', q: 'Q3', mois: ['07', '08', '09'] },
  { file: 'nb_validation_Q4_2025.json', idField: 'id_zdc', annee: '2025', trimestre: '4emeTrimestre', q: 'Q4', mois: ['10', '11', '12'] },
];

// id ZdC des fichiers de validation -> id_ref_zdc de info_gares.json, quand les deux référentiels divergent
const ZDC_ALIASES = {
  '71264': '474151',  // CHATELET (métro + RER) -> Châtelet-Les Halles
  '73794': '474151',  // LES HALLES (M4) -> Châtelet-Les Halles
  '74000': '478733',  // MAGENTA
  '412697': '479919', // NOISY-LE-GRAND -> Noisy-le-Grand-Mont d'Est
  '63650': '463850',  // TRAPPES
  '74371': '463843',  // TRIEL SUR SEINE
  '72219': '72225',   // GRESILLONS -> Les Grésillons
};

// Certains exports PRIM ont des séparateurs de milliers ("2 225") : parseInt les tronquerait.
function parseNbVald(value) {
  if (typeof value === 'number') return value;
  return Number(String(value ?? '').replace(/\D/g, '')) || 0;
}

// "01/07/24" ou "01/07/2024" -> "2024-07-01" ; les dates ISO passent telles quelles
function normalizeJour(value) {
  const s = String(value ?? '');
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);
  if (!m) return s;
  return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2]}-${m[1]}`;
}

// JSON (exports trimestriels) ou TXT tabulé (historique PRIM, en-têtes en majuscules)
const sourceCache = new Map();
function readRows(filePath) {
  if (sourceCache.has(filePath)) return sourceCache.get(filePath);
  let rows;
  if (filePath.endsWith('.txt')) {
    // latin1 : certains fichiers de l'historique ne sont pas en UTF-8 (seuls les libellés sont concernés)
    const [header, ...lines] = readFileSync(filePath, 'latin1').split(/\r?\n/);
    const keys = header.split('\t').map(k => k.trim().toLowerCase());
    rows = lines.filter(Boolean).map(line => {
      const cols = line.split('\t');
      return Object.fromEntries(keys.map((k, i) => [k, cols[i]]));
    });
  } else {
    rows = JSON.parse(readFileSync(filePath, 'utf-8'));
  }
  sourceCache.set(filePath, rows);
  return rows;
}

const previous = existsSync(OUT_PATH) ? JSON.parse(readFileSync(OUT_PATH, 'utf-8')) : {};
const aggregated = {};

function add(sourceId, annee, trimestre, nb) {
  const id = ZDC_ALIASES[sourceId] ?? sourceId;
  aggregated[id] ??= {};
  aggregated[id][annee] ??= {};
  aggregated[id][annee][trimestre] = (aggregated[id][annee][trimestre] ?? 0) + nb;
}

for (const q of QUARTERS) {
  const filePath = resolve(DATA_DIR, q.file);

  if (!existsSync(filePath)) {
    console.error(`${q.file} absent : conservation des valeurs existantes.`);
    for (const id in previous) {
      const nb = previous[id]?.[q.annee]?.[q.trimestre];
      if (nb) add(id, q.annee, q.trimestre, nb);
    }
    continue;
  }

  console.error(`Traitement de ${q.file} (${q.q} ${q.annee})...`);
  const data = readRows(filePath);
  let horsPeriode = 0;

  for (const row of data) {
    const [annee, mois] = normalizeJour(row.jour).split('-');
    if (annee !== q.annee || !q.mois.includes(mois)) {
      horsPeriode++;
      continue;
    }
    // "71379.0" dans certains exports
    const id = String(row[q.idField] ?? '').trim().replace(/\.0$/, '');
    if (!id) continue;
    const nb = parseNbVald(row.nb_vald);
    if (nb <= 0) continue;
    add(id, q.annee, q.trimestre, nb);
  }

  if (horsPeriode && !q.file.includes('_S')) {
    console.error(`  ${horsPeriode}/${data.length} lignes hors ${q.q} ${q.annee} ignorées.`);
  }
}

writeFileSync(OUT_PATH, JSON.stringify(aggregated));
console.error(`\nFichier généré : ${OUT_PATH}`);

const totals = {};
for (const q of QUARTERS) {
  let total = 0;
  for (const id in aggregated) total += aggregated[id]?.[q.annee]?.[q.trimestre] ?? 0;
  totals[q.annee] ??= {};
  totals[q.annee][q.q] = total || null;
}
writeFileSync(TOTAL_PATH, JSON.stringify(totals, null, 2) + '\n');
console.error(`Fichier généré : ${TOTAL_PATH}`);

const sizeMB = (Buffer.byteLength(JSON.stringify(aggregated)) / 1024 / 1024).toFixed(2);
const nbStations = Object.keys(aggregated).length;
console.error(`Stations : ${nbStations}`);
console.error(`Taille : ${sizeMB} Mo`);
