import React, { useId } from 'react';

import { fmt } from '../lib/fmt';
import { schemaLayout, type ConsumerLayout } from '../lib/schemaLayout';
import { tankFraction, tankScale } from '../lib/tank';
import type { ThemeType } from '../lib/theme';
import Led from './Led';

/** Ein Heizkreis im Schema */
export interface SchemaCircuit {
    /** Bezeichnung */
    label: string;
    /** Vorlauftemperatur */
    temp: number | null;
    /** Pumpe läuft bzw. Kreis wird versorgt */
    active: boolean;
}

/** Anzeigewerte und Beschriftungen des Anlagenschemas */
export interface SchemaViewProps {
    /** Hell oder dunkel */
    themeType: ThemeType;
    /** Überschrift */
    title: string;
    /** Unterzeile */
    subtitle?: string;
    /** Bezeichnung des Heizgeräts */
    boilerLabel: string;
    /** Brenner an; null: kein Objekt verknüpft (keine LED) */
    burner: boolean | null;
    /** Modulationsgrad in %; null: nicht vorhanden (Flamme voll, kein Text) */
    modulation: number | null;
    /** Kesseltemperatur / Vorlauf */
    flowTemp: number | null;
    /** Rücklauf; undefined blendet den Wert aus */
    returnTemp?: number | null;
    /** Vor- und Rücklauf zwischen Heizgerät und Verteiler fließen */
    primaryActive: boolean;
    /** Warmwasserspeicher; null blendet ihn aus */
    tank: { temp: number | null; active: boolean } | null;
    /** Heizkreise, höchstens vier */
    circuits: SchemaCircuit[];
    /** Außentemperatur; undefined blendet sie aus */
    outsideTemp?: number | null;
    /** Flussanimation (zusätzlich gilt prefers-reduced-motion) */
    animate: boolean;
    /** übersetzte Texte */
    labels: {
        burnerOn: string;
        burnerOff: string;
        modulation: string;
        distributor: string;
        dhw: string;
        outside: string;
        flow: string;
        returnFlow: string;
        circuitOn: string;
        circuitOff: string;
        schema: string;
    };
    /** Sprachregion */
    locale?: string;
}

/** Skala der Speicherfüllung wie im Entwurf */
const TANK_SCALE = tankScale(70);

/**
 * Hydraulisches Anlagenschema — Heizgerät mit Flamme, Verteiler, Speicher, Heizkreise und
 * Außentemperatur; Flusspfeile laufen nur, wo Wasser fließt. Darstellung ohne ioBroker.
 *
 * @param props Werte, Anlagenteile und Texte
 * @returns die Kachel
 */
