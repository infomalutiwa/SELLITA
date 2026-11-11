<?php
// Kontaktformular: nimmt JSON entgegen und schickt es per Mail an den Betrieb.
// Empfänger der Anfragen.
const TO   = 'selita.service@web.de';
const FROM = 'anfrage@sellita.de'; // muss eine Adresse der eigenen Domain sein (All-Inkl)

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out(int $code, bool $ok, string $msg = ''): void {
  http_response_code($code);
  echo json_encode(['ok' => $ok, 'error' => $msg]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, false, 'Nur POST.');

$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) out(400, false, 'Ungültige Anfrage.');

// Honeypot: Bots füllen das versteckte Feld aus, wir tun so, als wäre alles gut.
if (!empty($in['website'])) out(200, true);

// Einfache Drossel: höchstens 1 Anfrage pro 30 s je IP.
$lock = sys_get_temp_dir() . '/sellita_' . md5($_SERVER['REMOTE_ADDR'] ?? '');
if (is_file($lock) && time() - filemtime($lock) < 30) out(429, false, 'Bitte kurz warten.');

$clean = static fn($v, int $max) => mb_substr(trim(preg_replace('/[\r\n]+/', ' ', (string)($v ?? ''))), 0, $max);
$name    = $clean($in['name'] ?? '', 100);
$tel     = $clean($in['tel'] ?? '', 60);
$mail    = $clean($in['mail'] ?? '', 150);
$service = $clean($in['service'] ?? '', 80);
$ort     = $clean($in['ort'] ?? '', 100);
$msg     = mb_substr(trim(str_replace("\r", '', (string)($in['msg'] ?? ''))), 0, 3000);

if ($name === '' || $tel === '') out(422, false, 'Name und Telefon fehlen.');
if (!filter_var($mail, FILTER_VALIDATE_EMAIL)) out(422, false, 'Gültige E-Mail-Adresse fehlt.');

$subject = 'Anfrage' . ($service ? ': ' . $service : '') . ' – ' . $name;
$body = implode("\n", [
  'Neue Anfrage über sellita.de', '',
  'Leistung: ' . ($service ?: 'noch offen'),
  'Ort: ' . ($ort ?: '-'),
  'Beschreibung: ' . ($msg ?: '-'), '',
  'Name: ' . $name,
  'Telefon: ' . $tel,
  'E-Mail: ' . $mail,
]);

$headers = [
  'From: SELLITA Website <' . FROM . '>',
  'Content-Type: text/plain; charset=UTF-8',
];
// Antworten geht direkt an den Kunden.
$headers[] = 'Reply-To: ' . $mail;

$ok = mail(TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers), '-f' . FROM);
if (!$ok) out(500, false, 'Versand fehlgeschlagen.');

@touch($lock);
out(200, true);
