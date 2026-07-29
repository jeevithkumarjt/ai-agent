<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$firstName = trim($_POST['FirstName'] ?? '');
$lastName = trim($_POST['LastName'] ?? '');
$email = trim($_POST['Email'] ?? '');
$mobile = trim($_POST['MobileNumber'] ?? '');
$jobTitle = trim($_POST['JobTitle'] ?? '');
$reqIntId = trim($_POST['ReqIntID'] ?? '');

if (empty($firstName) || empty($lastName) || empty($email) || empty($mobile) || empty($jobTitle) || empty($reqIntId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}

$allowedExts = ['pdf', 'doc', 'docx'];
$resumeError = $_FILES['ResumeFile']['error'] ?? UPLOAD_ERR_NO_FILE;

if ($resumeError !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please upload a valid resume file.']);
    exit;
}

if ($_FILES['ResumeFile']['size'] > 2 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Resume must be under 2 MB.']);
    exit;
}

$ext = strtolower(pathinfo($_FILES['ResumeFile']['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $allowedExts)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Resume must be a PDF or DOC/DOCX file.']);
    exit;
}

$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$safeName = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $_FILES['ResumeFile']['name']);
$destPath = $uploadDir . $safeName;

if (!move_uploaded_file($_FILES['ResumeFile']['tmp_name'], $destPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save resume file.']);
    exit;
}

$logEntry = sprintf(
    "[%s] Job: %s | ReqID: %s | Name: %s %s | Email: %s | Mobile: %s | Resume: %s\n",
    date('Y-m-d H:i:s'),
    $jobTitle,
    $reqIntId,
    $firstName,
    $lastName,
    $email,
    $mobile,
    $safeName
);
file_put_contents(__DIR__ . '/../applications.log', $logEntry, FILE_APPEND);

echo json_encode(['success' => true, 'message' => 'Application submitted successfully! We will get back to you soon.']);