export default function SchemaView(props: SchemaViewProps): React.JSX.Element {
    const { labels, locale } = props;
    const clipId = `${useId().replace(/:/g, '')}-tank`;
    const layout = schemaLayout({
        tank: !!props.tank,
        circuits: props.circuits.length,
        outside: props.outsideTemp !== undefined,
    });
    const temp = (value: number | null | undefined): string => `${fmt(value ?? null, 1, undefined, locale)} °C`;
    const flow = (active: boolean, extra = ''): string =>
        ['wolf-pipe', 'wolf-flow', extra, active ? '' : 'wolf-idle'].filter(Boolean).join(' ');

    // Flamme: aus fast unsichtbar, an voll — mit Modulation dazwischen wie im Entwurf
    const flameOpacity = props.burner
        ? props.modulation === null
            ? 1
            : 0.45 + Math.min(100, props.modulation) / 180
        : 0.12;
    const b = layout.boiler;

    const consumer = (c: ConsumerLayout): React.JSX.Element => {
        if (c.kind === 'tank' && props.tank) {
            const fill = tankFraction(props.tank.temp, TANK_SCALE) ?? 0;
            const innerH = c.height - 4;
            const fillH = Math.max(4, fill * innerH);
            return (
                <g key="tank">
                    <rect
                        className="wolf-node"
                        x={c.x}
                        y={c.y}
                        width={c.width}
                        height={c.height}
                        rx="14"
                    />
                    <clipPath id={clipId}>
                        <rect
                            x={c.x + 2}
                            y={c.y + 2}
                            width={c.width - 4}
                            height={innerH}
                            rx="13"
                        />
                    </clipPath>
                    <rect
                        className="wolf-schema-fill"
                        x={c.x + 2}
                        y={(c.y + 2 + innerH - fillH).toFixed(1)}
                        width={c.width - 4}
                        height={fillH.toFixed(1)}
                        clipPath={`url(#${clipId})`}
                    />
                    <text
                        className="wolf-slab"
                        x={c.x + c.width / 2}
                        y={c.y + 25}
                        textAnchor="middle"
                    >
                        {labels.dhw}
                    </text>
                    <text
                        className="wolf-sval wolf-warm"
                        x={c.x + c.width / 2}
                        y={c.y + 75}
                        textAnchor="middle"
                    >
                        {temp(props.tank.temp)}
                    </text>
                </g>
            );
        }
        const circuit = props.circuits[c.index - 1];
        return (
            <g key={`hk${c.index}`}>
                <rect
                    className="wolf-node"
                    x={c.x}
                    y={c.y}
                    width={c.width}
                    height={c.height}
                    rx="10"
                />
                {/* Heizkörper-Symbol */}
                <g className="wolf-schema-radiator">
                    {[17, 29, 41].map(dx => (
                        <line
                            key={dx}
                            x1={c.x + dx}
                            y1={c.y + 12}
                            x2={c.x + dx}
                            y2={c.y + 48}
                        />
                    ))}
                </g>
                <text
                    className="wolf-slab"
                    x={c.x + 59}
                    y={c.y + 24}
                >
                    {circuit.label}
                </text>
                <text
                    className={circuit.active ? 'wolf-sval wolf-warm' : 'wolf-sval wolf-cool'}
                    x={c.x + 59}
                    y={c.y + 46}
                >
                    {temp(circuit.temp)}
                </text>
            </g>
        );
    };

    return (
        <div
            className="wolf-w wolf-schema"
            data-wolf-theme={props.themeType}
        >
            <div className="wolf-head">
                <div>
                    <h3>{props.title}</h3>
                    {props.subtitle ? <div className="wolf-hint">{props.subtitle}</div> : null}
                </div>
                {props.burner !== null ? (
                    <Led
                        on={props.burner}
                        labelOn={labels.burnerOn}
                        labelOff={labels.burnerOff}
                    />
                ) : null}
            </div>

            <svg
                className={props.animate ? 'wolf-schema-svg' : 'wolf-schema-svg wolf-schema-static'}
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                role="img"
                aria-label={labels.schema}
            >
                {/* Rohre: Hintergrund, darüber der Fluss */}
                <path
                    className="wolf-pipe wolf-pipe-bg"
                    d={layout.flowPipe}
                />
                <path
                    className="wolf-pipe wolf-pipe-bg"
                    d={layout.returnPipe}
                />
                {layout.consumers.map(c => (
                    <path
                        key={`bg-${c.kind}${c.index}`}
                        className="wolf-pipe wolf-pipe-bg"
                        d={c.pipe}
                    />
                ))}
                <path
                    className={flow(props.primaryActive, 'wolf-flow-warm')}
                    d={layout.flowPipe}
                />
                <path
                    className={flow(props.primaryActive, 'wolf-flow-cool wolf-rev')}
                    d={layout.returnPipe}
                />
                {layout.consumers.map(c => {
                    const active = c.kind === 'tank' ? !!props.tank?.active : !!props.circuits[c.index - 1]?.active;
                    const color = c.kind === 'tank' ? 'wolf-flow-warm' : active ? 'wolf-flow-on' : 'wolf-flow-off';
                    return (
                        <path
                            key={`flow-${c.kind}${c.index}`}
                            className={flow(active, color)}
                            d={c.pipe}
                        />
                    );
                })}

                {/* Heizgerät */}
                <rect
                    className="wolf-node"
                    x={b.x}
                    y={b.y}
                    width={b.width}
                    height={b.height}
                    rx="12"
                />
                <text
                    className="wolf-slab"
                    x={b.x + 16}
                    y={b.y + 24}
                >
                    {props.boilerLabel}
                </text>
                <text
                    className="wolf-sval"
                    x={b.x + 16}
                    y={b.y + 48}
                >
                    {temp(props.flowTemp)}
                </text>
                <g
                    className="wolf-flame"
                    transform={`translate(${b.x + 75},${b.y + 122})`}
                    style={{ opacity: flameOpacity }}
                >
                    <path
                        d="M0 -42 C 16 -24 24 -12 24 2 C 24 18 12 30 0 30 C -12 30 -24 18 -24 2 C -24 -12 -16 -24 0 -42 Z"
                        fill="var(--wolf-warm)"
                        opacity=".28"
                    />
                    <path
                        d="M0 -26 C 9 -14 14 -6 14 3 C 14 13 7 20 0 20 C -7 20 -14 13 -14 3 C -14 -6 -9 -14 0 -26 Z"
                        fill="var(--wolf-warm-2)"
                    />
                    {/* heller Kern der Flamme — physische Nachbildung, bewusst fest */}
                    <path
                        d="M0 -12 C 5 -6 7 -2 7 3 C 7 9 4 13 0 13 C -4 13 -7 9 -7 3 C -7 -2 -5 -6 0 -12 Z"
                        fill="#ffe1a8"
                    />
                </g>
                {props.modulation !== null ? (
                    <text
                        className="wolf-slab"
                        x={b.x + 16}
                        y={b.y + 168}
                    >
                        {`${labels.modulation} ${fmt(props.modulation, 0, undefined, locale)} %`}
                    </text>
                ) : null}

                {/* Rücklauftemperatur unter dem Rücklaufrohr, Bezeichnung und Wert in zwei Zeilen */}
                {props.returnTemp !== undefined ? (
                    <g>
                        <text
                            className="wolf-slab"
                            x={(b.x + b.width + layout.distributor.x) / 2}
                            y={layout.returnY + 22}
                            textAnchor="middle"
                        >
                            {labels.returnFlow}
                        </text>
                        <text
                            className="wolf-sval wolf-cool"
                            x={(b.x + b.width + layout.distributor.x) / 2}
                            y={layout.returnY + 40}
                            textAnchor="middle"
                        >
                            {temp(props.returnTemp)}
                        </text>
                    </g>
                ) : null}

                {/* Verteiler */}
                <rect
                    className="wolf-schema-dist"
                    x={layout.distributor.x}
                    y={layout.distributor.y}
                    width={layout.distributor.width}
                    height={layout.distributor.height}
                    rx="6"
                />
                <text
                    className="wolf-slab"
                    x={layout.distributor.x + layout.distributor.width / 2}
                    y={layout.distributor.y - 8}
                    textAnchor="middle"
                >
                    {labels.distributor}
                </text>

                {layout.consumers.map(consumer)}

                {layout.outside ? (
                    <g>
                        <rect
                            className="wolf-node"
                            x={layout.outside.x}
                            y={layout.outside.y}
                            width={layout.outside.width}
                            height={layout.outside.height}
                            rx="10"
                        />
                        <text
                            className="wolf-slab"
                            x={layout.outside.x + layout.outside.width / 2}
                            y={layout.outside.y + 26}
                            textAnchor="middle"
                        >
                            {labels.outside}
                        </text>
                        <text
                            className="wolf-sval wolf-cool"
                            x={layout.outside.x + layout.outside.width / 2}
                            y={layout.outside.y + 56}
                            textAnchor="middle"
                        >
                            {temp(props.outsideTemp)}
                        </text>
                    </g>
                ) : null}
            </svg>

            <div className="wolf-legend">
                <span className="wolf-lg">
                    <i className="wolf-lg-warm" />
                    {labels.flow}
                </span>
                <span className="wolf-lg">
                    <i className="wolf-lg-cool" />
                    {labels.returnFlow}
                </span>
                {props.circuits.length ? (
                    <>
                        <span className="wolf-lg">
                            <i className="wolf-lg-on" />
                            {labels.circuitOn}
                        </span>
                        <span className="wolf-lg">
                            <i className="wolf-lg-off" />
                            {labels.circuitOff}
                        </span>
                    </>
                ) : null}
            </div>
        </div>
    );
}
