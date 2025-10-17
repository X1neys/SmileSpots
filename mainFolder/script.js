// Global variables
let map = null;
let userLocation = null;
let markersGroup = null;

// jQuery document ready
$(document).ready(function() {
    console.log('SmileSpots initialized');
    
    // Initialize components
    initializeMap();
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
        
        // === major Bacolod City areas (visible only when radius hits them) ===
window.allMarkers = [
    { lat: 10.6761, lng: 122.9566, name: "SM City Bacolod", type: "mall" },
    { lat: 10.6813, lng: 122.9511, name: "The Ruins", type: "heritage" },
    { lat: 10.6765, lng: 122.9582, name: "Bacolod Public Plaza", type: "park" },
    { lat: 10.6924, lng: 122.9621, name: "Lopue's East Centre", type: "mall" },
    { lat: 10.6603, lng: 122.9506, name: "Panaad Park and Stadium", type: "sports" },
    { lat: 10.7015, lng: 122.9574, name: "Ayala Malls Capitol Central", type: "mall" },
    { lat: 10.6629, lng: 122.9493, name: "Bacolod Government Center", type: "government" },
    { lat: 10.6737, lng: 122.9394, name: "BREDCO Port", type: "port" }
];

        
        // Hide loading indicator
        $('#mapLoading').addClass('hidden');
        
        // Add some placeholder markers
        // TODO: Replace with real data from API
        // addPlaceholderMarkers();
        
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
                    window.userMarker = L.marker([userLocation.lat, userLocation.lng])
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

/**
 * Handle search form submission
 * TODO: Integrate with search API
 */
function handleSearchSubmit(e) {
    e.preventDefault();
    
    const selectedAmenities = [];
    $('input[name="amenity"]:checked').each(function() {
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
    
    console.log('Search form submitted:', formData);// update map circle size based on selected distance
    // === GEO-FENCE: only show markers within radius ===
if (userLocation && map) {
    const distanceMiles = parseFloat($('#distance').val()) || 100;
    const radiusMeters = distanceMiles ;

    // remove existing circle before creating new
    if (window.userCircle && map.hasLayer(window.userCircle)) {
        map.removeLayer(window.userCircle);
    }

    // draw updated purple circle
    window.userCircle = L.circle([userLocation.lat, userLocation.lng], {
        color: '#6B5B95',
        fillColor: '#6B5B95',
        fillOpacity: 0.3,
        radius: radiusMeters
    }).addTo(map);

    // remove previous markers
    // remove previous markers
if (!window.markerGroup) {
    window.markerGroup = L.layerGroup().addTo(map);
} else {
    window.markerGroup.clearLayers();
}

// remove existing polylines if any
if (window.userPolylines) {
    window.userPolylines.forEach(line => {
        if (map.hasLayer(line)) map.removeLayer(line);
    });
}
window.userPolylines = []; // reset array

// add only markers within radius
// add only markers within radius and draw polyline from user marker
window.allMarkers.forEach(location => {
    const distanceKm = Utils.calculateDistance(
        userLocation.lat, userLocation.lng,
        location.lat, location.lng
    );
    const distanceMeters = distanceKm * 1000;

    if (distanceMeters <= radiusMeters) {
        const marker = L.marker([location.lat, location.lng])
            .bindPopup(`
                <strong>${location.name}</strong><br>
                Type: ${location.type}<br>
                Distance: ${Utils.formatDistance(distanceKm)}
            `);
        window.markerGroup.addLayer(marker);

        // draw solid polyline from user's marker to this marker
        const polyline = L.polyline([
            [userLocation.lat, userLocation.lng],
            [location.lat, location.lng]
        ], {
            color: '#ca1193ff', // red line
            weight: 3,
            opacity: 0.7
        }).addTo(map);

        // store polyline for later removal if needed
        if (!window.userPolylines) window.userPolylines = [];
        window.userPolylines.push(polyline);
    }
});



    // focus map to radius area
    map.fitBounds(window.userCircle.getBounds());
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
        
        // TODO: Update map with search results
        // TODO: Update location count
        // TODO: Handle empty results
        
        console.log('Search completed (simulated)');
        
    }, 1500);
}

/**
 * Handle view full map button click
 * TODO: Implement full-screen map or redirect to dedicated map page
 */
function handleViewFullMap() {
    
    const mapContainer = document.getElementById('map');

    // if already fullscreen → exit fullscreen
    if (mapContainer.classList.contains('fullscreen-map')) {
        mapContainer.classList.remove('fullscreen-map');
        const exitBtn = document.getElementById('exitFullscreenBtn');
        if (exitBtn) exitBtn.remove();

        // restore map size
        map.invalidateSize();
        return;
    }

    // go fullscreen
    mapContainer.classList.add('fullscreen-map');
    map.invalidateSize(); // force leaflet to recalc map dimensions

    // add exit button
    const exitBtn = document.createElement('button');
    exitBtn.id = 'exitFullscreenBtn';
    exitBtn.className = 'exit-fullscreen-btn';
    exitBtn.textContent = 'Exit Fullscreen';
    document.body.appendChild(exitBtn);

    // exit when button clicked
    exitBtn.addEventListener('click', () => {
        mapContainer.classList.remove('fullscreen-map');
        exitBtn.remove();
        map.invalidateSize();
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
