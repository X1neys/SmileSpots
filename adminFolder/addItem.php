<?php
// addItem.php - API Endpoint for adding a new location

header('Content-Type: application/json');

// ------------------------------------------------------------------
// STEP 1: INCLUDE DB HELPER
// - THIS FILE CONTAINS get_db_connection() AND DB CREDENTIALS (SEE db.php)
// ------------------------------------------------------------------
require_once __DIR__ . '/db.php';

// ------------------------------------------------------------------
// STEP 2: ESTABLISH DB CONNECTION
// - CALL get_db_connection() WHICH RETURNS A mysqli CONNECTION
// - ON FAILURE, get_db_connection() WILL OUTPUT JSON AND EXIT
// ------------------------------------------------------------------
$conn = get_db_connection();

// ------------------------------------------------------------------
// STEP 3: VERIFY REQUEST METHOD
// - ENSURE THIS ENDPOINT IS CALLED WITH HTTP POST
// ------------------------------------------------------------------
// Check if the request method is POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    $conn->close();
    exit();
}

// Check if the Content-Type is correct
if (isset($_SERVER["CONTENT_TYPE"]) && strpos($_SERVER["CONTENT_TYPE"], 'application/json') === false) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Invalid Content-Type. Expected application/json.']);
    $conn->close();
    exit();
}

// ------------------------------------------------------------------
// STEP 4: READ AND PARSE JSON BODY
// - READ RAW BODY FROM php://input
// - DECODE JSON INTO PHP ARRAY
// ------------------------------------------------------------------
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

// STEP 4a: VALIDATE JSON DECODE
if (json_last_error() !== JSON_ERROR_NONE || empty($data)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input or empty data received.']);
    $conn->close();
    exit();
}

// ------------------------------------------------------------------
// STEP 5: SANITIZE & VALIDATE INPUT FIELDS
// - TRIM STRINGS, CAST NUMBERS, ENSURE REQUIRED FIELDS EXIST
// ------------------------------------------------------------------
$name = trim($data['name'] ?? '');
$type_id = filter_var($data['type_id'] ?? 0, FILTER_VALIDATE_INT);
$subcategory_id = isset($data['subcategory_id']) ? filter_var($data['subcategory_id'], FILTER_VALIDATE_INT) : null;
$latitude = isset($data['latitude']) ? filter_var($data['latitude'], FILTER_VALIDATE_FLOAT) : null;
$longitude = isset($data['longitude']) ? filter_var($data['longitude'], FILTER_VALIDATE_FLOAT) : null;
$vibe_id = filter_var($data['vibe_id'] ?? 0, FILTER_VALIDATE_INT);
$description = trim($data['description'] ?? '');
// Ensure image_id is handled safely. If missing or invalid, default to 0.
$image_id = filter_var($data['image_id'] ?? 0, FILTER_VALIDATE_INT);
$image_id_bind = ($image_id === null || $image_id === false) ? 0 : (int)$image_id;
// Accept amenities array (optional)
$amenities = [];
if (isset($data['amenities']) && is_array($data['amenities'])) {
    // Sanitize amenity IDs
    foreach ($data['amenities'] as $aid) {
        $aid_int = filter_var($aid, FILTER_VALIDATE_INT);
        if ($aid_int !== false && $aid_int > 0) $amenities[] = (int)$aid_int;
    }
} elseif (isset($data['amenities']) && is_string($data['amenities'])) {
    // If form-encoded, amenities may come as a comma-separated string
    $parts = preg_split('/[;,\s]+/', $data['amenities']);
    foreach ($parts as $p) {
        $aid_int = filter_var($p, FILTER_VALIDATE_INT);
        if ($aid_int !== false && $aid_int > 0) $amenities[] = (int)$aid_int;
    }
}


// STEP 5a: REQUIRED FIELD CHECK
// Note: subcategory is optional (nullable). Accept null/absent subcategory and store NULL in DB.
if (empty($name) || $type_id === false || $type_id <= 0 || $latitude === null || $longitude === null || $vibe_id === false || empty($description)) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'One or more required fields are missing or invalid.']);
    $conn->close();
    exit();
}


// Prepare the SQL statement using placeholders for security (Prepared Statements)
// Use NULLIF(?,0) so that a passed 0 becomes SQL NULL for subcategory
$sql = "INSERT INTO locations (name, type_id, subcategory_id, latitude, longitude, vibe_id, description, image_id, date_added) VALUES (?, ?, NULLIF(?,0), ?, ?, ?, ?, ?, NOW())";

// ------------------------------------------------------------------
// STEP 6: PREPARE AND EXECUTE INSERT
// - PREPARE STATEMENT, BIND PARAMETERS, EXECUTE, RETURN JSON
// ------------------------------------------------------------------
// Prepare sanitized bind values; pass 0 when missing so NULLIF(?,0) will set SQL NULL
$subcategory_bind = (is_null($subcategory_id) || $subcategory_id === false) ? 0 : (int)$subcategory_id;

if ($stmt = $conn->prepare($sql)) {
    // Bind parameters: s=string, i=integer, d=double/float
    // Order: name(s), type_id(i), subcategory_id(i), latitude(d), longitude(d), vibe_id(i), description(s), image_id(i)
    // Correct type string: "siiddisi"
    $stmt->bind_param("siiddisi", $name, $type_id, $subcategory_bind, $latitude, $longitude, $vibe_id, $description, $image_id_bind);
    
    // Attempt to execute the prepared statement
    if ($stmt->execute()) {
        // STEP 6a: SUCCESS RESPONSE
        $location_id = $conn->insert_id;
        // If amenities provided, insert into junction table
        if (!empty($amenities)) {
            // Use transaction to ensure consistency
            $conn->begin_transaction();
            $insertAmenSql = 'INSERT INTO location_amenities (location_id, amenity_id) VALUES (?, ?)';
            if ($insStmt = $conn->prepare($insertAmenSql)) {
                foreach ($amenities as $amenity_id) {
                    $insStmt->bind_param('ii', $location_id, $amenity_id);
                    $insStmt->execute();
                }
                $insStmt->close();
                $conn->commit();
            } else {
                // Rollback and report an error if amenity insert preparation fails
                $conn->rollback();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Location added but failed to prepare amenity insert.', 'id' => $location_id, 'sql_error' => $conn->error]);
                $stmt->close();
                $conn->close();
                exit();
            }
        }
        echo json_encode(['success' => true, 'message' => 'Location added successfully!', 'id' => $location_id]);
    } else {
        // STEP 6b: EXECUTION ERROR
        http_response_code(500); // Set response code to Internal Server Error
        echo json_encode(['success' => false, 'message' => 'Database Error: Could not execute query.', 'sql_error' => $stmt->error]);
    }
    
    // Close statement
    $stmt->close();
} else {
    // STEP 6c: PREPARATION ERROR
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => 'SQL Preparation Error.', 'sql_error' => $conn->error]);
}

// ------------------------------------------------------------------
// STEP 7: CLEANUP
// - CLOSE STATEMENT AND CONNECTION (ALREADY DONE ABOVE FOR STATEMENT)
// ------------------------------------------------------------------
$conn->close();
?>