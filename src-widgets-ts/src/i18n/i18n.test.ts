/*
 * Übersetzungen: gleiche Schlüssel in allen elf Sprachen, jeder im Code verwendete Schlüssel
 * vorhanden, und der Markenname „Wolf" nie übersetzt (Maschinenübersetzer machen daraus das Tier).
 */
import { describe, expect, it } from 'vitest';

import { COUNTER_VARIANTS } from '../components/Counter';
import { SERIES_COLORS } from '../components/TrendsChart';
import { AGGREGATES, RANGES } from '../lib/chart';
import { SEVERITIES } from '../lib/messages';
import { CIRCUIT_BLOCKS } from '../lib/circuitBlocks';
import { GAS_VALUE_KEYS } from '../lib/gasStats';
import { THEME_OPTIONS } from '../lib/theme';
import translations from '../translations';

const LANGUAGES = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'] as const;
const dict = translations as unknown as Record<string, Record<string, string>>;

/** Quelltexte der Anbindung und Darstellung — dort stehen alle Schlüssel für VIS-2 */
const sources = import.meta.glob('../{widgets,components}/*.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
});

/** Schlüssel, die der Code aus Listen zusammensetzt, z. B. theme_auto */
const DYNAMIC = [
    ...THEME_OPTIONS.map(v => `theme_${v}`),
    ...Object.keys(RANGES).map(v => `range_${v}`),
    ...COUNTER_VARIANTS.map(v => `variant_${v}`),
    ...SEVERITIES.map(v => `severity_${v}`),
    ...SERIES_COLORS.map(v => `color_${v}`),
    ...AGGREGATES.map(v => `aggregate_${v}`),
    ...CIRCUIT_BLOCKS.map(v => `show_${v}`),
    ...GAS_VALUE_KEYS,
    'phase_0',
    'phase_1',
    'phase_2',
];

describe('Übersetzungen', () => {
    it('gibt es in allen elf Sprachen mit denselben Schlüsseln, keiner leer', () => {
        const reference = Object.keys(dict.en).sort();
        for (const lang of LANGUAGES) {
            expect(Object.keys(dict[lang]).sort(), lang).toEqual(reference);
            const empty = Object.entries(dict[lang]).filter(([, v]) => typeof v !== 'string' || !v.trim());
            expect(empty, lang).toEqual([]);
        }
    });

    it('decken jeden im Code verwendeten Schlüssel ab', () => {
        const used = new Set<string>(DYNAMIC);
        const pattern = /(?:tr\(|label: |tooltip: |visWidgetLabel: |visSetLabel: )'([a-z0-9_]+)'/g;
        for (const source of Object.values(sources)) {
            for (const match of source.matchAll(pattern)) {
                used.add(match[1]);
            }
        }
        expect(used.size).toBeGreaterThan(100);
        expect([...used].filter(key => !(key in dict.en)).sort()).toEqual([]);
    });

    it('übersetzen den Markennamen Wolf nie', () => {
        const withBrand = Object.entries(dict.en).filter(([, v]) => v.includes('Wolf'));
        expect(withBrand.length).toBeGreaterThan(0);
        for (const lang of LANGUAGES) {
            const lost = withBrand.filter(([key]) => !dict[lang][key].includes('Wolf')).map(([key]) => key);
            expect(lost, lang).toEqual([]);
        }
    });
});
