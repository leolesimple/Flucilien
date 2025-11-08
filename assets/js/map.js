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
        .catch(error => console.error('Erreur chargement GeoJSON :', error));

    // Use the return of fetchAndMergeData() instead of fetching resultat_merge.json
    if (typeof fetchAndMergeData !== 'function') {
        console.error('fetchAndMergeData is not available. Ensure app.js is loaded before map.js.');
        return;
    }

    fetchAndMergeData()
        .then(resultat => {
            const features = [];

            // Robust helpers to extract coords and validation counts from varied structures
            function parseCoords(info = {}) {
                const raw = info.Coordonnees || info.coordonnees || info.coordinates || info.coords || info.coord || null;
                if (!raw) return null;

                // string "lat,lon" or "lon,lat"
                if (typeof raw === 'string') {
                    const parts = raw.split(/[;,]/).map(s => Number(s.trim()));
                    if (parts.length >= 2 && parts.every(n => !isNaN(n))) {
                        // guess order: if first looks like latitude (abs<=90) use [lat,lon]
                        const [a, b] = parts;
                        if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return {lat: a, lon: b};
                        return {lat: b, lon: a};
                    }
                    return null;
                }

                // array [lat, lon] or [lon, lat]
                if (Array.isArray(raw) && raw.length >= 2) {
                    const a = Number(raw[0]), b = Number(raw[1]);
                    if (!isNaN(a) && !isNaN(b)) {
                        if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return {lat: a, lon: b};
                        return {lat: b, lon: a};
                    }
                    return null;
                }

                // object with possible keys
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
                // pick the largest (assume totals or biggest quarter)
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
                    console.warn('Skipping gare (missing coords or validations):', {
                        id: g.id ?? g.code ?? null,
                        inferredCoords: coords,
                        inferredValidations: validations,
                        raw: g
                    });
                }
            });

            const geojson = {
                type: 'FeatureCollection',
                features: features
            };

            // Add or update source (avoid errors if source already exists)
            if (map.getSource && map.getSource('heatmap-gares')) {
                map.getSource('heatmap-gares').setData(geojson);
            } else {
                map.addSource('heatmap-gares', {
                    type: 'geojson',
                    data: geojson
                });
            }

            // Heatmap recalibrated for large validation counts (up to ~20.6M)
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

            // Replace previous 3 layers with 4 tiers adapted to large volumes

            // MEGA (>= 10,000,000) — visible earliest
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
                    'circle-color': '#b10026',
                    'circle-opacity': 0.9,
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 0.8
                }
            });

            // LARGE (1,000,000–9,999,999)
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
                    'circle-color': '#e31a1c',
                    'circle-opacity': 0.9,
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 0.6
                }
            });

            // MEDIUM (100,000–999,999)
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
                    'circle-color': '#fd8d3c',
                    'circle-opacity': 0.9,
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 0.5
                }
            });

            // SMALL (< 100,000) — only when zoomed in more
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
                    'circle-color': '#fdae6b',
                    'circle-opacity': 0.9,
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 0.5
                }
            });

            // Bind click popup and cursor behaviour for point layers (no hover name)
            ['points-gares-mega', 'points-gares-large', 'points-gares-medium', 'points-gares-small'].forEach(layerId => {
                // Click: detailed popup (unchanged)
                map.on('click', layerId, e => {
                    const props = e.features[0].properties;
                    new mapboxgl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(`<strong>${props.nom}</strong><br>${props.validations} validations`)
                        .addTo(map);
                });

                // Only change cursor on enter/leave; do not show name on hover
                map.on('mouseenter', layerId, () => {
                    map.getCanvas().style.cursor = 'pointer';
                });
                map.on('mouseleave', layerId, () => {
                    map.getCanvas().style.cursor = '';
                });
            });

            // Labels: show station name above the point when zoom > 10
            map.addLayer({
                id: 'labels-gares',
                type: 'symbol',
                source: 'heatmap-gares',
                // use a fractional minzoom so labels appear only when zoom is strictly greater than 10
                minzoom: 11.5,
                layout: {
                    'text-field': ['get', 'nom'],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    // anchor bottom so text sits above the point
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
        })
        .catch(err => console.error('Erreur heatmap :', err));
});

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