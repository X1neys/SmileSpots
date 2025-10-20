// Global variables
let map = null;
let userLocation = null;
let markersGroup = null;

// jQuery document ready
$(document).ready(function() {
    console.log('SmileSpots initialized');
    
    // Initialize components
    initializeMap();
    loadLookups();
    bindEventListeners();
    
    // TODO: Add any initial data loading or API calls here
});


function initializeMap() {
    try {
        
        const defaultLat = 10.6749;
        const defaultLng = 122.952;
        
        
        map = L.map('map').setView([defaultLat, defaultLng], 16);
        
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 16
        }).addTo(map);
        
        // Initialize marker group for fetched locations
        window.markerGroup = L.layerGroup().addTo(map);

        // Fetch locations from server and render markers
        fetchLocationsAndRender();

        
    // Hide loading indicator
        $('#mapLoading').addClass('hidden');
        
    // Add some placeholder markers
    // (Now replaced by fetchLocationsAndRender that loads real data)
        
        console.log('Map initialized successfully');
        
    } catch (error) {
        console.error('Error initializing map:', error);
        showMapError();
    }
}

/**
 * Add placeholder markers to demonstrate functionality
 * TODO: Replace with API data
 */
/* function addPlaceholderMarkers() {
    const placeholderLocations = [
        { lat: 40.7505, lng: -73.9934, name: "Times Square Cafe", type: "cafe" },
        { lat: 40.7614, lng: -73.9776, name: "Central Park Bistro", type: "restaurant" },
        { lat: 40.7489, lng: -73.9857, name: "Broadway Bar", type: "bar" },
        { lat: 40.7282, lng: -74.0776, name: "Liberty View Restaurant", type: "restaurant" },
        { lat: 40.7060, lng: -74.0113, name: "Brooklyn Bridge Park", type: "park" },
        { lat: 40.7831, lng: -73.9712, name: "Museum Mile Cafe", type: "museum" }
    ];
    
    placeholderLocations.forEach(location => {
        const marker = L.marker([location.lat, location.lng])
            .bindPopup(`
                <div class="marker-popup">
                    <h3>${location.name}</h3>
                    <p>Type: ${location.type}</p>
                    <button onclick="selectLocation('${location.name}')">Select This Spot</button>
                </div>
            `);
        
        markersGroup.addLayer(marker);
    });
}
    *\

/**
 * Handle location selection from marker popup
 * TODO: Integrate with booking/details system
 */

window.selectLocation = function(locationName) {
    console.log(`Selected location: ${locationName}`);
    // TODO: Open details modal, redirect to booking page, etc.
    alert(`You selected: ${locationName}\n\nTODO: Integrate with booking system`);
}

/**
 * Show map error message
 */
function showMapError() {
    $('#mapLoading').html(`
        <i class="fas fa-exclamation-triangle"></i>
        <span>Unable to load map. Please try again later.</span>
    `).removeClass('hidden');
}

/**
 * Bind all event listeners
 */
function bindEventListeners() {
    // Mobile navigation toggle
    $('.nav-toggle').on('click', toggleMobileNav);
    
    // Location button
    $('#locationBtn').on('click', requestUserLocation);
    
    // Search form submission
    $('.search-form').on('submit', handleSearchSubmit);
    
    // View full map button
    $('#viewFullMapBtn').on('click', handleViewFullMap);
    
    // Coordinate inputs - update map when changed
    $('#latitude, #longitude').on('input', debounce(handleCoordinateChange, 500));
    
    // Form field changes for dynamic filtering
    $('.form-select').on('change', handleFilterChange);
    
    // Handle changes to spotType for sub-category dropdown
    $('#spotType').on('change', handleSpotTypeChange);

    // Handle amenity checkbox changes
    $('input[name="amenity"]').on('change', handleFilterChange);
    
    // Close bindEventListeners
}

/**
 * Request user's current location
 */
