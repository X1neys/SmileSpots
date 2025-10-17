// admin-script.js

// Global variables for the map and default coordinates
let adminMap = null;
let marker = null;
const defaultLat = 10.6749;
const defaultLng = 122.952;
const defaultZoom = 13;
const COORD_PRECISION = 6; // Precision for storing coordinates


// --- Lookup Data ---
// 1. Spot Types (from smilespots_db.sql -> types table)
const TYPES = [
    { id: 1, name: 'Restaurant' }, { id: 2, name: 'Cafe' }, { id: 3, name: 'Church' },
    { id: 4, name: 'Bar' }, { id: 5, name: 'Park' }, { id: 6, name: 'Museum' },
    { id: 7, name: 'Mall' }, { id: 8, name: 'Secret' }
];

// 2. Subcategories (from smilespots_db.sql -> subcategories table)
const SUB_CATEGORIES = [
    { id: 1, name: 'Filipino' }, { id: 2, name: 'Japanese' }, { id: 3, name: 'Fast food' },
    { id: 4, name: 'Sea food' }, { id: 5, name: 'Iglesia' }, { id: 6, name: 'Christian' },
    { id: 7, name: 'Catholic' }, { id: 8, name: 'Baptist' }, { id: 9, name: 'Mormons' },
    { id: 10, name: 'Amusement Park' }, { id: 11, name: 'Water Park' }, { id: 12, name: 'Greenspace' }
];

// 3. Vibes (from smilespots_db.sql -> vibes table)
const VIBES = [
    { id: 1, name: 'Romantic' }, { id: 2, name: 'Family Friendly' }, { id: 3, name: 'Trendy' },
    { id: 4, name: 'Historical' }, { id: 5, name: 'Peaceful' }, { id: 6, name: 'Lively' }
];

/**
 * Initializes the Leaflet map for the admin interface.
 * Sets up tile layers and the click listener to place a marker.
 */
function initializeAdminMap() {
    // Only initialize if the map hasn't been created yet
    if (adminMap === null) {
        adminMap = L.map('adminMap').setView([defaultLat, defaultLng], defaultZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
            minZoom: 10
        }).addTo(adminMap);

        // Map click event listener to set coordinates and marker
        adminMap.on('click', function(e) {
            const lat = e.latlng.lat.toFixed(COORD_PRECISION);
            const lng = e.latlng.lng.toFixed(COORD_PRECISION);
            
            // Update hidden inputs for submission
            $('#spotLatitude').val(lat);
            $('#spotLongitude').val(lng);

            // Update display inputs (read-only)
            $('#spotLatitudeDisplay').val(lat);
            $('#spotLongitudeDisplay').val(lng);

            // Add or move marker
            if (marker) {
                marker.setLatLng(e.latlng);
            } else {
                marker = L.marker(e.latlng).addTo(adminMap)
                    .bindPopup("New Spot Location")
                    .openPopup();
            }
        });
        
        // Populate the lookup select dropdowns
        populateDropdowns();
    }
    
    // Invalidate size is crucial when map container changes visibility
    adminMap.invalidateSize();
}

/**
 * Populates the Type, Subcategory, and Vibe dropdowns.
 */
function populateDropdowns() {
    const $typeSelect = $('#spotType');
    const $subcategorySelect = $('#spotSubcategory');
    const $vibeSelect = $('#spotVibe');

    // Clear existing options
    $typeSelect.empty();
    $subcategorySelect.empty();
    $vibeSelect.empty();

    // Add default empty option
    $typeSelect.append('<option value="" disabled selected>Select a Type</option>');
    $subcategorySelect.append('<option value="" disabled selected>Select a Subcategory</option>');
    $vibeSelect.append('<option value="" disabled selected>Select a Vibe</option>');

    // Populate Types
    TYPES.forEach(type => {
        $typeSelect.append(`<option value="${type.id}">${type.name}</option>`);
    });

    // Populate Subcategories
    SUB_CATEGORIES.forEach(sub => {
        $subcategorySelect.append(`<option value="${sub.id}">${sub.name}</option>`);
    });
    
    // Populate Vibes
    VIBES.forEach(vibe => {
        $vibeSelect.append(`<option value="${vibe.id}">${vibe.name}</option>`);
    });
}


