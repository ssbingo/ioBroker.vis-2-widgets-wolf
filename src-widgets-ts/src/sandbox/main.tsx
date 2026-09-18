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

import BoilerView from '../components/BoilerView';
import Counter, { COUNTER_VARIANTS, toVariant } from '../components/Counter';
import GasMeterView from '../components/GasMeterView';
import { monthlyCost } from '../lib/gas';
import { injectStyles } from '../styles/injectStyles';
import de from '../i18n/de.json';

import SimCircuit from './SimCircuit';
import SimDhw from './SimDhw';

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

interface Boiler {
    subtitle: string;
    /** Bögen zeigen — ISM7 über wolf-smartset liefert weder Modulation noch Druck */
    gauges: boolean;
    phase: number;
    modulation: number;
    pressure: number;
    hours: number;
    starts: number;
    flowTemp: number;
    returnTemp: number;
}

/** Drei Kessel: Normalbetrieb, Druck zu niedrig (Warnzone sichtbar), und wie ISM7 ohne Modulation/Druck */
const BOILERS: Boiler[] = [
    {
        subtitle: 'CGB-2 / Betriebsdaten',
        gauges: true,
        phase: 1,
        modulation: 42,
        pressure: 1.6,
        hours: 14268,
        starts: 96314,
        flowTemp: 54.8,
        returnTemp: 41.3,
    },
    {
        subtitle: 'Druck unter Warnschwelle',
        gauges: true,
        phase: 0,
        modulation: 0,
        pressure: 1.05,
        hours: 8113,
        starts: 40211,
        flowTemp: 31.2,
        returnTemp: 29.8,
    },
    {
        subtitle: 'wie ISM7: ohne Modulation und Druck',
        gauges: false,
        phase: 0,
        modulation: 0,
        pressure: 0,
        hours: 25419,
        starts: 194198,
        flowTemp: 26,
        returnTemp: 26,
    },
];
const PHASES = [de.phase_0, de.phase_1, de.phase_2];

/** Heizkreis: Quelle bestätigt, Bestätigungsmodus, Quelle schweigt (kurze Wartezeit), schreibgeschützt */
const CIRCUITS = [
    { subtitle: 'Quelle bestätigt nach 1,5 s' },
    { subtitle: 'Bestätigungsmodus', confirm: true },
    { subtitle: 'Quelle bestätigt nicht (Wartezeit 4 s)', noAck: true, timeoutMs: 4000 },
    { subtitle: 'schreibgeschützt (write: false)', locked: true },
];

/** Warmwasser: mit Zirkulation und Sofortladung, wie ISM7 ohne beides, Quelle schweigt, Bestätigungsmodus */
const DHWS = [
    { subtitle: 'Speicher 160 l · Quelle bestätigt', temp: 52.4, extras: true },
    { subtitle: 'wie ISM7: ohne Zirkulation und Sofortladung', temp: 47, extras: false },
    { subtitle: 'Quelle bestätigt nicht (Wartezeit 4 s)', temp: 44, extras: true, noAck: true, timeoutMs: 4000 },
    { subtitle: 'Bestätigungsmodus', temp: 50, extras: true, confirm: true },
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

/**
 * Ein Simulationsschritt für den Kessel: Phase wechselt gelegentlich, Werte folgen der Phase.
 *
 * @param b Kesselzustand vor dem Schritt
 * @returns Kesselzustand nach dem Schritt
 */
function stepBoiler(b: Boiler): Boiler {
    const phase = Math.random() < 0.15 ? Math.floor(Math.random() * 3) : b.phase;
    const burning = phase > 0;
    const modulation = burning ? Math.max(15, Math.min(100, b.modulation + (Math.random() - 0.4) * 20)) : 0;
    const flowTemp = burning ? Math.min(72, b.flowTemp + 0.5) : Math.max(28, b.flowTemp - 0.35);
    return {
        ...b,
        phase,
        modulation,
        pressure: Math.max(0.8, Math.min(2.8, b.pressure + (Math.random() - 0.5) * 0.08)),
        hours: b.hours + (burning ? 1 : 0),
        starts: b.starts + (burning && b.phase === 0 ? 1 : 0),
        flowTemp,
        returnTemp: flowTemp - 9 - Math.random() * 2,
    };
}

/** Sandbox-Seite mit Umschaltern für Theme, Zählwerk-Variante und Simulation */
function Sandbox(): React.JSX.Element {
    const [dark, setDark] = useState(() => PARAMS.get('theme') === 'dark');
    const [variant, setVariant] = useState(() => toVariant(PARAMS.get('variant') || 'A'));
    const [running, setRunning] = useState(true);
    const [meters, setMeters] = useState(START);
    const [boilers, setBoilers] = useState(BOILERS);
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
        const timer = setInterval(() => {
            setMeters(ms => ms.map(step));
            setBoilers(bs => bs.map(stepBoiler));
        }, TICK_MS);
        return () => clearInterval(timer);
    }, [running]);

    return (
        <div className="sb-wrap">
            <div className="sb-top">
                <div>
                    <h1>Sandbox — vis-2-widgets-wolf</h1>
                    <p className="sb-sub">
                        Dieselben Komponenten und dasselbe CSS wie in VIS-2, mit simulierten Werten. Der Heizkreis
                        schreibt über dieselbe Nachverfolgung wie das Widget in eine simulierte Quelle. Bindung an
                        ioBroker und Übersetzungen prüfst du im dev-server.
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

            <h2 className="sb-h">Kesselstatus — WolfBoiler</h2>
            <div className="sb-grid">
                {boilers.map((b, i) => (
                    <div
                        key={i}
                        className="sb-cell sb-cell-boiler"
                    >
                        <BoilerView
                            themeType={themeType}
                            title={de.boiler}
                            subtitle={b.subtitle}
                            phase={PHASES[b.phase]}
                            burner={b.phase > 0}
                            showModulation={b.gauges}
                            showPressure={b.gauges}
                            modulation={b.modulation}
                            pressure={b.pressure}
                            pressureMin={1.2}
                            pressureMax={2.5}
                            pressureScale={3}
                            hours={b.hours}
                            starts={b.starts}
                            flowTemp={b.flowTemp}
                            returnTemp={b.returnTemp}
                            labels={{
                                modulation: de.modulation,
                                pressure: de.pressure,
                                hours: de.hours,
                                starts: de.starts,
                                flowTemp: de.flow_temp,
                                returnTemp: de.return_temp,
                                burnerOn: de.burner_on,
                                burnerOff: de.burner_off,
                            }}
                        />
                    </div>
                ))}
            </div>

            <h2 className="sb-h">Heizkreis — WolfCircuit</h2>
            <div className="sb-grid">
                {CIRCUITS.map(c => (
                    <div
                        key={c.subtitle}
                        className="sb-cell sb-cell-circuit"
                    >
                        <SimCircuit
                            themeType={themeType}
                            {...c}
                        />
                    </div>
                ))}
            </div>

            <h2 className="sb-h">Warmwasser — WolfDhw</h2>
            <div className="sb-grid">
                {DHWS.map(d => (
                    <div
                        key={d.subtitle}
                        className="sb-cell sb-cell-dhw"
                    >
                        <SimDhw
                            themeType={themeType}
                            running={running}
                            {...d}
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