function requestUserLocation() {
    const btn = $('#locationBtn');
    const originalContent = btn.html();
    btn.html('<i class="fas fa-spinner fa-spin"></i> Getting Location...').prop('disabled', true);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };

                if (map) {
                    map.setView([userLocation.lat, userLocation.lng], 14);

                    if (window.userMarker && map.hasLayer(window.userMarker)) map.removeLayer(window.userMarker);
                    window.userMarker = L.marker([userLocation.lat, userLocation.lng]).bindPopup('Your Location').addTo(map).openPopup();

                    $('#latitude').val(userLocation.lat.toFixed(6));
                    $('#longitude').val(userLocation.lng.toFixed(6));
                }

                btn.html('<i class="fas fa-check"></i> Location Found').removeClass('btn-primary').addClass('btn-success');
                console.log('User location:', userLocation);

                setTimeout(() => {
                    btn.html(originalContent).prop('disabled', false).removeClass('btn-success').addClass('btn-primary');
                }, 1500);
            },
            function(error) {
                console.error('Geolocation error:', error);
                btn.html('<i class="fas fa-exclamation-triangle"></i> Location Denied').removeClass('btn-primary').addClass('btn-danger');
                setTimeout(() => {
                    btn.html(originalContent).prop('disabled', false).removeClass('btn-danger').addClass('btn-primary');
                }, 2000);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    } else {
        btn.html('<i class="fas fa-exclamation-triangle"></i> Not Supported').removeClass('btn-primary').addClass('btn-warning');
        setTimeout(() => {
            btn.html(originalContent).prop('disabled', false).removeClass('btn-warning').addClass('btn-primary');
        }, 2000);
    }
}
}

/**
 * Handle search form submission
 * TODO: Integrate with search API
 */
function handleSearchSubmit(e) {
    e.preventDefault();
    
    // Collect selected amenity IDs (if amenity inputs were populated dynamically they will use numeric ids)
    const selectedAmenities = [];
    $('#amenitiesGrid input[type="checkbox"]:checked').each(function() {
        selectedAmenities.push($(this).val());
    });
    
    const formData = {
        spotType: $('#spotType').val(),
        subCategory: $('#subCategory').val(),
        distance: $('#distance').val(),
        openNow: $('#openNow').val(),
        amenities: selectedAmenities,
        vibe: $('#vibe').val(),
        latitude: $('#latitude').val(),
        longitude: $('#longitude').val()
    };
    console.log('Search form submitted:', formData); // update map circle size based on selected distance
    // Draw user radius circle if userLocation + distance provided; actual marker filtering is handled by applyClientFilters
    if (userLocation && map && formData.distance) {
        const radiusMeters = parseFloat(formData.distance) || 0;
        if (window.userCircle && map.hasLayer(window.userCircle)) map.removeLayer(window.userCircle);
        window.userCircle = L.circle([userLocation.lat, userLocation.lng], {
            color: '#6B5B95',
            fillColor: '#6B5B95',
            fillOpacity: 0.18,
            radius: radiusMeters
        }).addTo(map);
        if (radiusMeters > 0) map.fitBounds(window.userCircle.getBounds());
    }

    // Show loading state
    const searchBtn = $('.search-btn');
    const originalContent = searchBtn.html();
    searchBtn.html('<i class="fas fa-spinner fa-spin"></i> Searching...').prop('disabled', true);
    
    // Simulate API call
    // TODO: Replace with actual API integration
    setTimeout(() => {
        // Reset button
        searchBtn.html(originalContent).prop('disabled', false);
        // Client-side filtering based on form inputs
        const filtered = applyClientFilters(window.allLocations || [], formData);
        renderLocations(filtered.map(f => f.loc || f));
        updateLocationCount(filtered.length);
        console.log('Search completed (client-filter)');
        
    }, 1500);
}

/**
 * Load lookup data (types, vibes, amenities) from admin endpoint and populate amenities grid
 */
