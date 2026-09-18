import React, { useId } from 'react';

import { tankFraction, type TankScale } from '../lib/tank';

/** Eigenschaften der Speichergrafik */
export interface TankProps {
    /** Speichertemperatur; null zeigt einen leeren Speicher */
    temp: number | null;
    /** Sollmarke; null blendet sie aus */
    target: number | null;
    /** Sollmarke ist ein gewünschter, noch nicht bestätigter Wert */
    targetPending: boolean;
    /** Temperaturskala für Füllstand und Sollmarke */
    scale: TankScale;
    /** formatierte Temperatur im Speicher, z. B. „52,4°" */
    text: string;
    /** Beschriftung für Screenreader */
    label: string;
    /** Speicherladung läuft */
    charging: boolean;
}

/** Innenraum des Speichers im viewBox 0 0 86 190 */
const INNER = { x: 9.5, top: 9.5, bottom: 180.5, width: 67 };
const INNER_HEIGHT = INNER.bottom - INNER.top;

/**
 * Warmwasserspeicher: Füllung von warm (oben) nach kühl (unten) bis zur Speichertemperatur,
 * gestrichelte Sollmarke. Füllung und Marke stehen im selben Maßstab.
 *
 * @param props Temperatur, Sollwert, Skala und Texte
 * @returns die Grafik
 */
export default function Tank(props: TankProps): React.JSX.Element {
    const id = useId().replace(/:/g, '');
    const fill = tankFraction(props.temp, props.scale);
    const target = tankFraction(props.target, props.scale);
    const fillHeight = fill === null ? 0 : Math.max(4, fill * INNER_HEIGHT);
    const targetY = target === null ? null : Math.min(178, Math.max(12, INNER.bottom - target * INNER_HEIGHT));
    const classes = ['wolf-tank'];
    if (props.charging) {
        classes.push('wolf-tank-charging');
    }
    return (
        <div
            className={classes.join(' ')}
            role="meter"
            aria-label={props.label}
            aria-valuemin={props.scale.min}
            aria-valuemax={props.scale.max}
            aria-valuenow={props.temp ?? undefined}
            aria-valuetext={props.text}
        >
            <svg
                viewBox="0 0 86 190"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient
                        id={`${id}-grad`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stopColor="var(--wolf-warm)"
                            stopOpacity="0.55"
                        />
                        <stop
                            offset="100%"
                            stopColor="var(--wolf-cool)"
                            stopOpacity="0.3"
                        />
                    </linearGradient>
                    <clipPath id={`${id}-clip`}>
                        <rect
                            x={INNER.x}
                            y={INNER.top}
                            width={INNER.width}
                            height={INNER_HEIGHT}
                            rx="19"
                        />
                    </clipPath>
                </defs>
                <rect
                    x="8"
                    y="8"
                    width="70"
                    height="174"
                    rx="20"
                    fill="var(--wolf-surface-2)"
                    stroke="var(--wolf-line-strong)"
                    strokeWidth="1.5"
                />
                {fillHeight > 0 ? (
                    <rect
                        className="wolf-tank-fill"
                        x={INNER.x}
                        y={(INNER.bottom - fillHeight).toFixed(1)}
                        width={INNER.width}
                        height={fillHeight.toFixed(1)}
                        clipPath={`url(#${id}-clip)`}
                        fill={`url(#${id}-grad)`}
                    />
                ) : null}
                {targetY === null ? null : (
                    <line
                        className={props.targetPending ? 'wolf-tank-target wolf-pending' : 'wolf-tank-target'}
                        x1="4"
                        y1={targetY.toFixed(1)}
                        x2="82"
                        y2={targetY.toFixed(1)}
                        stroke="var(--wolf-accent)"
                        strokeWidth="2"
                        strokeDasharray="5 4"
                    />
                )}
                <text
                    className="wolf-tank-val"
                    x="43"
                    y="104"
                    textAnchor="middle"
                >
                    {props.text}
                </text>
            </svg>
        </div>
    );
}
