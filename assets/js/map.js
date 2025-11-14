mapboxgl.accessToken = 'pk.eyJ1IjoibGVvbGVzaW1wbGUiLCJhIjoiY21nancwcmJwMGp4bjJtcXdxdWxlZnhmbSJ9.KLcGk5hjQ3RnxWNaNYmX0A';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    projection: 'globe',
    zoom: 10,
    minZoom: 8,
    maxZoom: 14,
    center: [2.325485, 48.857138],
    cooperativeGestures: true,
    attributionControl: false,
    doubleClickZoom: true,
    logoPosition: 'bottom-right',
    testMode: true,
    language: 'fr',
});

map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        useBrowserFocus: true,
        mapboxgl: mapboxgl,
        placeholder: 'Ville, gare, adresse...',
        countries: 'fr',
        types: 'place,postcode,address,poi',
    })
);

map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.ScaleControl({maxWidth: 50, unit: 'metric'}));
map.addControl(new mapboxgl.FullscreenControl());
map.addControl(new mapboxgl.GeolocateControl({}));

map.on('style.load', () => {

    fetch('https://raw.githubusercontent.com/leolesimple/dataTchoo/main/data/front/lines_alleged.geojson')
        .then(response => response.json())
        .then(data => {
            map.addSource('trainLines', {
                type: 'geojson',
                data: data
            });

            map.addLayer({
                id: 'trainLinesLayer',
                type: 'line',
                source: 'trainLines',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': [
                        'case',
                        ['==', ['slice', ['get', 'colourweb_hexa'], 0, 1], '#'],
                        ['get', 'colourweb_hexa'],
                        ['case',
                            ['has', 'colourweb_hexa'],
                            ['concat', '#', ['get', 'colourweb_hexa']],
                            '#888'
                        ]
                    ],
                    'line-width': 4,
                    'line-opacity': 0.5,
                    'line-blur': 1
                }
            });
        })


    /*
    * En raison d'un contretemps dans le projet de groupe, le code suivant a partiellement été créé avec l'aide des outils d'IA ChatGPT et GitHub Copilot.
    * Il a été revu et adapté par mes soins pour répondre à mes besoins spécifiques.
    * Les function/méthodes utilisées sont toutes acquises et comprises par mes soins.
    */
    fetchAndMergeData()
        .then(resultat => {
            sessionStorage.setItem('garesData', JSON.stringify(resultat));
            const features = [];

            function parseCoords(info = {}) {
                const raw = info.Coordonnees || info.coordonnees || info.coordinates || info.coords || info.coord || null;
                if (!raw) return null;

                if (typeof raw === 'string') {
                    const parts = raw.split(/[;,]/).map(s => Number(s.trim()));
                    if (parts.length >= 2 && parts.every(n => !isNaN(n))) {
                        const [a, b] = parts;
                        if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return {lat: a, lon: b};
                        return {lat: b, lon: a};
                    }
                    return null;
                }

                if (Array.isArray(raw) && raw.length >= 2) {
                    const a = Number(raw[0]), b = Number(raw[1]);
                    if (!isNaN(a) && !isNaN(b)) {
                        if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return {lat: a, lon: b};
                        return {lat: b, lon: a};
                    }
                    return null;
                }

                if (typeof raw === 'object') {
                    const lat = Number(raw.lat ?? raw.latitude ?? raw.Lat ?? raw.Latitude ?? raw.LAT);
                    const lon = Number(raw.lon ?? raw.lng ?? raw.longitude ?? raw.Lon ?? raw.LONG);
                    if (!isNaN(lat) && !isNaN(lon)) return {lat, lon};
                }

                return null;
            }

            function extractValidations(info = {}) {
                const candidate = info.Validations || info.validations || info.Validation || null;
                if (!candidate) return null;

                const nums = [];
                function collect(obj) {
                    if (obj == null) return;
                    if (typeof obj === 'number') { nums.push(obj); return; }
                    if (typeof obj === 'string') {
                        const n = Number(obj.toString().replace(/\s+/g, '').replace(/[^\d.-]/g, ''));
                        if (!isNaN(n)) nums.push(n);
                        return;
                    }
                    if (Array.isArray(obj)) return obj.forEach(collect);
                    if (typeof obj === 'object') return Object.values(obj).forEach(collect);
                }

                collect(candidate);
                if (nums.length === 0) return null;
                return Math.max.apply(null, nums);
            }

            (Array.isArray(resultat.gares) ? resultat.gares : []).forEach(g => {
                const info = g.infos || g.info || g || {};
                const coords = parseCoords(info);
                const validations = extractValidations(info);

                if (coords && Number.isFinite(validations)) {
                    features.push({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [Number(coords.lon), Number(coords.lat)]
                        },
                        properties: {
                            nom: info.nom || info.Nom || g.nom || g.name || '—',
                            validations: Number(validations)
                        }
                    });
                } else {
                }
            });

            const geojson = {
                type: 'FeatureCollection',
                features: features
            };

            if (map.getSource && map.getSource('heatmap-gares')) {
                map.getSource('heatmap-gares').setData(geojson);
            } else {
                map.addSource('heatmap-gares', {
                    type: 'geojson',
                    data: geojson
                });
            }

            map.addLayer({
                id: 'heatmap',
                type: 'heatmap',
                source: 'heatmap-gares',
                maxzoom: 12,
                paint: {
                    'heatmap-weight': [
                        'interpolate', ['linear'], ['get', 'validations'],
                        0, 0,
                        100000, 0.05,
                        1000000, 0.2,
                        5000000, 0.6,
                        10000000, 0.85,
                        20559184, 1
                    ],
                    'heatmap-intensity': [
                        'interpolate', ['linear'], ['zoom'],
                        5, 1,
                        12, 3
                    ],
                    'heatmap-color': [
                        'interpolate', ['linear'], ['heatmap-density'],
                        0, 'rgba(0,0,255,0)',
                        0.2, 'royalblue',
                        0.4, 'cyan',
                        0.6, 'lime',
                        0.8, 'yellow',
                        1, 'red'
                    ],
                    'heatmap-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        5, 12,
                        8, 20,
                        12, 36
                    ],
                    'heatmap-opacity': [
                        'interpolate', ['linear'], ['zoom'],
                        8, 0.85,
                        11, 0.6,
                        12, 0.2,
                        13, 0
                    ]
                }
            });

            // Très grandes gares (≥ 10,000,000)
            map.addLayer({
                id: 'points-gares-mega',
                type: 'circle',
                source: 'heatmap-gares',
                minzoom: 8,
                filter: ['>=', ['get', 'validations'], 10000000],
                paint: {
                    'circle-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        8, 10,
                        12, 24,
                        14, 36
                    ],
                    'circle-color': '#9a2929',
                    'circle-opacity': 0.9,
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 0.8
                }
            });

            // Grandes gares (1,000,000–9,999,999)
            map.addLayer({
                id: 'points-gares-large',
                type: 'circle',
                source: 'heatmap-gares',
                minzoom: 9,
                filter: ['all',
                    ['>=', ['get', 'validations'], 1000000],
                    ['<', ['get', 'validations'], 10000000]
                ],
                paint: {
                    'circle-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        9, 8,
                        12, 18,
                        14, 28
                    ],
                    'circle-color': '#bc3f40',
                    'circle-opacity': 0.9,
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 0.6
                }
            });

            // Gares intermédiaires (100,000–999,999)
            map.addLayer({
                id: 'points-gares-medium',
                type: 'circle',
                source: 'heatmap-gares',
                minzoom: 11,
                filter: ['all',
                    ['>=', ['get', 'validations'], 100000],
                    ['<', ['get', 'validations'], 1000000]
                ],
                paint: {
                    'circle-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        10, 6,
                        12, 14,
                        14, 20
                    ],
                    'circle-color': '#da945a',
                    'circle-opacity': 0.9,
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 0.5
                }
            });

            // Petites gares (< 100,000) - Visible à partir du zoom 12
            map.addLayer({
                id: 'points-gares-small',
                type: 'circle',
                source: 'heatmap-gares',
                minzoom: 12,
                filter: ['<', ['get', 'validations'], 100000],
                paint: {
                    'circle-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        12, 3,
                        14, 10
                    ],
                    'circle-color': '#fac59b',
                    'circle-opacity': 0.9,
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 0.5
                }
            });

            ['points-gares-mega', 'points-gares-large', 'points-gares-medium', 'points-gares-small'].forEach(layerId => {
                map.on('click', layerId, e => {
                    const props = e.features[0].properties;
                    details(props.nom, props.validations, e.lngLat);
                    map.flyTo({center: e.lngLat, zoom: Math.max(map.getZoom(), 12)});
                });

                map.on('mouseenter', layerId, () => {
                    map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', layerId, () => {
                    map.getCanvas().style.cursor = '';
                });
            });

            // Étiquettes de nom des gares
            map.addLayer({
                id: 'labels-gares',
                type: 'symbol',
                source: 'heatmap-gares',
                minzoom: 11.5,
                layout: {
                    'text-field': ['get', 'nom'],
                    'text-font': ['Fira Sans Bold', 'Arial Unicode MS Bold'],
                    'text-anchor': 'bottom',
                    'text-offset': [0, 0.4],
                    'text-size': ['interpolate', ['linear'], ['zoom'], 10.01, 11, 12, 12, 14, 14]
                },
                paint: {
                    'text-color': '#25303B',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': .5
                }
            });
            // Fermer le loader quand la carte a fini de charger les sources/tuiles
                if (map && typeof map.once === 'function') { // vérifie que map est défini et que la méthode once existe
                    map.once('idle', function () {
                    });
                }
        })
});
/*
* Fin du code aidé par IA.
*/

