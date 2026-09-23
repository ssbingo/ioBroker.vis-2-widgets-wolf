/*
 * Simulierte Quelle für die Sandbox: dieselbe Schreib-Nachverfolgung wie im Widget (WriteTracker),
 * die Quelle bestätigt nach kurzer Zeit mit ack:true — oder absichtlich nicht, um die
 * Zeitüberschreitung zu sehen.
 */
import { useEffect, useReducer, useState } from 'react';

import type { ControlStatus, NumberControl, SelectControl, SwitchControl } from '../components/controls';
import { toBoolean } from '../lib/fmt';
import type { NumberRange, SelectOption } from '../lib/objectMeta';
import { WriteTracker, type WriteValue } from '../lib/writeTracker';

/** Bestätigungszeit der simulierten Quelle */
const ACK_MS = 1500;

/** Werte der simulierten Quelle nach Name */
export type SimValues = Record<string, WriteValue>;

/** Varianten der Simulation */
export interface SimOptions {
    /** Änderungen erst nach „Übernehmen" schreiben */
    confirm?: boolean;
    /** Quelle ohne Schreibrecht (common.write: false) */
    locked?: boolean;
    /** Quelle bestätigt nie — zeigt nach der Wartezeit „keine Bestätigung" */
    noAck?: boolean;
    /** Wartezeit auf die Bestätigung in ms */
    timeoutMs?: number;
}

/** Zugriff auf die simulierte Quelle und fertige Bedienelemente */
export interface SimSource {
    /** bestätigte Werte der Quelle */
    values: SimValues;
    /** Nachverfolgung der Schreibvorgänge */
    writes: WriteTracker;
    /** Quelle ändert selbst Werte, bestätigt mit ack:true — z. B. Speicher kühlt ab */
    report: (id: string, value: WriteValue) => void;
    /** Zahlen-Bedienelement */
    number: (id: string, range: NumberRange) => NumberControl;
    /** Auswahl-Bedienelement */
    select: (id: string, options: SelectOption[]) => SelectControl;
    /** Schalter */
    toggle: (id: string) => SwitchControl;
}

/**
 * Simulierte Quelle mit Schreib-Nachverfolgung.
 *
 * @param start Startwerte
 * @param options Varianten der Simulation
 * @returns Werte, Nachverfolgung und Bedienelemente
 */
export function useSimSource(start: SimValues, options: SimOptions): SimSource {
    const { confirm = false, locked = false, noAck = false, timeoutMs = 10_000 } = options;
    const [values, setValues] = useState(start);
    const [, redraw] = useReducer((n: number) => n + 1, 0);
    const [sim] = useState(() => {
        const timers = new Set<ReturnType<typeof setTimeout>>();
        const tracker = new WriteTracker({
            // wie ioBroker: der Befehl steht als Wert im Objekt, die Quelle bestätigt später
            write: (id, value) => {
                if (noAck) {
                    return;
                }
                const timer = globalThis.setTimeout(() => {
                    timers.delete(timer);
                    setValues(s => ({ ...s, [id]: value }));
                    tracker.onState(id, { val: value, ack: true });
                }, ACK_MS);
                timers.add(timer);
            },
            onChange: redraw,
            confirm,
            timeoutMs,
        });
        const report = (id: string, value: WriteValue): void => {
            setValues(s => ({ ...s, [id]: value }));
            tracker.onState(id, { val: value, ack: true });
        };
        const stop = (): void => {
            timers.forEach(clearTimeout);
            tracker.dispose();
        };
        return { writes: tracker, report, stop };
    });
    const { writes } = sim;

    useEffect(() => sim.stop, [sim]);

    const status = (id: string): ControlStatus => (locked ? 'locked' : writes.status(id));
    const request = (id: string, value: WriteValue, immediate: boolean): void => {
        if (!locked) {
            writes.request(id, value, immediate, values[id]);
        }
    };
    return {
        values,
        writes,
        report: sim.report,
        number: (id, range) => ({
            value: Number(writes.display(id, values[id])),
            range,
            status: status(id),
            onChange: v => request(id, v, false),
        }),
        select: (id, list) => ({
            options: list,
            value: String(writes.display(id, values[id])),
            status: status(id),
            onSelect: v => request(id, Number(v), true),
        }),
        toggle: id => ({
            value: toBoolean(writes.display(id, values[id])),
            status: status(id),
            onToggle: on => request(id, on, true),
        }),
    };
}
