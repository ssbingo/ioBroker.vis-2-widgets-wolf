import css from './wolf.css?inline';
import { fontFaceCss } from './fonts';

const STYLE_ID = 'vis-2-widgets-wolf-styles';

/**
 * Fügt Schriften und das Widget-CSS einmal je Seite ein.
 * Alle Selektoren in wolf.css sind mit .wolf- präfixiert und wirken nicht auf die übrige VIS-Oberfläche.
 */
export function injectStyles(): void {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
        return;
    }
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `${fontFaceCss()}\n${css}`;
    document.head.appendChild(style);
}