function loadLookups() {
    const url = window.location.origin + '/SmileSpots/adminFolder/getLookups.php';
    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (!data || !data.success) return;
            const amenities = data.amenities || [];
            const grid = document.getElementById('amenitiesGrid');
            if (!grid) return;
            grid.innerHTML = '';
            amenities.forEach(a => {
                const label = document.createElement('label');
                label.className = 'amenity-item';
                label.innerHTML = `<input type="checkbox" name="amenity_dynamic" value="${a.amenity_id}"><span>${escapeHtml(a.amenity_name)}</span>`;
                grid.appendChild(label);
            });
        })
        .catch(err => console.warn('Failed to load lookups', err));
}

/**
 * Apply client-side filters: type, subcategory, amenities (by id), distance
 * Returns an array of either location objects or {loc, distance}
 */
function applyClientFilters(locations, formData) {
    if (!locations) return [];

    const results = [];
    locations.forEach(loc => {
        // Type filter
        if (formData.spotType && formData.spotType !== '') {
            if ((loc.type || '').toLowerCase() !== formData.spotType.toLowerCase()) return;
        }

        // (Mall filter removed) -- if you need mall filtering later, re-add here

        // Subcategory filter: only applicable for Restaurant, Church, Park
        if (formData.subCategory && formData.subCategory !== '') {
            const typeName = (loc.type || '').toLowerCase();
            const allowed = ['restaurant', 'church', 'park'];
            // If the location's type is one of the allowed, enforce subcategory match
            if (allowed.includes(typeName)) {
                if (!loc.subcategory || loc.subcategory.toLowerCase().replace(/\s+/g,'-') !== formData.subCategory.toLowerCase()) return;
            } else {
                // Otherwise, ignore subcategory filter for this location (it should be null)
            }
        }

        // Amenities filter: formData.amenities contains amenity IDs (strings)
        if (formData.amenities && formData.amenities.length) {
            const locAmenityIds = (loc.amenities || []).map(a => String(a.amenity_id));
            // require all selected amenities to be present
            const allPresent = formData.amenities.every(aid => locAmenityIds.indexOf(String(aid)) !== -1);
            if (!allPresent) return;
        }

        // Distance filter (if userLocation and distance set)
        if (formData.distance && formData.distance !== '' && userLocation) {
            const dKm = Utils.calculateDistance(userLocation.lat, userLocation.lng, loc.latitude, loc.longitude);
            const dMeters = dKm * 1000;
            const maxMeters = parseFloat(formData.distance) || 0;
            if (maxMeters > 0 && dMeters > maxMeters) return;
            results.push({ loc, distance: dKm });
            return;
        }

        // If distance not applied, push loc only
        results.push(loc);
    });

    // If user location exists and we have distances included, sort by distance
    if (userLocation) {
        // Normalize to items with distance
        const withDist = results.map(r => (r.loc ? r : { loc: r, distance: null }));
        // If distances are null compute them
        withDist.forEach(item => {
            if (item.distance === null) {
                item.distance = Utils.calculateDistance(userLocation.lat, userLocation.lng, item.loc.latitude, item.loc.longitude);
            }
        });
        // sort by distance
        withDist.sort((a,b) => a.distance - b.distance);
        return withDist;
    }

    return results;
}

/**
 * Handle view full map button click
 * TODO: Implement full-screen map or redirect to dedicated map page
 */
