// Builds a full chain snapshot (bootstrap.zip) from the coin data directory.
// Mirrors the official SCC-multitool (offlinechainfilebuild): the whole data dir
// is archived (blocks, chainstate, evodb, llmq, indexes, *.dat) EXCEPT wallets,
// config and logs, so a node can start normally without -reindex.
//
// Usage:
//   node scripts/create_bootstrap.js build     -> pack into bootstrap.zip.tmp (daemon MUST be stopped)
//   node scripts/create_bootstrap.js finalize  -> test archive, check for wallet/config, publish (daemon may run)
//   node scripts/create_bootstrap.js           -> both (daemon must be stopped)
// See scripts/bootstrap-cron.sh, which restarts the daemon between the two phases.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../lib/settings');

const phase = process.argv[2] || 'all';
const coinDataDir = (settings.bootstrap_page && settings.bootstrap_page.coin_data_dir) || '';
const outputDir = path.join(path.dirname(__dirname), 'public', 'downloads');
const outputFile = path.join(outputDir, 'bootstrap.zip');
const tmpFile = outputFile + '.tmp';
const metaFile = path.join(outputDir, 'bootstrap-meta.json');

// never ship wallets, config, logs, pid/lock files, the mempool or node-specific state (7z exclude syntax)
const excludes = [
  '-xr!wallet.dat', '-xr!wallets', '-xr!backups', '-xr!*.conf', '-xr!debug.log',
  '-xr!*.pid', '-xr!.lock', '-xr!LOCK', '-xr!mempool.dat', '-xr!*.tmp',
  '-xr!banlist.dat', '-xr!netfulfilled.dat'  // node-specific state, not useful for other nodes
];

const q = s => `'${s.replace(/'/g, `'\\''`)}'`;
const sevenZip = ['/usr/bin/7z', '/usr/bin/7za', '/usr/bin/7zz'].find(f => fs.existsSync(f));

function fail(msg) {
  console.error(msg);
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  process.exit(1);
}

function build() {
  if (!coinDataDir) fail('Error: bootstrap_page.coin_data_dir is not configured in settings.json');
  if (!fs.existsSync(path.join(coinDataDir, 'blocks'))) fail(`Error: blocks/ directory not found in ${coinDataDir}`);
  if (fs.existsSync(path.join(coinDataDir, 'sccd.pid'))) fail('Error: daemon appears to be running (sccd.pid present) - stop it first');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);

  // 7z writes a standard .zip (deflate, level 1) using all CPU cores; plain zip as fallback
  const cmd = sevenZip
    ? `cd ${q(coinDataDir)} && ${sevenZip} a -tzip -mx=1 -mmt=on -bd -bso0 -bsp0 ${q(tmpFile)} * ${excludes.map(q).join(' ')}`
    : `cd ${q(coinDataDir)} && zip -r -q -1 ${q(tmpFile)} . -x 'wallet.dat' 'wallets/*' 'backups/*' '*.conf' 'debug.log' '*.pid' '.lock' '*/LOCK' 'mempool.dat' '*.tmp' 'banlist.dat' 'netfulfilled.dat'`;

  console.log(`Creating bootstrap from ${coinDataDir} using ${sevenZip || 'zip'} ...`);
  try { execSync(cmd, { stdio: 'inherit' }); } catch (e) { fail(e.message); }
}

function finalize() {
  if (!fs.existsSync(tmpFile)) fail(`Error: ${tmpFile} not found - run build first`);
  try {
    console.log('Testing archive ...');
    execSync(`unzip -tq ${q(tmpFile)}`, { stdio: 'inherit' });

    const list = execSync(`unzip -Z1 ${q(tmpFile)}`, { maxBuffer: 64 * 1024 * 1024 }).toString();
    if (/(^|\/)wallet\.dat$|^wallets\/|\.conf$|^backups\//m.test(list))
      throw new Error('wallet/config/backup file found in archive - aborting');
    if (!/^blocks\//m.test(list) || !/^evodb\//m.test(list))
      throw new Error('archive is missing blocks/ or evodb/ - aborting');
  } catch (e) { fail(e.message); }

  fs.chmodSync(tmpFile, 0o644);
  fs.renameSync(tmpFile, outputFile);

  const stats = fs.statSync(outputFile);
  fs.writeFileSync(metaFile, JSON.stringify({
    generated: Date.now(),
    size: stats.size,
    filename: 'bootstrap.zip',
    contents: 'full'
  }, null, 2));
  console.log(`Bootstrap saved: ${outputFile} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
}

if (phase === 'build') build();
else if (phase === 'finalize') finalize();
else { build(); finalize(); }
