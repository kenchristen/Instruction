<?php
require_once 'db_config.php';

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['title']) || !isset($data['type'])) {
    header('Content-Type: application/json', true, 400);
    echo json_encode(['error' => 'Données invalides']);
    exit;
}

$db = get_db_connection();

// On utilise un UUID pour identifier le plan de manière unique côté client/serveur
$uuid = $data['uuid'] ?? bin2hex(random_bytes(16));
$title = $data['title'];
$type = $data['type'];
$content = json_encode($data);

try {
    $stmt = $db->prepare("INSERT INTO plans (uuid, title, plan_type, content) 
                          VALUES (?, ?, ?, ?) 
                          ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content), updated_at = NOW()");
    $stmt->execute([$uuid, $title, $type, $content]);

    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'uuid' => $uuid]);
} catch (PDOException $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