map.on('click', 'trainLinesLayer', (e) => {
    const lineName = e.features[0].properties.reseau;
    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`${lineName}`)
        .addTo(map);
});

map.on('mouseenter', 'trainLinesLayer', () => {
    map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'trainLinesLayer', () => {
    map.getCanvas().style.cursor = '';
});

map.on('error', (e) => {
    console.error('Mapbox error:', e.error);
});

/**
* Detail for station points, shown in a sidebar.
* @param {string} nom - Station name
 * @param {object} validations - Annual validation count
 * @return {void}
* */
function details(nom, validations) {
    const sidebar = document.getElementById('details');
    if (!sidebar) return;

    const data = JSON.parse(sessionStorage.getItem('garesData'));
    const gareData = data.gares.find(g => g.infos.nom === nom);
    if (!gareData) return;

    sidebar.innerHTML = `
        <div class="detailContent" aria-live="polite" aria-atomic="true" role="dialog" tabindex="-1">
            <h3 class="gare">${nom}</h3>
            <h4>Affluences (par trimestre) : </h4>
            <div class="chart-container">
                <canvas id="chart" width="400" height="250" aria-describedby="chart-desc"></canvas>
                <p class="sr-only" id="chart-desc"></p>
                <p class="info">
                   Le faible nombre de validations au troisième trimestre 2025 s’explique par la période des Jeux Olympiques de Paris 2024, durant laquelle les comptages habituels n’ont pas été réalisés.
                </p>
            </div>
        </div>
        <button class="closeSidebar" aria-label="Fermer les détails" onclick="hideSidebar()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z"/></svg>
        </button>
    `;

    sidebar.classList.add('show');
    sidebarDetails(gareData, sidebar);
}