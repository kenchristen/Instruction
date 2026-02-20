<?php
require_once 'db_config.php';

$db = get_db_connection();

try {
    if (isset($_GET['uuid'])) {
        // Récupérer un plan spécifique
        $stmt = $db->prepare("SELECT content FROM plans WHERE uuid = ?");
        $stmt->execute([$_GET['uuid']]);
        $plan = $stmt->fetch();

        if ($plan) {
            header('Content-Type: application/json');
            echo $plan['content'];
        } else {
            header('Content-Type: application/json', true, 404);
            echo json_encode(['error' => 'Plan non trouvé']);
        }
    } else {
        // Lister tous les plans (version simplifiée)
        $stmt = $db->query("SELECT uuid, title, plan_type, updated_at FROM plans ORDER BY updated_at DESC");
        $plans = $stmt->fetchAll();

        header('Content-Type: application/json');
        echo json_encode($plans);
    }
} catch (PDOException $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
