/** Ziffern eines Zählerstands, aufgeteilt für die Zählwerk-Darstellung */
export interface CounterDigits {
    /** Ganzzahliger Teil, links mit Nullen aufgefüllt */
    whole: string;
    /** Nachkommastellen, abgeschnitten wie bei einem mechanischen Zählwerk */
    dec: string;
    /** whole + dec */
    all: string;
}

/**
 * Zählerstand in Ziffern zerlegen.
 *
 * Die Zerlegung arbeitet auf der Dezimaldarstellung statt mit Gleitkomma-Arithmetik:
 * (18427.482 - 18427) * 1000 ergibt 481.99…, abgeschnitten also 481 — falsch.
 * toFixed mit drei Reservestellen liefert "18427.482000" und damit die richtigen Ziffern.
 * Nachkommastellen werden abgeschnitten, nicht gerundet — wie beim realen Zählwerk.
 *
 * @param value Zählerstand; null wird als 0 dargestellt
 * @param intDigits Stellen vor dem Komma
 * @param decDigits Stellen nach dem Komma
 * @returns die Ziffern als Zeichenketten
 */
export function splitDigits(value: number | null, intDigits: number, decDigits: number): CounterDigits {
    const v = value !== null && Number.isFinite(value) ? Math.abs(value) : 0;
    const [intPart, fracPart = ''] = v.toFixed(decDigits + 3).split('.');
    const whole = intPart.padStart(intDigits, '0').slice(-intDigits);
    const dec = fracPart.slice(0, decDigits).padEnd(decDigits, '0');
    return { whole, dec, all: whole + dec };
}
