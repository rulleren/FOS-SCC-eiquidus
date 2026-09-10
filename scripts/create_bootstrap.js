const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../lib/settings');

const outputDir = path.join(path.dirname(__dirname), 'public', 'downloads');
const outputFile = path.join(outputDir, 'bootstrap.gz');
const metaFile = path.join(outputDir, 'bootstrap-meta.json');

if (!fs.existsSync(outputDir))
  fs.mkdirSync(outputDir, { recursive: true });

console.log('Creating bootstrap archive...');

const cmd = `mongodump --host="${settings.dbsettings.address}" --port="${settings.dbsettings.port}" --username="${settings.dbsettings.user}" --password="${settings.dbsettings.password}" --db="${settings.dbsettings.database}" --archive="${outputFile}" --gzip`;

const proc = exec(cmd);

proc.stdout.on('data', data => console.log(data));
proc.stderr.on('data', data => console.log(Buffer.from(data).toString()));
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
    filename: 'bootstrap.gz'
  };

  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  console.log(`Bootstrap saved: ${outputFile} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
  process.exit(0);
});
