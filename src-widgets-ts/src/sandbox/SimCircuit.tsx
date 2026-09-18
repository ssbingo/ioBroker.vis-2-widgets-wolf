/*
 * Heizkreis in der Sandbox — schreibt über die simulierte Quelle (useSimSource).
 */
import React from 'react';

import CircuitView from '../components/CircuitView';
import type { NumberRange, SelectOption } from '../lib/objectMeta';
import type { ThemeType } from '../lib/theme';
import de from '../i18n/de.json';
import { useSimSource, type SimOptions, type SimValues } from './useSimSource';

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
const START: SimValues = { mode: 5, day: 22, eco: 18, correction: 1, program: 2 };

/** Eigenschaften der simulierten Kachel */
export interface SimCircuitProps extends SimOptions {
    /** Hell oder dunkel */
    themeType: ThemeType;
    /** Unterzeile */
    subtitle: string;
}

/**
 * Heizkreis-Kachel mit simulierter Quelle.
 *
 * @param props Varianten der Simulation
 * @returns die Kachel
 */
export default function SimCircuit(props: SimCircuitProps): React.JSX.Element {
    const sim = useSimSource(START, props);
    const { values, writes } = sim;

    return (
        <CircuitView
            themeType={props.themeType}
            title={de.circuit}
            subtitle={props.subtitle}
            mode={sim.select('mode', MODES)}
            dayTemp={sim.number('day', TEMP)}
            ecoTemp={sim.number('eco', TEMP)}
            correction={sim.number('correction', CORRECTION)}
            program={sim.select('program', PROGRAMS)}
            readings={[
                { label: de.room_actual, value: 21.4, unit: '°C', decimals: 1 },
                {
                    label: de.room_setpoint,
                    value: Number(values.day) + Number(values.correction),
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
