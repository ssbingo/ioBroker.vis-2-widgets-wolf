import React from 'react';

import { fmt } from '../lib/fmt';
import { flowTicks } from '../lib/heatCurve';

/** Betriebspunkt der Regelung */
export interface CurvePoint {
    /** gemittelte Außentemperatur in °C */
    outside: number;
    /** Vorlauf-Soll der Regelung in °C */
    flow: number;
    /** verfälscht, z. B. während einer Speicherladung — wird hohl gezeichnet */
    distorted: boolean;
}

/** Eigenschaften des Kurvendiagramms */
export interface HeatCurveChartProps {
    /** Stützpunkte [Außentemperatur, Vorlauf] von warm nach kalt */
    points: Array<[number, number]>;
    /** Kurve beruht auf einem noch nicht bestätigten Wert — wird gestrichelt gezeichnet */
    pending: boolean;
    /** Betriebspunkt; null blendet ihn aus */
    point: CurvePoint | null;
    /** wärmste Außentemperatur (linker Rand) */
    outsideMax: number;
    /** kälteste Außentemperatur (rechter Rand) */
    outsideMin: number;
    /** unterer Rand der Vorlaufachse */
    flowMin: number;
    /** oberer Rand der Vorlaufachse */
    flowMax: number;
    /** Beschreibung für Screenreader */
    label: string;
    /** Sprachregion */
    locale?: string;
}

const W = 340;
const H = 150;
const PAD = { left: 30, right: 10, top: 12, bottom: 22 };
const IW = W - PAD.left - PAD.right;
const IH = H - PAD.top - PAD.bottom;

/**
 * Heizkurve: Vorlauf über Außentemperatur, warm links, kalt rechts; Betriebspunkt der Regelung.
 *
 * @param props Kurve, Betriebspunkt und Achsen
 * @returns das Diagramm
 */
export default function HeatCurveChart(props: HeatCurveChartProps): React.JSX.Element {
    const { outsideMax, outsideMin, flowMin, flowMax } = props;
    const x = (ta: number): number => {
        const t = Math.min(outsideMax, Math.max(outsideMin, ta));
        return PAD.left + ((outsideMax - t) / (outsideMax - outsideMin)) * IW;
    };
    const y = (vl: number): number => {
        const v = Math.min(flowMax, Math.max(flowMin, vl));
        return PAD.top + IH - ((v - flowMin) / (flowMax - flowMin)) * IH;
    };
    const path = props.points.map(([ta, vl], i) => `${i ? 'L' : 'M'}${x(ta).toFixed(1)} ${y(vl).toFixed(1)}`).join(' ');
    const outsideTicks = [15, 0, -15].filter(t => t < outsideMax && t > outsideMin);

    const point = props.point;
    let pointLabel: React.JSX.Element | null = null;
    if (point) {
        const px = x(point.outside);
        const py = y(point.flow);
        // Beschriftung rechts oben, am rechten Rand links davon
        const right = px < W - PAD.right - 60;
        pointLabel = (
            <text
                className="wolf-curve-point-label"
                x={(right ? px + 8 : px - 8).toFixed(1)}
                y={Math.max(PAD.top + 10, py - 8).toFixed(1)}
                textAnchor={right ? 'start' : 'end'}
            >
                {`${fmt(point.flow, 0, undefined, props.locale)}°C`}
            </text>
        );
    }

    return (
        <svg
            className="wolf-curve"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={props.label}
        >
            {flowTicks(flowMin, flowMax).map(v => (
                <g key={v}>
                    <line
                        className="wolf-curve-grid"
                        x1={PAD.left}
                        y1={y(v).toFixed(1)}
                        x2={W - PAD.right}
                        y2={y(v).toFixed(1)}
                    />
                    <text
                        className="wolf-curve-tick"
                        x={PAD.left - 6}
                        y={(y(v) + 3.5).toFixed(1)}
                        textAnchor="end"
                    >
                        {v}
                    </text>
                </g>
            ))}
            {outsideTicks.map(t => (
                <text
                    key={t}
                    className="wolf-curve-tick"
                    x={x(t).toFixed(1)}
                    y={H - 6}
                    textAnchor="middle"
                >
                    {`${t < 0 ? `\u2212${-t}` : t}°`}
                </text>
            ))}
            {path ? (
                <path
                    className={props.pending ? 'wolf-curve-line wolf-pending' : 'wolf-curve-line'}
                    d={path}
                />
            ) : null}
            {point ? (
                <circle
                    className={point.distorted ? 'wolf-curve-point wolf-distorted' : 'wolf-curve-point'}
                    cx={x(point.outside).toFixed(1)}
                    cy={y(point.flow).toFixed(1)}
                    r="4.5"
                />
            ) : null}
            {pointLabel}
        </svg>
    );
}
