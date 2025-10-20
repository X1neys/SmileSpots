<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';
$conn = get_db_connection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (json_last_error() !== JSON_ERROR_NONE || empty($data)) {
    // also accept form-encoded
    $data = $_POST;
}

$id = filter_var($data['id'] ?? 0, FILTER_VALIDATE_INT);
if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid ID']);
    exit();
}

$name = trim($data['name'] ?? '');
$type_id = filter_var($data['type_id'] ?? 0, FILTER_VALIDATE_INT);
$subcategory_id = filter_var($data['subcategory_id'] ?? 0, FILTER_VALIDATE_INT);
$latitude = isset($data['latitude']) ? filter_var($data['latitude'], FILTER_VALIDATE_FLOAT) : null;
$longitude = isset($data['longitude']) ? filter_var($data['longitude'], FILTER_VALIDATE_FLOAT) : null;
$vibe_id = filter_var($data['vibe_id'] ?? 0, FILTER_VALIDATE_INT);
$description = trim($data['description'] ?? '');
$image_id = filter_var($data['image_id'] ?? 0, FILTER_VALIDATE_INT);

// amenities
$amenities = [];
if (isset($data['amenities']) && is_array($data['amenities'])) {
    foreach ($data['amenities'] as $a) {
        $ai = filter_var($a, FILTER_VALIDATE_INT);
        if ($ai) $amenities[] = $ai;
    }
}

// Allow subcategory to be NULL when not provided (>0 required to set)
if ($subcategory_id && $subcategory_id > 0) {
    $sql = "UPDATE locations SET name=?, type_id=?, subcategory_id=?, latitude=?, longitude=?, vibe_id=?, description=?, image_id=? WHERE id=?";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param('siiddisii', $name, $type_id, $subcategory_id, $latitude, $longitude, $vibe_id, $description, $image_id, $id);
    }
} else {
    $sql = "UPDATE locations SET name=?, type_id=?, subcategory_id=NULL, latitude=?, longitude=?, vibe_id=?, description=?, image_id=? WHERE id=?";
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param('siddisii', $name, $type_id, $latitude, $longitude, $vibe_id, $description, $image_id, $id);
    }
}
    // Note: 's' used mistakenly for description/latitude binding types; ensure binding types match actual types
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Update failed', 'sql_error' => $stmt->error]);
        $stmt->close();
        $conn->close();
        exit();
    }
    $stmt->close();
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'SQL prepare failed', 'sql_error' => $conn->error]);
    $conn->close();
    exit();
}

// Update amenities: remove existing and insert new set
$conn->begin_transaction();
if (!$conn->query('DELETE FROM location_amenities WHERE location_id=' . (int)$id)) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to clear old amenities', 'sql_error' => $conn->error]);
    $conn->close();
    exit();
}

if (!empty($amenities)) {
    $insSql = 'INSERT INTO location_amenities (location_id, amenity_id) VALUES (?, ?)';
    if ($insStmt = $conn->prepare($insSql)) {
        foreach ($amenities as $aId) {
            $insStmt->bind_param('ii', $id, $aId);
            $insStmt->execute();
        }
        $insStmt->close();
    } else {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to prepare amenity insert', 'sql_error' => $conn->error]);
        $conn->close();
        exit();
    }
}
$conn->commit();

echo json_encode(['success' => true, 'message' => 'Updated']);
$conn->close();
?>