function handleViewFullMap() {
    
    // Use the outer .map-container for fullscreen so header, padding and layout remain consistent.
    const mapEl = document.getElementById('map');
    const mapContainer = mapEl ? mapEl.closest('.map-container') : document.querySelector('.map-container');

    if (!mapContainer) return;

    // if already fullscreen → exit fullscreen
    if (mapContainer.classList.contains('fullscreen-map')) {
        mapContainer.classList.remove('fullscreen-map');
        const exitBtn = document.getElementById('exitFullscreenBtn');
        if (exitBtn) exitBtn.remove();
        const leafletContainer = document.querySelector('.leaflet-container');
        if (leafletContainer) leafletContainer.classList.remove('fullscreen-map');
        // Restore scrolling
        document.body.style.overflow = '';
        // remove dynamic top offset
        mapContainer.style.top = '';

        // restore map size after a short delay to allow layout to settle
        setTimeout(() => map.invalidateSize(), 120);
        return;
    }

    // go fullscreen by adding class to the outer container
    mapContainer.classList.add('fullscreen-map');
    // Calculate header height dynamically and apply as top offset
    const header = document.querySelector('.header');
    const headerHeight = header ? header.getBoundingClientRect().height : 95;
    mapContainer.style.top = `${headerHeight}px`;

    // SAVE previous layout-related inline styles so we can restore them on exit
    const prev = {
        margin: mapContainer.style.margin || '',
        left: mapContainer.style.left || '',
        width: mapContainer.style.width || '',
        borderRadius: mapContainer.style.borderRadius || ''
    };
    mapContainer.dataset.prevStyles = JSON.stringify(prev);

    // Force the container to cover full width (remove side margins) and remove rounded corners
    mapContainer.style.left = '0';
    mapContainer.style.margin = '0';
    mapContainer.style.width = '100%';
    mapContainer.style.borderRadius = '0';
    // Also add class to the leaflet container for CSS targeting
    const leafletContainer = document.querySelector('.leaflet-container');
    if (leafletContainer) leafletContainer.classList.add('fullscreen-map');

    // Prevent body scrolling while fullscreen
    document.body.style.overflow = 'hidden';

    // Wait a tick so layout updates, then force leaflet to recalc map dimensions
    setTimeout(() => map.invalidateSize(), 120);

    // add exit button and position it below the header so it's visible
    const exitBtn = document.createElement('button');
    exitBtn.id = 'exitFullscreenBtn';
    exitBtn.className = 'exit-fullscreen-btn';
    exitBtn.textContent = 'Exit Fullscreen';
    // position below header
    exitBtn.style.top = `${headerHeight + 12}px`;
    document.body.appendChild(exitBtn);

    // Add Escape key listener to exit fullscreen
    function escListener(e) {
        if (e.key === 'Escape') {
            exitBtn.click();
        }
    }
    document.addEventListener('keydown', escListener);

    // exit when button clicked
    exitBtn.addEventListener('click', () => {
        mapContainer.classList.remove('fullscreen-map');
        // remove dynamic top offset
        mapContainer.style.top = '';
        if (leafletContainer) leafletContainer.classList.remove('fullscreen-map');
        // Restore previously-saved styles
        if (mapContainer.dataset.prevStyles) {
            try {
                const s = JSON.parse(mapContainer.dataset.prevStyles);
                mapContainer.style.margin = s.margin || '';
                mapContainer.style.left = s.left || '';
                mapContainer.style.width = s.width || '';
                mapContainer.style.borderRadius = s.borderRadius || '';
            } catch (err) {
                // ignore
            }
            delete mapContainer.dataset.prevStyles;
        }
        exitBtn.remove();
        // Restore scrolling
        document.body.style.overflow = '';
        // Remove escape listener
        document.removeEventListener('keydown', escListener);
        // Delay invalidate so the DOM has time to revert layout
        setTimeout(() => map.invalidateSize(), 120);
    });
}
    
    


/**
 * Handle coordinate input changes
 */
function handleCoordinateChange() {
    const lat = parseFloat($('#latitude').val());
    const lng = parseFloat($('#longitude').val());
    
    // Validate coordinates
    if (isValidCoordinate(lat, lng)) {
        // Update map view
        if (map) {
            map.setView([lat, lng], 14);
            
            // Clear existing user marker and add new one
            // TODO: Implement proper marker management
            console.log(`Map updated to coordinates: ${lat}, ${lng}`);
        }
    }
}

/**
 * Handle filter changes for dynamic search
 * TODO: Implement real-time filtering
 */
function handleFilterChange() {
    const changedField = $(this);
    const value = changedField.val();
    const fieldName = changedField.attr('id');
    
    console.log(`Filter changed: ${fieldName} = ${value}`);
    
    // TODO: Implement real-time filtering based on form changes
    // This could trigger immediate map updates or mark the form as "dirty"
    
    // Example: Update location count based on filters
    // updateLocationCount();
}

/**
 * Handle spot type change to populate sub-category dropdown
 */
