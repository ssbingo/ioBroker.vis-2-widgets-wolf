import { readFileSync } from 'node:fs';

import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { moduleFederationShared } from '@iobroker/types-vis-2/modulefederation.vis.config';
import type { UserConfig } from 'vite';

const pack = JSON.parse(readFileSync('./package.json').toString());

// Produktions-Build: Module Federation erzeugt customWidgets.js und mf-manifest.json.
// React und React-DOM kommen zur Laufzeit von VIS-2 (Singletons aus moduleFederationShared).
const config: UserConfig = {
    plugins: [
        federation({
            manifest: true,
            name: 'vis2Wolf',
            filename: 'customWidgets.js',
            exposes: {
                './WolfGasMeter': './src/widgets/WolfGasMeter',
                './WolfBoiler': './src/widgets/WolfBoiler',
                './WolfCircuit': './src/widgets/WolfCircuit',
                './WolfDhw': './src/widgets/WolfDhw',
                './WolfHeatCurve': './src/widgets/WolfHeatCurve',
                './WolfMessages': './src/widgets/WolfMessages',
                './WolfSchema': './src/widgets/WolfSchema',
                './translations': './src/translations',
            },
            remotes: {},
            shared: moduleFederationShared(pack),
            dts: false,
        }),
        react(),
    ],
    base: './',
    build: {
        target: 'es2022',
        outDir: './build',
    },
};

export default config;
