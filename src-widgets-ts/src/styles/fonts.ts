/*
 * Schriften lokal ausliefern (SIL Open Font License) — keine Anfrage an Google, offline lauffähig.
 *
 * Die @font-face-Regeln entstehen hier im Code statt in wolf.css: Vite löst die ?url-Importe
 * relativ zu import.meta.url auf. Damit stimmen die Pfade auch dann, wenn VIS-2 die Widgets
 * per Module Federation aus einem anderen Verzeichnis lädt als die Seite selbst.
 *
 * Die Schriftpakete stehen in src-widgets-ts/package.json; das Wurzel-package.json des Adapters
 * kennt sie nicht, weil sie nur zum Bauen der Widgets gebraucht werden:
 */
// @repochecker: optional dependency '@fontsource/archivo'
// @repochecker: optional dependency '@fontsource/barlow-semi-condensed'
// @repochecker: optional dependency '@fontsource/jetbrains-mono'
import archivo400 from '@fontsource/archivo/files/archivo-latin-400-normal.woff2?url';
import archivo500 from '@fontsource/archivo/files/archivo-latin-500-normal.woff2?url';
import archivo600 from '@fontsource/archivo/files/archivo-latin-600-normal.woff2?url';
import archivo700 from '@fontsource/archivo/files/archivo-latin-700-normal.woff2?url';
import barlow500 from '@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-500-normal.woff2?url';
import barlow600 from '@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-600-normal.woff2?url';
import jetbrains500 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2?url';
import jetbrains700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2?url';

const FACES: ReadonlyArray<readonly [family: string, weight: number, url: string]> = [
    ['Archivo', 400, archivo400],
    ['Archivo', 500, archivo500],
    ['Archivo', 600, archivo600],
    ['Archivo', 700, archivo700],
    ['Barlow Semi Condensed', 500, barlow500],
    ['Barlow Semi Condensed', 600, barlow600],
    ['JetBrains Mono', 500, jetbrains500],
    ['JetBrains Mono', 700, jetbrains700],
];

/**
 * Liefert die font-face-Regeln für alle Schriften der Widgets.
 *
 * @returns CSS-Text
 */
export function fontFaceCss(): string {
    return FACES.map(
        ([family, weight, url]) =>
            `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url("${url}") format("woff2");}`,
    ).join('\n');
}
