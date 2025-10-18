<?php
header('Content-Type: application/json');

require_once __DIR__ . '/db.php';

$conn = get_db_connection();

$result = [
    'success' => true,
    'types' => [],
    'subcategories' => [],
    'vibes' => [],
    'amenities' => []
];

// Helper to fetch rows
function fetch_all($conn, $sql) {
    $rows = [];
    if ($res = $conn->query($sql)) {
        while ($r = $res->fetch_assoc()) $rows[] = $r;
        $res->free();
    }
    return $rows;
}

$result['types'] = fetch_all($conn, 'SELECT type_id, type_name FROM types ORDER BY type_name');
$result['subcategories'] = fetch_all($conn, 'SELECT subcategory_id, subcategory_name FROM subcategories ORDER BY subcategory_name');
$result['vibes'] = fetch_all($conn, 'SELECT vibe_id, vibe_name FROM vibes ORDER BY vibe_name');
$result['amenities'] = fetch_all($conn, 'SELECT amenity_id, amenity_name, amenity_slug FROM amenities ORDER BY amenity_name');

echo json_encode($result);

$conn->close();

?>
