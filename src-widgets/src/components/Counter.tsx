import React from 'react';

import { splitDigits } from '../lib/digits';
import { decimalSeparator, fmt } from '../lib/fmt';
import Dial from './Dial';
import SevenSegRow from './SevenSeg';

/** Freigegebene Zählwerk-Varianten; D (LCD) wurde verworfen */
export const COUNTER_VARIANTS = ['A', 'B', 'C', 'E', 'F', 'G', 'H'] as const;
export type CounterVariant = (typeof COUNTER_VARIANTS)[number];

/** Höhe einer Ziffer auf der Walze (Variante B) — muss zu .wolf-cnt-b .wolf-strip span passen */
const DRUM_DIGIT_HEIGHT = 38;
/** Farben der VFD-Leuchtanzeige (Variante E), physisch nachgebildet */
const VFD = { on: '#FFA23F', off: 'rgba(255,162,63,.055)', dec: '#FF7A3F' };

/** Eigenschaften des Zählwerks */
export interface CounterProps {
    /** Zählerstand; null wird als 0 dargestellt */
    value: number | null;
    /** Variante A, B, C, E, F, G oder H; Unbekanntes fällt auf A zurück */
    variant: string;
    /** Stellen vor dem Komma */
    intDigits: number;
    /** Stellen nach dem Komma (Variante H zeigt immer vier Zeigerskalen) */
    decDigits: number;
    /** Sprachregion für Trennzeichen */
    locale?: string;
    /** Einheit; bei C, E und F Teil des Zählwerks, sonst nur für Screenreader */
    unit?: string;
}

/** Varianten, bei denen die Einheit Teil des Zählwerks ist (Plakette, VFD, typografisch) */
const UNIT_INSIDE: readonly CounterVariant[] = ['C', 'E', 'F'];

/**
 * Zeigt das Zählwerk die Einheit selbst an? Sonst setzt sie die Kachel daneben.
 *
 * @param variant Angabe aus dem Widget-Attribut
 * @returns true bei C, E und F
 */
export function unitInside(variant: string | undefined): boolean {
    return UNIT_INSIDE.includes(toVariant(variant));
}

/**
 * Normalisiert eine Variantenangabe.
 *
 * @param variant Angabe aus dem Widget-Attribut
 * @returns eine gültige Variante, sonst A
 */
export function toVariant(variant: string | undefined): CounterVariant {
    const v = (variant || 'A').toUpperCase();
    return (COUNTER_VARIANTS as readonly string[]).includes(v) ? (v as CounterVariant) : 'A';
}

function digitSpans(chars: string, prefix: string, className?: string): React.JSX.Element[] {
    return chars.split('').map((d, i) => (
        <span
            key={`${prefix}${i}`}
            className={className}
        >
            {d}
        </span>
    ));
}

/**
 * Zählwerk in den freigegebenen Varianten.
 *
 * @param props Wert, Variante und Stellen
 * @returns das Zählwerk
 */
export default function Counter(props: CounterProps): React.JSX.Element {
    const variant = toVariant(props.variant);
    const d = splitDigits(props.value, props.intDigits, props.decDigits);
    const label = fmt(props.value, props.decDigits, props.unit, props.locale);
    const className = `wolf-counter wolf-cnt-${variant.toLowerCase()}`;

    switch (variant) {
        case 'B':
            // Walzen: jede Ziffer ist ein Streifen 0–9, die Verschiebung wird per CSS animiert
            return (
                <div
                    className={className}
                    role="img"
                    aria-label={label}
                >
                    {d.all.split('').map((digit, i) => (
                        <div
                            key={i}
                            className={i >= d.whole.length ? 'wolf-col wolf-dec' : 'wolf-col'}
                        >
                            <div
                                className="wolf-strip"
                                style={{ transform: `translateY(-${Number(digit) * DRUM_DIGIT_HEIGHT}px)` }}
                            >
                                {digitSpans('0123456789', 's')}
                            </div>
                        </div>
                    ))}
                </div>
            );

        case 'C':
            return (
                <div
                    className={className}
                    role="img"
                    aria-label={label}
                >
                    <div className="wolf-win">
                        {digitSpans(d.whole, 'w')}
                        {digitSpans(d.dec, 'd', 'wolf-dec')}
                    </div>
                    {props.unit ? <span className="wolf-m3">{props.unit}</span> : null}
                </div>
            );

        case 'E':
            return (
                <div className={className}>
                    <SevenSegRow
                        digits={d.all}
                        decFrom={d.whole.length}
                        onColor={VFD.on}
                        offColor={VFD.off}
                        decColor={VFD.dec}
                        glow
                        ariaLabel={label}
                    />
                    {props.unit ? <span className="wolf-m3">{props.unit}</span> : null}
                </div>
            );

        case 'F':
            return (
                <div
                    className={className}
                    role="img"
                    aria-label={label}
                >
                    <span className="wolf-int">{Number(d.whole).toLocaleString(props.locale || 'de-DE')}</span>
                    {d.dec ? (
                        <>
                            <span className="wolf-sep">{decimalSeparator(props.locale)}</span>
                            <span className="wolf-frac">{d.dec}</span>
                        </>
                    ) : null}
                    {props.unit ? <span className="wolf-u">{props.unit}</span> : null}
                </div>
            );

        case 'H': {
            // Ganze m³ auf Walzen, vier Nachkommastellen auf Zeigerskalen
            const frac = splitDigits(props.value, props.intDigits, 4).dec;
            const sep = decimalSeparator(props.locale);
            const labels = [`0${sep}1`, `0${sep}01`, `0${sep}001`, `0${sep}0001`];
            return (
                <div
                    className={className}
                    role="img"
                    aria-label={fmt(props.value, 4, props.unit, props.locale)}
                >
                    <div className="wolf-cnt-a">{digitSpans(d.whole, 'w')}</div>
                    <div className="wolf-dials">
                        {labels.map((l, i) => (
                            <Dial
                                key={l}
                                value={Number(frac[i])}
                                label={l}
                            />
                        ))}
                    </div>
                </div>
            );
        }

        default:
            // A (mechanisches Rollenzählwerk) und G (Kachelziffern) teilen das Markup
            return (
                <div
                    className={className}
                    role="img"
                    aria-label={label}
                >
                    {digitSpans(d.whole, 'w')}
                    {digitSpans(d.dec, 'd', 'wolf-dec')}
                </div>
            );
    }
}
