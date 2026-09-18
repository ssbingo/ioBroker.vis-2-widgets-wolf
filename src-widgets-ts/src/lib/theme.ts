/** Hell oder dunkel — so wie es die Darstellungs-Komponenten erwarten */
export type ThemeType = 'light' | 'dark';

/** Auswahl im Widget-Attribut "theme" */
export const THEME_OPTIONS = ['auto', 'light', 'dark'] as const;

/**
 * Farbschema eines Widgets bestimmen.
 *
 * "light" und "dark" gelten fest. "auto" (Vorgabe, auch bei fehlendem oder unbekanntem Wert)
 * folgt dem Theme von VIS-2.
 *
 * @param setting Wert des Widget-Attributs "theme"
 * @param visTheme themeType aus dem Kontext von VIS-2
 * @returns das anzuwendende Farbschema
 */
export function resolveTheme(setting: unknown, visTheme: unknown): ThemeType {
    if (setting === 'light' || setting === 'dark') {
        return setting;
    }
    return visTheme === 'dark' ? 'dark' : 'light';
}
