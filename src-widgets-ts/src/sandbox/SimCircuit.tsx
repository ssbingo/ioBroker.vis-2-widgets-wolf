/*
 * Heizkreis in der Sandbox: dieselbe Schreib-Nachverfolgung wie im Widget (WriteTracker),
 * dazu eine simulierte Quelle, die nach kurzer Zeit mit ack:true bestätigt — oder absichtlich
 * nicht, um die Zeitüberschreitung zu sehen.
 */
import React, { useEffect, useReducer, useState } from 'react';

import CircuitView from '../components/CircuitView';
import type { ControlStatus, NumberControl, SelectControl } from '../components/controls';
import type { NumberRange, SelectOption } from '../lib/objectMeta';
import type { ThemeType } from '../lib/theme';
import { WriteTracker, type WriteValue } from '../lib/writeTracker';
import de from '../i18n/de.json';

/** Bestätigungszeit der simulierten Quelle */
const ACK_MS = 1500;

/** wie wolf-smartset: common.states, gefiltert auf min 1 … max 5 */
const MODES: SelectOption[] = [
    { value: '1', label: 'Standby-Betrieb' },
    { value: '2', label: 'Automatikbetrieb' },
    { value: '3', label: 'Heizbetrieb' },
    { value: '4', label: 'Absenkbetrieb' },
    { value: '5', label: 'Sommerbetrieb' },
];
const PROGRAMS: SelectOption[] = ['1', '2', '3'].map(v => ({ value: v, label: v }));
const TEMP: NumberRange = { min: 5, max: 30, step: 0.5 };
const CORRECTION: NumberRange = { min: -4, max: 4, step: 0.5 };

/** Startwerte wie im wolf-smartset-Export */
const START: Record<string, WriteValue> = { mode: 5, day: 22, eco: 18, correction: 1, program: 2 };

/** Eigenschaften der simulierten Kachel */
export interface SimCircuitProps {
    /** Hell oder dunkel */
    themeType: ThemeType;
    /** Unterzeile */
    subtitle: string;
    /** Änderungen erst nach „Übernehmen" schreiben */
    confirm?: boolean;
    /** Quelle ohne Schreibrecht (common.write: false) */
    locked?: boolean;
    /** Quelle bestätigt nie — zeigt nach der Wartezeit „keine Bestätigung" */
    noAck?: boolean;
    /** Wartezeit auf die Bestätigung in ms */
    timeoutMs?: number;
}

/**
 * Heizkreis-Kachel mit simulierter Quelle.
 *
 * @param props Varianten der Simulation
 * @returns die Kachel
 */
export default function SimCircuit(props: SimCircuitProps): React.JSX.Element {
    const { confirm = false, locked = false, noAck = false, timeoutMs = 10_000 } = props;
    const [source, setSource] = useState(START);
    const [, redraw] = useReducer((n: number) => n + 1, 0);
    const [sim] = useState(() => {
        const timers = new Set<ReturnType<typeof setTimeout>>();
        const tracker = new WriteTracker({
            // wie ioBroker: der Befehl steht als Wert im Objekt, die Quelle bestätigt später
            write: (id, value) => {
                if (noAck) {
                    return;
                }
                const timer = setTimeout(() => {
                    timers.delete(timer);
                    setSource(s => ({ ...s, [id]: value }));
                    tracker.onState(id, { val: value, ack: true });
                }, ACK_MS);
                timers.add(timer);
            },
            onChange: redraw,
            confirm,
            timeoutMs,
        });
        const stop = (): void => {
            timers.forEach(clearTimeout);
            tracker.dispose();
        };
        return { writes: tracker, stop };
    });
    const writes = sim.writes;

    useEffect(() => sim.stop, [sim]);

    const status = (id: string): ControlStatus => (locked ? 'locked' : writes.status(id));
    const request = (id: string, value: WriteValue, immediate: boolean): void => {
        if (!locked) {
            writes.request(id, value, immediate, source[id]);
        }
    };
    const number = (id: string, range: NumberRange): NumberControl => ({
        value: Number(writes.display(id, source[id])),
        range,
        status: status(id),
        onChange: v => request(id, v, false),
    });
    const select = (id: string, options: SelectOption[]): SelectControl => ({
        options,
        value: String(writes.display(id, source[id])),
        status: status(id),
        onSelect: v => request(id, Number(v), true),
    });

    return (
        <CircuitView
            themeType={props.themeType}
            title={de.circuit}
            subtitle={props.subtitle}
            mode={select('mode', MODES)}
            dayTemp={number('day', TEMP)}
            ecoTemp={number('eco', TEMP)}
            correction={number('correction', CORRECTION)}
            program={select('program', PROGRAMS)}
            readings={[
                { label: de.room_actual, value: 21.4, unit: '°C', decimals: 1 },
                {
                    label: de.room_setpoint,
                    value: Number(source.day) + Number(source.correction),
                    unit: '°C',
                    decimals: 1,
                },
                { label: de.flow_setpoint, value: 41.5, unit: '°C', decimals: 1 },
            ]}
            staged={writes.hasStaged()}
            onCommit={() => writes.commit()}
            onDiscard={() => writes.discard()}
            labels={{
                mode: de.mode,
                dayTemp: de.day_temp,
                ecoTemp: de.eco_temp,
                correction: de.correction,
                program: de.program,
                decrease: de.decrease,
                increase: de.increase,
                apply: de.apply,
                discard: de.discard,
                status: {
                    pending: de.status_pending,
                    staged: de.status_staged,
                    timeout: de.status_timeout,
                    locked: de.status_locked,
                },
            }}
            locale="de-DE"
        />
    );
}
