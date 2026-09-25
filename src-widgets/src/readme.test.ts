/*
 * Zwingende Grundregel für alle README-Dateien: der Buy-Me-a-Coffee-Eintrag steht oben —
 * in README.md und in allen doc/<sprache>/README.md. Fehlt er, schlägt die CI fehl.
 */
import { describe, expect, it } from 'vitest';

const LANGUAGES = ['de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'];
const LINK = 'https://www.buymeacoffee.com/ssbingo';
/** „oben": innerhalb der ersten Zeilen, vor dem ersten inhaltlichen Abschnitt */
const TOP_LINES = 25;

const readmes = import.meta.glob('../../{README.md,doc/*/README.md}', {
    query: '?raw',
    import: 'default',
    eager: true,
});

/** Dateien des beiliegenden Statistik-Skripts, je Fassung als …_vX.Y.Z.js */
const addOn = import.meta.glob('../../addOn/*', { query: '?raw', import: 'default', eager: true });

/** Dateiname einer Skriptfassung, z. B. gasverbrauch_statistik_v2.1.0.js */
const SCRIPT_PATTERN = /gasverbrauch_statistik_v(\d+)\.(\d+)\.(\d+)\.js/g;

/**
 * Fassung als vergleichbare Zahl.
 *
 * @param name Dateiname mit Versionsnummer
 * @returns Zahl, die sich vergleichen lässt
 */
function versionOf(name: string): number {
    const m = /_v(\d+)\.(\d+)\.(\d+)\.js$/.exec(name);
    return m ? Number(m[1]) * 1e6 + Number(m[2]) * 1e3 + Number(m[3]) : 0;
}

describe('README', () => {
    it('gibt es auf Englisch und in allen zehn weiteren Sprachen', () => {
        const files = Object.keys(readmes);
        expect(files).toContain('../../README.md');
        for (const lang of LANGUAGES) {
            expect(files).toContain(`../../doc/${lang}/README.md`);
        }
    });

    it('hat oben den Buy-Me-a-Coffee-Eintrag', () => {
        const paths = ['../../README.md', ...LANGUAGES.map(l => `../../doc/${l}/README.md`)];
        const missing = paths.filter(p => {
            const lines = (readmes[p] ?? '').split('\n');
            const at = lines.findIndex(line => line.includes(LINK));
            const firstSection = lines.findIndex(line => line.startsWith('## '));
            return at < 0 || at >= TOP_LINES || (firstSection >= 0 && at > firstSection);
        });
        expect(missing).toEqual([]);
    });
});

describe('Beiliegendes Statistik-Skript', () => {
    /** Dateinamen im Ordner addOn/ */
    const dateien = Object.keys(addOn).map(f => f.split('/').pop() ?? '');
    /** die neueste Fassung des Skripts */
    const neueste = dateien
        .filter(f => /_v\d+\.\d+\.\d+\.js$/.test(f))
        .sort((a, b) => versionOf(a) - versionOf(b))
        .pop();

    it('liegt als Skript mit Versionsnummer im Ordner addOn/', () => {
        expect(neueste, 'keine Datei gasverbrauch_statistik_vX.Y.Z.js gefunden').toBeTruthy();
    });

    it('wird in den READMEs nur mit vorhandenen Dateinamen genannt', () => {
        for (const [datei, inhalt] of Object.entries(readmes)) {
            // im Changelog bleiben ältere Fassungen stehen, auch wenn ihre Datei längst weg ist
            const text = String(inhalt).split('## Changelog')[0];
            const genannt = [...text.matchAll(SCRIPT_PATTERN)].map(m => m[0]);
            for (const name of genannt) {
                expect(dateien, `${datei} nennt ${name}`).toContain(name);
            }
        }
    });

    it('wird in jeder Anleitung mit der neuesten Fassung genannt', () => {
        // im Changelog stehen ältere Fassungen weiter — geprüft wird nur der Text davor
        for (const datei of Object.keys(readmes)) {
            const text = String(readmes[datei]).split('## Changelog')[0];
            if (!SCRIPT_PATTERN.test(text)) {
                continue; // diese Sprache nennt keine Datei
            }
            SCRIPT_PATTERN.lastIndex = 0;
            const genannt = [...text.matchAll(SCRIPT_PATTERN)].map(m => m[0]);
            for (const name of genannt) {
                expect(name, `${datei} nennt eine ältere Fassung`).toBe(neueste);
            }
        }
    });
});
