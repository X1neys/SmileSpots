// Global variables
let map = null;
let userLocation = null;
let markersGroup = null;
// store all fetched locations globally for filtering and rendering
window.allMarkers = window.allMarkers || [];

// jQuery document ready
$(document).ready(function() {
    console.log('SmileSpots initialized');
    
    // Initialize components
    initializeMap();
    bindEventListeners();
    
    // TODO: Add any initial data loading or API calls here
});

// Icon registry: map spot type -> Leaflet Icon
const ICONS = {};
function ensureIcons() {
    if (Object.keys(ICONS).length) return ICONS;
    const basePath = window.location.origin + '/SmileSpots/assets/';
    ICONS['restaurant'] = L.icon({ iconUrl: basePath + 'cafeMarker.png', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -36] });
    ICONS['cafe'] = L.icon({ iconUrl: basePath + 'cafeMarker.png', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -36] });
    ICONS['church'] = L.icon({ iconUrl: basePath + 'churchMarker.png', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -36] });
    ICONS['bar'] = L.icon({ iconUrl: basePath + 'barMarker.png', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -36] });
    ICONS['park'] = L.icon({ iconUrl: basePath + 'parkMarker.png', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -36] });
    ICONS['museum'] = L.icon({ iconUrl: basePath + 'museumMarker.png', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -36] });
    ICONS['mall'] = L.icon({ iconUrl: basePath + 'mallMarker.png', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -36] });
    ICONS['default'] = L.icon({ iconUrl: basePath + 'SmileSpots.png', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -36] });
    ICONS['user'] = L.icon({ iconUrl: basePath + 'youMarker.png', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -12] });
    return ICONS;
}


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
    
    // Close mobile nav when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.nav').length) {
            $('.nav-list').removeClass('active');
        }
    });
    
    // Keyboard navigation for accessibility
    $('.nav-toggle').on('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMobileNav();
        }
    });
}

/**
 * Toggle mobile navigation
 */
function toggleMobileNav() {
    $('.nav-list').toggleClass('active');
    const isOpen = $('.nav-list').hasClass('active');
    
    // Update ARIA attributes for accessibility
    $('.nav-toggle').attr('aria-expanded', isOpen);
    
    // Update icon
    const icon = $('.nav-toggle i');
    if (isOpen) {
        icon.removeClass('fa-bars').addClass('fa-times');
    } else {
        icon.removeClass('fa-times').addClass('fa-bars');
    }
}

/**
 * Request user's current location
 */
function requestUserLocation() {
    const btn = $('#locationBtn');
    const originalContent = btn.html();
    
    // Show loading state
    btn.html('<i class="fas fa-spinner fa-spin"></i> Getting Location...').prop('disabled', true);
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Update map view
                if (map) {
                    map.setView([userLocation.lat, userLocation.lng], 14);
                    
                    // Add user location marker
                    if (window.userMarker && map.hasLayer(window.userMarker)) {
                        map.removeLayer(window.userMarker);
                    }

                    // add the new marker only
                    ensureIcons();
                    window.userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: ICONS['user'] })
                        .bindPopup('Your Location')
                        .openPopup()
                        .addTo(map);
                    
                    // Update coordinate inputs
                    $('#latitude').val(userLocation.lat.toFixed(6));
                    $('#longitude').val(userLocation.lng.toFixed(6));
                }
                
                // Success state
                btn.html('<i class="fas fa-check"></i> Location Found').removeClass('btn-primary').addClass('btn-success');
                
                
                // TODO: Trigger search with user's location
                console.log('User location:', userLocation);
                
                // Reset button after delay
                setTimeout(() => {
                    btn.html(originalContent).prop('disabled', false).removeClass('btn-success').addClass('btn-primary');
                }, 2000);
            },
            function(error) {
                console.error('Geolocation error:', error);
                
                // Error state
                btn.html('<i class="fas fa-exclamation-triangle"></i> Location Denied').removeClass('btn-primary').addClass('btn-danger');
                
                // Reset button after delay
                setTimeout(() => {
                    btn.html(originalContent).prop('disabled', false).removeClass('btn-danger').addClass('btn-primary');
                }, 3000);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    } else {
        // Geolocation not supported
        btn.html('<i class="fas fa-exclamation-triangle"></i> Not Supported').removeClass('btn-primary').addClass('btn-warning');
        
        setTimeout(() => {
            btn.html(originalContent).prop('disabled', false).removeClass('btn-warning').addClass('btn-primary');
        }, 3000);
    }
}