// jQuery document ready
$(document).ready(function() {
    console.log('Admin Script initialized.');

    // Attach event listener to the Add Spot form
    $('#addSpotForm').on('submit', function(e) {
        e.preventDefault();
        handleAddSpotFormSubmission();
    });
    
    // Show Modal functionality
    $('#showAddFormBtn').on('click', function() {
        $('#adminFormModal').removeClass('hidden'); 
        // Delay map initialization/invalidation to ensure the container is visible
        setTimeout(() => {
            initializeAdminMap();
        }, 50); 
    });

    // Close Modal functionality
    $('#adminFormClose').on('click', function() {
        $('#adminFormModal').addClass('hidden');
        // Clear marker and coordinate display when closing
        if (marker) {
            adminMap.removeLayer(marker);
            marker = null;
        }
        $('#spotLatitudeDisplay').val('');
        $('#spotLongitudeDisplay').val('');
        $('#spotLatitude').val('');
        $('#spotLongitude').val('');
        $('#addSpotForm')[0].reset(); // Reset form fields
    });
});

/**
 * Handles the submission of the 'Add New Spot' form.
 */
function handleAddSpotFormSubmission() {
    const form = $('#addSpotForm');
    displayFeedback('Saving spot...', 'loading');

    // Collect data from form fields
    const spotData = {
        name: $('#spotName').val(),
        type_id: $('#spotType').val(),
        subcategory_id: $('#spotSubcategory').val(),
        vibe_id: $('#spotVibe').val(),
        description: $('#spotDescription').val(),
        image_id: $('#spotImageId').val() || 0,
        latitude: $('#spotLatitude').val(), // Hidden input value
        longitude: $('#spotLongitude').val() // Hidden input value
    };

    // --- CRITICAL CLIENT-SIDE VALIDATION ---
    // Check if coordinates have been set by map click
    if (!spotData.latitude || !spotData.longitude || isNaN(parseFloat(spotData.latitude)) || isNaN(parseFloat(spotData.longitude))) {
        displayFeedback('Location coordinates are missing or invalid. Please click on the map to select the spot\'s location.', 'error');
        return; // Halt submission
    }
    // --- END CRITICAL VALIDATION ---

    // Send data to the PHP endpoint
    $.ajax({
        url: 'addItem.php',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(spotData),
        success: function(response) {
            // Check for success flag in JSON response
            if (response.success) {
                displayFeedback(`Success! Location added with ID: ${response.id}`, 'success');
                
                // Reset UI after success
                form[0].reset(); // Clear the form
                $('#spotLatitudeDisplay').val('');
                $('#spotLongitudeDisplay').val('');
                $('#spotLatitude').val('');
                $('#spotLongitude').val('');
                $('#adminFormModal').addClass('hidden'); // Hide modal on success
                if (marker) adminMap.removeLayer(marker); // Clear map marker

            } else {
                // Failure (validation or DB error)
                let errorMessage = response.message || 'An unknown error occurred.';
                if (response.sql_error) {
                    errorMessage += `<br>Database Error: ${response.sql_error}`;
                }
                displayFeedback(errorMessage, 'error');
            }
        },
        error: function(xhr, status, error) {
            // Network or server-side script error
            displayFeedback(`AJAX Request Failed. Status: ${status}, Error: ${error}`, 'error');
            console.error("AJAX Error:", xhr.responseText);
        }
    });
}

/**
 * Utility function to display feedback messages on the admin page.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message ('success', 'error', 'loading').
 */
function displayFeedback(message, type) {
    const feedbackArea = $('#feedbackArea');
    feedbackArea.html(message);
    
    // Clear previous classes and apply the new one for styling
    feedbackArea.removeClass('success error loading');
    
    if (type === 'success') {
        feedbackArea.addClass('success');
    } else if (type === 'error') {
        feedbackArea.addClass('error');
    } else if (type === 'loading') {
        feedbackArea.addClass('loading');
    }
}