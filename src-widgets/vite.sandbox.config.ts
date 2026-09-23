import react from '@vitejs/plugin-react';
import type { UserConfig } from 'vite';

// Sandbox: rendert die Darstellungs-Komponenten mit simulierten Werten, ohne ioBroker.
// Nicht Teil des Produktions-Builds. Port 4173 bleibt frei, den nutzt der
// Widget-Entwicklungsmodus von VIS-2.
const config: UserConfig = {
    plugins: [react()],
    server: {
        port: 5173,
        open: '/sandbox.html',
    },
};

export default config;