function handleSpotTypeChange() {
    const spotType = $('#spotType').val();
    const subCategorySelect = $('#subCategory');
    subCategorySelect.empty();
    subCategorySelect.append('<option value="">Sub Category</option>'); // Default option

    let options = [];
    switch (spotType) {
        case 'restaurant':
            options = ['Filipino', 'Japanese', 'Fast food', 'Sea food'];
            break;
        case 'church':
            options = ['Iglesia', 'Christian', 'Catholic', 'Baptist', 'Mormons'];
            break;
        case 'park':
            options = ['Amusement Park', 'Water Park', 'Greenspace'];
            break;
        default:
            // For other types, no sub-categories
            subCategorySelect.prop('disabled', true);
            return;
    }

    options.forEach(optionText => {
        subCategorySelect.append(`<option value="${optionText.toLowerCase().replace(' ', '-')}">${optionText}</option>`);
    });

    subCategorySelect.prop('disabled', false);
}

/**
 * Validate coordinate values
 */
function isValidCoordinate(lat, lng) {
    return !isNaN(lat) && !isNaN(lng) && 
        lat >= -90 && lat <= 90 && 
        lng >= -180 && lng <= 180;
}

/**
 * Debounce function to limit API calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Update location count display
 * TODO: Connect to actual search results
 */
function updateLocationCount(count = null) {
    if (count !== null) {
        $('#locationCount').text(count);
    }
    
    // TODO: Update based on current filters and search results
}

/**
 * Error handling and user feedback
 */
function showError(message, type = 'error') {
    // TODO: Implement toast notifications or error banner
    console.error('Error:', message);
    
    // For now, use console and alert
    // In production, implement proper user feedback system
    if (type === 'error') {
        alert(`Error: ${message}`);
    }
}

/**
 * Analytics and tracking functions
 * TODO: Implement Google Analytics, Mixpanel, or similar
 */
function trackEvent(eventName, properties = {}) {
    console.log('Analytics event:', eventName, properties);
    
    // TODO: Integrate with analytics service
    // Example: gtag('event', eventName, properties);
    // Example: mixpanel.track(eventName, properties);
}

/**
 * API Helper Functions
 * TODO: Implement when backend is available
 */
const API = {
    baseUrl: '/api/v1', // TODO: Update with actual API URL
    
    // TODO: Implement API methods
    search: function(params) {
        // return fetch(`${this.baseUrl}/search`, { ... });
        console.log('API search called with:', params);
    },
    
    getLocation: function(id) {
        // return fetch(`${this.baseUrl}/locations/${id}`);
        console.log('API getLocation called with ID:', id);
    },
    
    getNearbyLocations: function(lat, lng, radius) {
        // return fetch(`${this.baseUrl}/locations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
        console.log('API getNearbyLocations called:', { lat, lng, radius });
    }
};

/**
 * Utility functions
 */
const Utils = {
    // Format coordinates for display
    formatCoordinate: function(coord, precision = 4) {
        return parseFloat(coord).toFixed(precision);
    },
    
    // Calculate distance between two points
    calculateDistance: function(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in kilometers
    },
    
    deg2rad: function(deg) {
        return deg * (Math.PI/180);
    },
    
    // Format distance for display
    formatDistance: function(km) {
        if (km < 1) {
            return `${Math.round(km * 1000)}m`;
        }
        return `${km.toFixed(1)}km`;
    }
};

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API, Utils };
}

// ------------------------------------------------------------------
// FETCH & RENDER LOCATIONS FROM SERVER
// - Calls mainFolder/getLocations.php and renders markers on the map
// ------------------------------------------------------------------
function fetchLocationsAndRender() {
    // Build URL relative to current site
    const url = window.location.origin + '/SmileSpots/mainFolder/getLocations.php';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (!data || data.success !== true) {
                console.warn('getLocations returned unexpected data', data);
                updateLocationCount(0);
                return;
            }

            const locations = data.locations || [];
            // Store master list for client-side filtering but do not render markers until user searches
            window.allLocations = locations;
            // Do not render all markers by default — keep map clean until a search is performed
            updateLocationCount(0);
        })
        .catch(err => {
            console.error('Failed to fetch locations:', err);
            updateLocationCount(0);
        });
}

