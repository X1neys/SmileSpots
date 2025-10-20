<?php
// getLocations.php - Return JSON list of locations for main map
header('Content-Type: application/json');

require_once __DIR__ . '/../adminFolder/db.php';

$conn = get_db_connection();

$sql = "SELECT l.id, l.name, l.latitude, l.longitude, l.description, t.type_name, s.subcategory_name, v.vibe_name
        FROM locations l
        LEFT JOIN types t ON l.type_id = t.type_id
        LEFT JOIN subcategories s ON l.subcategory_id = s.subcategory_id
        LEFT JOIN vibes v ON l.vibe_id = v.vibe_id
        ORDER BY l.date_added DESC
        LIMIT 100";

$result = $conn->query($sql);

$locations = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        // Fetch amenities for this location
        $amenities = [];
        $aSql = 'SELECT a.amenity_id, a.amenity_name, a.amenity_slug FROM amenities a JOIN location_amenities la ON a.amenity_id = la.amenity_id WHERE la.location_id = ' . (int)$row['id'];
        if ($aRes = $conn->query($aSql)) {
            while ($ar = $aRes->fetch_assoc()) {
                $amenities[] = $ar;
            }
            $aRes->free();
        }

        $locations[] = [
            'id' => (int)$row['id'],
            'name' => $row['name'],
            'latitude' => (float)$row['latitude'],
            'longitude' => (float)$row['longitude'],
            'description' => $row['description'],
            'type' => $row['type_name'],
            'subcategory' => $row['subcategory_name'],
            'vibe' => $row['vibe_name'],
            'amenities' => $amenities
        ];
    }
}

echo json_encode(['success' => true, 'count' => count($locations), 'locations' => $locations]);

$conn->close();
?>
