import React, { useId } from 'react';

/** Leuchtende Segmente je Ziffer */
const SEG_MAP: Record<string, string> = {
    0: 'abcdef',
    1: 'bc',
    2: 'abged',
    3: 'abgcd',
    4: 'fgbc',
    5: 'afgcd',
    6: 'afgedc',
    7: 'abc',
    8: 'abcdefg',
    9: 'abfgcd',
};

const W = 22;
const H = 42;
const GAP = 4;
const X0 = 3.5;
const X1 = W - 3.5;
const Y_TOP = 4;
const Y_MID = H / 2;
const Y_BOTTOM = H - 4;
const T = 3.2;

type Point = [number, number];

function hSeg(y: number, a: number, b: number): Point[] {
    return [
        [a + 2, y],
        [a + 4.6, y - T],
        [b - 4.6, y - T],
        [b - 2, y],
        [b - 4.6, y + T],
        [a + 4.6, y + T],
    ];
}

function vSeg(x: number, ya: number, yb: number): Point[] {
    return [
        [x, ya + 2],
        [x + T, ya + 4.6],
        [x + T, yb - 4.6],
        [x, yb - 2],
        [x - T, yb - 4.6],
        [x - T, ya + 4.6],
    ];
}

const SEGMENTS: Record<string, Point[]> = {
    a: hSeg(Y_TOP, X0, X1),
    g: hSeg(Y_MID, X0, X1),
    d: hSeg(Y_BOTTOM, X0, X1),
    f: vSeg(X0, Y_TOP, Y_MID),
    b: vSeg(X1, Y_TOP, Y_MID),
    e: vSeg(X0, Y_MID, Y_BOTTOM),
    c: vSeg(X1, Y_MID, Y_BOTTOM),
};

/** Eigenschaften einer Sieben-Segment-Zeile */
export interface SevenSegRowProps {
    /** Ziffernfolge, z. B. "18427482" */
    digits: string;
    /** Index der ersten Nachkommastelle; davor steht der Dezimalpunkt */
    decFrom: number;
    /** Farbe leuchtender Segmente */
    onColor: string;
    /** Farbe dunkler Segmente */
    offColor: string;
    /** Farbe der Nachkommastellen */
    decColor?: string;
    /** Leuchteffekt wie bei einer VFD-Anzeige */
    glow?: boolean;
    /** Beschriftung für Screenreader */
    ariaLabel: string;
}

/**
 * Ziffernzeile in Sieben-Segment-Darstellung (Zählwerk-Variante E).
 * Die Filter-ID ist je Instanz eindeutig, damit mehrere Widgets auf einer Seite sich nicht stören.
 *
 * @param props Ziffern, Farben und Beschriftung
 * @returns die Zeile als SVG
 */
export default function SevenSegRow(props: SevenSegRowProps): React.JSX.Element {
    const filterId = `wolf-glow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const decColor = props.decColor || props.onColor;
    const parts: React.JSX.Element[] = [];
    let x = 2;

    for (let i = 0; i < props.digits.length; i++) {
        if (i === props.decFrom) {
            parts.push(
                <circle
                    key="dp"
                    cx={x + 1.5}
                    cy="38"
                    r="2"
                    fill={decColor}
                />,
            );
            x += 7;
        }
        const lit = SEG_MAP[props.digits[i]] || '';
        const color = i >= props.decFrom ? decColor : props.onColor;
        const ox = x;
        for (const [name, points] of Object.entries(SEGMENTS)) {
            const isOn = lit.includes(name);
            parts.push(
                <polygon
                    key={`${i}${name}`}
                    points={points.map(([px, py]) => `${(px + ox).toFixed(1)},${py.toFixed(1)}`).join(' ')}
                    fill={isOn ? color : props.offColor}
                    filter={isOn && props.glow ? `url(#${filterId})` : undefined}
                />,
            );
        }
        x += W + GAP;
    }

    return (
        <svg
            height="46"
            viewBox={`0 0 ${x} 46`}
            role="img"
            aria-label={props.ariaLabel}
        >
            {props.glow ? (
                <defs>
                    <filter
                        id={filterId}
                        x="-60%"
                        y="-60%"
                        width="220%"
                        height="220%"
                    >
                        <feGaussianBlur
                            stdDeviation="1.6"
                            result="b"
                        />
                        <feMerge>
                            <feMergeNode in="b" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            ) : null}
            {parts}
        </svg>
    );
}
