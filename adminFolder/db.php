<?php
// db.php - CENTRAL DATABASE CONNECTION HELPER FOR ADMIN ENDPOINTS
// ------------------------------------------------------------------
// STEP 1: DB CONFIG (YOU MUST EDIT THESE VALUES FOR YOUR LOCAL SETUP)
// - SET $DB_USER AND $DB_PASS TO MATCH YOUR XAMPP / MYSQL CREDENTIALS
// - DEFAULTS ARE FOR XAMPP: user='root', password=''
// ------------------------------------------------------------------

// Update these credentials to match your local XAMPP MySQL setup
$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'smilespots_db';

// ------------------------------------------------------------------
// STEP 2: CONNECTION FACTORY
// - CALL get_db_connection() FROM YOUR PHP ENDPOINTS (e.g. addItem.php)
// - THIS FUNCTION RETURNS A mysqli CONNECTION OR EXITS WITH JSON ERROR
// ------------------------------------------------------------------
function get_db_connection() {
    global $DB_HOST, $DB_USER, $DB_PASS, $DB_NAME;

    // Create connection
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

    // Check connection
    if ($conn->connect_error) {
        header('Content-Type: application/json');
        // STEP 2a: ON FAILURE, THIS WILL OUTPUT A JSON ERROR AND EXIT
        echo json_encode(['success' => false, 'message' => 'Database Connection Failed: ' . $conn->connect_error]);
        exit();
    }

    // Set charset to utf8mb4
    $conn->set_charset('utf8mb4');

    return $conn;
}

// END OF db.php
?>
