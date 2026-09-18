import config from '@iobroker/eslint-config';

// Die Widgets prüft die eigene Konfiguration in src-widgets-ts/. Diese Datei im
// Wurzelverzeichnis gibt es, damit Werkzeuge und der Repochecker eine Flat-Config finden.
export default [
    ...config,
    {
        ignores: [
            '.dev-server/',
            '.github/',
            'admin/',
            'widgets/',
            'node_modules/',
            'src-widgets-ts/',
            'test/',
            'tasks.js',
        ],
    },
];
