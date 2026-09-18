import { describe, expect, it } from 'vitest';

import { resolveTheme } from './theme';

describe('resolveTheme', () => {
    it('übernimmt eine feste Auswahl unabhängig von VIS-2', () => {
        expect(resolveTheme('dark', 'light')).toBe('dark');
        expect(resolveTheme('light', 'dark')).toBe('light');
    });

    it('folgt bei "auto" dem Theme von VIS-2', () => {
        expect(resolveTheme('auto', 'dark')).toBe('dark');
        expect(resolveTheme('auto', 'light')).toBe('light');
    });

    it('behandelt fehlende oder unbekannte Werte wie "auto"', () => {
        expect(resolveTheme(undefined, 'dark')).toBe('dark');
        expect(resolveTheme('', 'light')).toBe('light');
        expect(resolveTheme('blau', 'dark')).toBe('dark');
    });

    it('fällt ohne VIS-2-Theme auf hell zurück', () => {
        expect(resolveTheme('auto', undefined)).toBe('light');
    });
});
