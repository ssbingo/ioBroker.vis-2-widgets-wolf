/*
 * Build der Widgets: src-widgets-ts/ bauen und die Ausgabe nach widgets/vis-2-widgets-wolf/ kopieren.
 *
 * ACHTUNG: widgets/ wird dabei vollständig gelöscht — dort nie von Hand Dateien ablegen.
 */
const { existsSync } = require('node:fs');
const { deleteFoldersRecursive, copyFiles, npmInstall, buildReact } = require('@iobroker/build-tools');

const adapterName = require('./package.json').name.replace('iobroker.', '');

const SRC_TS = 'src-widgets-ts/';
const srcTs = `${__dirname}/${SRC_TS}`;

function clean() {
    deleteFoldersRecursive(`${srcTs}build`);
    deleteFoldersRecursive(`${__dirname}/widgets`);
}

function copyAllFiles() {
    copyFiles([`${SRC_TS}build/customWidgets.js`], `widgets/${adapterName}`);
    // Pflicht: VIS-2 prüft am Manifest, ob react/jsx-runtime geteilt wird (React-19-Kompatibilität)
    copyFiles([`${SRC_TS}build/mf-manifest.json`], `widgets/${adapterName}`);
    copyFiles([`${SRC_TS}build/assets/*.*`], `widgets/${adapterName}/assets`);
    copyFiles([`${SRC_TS}build/img/*`], `widgets/${adapterName}/img`);
    // Statistik-Skript für den Gaszähler: über vis-2 abrufbar unter
    // /vis-2/widgets/vis-2-widgets-wolf/addon/gasverbrauch_statistik_v2.1.0.js
    copyFiles(['addOn/*.*'], `widgets/${adapterName}/addon`);
}

/*
 * Release-ZIP: genau der letzte Commit (git archive) — ohne node_modules, .dev-server,
 * src-widgets-ts/build, www und die lokalen Planungsunterlagen, weil die nicht versioniert sind.
 */
function zip() {
    const { execFileSync } = require('node:child_process');
    const { version } = require('./package.json');
    const pending = execFileSync('git', ['status', '--porcelain'], { cwd: __dirname }).toString().trim();
    if (pending) {
        console.warn('Achtung: nicht übernommene Änderungen fehlen im ZIP — es enthält nur den letzten Commit.');
    }
    const file = `iobroker.vis-2-widgets-wolf-${version}.zip`;
    execFileSync('git', ['archive', '--format=zip', '--prefix=ioBroker.vis-2-widgets-wolf/', '-o', file, 'HEAD'], {
        cwd: __dirname,
    });
    console.log(`${file} erstellt`);
}

if (process.argv.includes('--zip')) {
    zip();
} else if (process.argv.includes('--typescript') || process.argv.length === 2) {
    clean();
    const installed = existsSync(`${srcTs}node_modules`) ? Promise.resolve() : npmInstall(srcTs);
    installed
        .then(() => buildReact(srcTs, { rootDir: __dirname, vite: true }))
        .then(() => copyAllFiles())
        .catch(e => {
            console.error(`Build fehlgeschlagen: ${e}`);
            process.exit(1);
        });
}