function renderLocations(locations) {
    if (!map) return;

    // Clear existing markers
    if (!window.markerGroup) window.markerGroup = L.layerGroup().addTo(map);
    window.markerGroup.clearLayers();

    // Keep a mapping of location id -> marker for easy access
    window.locationMarkers = window.locationMarkers || {};
    window.locationMarkers = {}; // reset

    locations.forEach(loc => {
        if (!loc.latitude || !loc.longitude) return;

        const marker = L.marker([loc.latitude, loc.longitude])
            .bindPopup(`
                <div class="marker-popup">
                    <h3>${escapeHtml(loc.name)}</h3>
                    <p>${escapeHtml(loc.type || '')} ${loc.subcategory ? ' - ' + escapeHtml(loc.subcategory) : ''}</p>
                    <p>${escapeHtml(loc.description || '')}</p>
                </div>
            `);

        window.markerGroup.addLayer(marker);
        window.locationMarkers[loc.id] = marker;
    });

    // Also render the left-hand results list if present
    renderResultsList(locations);
}

/**
 * Render the left-hand search results list. Each result is clickable and will isolate the marker.
 */
function renderResultsList(locations) {
    const container = document.getElementById('resultsList');
    if (!container) return;

    container.innerHTML = '';

    if (!locations || locations.length === 0) {
        container.innerHTML = '<div class="results-empty">No results found</div>';
        return;
    }

    // If we have a user location, compute distance and sort by proximity using a PQ
    let ordered = locations;
    if (userLocation) {
        const pq = new PriorityQueue((a, b) => a.distance - b.distance);
        locations.forEach(loc => {
            const dKm = Utils.calculateDistance(userLocation.lat, userLocation.lng, loc.latitude, loc.longitude);
            pq.push({ loc, distance: dKm });
        });
        ordered = [];
        while (!pq.isEmpty()) {
            ordered.push(pq.pop());
        }
        // pq items contain {loc, distance}
    }

    // Helper to iterate over ordered list (which may be plain locations or pq items)
    const iterate = ordered.map(item => (item.loc ? item : { loc: item, distance: null }));

    iterate.forEach(entry => {
        const loc = entry.loc;
        const distanceKm = entry.distance;
        const div = document.createElement('div');
        div.className = 'result-item';
        div.dataset.id = loc.id;
        // Expose type/category for later styling or custom marker assignment
        div.dataset.type = (loc.type || '').toLowerCase();

        const title = document.createElement('h4');
        title.textContent = loc.name;
        div.appendChild(title);

        const meta = document.createElement('div');
        meta.className = 'result-meta';
        meta.innerHTML = `${escapeHtml(loc.type || '')} ${loc.subcategory ? ' - ' + escapeHtml(loc.subcategory) : ''}`;
        div.appendChild(meta);

        // Distance display (if computed)
        if (distanceKm !== null && distanceKm !== undefined) {
            const distEl = document.createElement('div');
            distEl.className = 'result-distance';
            // show meters if under 1 km
            distEl.textContent = Utils.formatDistance(distanceKm);
            div.appendChild(distEl);
        }

        const desc = document.createElement('p');
        desc.className = 'result-desc';
        desc.textContent = loc.description || '';
        div.appendChild(desc);

        // Amenities list (if available)
        if (loc.amenities && loc.amenities.length) {
            const aWrap = document.createElement('div');
            aWrap.className = 'result-amenities';
            loc.amenities.forEach(a => {
                const span = document.createElement('span');
                span.className = 'amenity-pill';
                span.textContent = a.amenity_name;
                aWrap.appendChild(span);
            });
            div.appendChild(aWrap);
        }

        div.addEventListener('click', () => {
            focusResult(loc.id);
        });

        container.appendChild(div);
    });
}

/**
 * Focus a single result by id: pan to marker, open popup, isolate it, and draw a path from user location if available.
 */
