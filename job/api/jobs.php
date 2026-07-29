<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../model/JobModel.php';

$jobs = JobModel::getAll();

if (!empty($jobs)) {
    echo json_encode(['success' => true, 'data' => $jobs]);
} else {
    echo json_encode(['success' => false, 'data' => [], 'message' => 'No jobs found']);
}
