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
    $data = $_POST;
}

$id = filter_var($data['id'] ?? 0, FILTER_VALIDATE_INT);
if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid ID']);
    exit();
}

$sql = 'DELETE FROM locations WHERE id = ?';
if ($stmt = $conn->prepare($sql)) {
    $stmt->bind_param('i', $id);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Deleted']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Delete failed', 'sql_error' => $stmt->error]);
    }
    $stmt->close();
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare failed', 'sql_error' => $conn->error]);
}

$conn->close();
?>
