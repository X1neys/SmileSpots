<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';
$conn = get_db_connection();

$out = ['success' => true, 'locations' => []];

$sql = "SELECT l.id, l.name, l.type_id, t.type_name, l.subcategory_id, s.subcategory_name, l.latitude, l.longitude, l.vibe_id, v.vibe_name, l.description, l.image_id, l.date_added
        FROM locations l
        LEFT JOIN types t ON l.type_id = t.type_id
        LEFT JOIN subcategories s ON l.subcategory_id = s.subcategory_id
        LEFT JOIN vibes v ON l.vibe_id = v.vibe_id
        ORDER BY l.id DESC";

if ($res = $conn->query($sql)) {
    while ($r = $res->fetch_assoc()) {
        // fetch amenities for this location
        $aSql = "SELECT a.amenity_id, a.amenity_name FROM amenities a JOIN location_amenities la ON a.amenity_id = la.amenity_id WHERE la.location_id = " . (int)$r['id'];
        $aRows = [];
        if ($aRes = $conn->query($aSql)) {
            while ($ar = $aRes->fetch_assoc()) $aRows[] = $ar;
            $aRes->free();
        }
        $r['amenities'] = $aRows;
        $out['locations'][] = $r;
    }
    $res->free();
}

echo json_encode($out);
$conn->close();
?>
