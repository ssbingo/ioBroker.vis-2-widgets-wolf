/*
 * Sandbox — Vorschau der Darstellungs-Komponenten ohne ioBroker (npm start).
 *
 * Rendert dieselben Komponenten, dasselbe CSS und dieselben Schriften wie VIS-2, nur mit
 * simulierten Werten. Die Anbindung (src/widgets/) wird hier bewusst nicht geladen — sie
 * braucht window.visRxWidget von VIS-2 und wird im dev-server geprüft.
 *
 * URL-Parameter für Screenshots: ?theme=dark, ?variant=E
 */
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import Counter, { COUNTER_VARIANTS, toVariant } from '../components/Counter';
import GasMeterView from '../components/GasMeterView';
import { monthlyCost } from '../lib/gas';
import { injectStyles } from '../styles/injectStyles';
import de from '../i18n/de.json';

import './sandbox.css';

interface Meter {
    title: string;
    subtitle: string;
    reading: number;
    flow: number;
    today: number;
    month: number;
}

const START: Meter[] = [
    { title: 'Haupthaus', subtitle: 'mbus.0.1', reading: 18427.482, flow: 0, today: 4.82, month: 96.4 },
    { title: 'Wohnung Obergeschoss', subtitle: 'mbus.0.2', reading: 7314.096, flow: 0.92, today: 2.14, month: 51.7 },
];

const TARIFF = { brennwert: 11.482, zustandszahl: 0.9612, arbeitspreis: 0.1092, grundpreis: 14.9 };
const TICK_MS = 2000;
const PARAMS = new URLSearchParams(window.location.search);

/**
 * Ein Simulationsschritt: Durchfluss gelegentlich an/aus, Zählerstände laufen mit.
 *
 * @param m Zählerzustand vor dem Schritt
 * @returns Zählerzustand nach dem Schritt
 */
function step(m: Meter): Meter {
    let flow = m.flow;
    if (Math.random() < 0.18) {
        flow = flow > 0.02 ? 0 : 0.9 + Math.random() * 1.4;
    }
    const inc = (flow / 3600) * (TICK_MS / 1000);
    return { ...m, flow, reading: m.reading + inc, today: m.today + inc, month: m.month + inc };
}

/** Sandbox-Seite mit Umschaltern für Theme, Zählwerk-Variante und Simulation */
function Sandbox(): React.JSX.Element {
    const [dark, setDark] = useState(() => PARAMS.get('theme') === 'dark');
    const [variant, setVariant] = useState(() => toVariant(PARAMS.get('variant') || 'A'));
    const [running, setRunning] = useState(true);
    const [meters, setMeters] = useState(START);
    const themeType = dark ? 'dark' : 'light';

    useEffect(() => {
        injectStyles();
    }, []);

    useEffect(() => {
        document.body.classList.toggle('sb-dark', dark);
    }, [dark]);

    useEffect(() => {
        if (!running) {
            return undefined;
        }
        const timer = setInterval(() => setMeters(ms => ms.map(step)), TICK_MS);
        return () => clearInterval(timer);
    }, [running]);

    return (
        <div className="sb-wrap">
            <div className="sb-top">
                <div>
                    <h1>Sandbox — vis-2-widgets-wolf</h1>
                    <p className="sb-sub">
                        Dieselben Komponenten und dasselbe CSS wie in VIS-2, mit simulierten Werten. Bindung, Schreiben
                        und Übersetzungen prüfst du im dev-server.
                    </p>
                </div>
                <div className="sb-tools">
                    <button
                        type="button"
                        onClick={() => setDark(d => !d)}
                    >
                        {dark ? 'Hell' : 'Dunkel'}
                    </button>
                    <label>
                        Zählwerk{' '}
                        <select
                            value={variant}
                            onChange={e => setVariant(toVariant(e.target.value))}
                        >
                            {COUNTER_VARIANTS.map(v => (
                                <option
                                    key={v}
                                    value={v}
                                >
                                    {de[`variant_${v}`]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        onClick={() => setRunning(r => !r)}
                    >
                        {running ? 'Simulation pausieren' : 'Simulation starten'}
                    </button>
                </div>
            </div>

            <h2 className="sb-h">Gaszähler — WolfGasMeter</h2>
            <div className="sb-grid">
                {meters.map(m => (
                    <div
                        key={m.subtitle}
                        className="sb-cell"
                    >
                        <GasMeterView
                            themeType={themeType}
                            title={m.title}
                            subtitle={m.subtitle}
                            reading={m.reading}
                            flow={m.flow}
                            today={m.today}
                            month={m.month}
                            costMonth={monthlyCost(m.month, TARIFF)}
                            variant={variant}
                            threshold={0.02}
                            maxFlow={3}
                            intDigits={5}
                            decDigits={3}
                            labels={{
                                flow: de.flow,
                                today: de.today,
                                month: de.month,
                                costMonth: de.cost_month,
                                consumption: de.consumption,
                                noConsumption: de.no_consumption,
                            }}
                        />
                    </div>
                ))}
            </div>

            <h2 className="sb-h">Zählwerk — alle freigegebenen Varianten</h2>
            <div className="sb-grid">
                {COUNTER_VARIANTS.map(v => (
                    <div
                        key={v}
                        className="sb-gallery wolf-w"
                        data-wolf-theme={themeType}
                    >
                        <div className="wolf-label">{de[`variant_${v}`]}</div>
                        <Counter
                            value={meters[0].reading}
                            variant={v}
                            intDigits={5}
                            decDigits={3}
                            unit="m³"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

const root = document.getElementById('root');
if (root) {
    createRoot(root).render(<Sandbox />);
}
