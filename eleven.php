<?php
$elevenKey = 'sk_6f1e00db53ae2453c08294432af1cb423f10cfcd3e3e28ac';
$voiceId = 'Gyqu9jCJup6lkiLgiu0l'; // Andromeda Thunder
$texto = $_POST['texto'] ?? 'Hola, ¿qué deseas ordenar?';

$ch = curl_init("https://api.elevenlabs.io/v1/text-to-speech/$voiceId");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "xi-api-key: $elevenKey",
  "Content-Type: application/json",
  "accept: audio/mpeg"
]);

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  "text" => $texto,
  "model_id" => "eleven_multilingual_v2",
  "voice_settings" => [
    "stability" => 0.5,
    "similarity_boost" => 0.7
  ]
]));

$response = curl_exec($ch);
curl_close($ch);

header("Content-Type: audio/mpeg");
echo $response;