// NOTE: search handling and results rendering moved below to the consolidated implementation

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

/**
 * Simple min-heap PriorityQueue for ranking by distance.
 * Usage: const pq = new PriorityQueue((a,b) => a.distance_km - b.distance_km);
 * push items, then pop repeatedly to get ascending order.
 */
class PriorityQueue {
    constructor(comparator = (a, b) => a - b) {
        this._heap = [];
        this._comparator = comparator;
    }
    size() { return this._heap.length; }
    isEmpty() { return this.size() === 0; }
    peek() { return this._heap[0]; }
    push(...values) {
        values.forEach(value => {
            this._heap.push(value);
            this._siftUp();
        });
        return this.size();
    }
    pop() {
        const poppedValue = this.peek();
        const bottom = this.size() - 1;
        if (bottom > 0) {
            this._swap(0, bottom);
        }
        this._heap.pop();
        this._siftDown();
        return poppedValue;
    }
    _greater(i, j) {
        return this._comparator(this._heap[i], this._heap[j]) > 0;
    }
    _swap(i, j) {
        [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
    }
    _siftUp() {
        let node = this.size() - 1;
        while (node > 0 && this._greater(Math.floor((node - 1) / 2), node)) {
            this._swap(node, Math.floor((node - 1) / 2));
            node = Math.floor((node - 1) / 2);
        }
    }
    _siftDown() {
        let node = 0;
        while (
            (2 * node + 1 < this.size() && this._greater(node, 2 * node + 1)) ||
            (2 * node + 2 < this.size() && this._greater(node, 2 * node + 2))
        ) {
            let maxChild = (2 * node + 2 < this.size() && this._greater(2 * node + 1, 2 * node + 2)) ? 2 * node + 2 : 2 * node + 1;
            this._swap(node, maxChild);
            node = maxChild;
        }
    }
}

/**
 * Rank an array of locations by distance from a reference point.
 * Adds `distance_km` to each location and returns a new array sorted ascending.
 */
function rankByDistance(locations, ref) {
    if (!ref || !locations || locations.length === 0) return locations || [];
    const pq = new PriorityQueue((a, b) => a.distance_km - b.distance_km);
    locations.forEach(loc => {
        if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
            // explicit lat/lng order: (lat1, lon1, lat2, lon2)
            loc.distance_km = Utils.calculateDistance(ref.lat, ref.lng, loc.latitude, loc.longitude);
        } else {
            loc.distance_km = Infinity;
        }
        pq.push(loc);
    });
    const out = [];
    while (!pq.isEmpty()) out.push(pq.pop());
    return out;
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
            // normalize numeric lat/lng
            locations.forEach(loc => {
                loc.latitude = parseFloat(loc.latitude);
                loc.longitude = parseFloat(loc.longitude);
            });
            window.allMarkers = locations;
            // If we have a user location or a visible map center, rank by distance
            const ref = userLocation ? userLocation : (map ? map.getCenter() : null);
            const ordered = ref ? rankByDistance(locations, { lat: ref.lat, lng: ref.lng }) : locations;
            renderLocations(ordered);
            renderResultsList(ordered);
            updateLocationCount(ordered.length);
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

