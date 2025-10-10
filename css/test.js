if (userLocation && map) {
    const distanceMiles = parseFloat($('#distance').val()) || 0.1;
    const radiusMeters = distanceMiles * 1609.34;

    // remove old circle if exists
    if (window.userCircle) map.removeLayer(window.userCircle);

    // draw purple geofence circle
    window.userCircle = L.circle([userLocation.lat, userLocation.lng], {
        color: '#6B5B95',
        fillColor: '#6B5B95',
        fillOpacity: 0.3,
        radius: radiusMeters
    }).addTo(map);

    // clear old markers
    window.markerClusterGroup.clearLayers();

    // add only markers within the circle radius
    window.allMarkers.forEach(location => {
        const distance = Utils.calculateDistance(
            userLocation.lat, userLocation.lng,
            location.lat, location.lng
        );
        const distanceMeters = distance * 1000;

        if (distanceMeters <= radiusMeters) {
            const marker = L.marker([location.lat, location.lng])
                .bindPopup(`
                    <strong>${location.name}</strong><br>
                    Type: ${location.type}<br>
                    Distance: ${Utils.formatDistance(distance)}
                `);
            window.markerClusterGroup.addLayer(marker);
        }
    });

    // fit map to the circle bounds
    map.fitBounds(window.userCircle.getBounds());
}