function focusResult(locationId) {
    const loc = (window.allLocations || []).find(l => Number(l.id) === Number(locationId));
    if (!loc) return;

    // Clear any existing polylines
    if (window.currentPolyline) {
        if (map.hasLayer(window.currentPolyline)) map.removeLayer(window.currentPolyline);
        window.currentPolyline = null;
    }

    const marker = (window.locationMarkers || {})[loc.id];
    if (!marker) return;

    // Open popup and pan to marker
    marker.openPopup();
    map.setView([loc.latitude, loc.longitude], 17);

    // Isolate: remove other markers temporarily by hiding the markerGroup and adding only this marker to a temp group
    if (window.tempLayer) {
        window.tempLayer.clearLayers();
        map.removeLayer(window.tempLayer);
    }
    window.tempLayer = L.layerGroup().addTo(map);
    const single = L.marker([loc.latitude, loc.longitude]).addTo(window.tempLayer).bindPopup(marker.getPopup().getContent()).openPopup();

    // Draw polyline from user location to the selected location (if user location exists)
    if (userLocation) {
        const polyline = L.polyline([
            [userLocation.lat, userLocation.lng],
            [loc.latitude, loc.longitude]
        ], { color: '#007bff', weight: 3, opacity: 0.8 }).addTo(map);
        window.currentPolyline = polyline;
    }

    // Add a small control to restore full markers view after inspection
    addRestoreResultsControl();
}

function addRestoreResultsControl() {
    // If control already exists, don't add another
    if (document.getElementById('restoreResultsBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'restoreResultsBtn';
    btn.className = 'restore-results-btn';
    btn.textContent = 'Show All Results';
    btn.addEventListener('click', () => {
        // Remove temp layer and polyline
        if (window.tempLayer) {
            window.tempLayer.clearLayers();
            map.removeLayer(window.tempLayer);
            window.tempLayer = null;
        }
        if (window.currentPolyline) {
            if (map.hasLayer(window.currentPolyline)) map.removeLayer(window.currentPolyline);
            window.currentPolyline = null;
        }

        // Re-render full marker group
        if (window.allLocations) renderLocations(window.allLocations);

        // Remove button
        const b = document.getElementById('restoreResultsBtn');
        if (b) b.remove();
    });

    // Append to map container
    const mapContainer = document.querySelector('.map-container') || document.body;
    mapContainer.appendChild(btn);
}

// Small helper to avoid inserting raw HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe).replace(/[&<>"'`]/g, function (s) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '`': '&#96;'
        })[s];
    });
}

// Simple binary-heap Priority Queue (min-heap) for numeric keys
class PriorityQueue {
    constructor(comparator = (a, b) => a - b) {
        this._heap = [];
        this._comparator = comparator;
    }
    size() { return this._heap.length; }
    isEmpty() { return this.size() === 0; }
    peek() { return this._heap[0]; }
    push(value) {
        this._heap.push(value);
        this._siftUp();
    }
    pop() {
        const top = this.peek();
        const bottom = this._heap.pop();
        if (this.size() > 0) {
            this._heap[0] = bottom;
            this._siftDown();
        }
        return top;
    }
    _parent(idx) { return Math.floor((idx - 1) / 2); }
    _left(idx) { return idx * 2 + 1; }
    _right(idx) { return idx * 2 + 2; }
    _siftUp() {
        let node = this.size() - 1;
        while (node > 0 && this._comparator(this._heap[node], this._heap[this._parent(node)]) < 0) {
            this._swap(node, this._parent(node));
            node = this._parent(node);
        }
    }
    _siftDown() {
        let node = 0;
        while (
            (this._left(node) < this.size() && this._comparator(this._heap[this._left(node)], this._heap[node]) < 0) ||
            (this._right(node) < this.size() && this._comparator(this._heap[this._right(node)], this._heap[node]) < 0)
        ) {
            let smallerChild = (this._right(node) < this.size() && this._comparator(this._heap[this._right(node)], this._heap[this._left(node)]) < 0)
                ? this._right(node)
                : this._left(node);
            this._swap(node, smallerChild);
            node = smallerChild;
        }
    }
    _swap(i, j) { [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]]; }
}