    locations.forEach(loc => {
        if (!loc.latitude || !loc.longitude) return;
        // choose icon by type or subcategory
        ensureIcons();
        const typeKey = (loc.type || '').toString().toLowerCase();
        const icon = ICONS[typeKey] || ICONS[loc.subcategory] || ICONS['default'];

        const marker = L.marker([loc.latitude, loc.longitude], { icon: icon })
            .bindPopup(`
                <div class="marker-popup">
                    <h3>${escapeHtml(loc.name)}</h3>
                    <p>${escapeHtml(loc.type || '')} ${loc.subcategory ? ' - ' + escapeHtml(loc.subcategory) : ''}</p>
                    <p>${escapeHtml(loc.description || '')}</p>
                </div>
            `);

        window.markerGroup.addLayer(marker);
    });
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

// Render a vertical list of result cards (left panel)
function renderResultsList(locations) {
    const container = document.getElementById('resultsList');
    if (!container) return;
    container.innerHTML = '';

    if (!locations || locations.length === 0) {
        container.innerHTML = '<p class="no-results">No locations found.</p>';
        return;
    }

    locations.forEach((loc, idx) => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.dataset.index = idx;

        // compute distance from userLocation or map center (use precomputed distance_km when available)
        const ref = userLocation ? userLocation : (map ? map.getCenter() : null);
        let distanceText = '';
        if (typeof loc.distance_km === 'number' && isFinite(loc.distance_km)) {
            distanceText = Utils.formatDistance(loc.distance_km);
        } else if (ref && loc.latitude && loc.longitude) {
            const km = Utils.calculateDistance(ref.lat, ref.lng, loc.latitude, loc.longitude);
            distanceText = Utils.formatDistance(km);
        }

        card.innerHTML = `
            <h4 class="result-name">${escapeHtml(loc.name || 'Unnamed')}</h4>
            <p class="result-type">${escapeHtml(loc.type || '')} ${loc.subcategory ? ' - ' + escapeHtml(loc.subcategory) : ''}</p>
            <p class="result-desc">${escapeHtml(loc.description || '')}</p>
            <div class="result-meta">
                <span class="result-distance">${distanceText}</span>
                <button class="result-focus-btn" data-lat="${loc.latitude}" data-lng="${loc.longitude}">Show</button>
            </div>
        `;

        // click to focus
        card.querySelector('.result-focus-btn').addEventListener('click', function() {
            const lat = parseFloat(this.dataset.lat);
            const lng = parseFloat(this.dataset.lng);
            isolateLocationOnMap({ lat, lng, loc });
        });

        container.appendChild(card);
    });
}

