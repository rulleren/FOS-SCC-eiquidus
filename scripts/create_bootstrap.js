const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../lib/settings');

const coinDataDir = (settings.bootstrap_page && settings.bootstrap_page.coin_data_dir) || '';
const outputDir = path.join(path.dirname(__dirname), 'public', 'downloads');
const outputFile = path.join(outputDir, 'bootstrap.zip');
const metaFile = path.join(outputDir, 'bootstrap-meta.json');

if (!coinDataDir) {
  console.error('Error: bootstrap_page.coin_data_dir is not configured in settings.json');
  process.exit(1);
}

if (!fs.existsSync(path.join(coinDataDir, 'blocks'))) {
  console.error(`Error: blocks/ directory not found in ${coinDataDir}`);
  process.exit(1);
}

if (!fs.existsSync(outputDir))
  fs.mkdirSync(outputDir, { recursive: true });

// remove previous bootstrap so zip doesn't append to it
if (fs.existsSync(outputFile))
  fs.unlinkSync(outputFile);

// include blocks/ and chainstate/ if they exist
const dirs = ['blocks', 'chainstate'].filter(d => fs.existsSync(path.join(coinDataDir, d)));

console.log(`Creating bootstrap from ${coinDataDir} (${dirs.join(', ')})...`);

const cmd = `cd "${coinDataDir}" && zip -r "${outputFile}" ${dirs.join(' ')}`;
const proc = exec(cmd);

proc.stdout.on('data', data => process.stdout.write(data));
proc.stderr.on('data', data => process.stderr.write(Buffer.from(data).toString()));
proc.on('error', err => { console.error(err); process.exit(1); });

proc.on('exit', (code, signal) => {
  if (code || signal) {
    console.log(code ? `Exit code: ${code}` : `Killed with signal: ${signal}`);
    process.exit(1);
  }

  const stats = fs.statSync(outputFile);
  const meta = {
    generated: Date.now(),
    size: stats.size,
    filename: 'bootstrap.zip'
  };

  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  console.log(`Bootstrap saved: ${outputFile} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
  process.exit(0);
});
