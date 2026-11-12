<?php
// Composer — composer/semver (VersionParser::parseConstraints + matches), before minimum-stability filtering
// Usage: php oracle_composer.php <path to vendor/autoload.php>   (composer require composer/semver in a scratch dir)
require $argv[1];
use Composer\Semver\VersionParser; use Composer\Semver\Constraint\Constraint;
$p = new VersionParser(); $inp = json_decode(file_get_contents('inputs.json'), true);
$norm = []; foreach ($inp['versions'] as $v) { try { $norm[$v] = $p->normalize($v); } catch (Throwable $e) { $norm[$v] = null; } }
$res = [];
foreach ($inp['constraints'] as $c) {
  try { $k = $p->parseConstraints($c); } catch (Throwable $e) { $res[$c] = ['valid' => false]; continue; }
  $m = [];
  foreach ($inp['versions'] as $v) $m[$v] = $norm[$v] === null ? null : $k->matches(new Constraint('==', $norm[$v]));
  $res[$c] = ['valid' => true, 'range' => (string)$k, 'matches' => $m];
}
$ver = json_decode(file_get_contents(dirname($argv[1]) . '/composer/installed.json'), true);
$tv = '?'; foreach ($ver['packages'] as $pk) if ($pk['name'] === 'composer/semver') $tv = $pk['version'];
echo json_encode(['tool' => "composer/semver $tv", 'normalized_versions' => $norm, 'results' => $res], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), "\n";
