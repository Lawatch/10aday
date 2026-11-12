<?php
// Composer — the comparator of Composer\Semver\Semver::sort(): normalize + normalizeDefaultBranch, then Comparator::lessThan.
// Usage: php oracle_composer.php <vendor/autoload.php> < inputs.json
require $argv[1];
use Composer\Semver\VersionParser; use Composer\Semver\Comparator;
$p = new VersionParser(); $vs = json_decode(stream_get_contents(STDIN), true)['versions'];
$n = []; foreach ($vs as $v) { try { $n[] = $p->normalizeDefaultBranch($p->normalize($v)); } catch (Throwable $e) { $n[] = null; } }
$cmp = [];
foreach ($n as $a) { if ($a === null) { $cmp[] = null; continue; } $row = [];
  foreach ($n as $b) $row[] = $b === null ? null : ($a === $b ? 0 : (Comparator::lessThan($a, $b) ? -1 : (Comparator::lessThan($b, $a) ? 1 : 0)));
  $cmp[] = $row; }
$ver = json_decode(file_get_contents(dirname($argv[1]) . '/composer/installed.json'), true);
$tv = '?'; foreach ($ver['packages'] as $pk) if ($pk['name'] === 'composer/semver') $tv = $pk['version'];
echo json_encode(['tool' => "composer/semver $tv", 'canon' => $n, 'cmp' => $cmp], JSON_UNESCAPED_SLASHES), "\n";
