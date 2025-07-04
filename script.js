document.addEventListener('DOMContentLoaded', () => {
    // Smooth Scrolling for Navigation
    document.querySelectorAll('nav ul li a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            window.scrollTo({
                top: targetElement.offsetTop - 60,
                behavior: 'smooth'
            });
        });
    });

    // Project Filter (non-functional due to missing filter buttons)
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.getAttribute('data-filter');

            projectCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Contact Form Validation
    const contactForm = document.getElementById('contact-form');
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = this.querySelector('input[name="name"]').value.trim();
        const email = this.querySelector('input[name="email"]').value.trim();
        const message = this.querySelector('textarea[name="message"]').value.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (name.length < 2) {
            alert('Name must be at least 2 characters long.');
            return;
        }

        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        if (message.length < 10) {
            alert('Message must be at least 10 characters long.');
            return;
        }

        this.submit();
    });

    // Initialize Leaflet Map with multiple base layers
    try {
        const map = L.map('map-container', { layers: [] }).setView([26.6067, 87.1483], 12);

        // Define base layers
        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri | Source: Esri, Maxar, Earthstar Geographics'
        });

        const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© <a href="https://carto.com/attributions">CARTO</a>'
        });

        // Add base layers to layer control
        const baseLayers = {
            "OpenStreetMap": osm,
            "Satellite": satellite,
            "CartoDark": cartoDark
        };

        L.control.layers(baseLayers).addTo(map);

        // Set OpenStreetMap as default
        osm.addTo(map);

        // Define spatial features for Inaruwa Municipality
        const inaruwaPoint = turf.point([87.1483, 26.6067]);
        const inaruwaPolygon = turf.polygon([[
            [87.13, 26.59], [87.17, 26.59], [87.17, 26.62], [87.13, 26.62], [87.13, 26.59]
        ]]);

        // Buffer Analysis
        const buffered = turf.buffer(inaruwaPoint, 5, { units: 'kilometers' });
        L.geoJSON(buffered, {
            style: { color: '#ff7800', fillColor: '#ff7800', fillOpacity: 0.2 }
        }).addTo(map);
        console.log('Buffer Analysis (5km) completed for Inaruwa');

        // Point-in-Polygon Analysis
        const isInside = turf.booleanPointInPolygon(inaruwaPoint, inaruwaPolygon);
        L.geoJSON(inaruwaPolygon, {
            style: { color: '#0f0', fillOpacity: 0.1 }
        }).addTo(map);
        L.marker(inaruwaPoint.geometry.coordinates.reverse()).addTo(map)
            .bindPopup(`Point in Polygon: ${isInside}`).openPopup();
        console.log('Point in Polygon Result:', isInside);

        // Add .com.np data source reference
        L.control.attribution({
            prefix: 'Data from <a href="https://inaruwa-map.com.np">inaruwa-map.com.np</a>'
        }).addTo(map);

        // Interactive Distance Measurement Tool
        let measureControl = null;
        let measureLayer = L.featureGroup().addTo(map);
        let measurePoints = [];
        let isMeasuring = false;

        document.getElementById('measure-toggle').addEventListener('click', () => {
            if (!isMeasuring) {
                isMeasuring = true;
                measureLayer.clearLayers();
                measurePoints = [];
                map.on('click', onMapClick);
                document.getElementById('measure-toggle').textContent = 'Finish Measuring';
            } else {
                isMeasuring = false;
                map.off('click', onMapClick);
                measureLayer.clearLayers();
                measurePoints = [];
                document.getElementById('measure-toggle').textContent = 'Toggle Distance Tool';
            }
        });

        function onMapClick(e) {
            measurePoints.push(e.latlng);
            measureLayer.clearLayers();

            const totalDistance = measurePoints.reduce((total, current, index) => {
                if (index > 0) {
                    const prevPoint = measurePoints[index - 1];
                    return total + turf.distance(
                        [prevPoint.lng, prevPoint.lat],
                        [current.lng, current.lat],
                        { units: 'kilometers' }
                    );
                }
                return total;
            }, 0);

            measurePoints.forEach((point, index) => {
                const marker = L.marker(point, { icon: L.divIcon({ className: 'custom-marker', html: '<div style="background-color: #006400; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #006400;"></div>' }) })
                    .addTo(measureLayer)
                    .bindPopup(`Point ${index + 1}`);
                if (index === measurePoints.length - 1) {
                    marker.bindPopup(`Point ${index + 1} (Total Distance: ${totalDistance.toFixed(2)} km)`).openPopup();
                }
            });

            if (measurePoints.length > 1) {
                const lineCoords = measurePoints.map(p => [p.lat, p.lng]);
                L.polyline(lineCoords, { color: '#ff0000', weight: 3 }).addTo(measureLayer);
            }
        }

    } catch (error) {
        console.error('Map initialization failed:', error);
    }
});