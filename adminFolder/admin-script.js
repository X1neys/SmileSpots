// admin-script.js

// Global variables for the map and default coordinates
let adminMap = null;
let marker = null;
const defaultLat = 10.6749;
const defaultLng = 122.952;
const defaultZoom = 13;
const COORD_PRECISION = 6; // Precision for storing coordinates


// Lookups loaded from server (populated by getLookups.php)
let LOOKUPS = {
    types: [],
    subcategories: [],
    vibes: [],
    amenities: []
};

function loadLookups() {
    return $.getJSON('getLookups.php')
        .done(function(res) {
            if (res && res.success) {
                LOOKUPS.types = res.types || [];
                LOOKUPS.subcategories = res.subcategories || [];
                LOOKUPS.vibes = res.vibes || [];
                LOOKUPS.amenities = res.amenities || [];
            } else {
                console.error('Failed to load lookups', res);
            }
        })
        .fail(function(xhr, status, err) {
            console.error('Failed to fetch lookups:', status, err, xhr.responseText);
        });
}

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
    LOOKUPS.types.forEach(type => {
        $typeSelect.append(`<option value="${type.type_id}">${type.type_name}</option>`);
    });

    // Populate Subcategories
    LOOKUPS.subcategories.forEach(sub => {
        $subcategorySelect.append(`<option value="${sub.subcategory_id}">${sub.subcategory_name}</option>`);
    });
    
    // Populate Vibes
    LOOKUPS.vibes.forEach(vibe => {
        $vibeSelect.append(`<option value="${vibe.vibe_id}">${vibe.vibe_name}</option>`);
    });

    // Populate Amenities as checkboxes
    const $amenitiesContainer = $('#amenitiesContainer');
    $amenitiesContainer.empty();
    LOOKUPS.amenities.forEach(a => {
        const id = a.amenity_id;
        const name = a.amenity_name;
        const checkbox = `<label class="amenity-item"><input type="checkbox" name="amenities[]" value="${id}"> ${name}</label>`;
        $amenitiesContainer.append(checkbox);
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
        // Load lookups first, then initialize map and populate selects
        loadLookups().always(() => {
            populateDropdowns();
            // Delay map initialization/invalidation to ensure the container is visible
            setTimeout(() => {
                initializeAdminMap();
            }, 50);
        });
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

    // Collect selected amenities (array of IDs)
    const selectedAmenities = $('input[name="amenities[]"]:checked').map(function() {
        return parseInt($(this).val(), 10);
    }).get();
    if (selectedAmenities.length > 0) {
        spotData.amenities = selectedAmenities;
    }

    // --- CRITICAL CLIENT-SIDE VALIDATION ---
    // Check if coordinates have been set by map click
    if (!spotData.latitude || !spotData.longitude || isNaN(parseFloat(spotData.latitude)) || isNaN(parseFloat(spotData.longitude))) {
        displayFeedback('Location coordinates are missing or invalid. Please click on the map to select the spot\'s location.', 'error');
        return; // Halt submission
    }
    // --- END CRITICAL VALIDATION ---

    // Disable submit button to prevent duplicate submissions and show loading state
    const $submitBtn = form.find('button[type="submit"]');
    const originalBtnHtml = $submitBtn.html();
    $submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Saving...');

    // Send data to the PHP endpoint
    console.log('Submitting spot data to addItem.php:', spotData);
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

                // Restore submit button
                $submitBtn.prop('disabled', false).html(originalBtnHtml);

            } else {
                // Failure (validation or DB error)
                let errorMessage = response.message || 'An unknown error occurred.';
                if (response.sql_error) {
                    errorMessage += `<br>Database Error: ${response.sql_error}`;
                }
                displayFeedback(errorMessage, 'error');

                // Restore submit button
                $submitBtn.prop('disabled', false).html(originalBtnHtml);
            }
        },
        error: function(xhr, status, error) {
            // Network or server-side script error
            console.error("AJAX Error (JSON POST):", status, error, xhr.responseText);

            // If server rejected JSON content-type, try a form-encoded POST as a fallback
            let serverMsg = '';
            try { serverMsg = JSON.parse(xhr.responseText).message || ''; } catch (e) { serverMsg = xhr.responseText || ''; }

            if (xhr.status === 400 && (serverMsg.toLowerCase().includes('content-type') || serverMsg.toLowerCase().includes('invalid json') || serverMsg.toLowerCase().includes('invalid content-type'))) {
                console.log('Retrying submission as application/x-www-form-urlencoded');
                $.ajax({
                    url: 'addItem.php',
                    type: 'POST',
                    data: $.param(spotData),
                    success: function(resp2) {
                        if (resp2 && resp2.success) {
                            displayFeedback(`Success! Location added with ID: ${resp2.id}`, 'success');
                            form[0].reset();
                            $('#spotLatitudeDisplay').val('');
                            $('#spotLongitudeDisplay').val('');
                            $('#spotLatitude').val('');
                            $('#spotLongitude').val('');
                            $('#adminFormModal').addClass('hidden');
                            if (marker) adminMap.removeLayer(marker);
                        } else {
                            displayFeedback(resp2.message || 'Submission failed on form-encoded retry.', 'error');
                        }
                        $submitBtn.prop('disabled', false).html(originalBtnHtml);
                    },
                    error: function(xhr2, status2, err2) {
                        console.error('Fallback POST failed:', status2, err2, xhr2.responseText);
                        displayFeedback(`AJAX Request Failed. Status: ${status2}, Error: ${err2}`, 'error');
                        $submitBtn.prop('disabled', false).html(originalBtnHtml);
                    }
                });
                return;
            }

            displayFeedback(`AJAX Request Failed. Status: ${status}, Error: ${error}`, 'error');
            $submitBtn.prop('disabled', false).html(originalBtnHtml);
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