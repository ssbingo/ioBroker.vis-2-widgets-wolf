import React from 'react';

/** Zeiger und Skala in der Farbe eines realen Zeigerwerks */
const DIAL_RED = '#B01F1A';
const R = 17;
const CX = 20;
const CY = 20;

/** Eigenschaften einer Zeigerskala */
export interface DialProps {
    /** Ziffer 0–9, auf die der Zeiger zeigt */
    value: number;
    /** Beschriftung unter der Skala, z. B. "0,1" */
    label: string;
}

/**
 * Zeigerskala 0–9 wie bei den Nachkommarollen eines Balgengaszählers.
 *
 * @param props Ziffer und Beschriftung
 * @returns die Skala als SVG
 */
export default function Dial(props: DialProps): React.JSX.Element {
    const ticks: React.JSX.Element[] = [];
    for (let i = 0; i < 10; i++) {
        const a = (i / 10) * 2 * Math.PI - Math.PI / 2;
        ticks.push(
            <line
                key={`t${i}`}
                x1={(CX + Math.cos(a) * (R - 3)).toFixed(1)}
                y1={(CY + Math.sin(a) * (R - 3)).toFixed(1)}
                x2={(CX + Math.cos(a) * (R - 6.5)).toFixed(1)}
                y2={(CY + Math.sin(a) * (R - 6.5)).toFixed(1)}
                stroke="var(--wolf-muted)"
                strokeWidth="1.2"
            />,
        );
        if (i % 2 === 0) {
            ticks.push(
                <text
                    key={`n${i}`}
                    x={(CX + Math.cos(a) * (R - 10.5)).toFixed(1)}
                    y={(CY + Math.sin(a) * (R - 10.5) + 3).toFixed(1)}
                    fontSize="6"
                    textAnchor="middle"
                    fill="var(--wolf-muted)"
                >
                    {i}
                </text>,
            );
        }
    }
    const angle = ((props.value / 10) * 360 - 90) * (Math.PI / 180);

    return (
        <svg
            width="46"
            height="58"
            viewBox="0 0 40 52"
            role="img"
            aria-label={`${props.label}: ${props.value}`}
        >
            <circle
                cx={CX}
                cy={CY}
                r="17.5"
                fill="var(--wolf-surface)"
                stroke={DIAL_RED}
                strokeWidth="1.6"
            />
            {ticks}
            <line
                x1={CX}
                y1={CY}
                x2={(CX + Math.cos(angle) * (R - 7)).toFixed(1)}
                y2={(CY + Math.sin(angle) * (R - 7)).toFixed(1)}
                stroke={DIAL_RED}
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <circle
                cx={CX}
                cy={CY}
                r="2"
                fill={DIAL_RED}
            />
            <text
                x={CX}
                y="47"
                fontSize="8"
                textAnchor="middle"
                fill="var(--wolf-muted)"
            >
                {props.label}
            </text>
        </svg>
    );
}