// Isolate a single location on the map: zoom to it, open popup, draw polyline from user or center, and highlight card
function isolateLocationOnMap({ lat, lng, loc }) {
    if (!map) return;

    // Clear previous highlight
    document.querySelectorAll('.result-card.active').forEach(el => el.classList.remove('active'));

    // find matching card and mark active
    const cards = document.querySelectorAll('#resultsList .result-card');
    cards.forEach(card => {
        const btn = card.querySelector('.result-focus-btn');
        if (!btn) return;
        if (parseFloat(btn.dataset.lat) === parseFloat(lat) && parseFloat(btn.dataset.lng) === parseFloat(lng)) {
            card.classList.add('active');
            // scroll into view
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    // Remove existing isolated layers (polyline or marker highlight)
    if (window.isolatedLayer && map.hasLayer(window.isolatedLayer)) {
        map.removeLayer(window.isolatedLayer);
    }

    // add a temporary highlighted marker
    const highlight = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#2a9df4',
        weight: 2,
        fillColor: '#ffffff',
        fillOpacity: 1
    }).addTo(map).bindPopup(`<strong>${escapeHtml(loc.name || '')}</strong>`).openPopup();

    window.isolatedLayer = highlight;

    // remove previous polylines
    if (window.userPolylines) {
        window.userPolylines.forEach(line => { if (map.hasLayer(line)) map.removeLayer(line); });
    }
    window.userPolylines = [];

    // draw a route from user location or map center
    const from = userLocation ? [userLocation.lat, userLocation.lng] : (map ? [map.getCenter().lat, map.getCenter().lng] : null);
    if (from) {
        const route = L.polyline([from, [lat, lng]], { color: '#ca1193ff', weight: 3, dashArray: '6,4' }).addTo(map);
        // keep track so it can be removed on next isolate
        window.userPolylines.push(route);
    }

    // center the map to show both points
    if (from) {
        const bounds = L.latLngBounds([from, [lat, lng]]);
        map.fitBounds(bounds.pad(0.2));
    } else {
        map.setView([lat, lng], 16);
    }

    // Update distance in the active card
    const distKm = from ? Utils.calculateDistance(from[0], from[1], lat, lng) : null;
    if (distKm !== null) {
        document.querySelectorAll('#resultsList .result-card').forEach(card => {
            const btn = card.querySelector('.result-focus-btn');
            if (!btn) return;
            if (parseFloat(btn.dataset.lat) === parseFloat(lat) && parseFloat(btn.dataset.lng) === parseFloat(lng)) {
                const span = card.querySelector('.result-distance');
                if (span) span.textContent = Utils.formatDistance(distKm);
            }
        });
    }
}

// Simple client-side filtering used by the search form
function filterLocationsFromForm() {
    const selectedAmenities = [];
    $('input[name="amenity"]:checked').each(function() { selectedAmenities.push($(this).val()); });

    const formData = {
        spotType: $('#spotType').val(),
        distance: parseFloat($('#distance').val()) || null,
        vibe: $('#vibe').val(),
        latitude: parseFloat($('#latitude').val()) || null,
        longitude: parseFloat($('#longitude').val()) || null,
        amenities: selectedAmenities
    };

    let results = (window.allMarkers || []).slice();

    // filter by type
    if (formData.spotType) {
        results = results.filter(r => (r.type || '').toLowerCase() === formData.spotType.toLowerCase());
    }

    // filter by distance from userLocation or provided coordinates
    let refPoint = null;
    if (userLocation) refPoint = userLocation;
    else if (formData.latitude && formData.longitude) refPoint = { lat: formData.latitude, lng: formData.longitude };

    if (formData.distance && refPoint) {
        const radiusMeters = formData.distance;
        results = results.filter(r => {
            if (!r.latitude || !r.longitude) return false;
        const km = Utils.calculateDistance(refPoint.lat, refPoint.lng, r.latitude, r.longitude);
            return (km * 1000) <= radiusMeters;
        });
    }

    // TODO: filter by amenities & vibe when data available

    return results;
}

// Handle search submit: use client-side filter, update markers and results list
function handleSearchSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const results = filterLocationsFromForm();

    // update markers on map
    if (!window.markerGroup) window.markerGroup = L.layerGroup().addTo(map);
    window.markerGroup.clearLayers();

    results.forEach(loc => {
        ensureIcons();
        const typeKey = (loc.type || '').toString().toLowerCase();
        const icon = ICONS[typeKey] || ICONS[loc.subcategory] || ICONS['default'];
        const marker = L.marker([loc.latitude, loc.longitude], { icon: icon })
            .bindPopup(`<strong>${escapeHtml(loc.name)}</strong><br>${escapeHtml(loc.type || '')}`);
        window.markerGroup.addLayer(marker);
    });

    // rank by distance if possible
    const ref = userLocation ? userLocation : (map ? map.getCenter() : null);
    const orderedResults = ref ? rankByDistance(results, { lat: ref.lat, lng: ref.lng }) : results;

    // render list and update count
    renderResultsList(orderedResults);
    updateLocationCount(orderedResults.length);

    // draw circle if reference exists
    const distVal = parseFloat($('#distance').val());
    if ((userLocation || ($('#latitude').val() && $('#longitude').val())) && distVal) {
        const center = userLocation ? [userLocation.lat, userLocation.lng] : [parseFloat($('#latitude').val()), parseFloat($('#longitude').val())];
        if (window.userCircle && map.hasLayer(window.userCircle)) map.removeLayer(window.userCircle);
        window.userCircle = L.circle(center, { color: '#6B5B95', fillColor: '#6B5B95', fillOpacity: 0.2, radius: distVal }).addTo(map);
        map.fitBounds(window.userCircle.getBounds());
    } else if (results.length > 0) {
        const bounds = results.map(r => [r.latitude, r.longitude]);
        map.fitBounds(bounds);
    }

    // brief loading state on button
    const searchBtn = $('.search-btn');
    const originalContent = searchBtn.html();
    searchBtn.html('<i class="fas fa-spinner fa-spin"></i> Searching...').prop('disabled', true);
    setTimeout(() => { searchBtn.html(originalContent).prop('disabled', false); }, 600);
}
