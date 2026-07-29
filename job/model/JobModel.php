<?php
class JobModel {

    public static function getAll() {
        $cacheKey = "job_listings_cache";
        $cached = get_transient_mock($cacheKey);
        if ($cached !== false && !empty($cached)) {
            return $cached;
        }

        $remoteData = self::fetchFromRemote();
        if (!empty($remoteData)) {
            set_transient_mock($cacheKey, $remoteData, 86400);
            return $remoteData;
        }

        return [];
    }

    private static function fetchFromRemote() {
        $postData = [
            "CompanyID" => "Exl_SensipleIndia",
            "Username" => "Admin",
            "Password" => "S3nS1pl3",
            "EntityID" => "Requirements",
            "Which" => "DView",
            "WhichID" => "JobsAPI",
            "PageSize" => 100,
            "PageNumber" => 1,
            "FilterBy" => [[
                "FieldName" => "Requirements.BusinessUnit",
                "Type" => "Like",
                "FieldValue1" => "'Sensiple%'"
            ]]
        ];

        $ctx = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n",
                'content' => json_encode($postData),
                'timeout' => 15,
                'ignore_errors' => true
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ]);

        $response = @file_get_contents("https://exelareweb.com/ExelareJobsAPI/api/viewrecords", false, $ctx);

        if ($response === false) {
            return null;
        }

        $data = @json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE || empty($data)) {
            return null;
        }

        return $data['Records'] ?? null;
    }
}

function get_transient_mock($key) {
    $file = sys_get_temp_dir() . "/job_cache_" . md5($key) . ".json";
    if (!file_exists($file)) return false;
    $data = json_decode(file_get_contents($file), true);
    if (!$data || time() > $data['expires']) {
        @unlink($file);
        return false;
    }
    return $data['value'];
}

function set_transient_mock($key, $value, $ttl) {
    $file = sys_get_temp_dir() . "/job_cache_" . md5($key) . ".json";
    file_put_contents($file, json_encode([
        'expires' => time() + $ttl,
        'value' => $value
    ]));
}
