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
