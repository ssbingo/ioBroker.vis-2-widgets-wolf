/*
 * Warmwasser in der Sandbox — schreibt über die simulierte Quelle (useSimSource). Der Speicher
 * kühlt langsam ab, lädt unterhalb von Soll − 5 K nach und bei Sofortladung sofort; die Quelle
 * setzt die Sofortladung am Ende selbst zurück.
 */
import React, { useEffect, useRef } from 'react';

import DhwView from '../components/DhwView';
import type { NumberRange, SelectOption } from '../lib/objectMeta';
import { tankScale } from '../lib/tank';
import type { ThemeType } from '../lib/theme';
import de from '../i18n/de.json';
import { useSimSource, type SimOptions, type SimValues } from './useSimSource';

/** wie wolf-smartset: Werte 0…2 mit den Klartexten 1…3 */
const PROGRAMS: SelectOption[] = ['1', '2', '3'].map((label, i) => ({ value: String(i), label }));
const SETPOINT: NumberRange = { min: 15, max: 80, step: 1 };
const TICK_MS = 2000;

/** Eigenschaften der simulierten Kachel */
export interface SimDhwProps extends SimOptions {
    /** Hell oder dunkel */
    themeType: ThemeType;
    /** Unterzeile */
    subtitle: string;
    /** Speichertemperatur zu Beginn */
    temp: number;
    /** Zirkulation und Sofortladung zeigen — wie ISM7 ohne beides */
    extras: boolean;
    /** Simulation läuft */
    running: boolean;
}

/**
 * Warmwasser-Kachel mit simulierter Quelle.
 *
 * @param props Varianten der Simulation
 * @returns die Kachel
 */
export default function SimDhw(props: SimDhwProps): React.JSX.Element {
    const start: SimValues = {
        temp: props.temp,
        setpoint: 55,
        program: 0,
        circulation: false,
        boost: false,
        charging: 0,
    };
    const sim = useSimSource(start, props);
    const { values, writes, report } = sim;
    // Zustand für den Zeitgeber, ohne ihn bei jedem Wert neu zu starten
    const latest = useRef(values);
    useEffect(() => {
        latest.current = values;
    }, [values]);

    useEffect(() => {
        if (!props.running) {
            return undefined;
        }
        const timer = globalThis.setInterval(() => {
            const v = latest.current;
            const temp = Number(v.temp);
            const target = Number(v.setpoint);
            const boost = v.boost === true;
            let charging = Number(v.charging) === 1;
            if (!charging && (boost || temp < target - 5)) {
                charging = true;
                report('charging', 1);
            }
            if (charging && temp >= target) {
                charging = false;
                report('charging', 0);
                if (boost) {
                    report('boost', false);
                }
            }
            report('temp', Math.round((charging ? temp + 0.6 : temp - 0.08) * 100) / 100);
        }, TICK_MS);
        return () => clearInterval(timer);
    }, [props.running, report]);

    return (
        <DhwView
            themeType={props.themeType}
            title={de.dhw}
            subtitle={props.subtitle}
            temp={Number(values.temp)}
            setpoint={sim.number('setpoint', SETPOINT)}
            effectiveSetpoint={Number(values.charging) === 1 ? Number(values.setpoint) : 15}
            charging={Number(values.charging) === 1}
            program={sim.select('program', PROGRAMS)}
            circulation={props.extras ? sim.toggle('circulation') : null}
            boost={props.extras ? sim.toggle('boost') : null}
            scale={tankScale(SETPOINT.max)}
            staged={writes.hasStaged()}
            onCommit={() => writes.commit()}
            onDiscard={() => writes.discard()}
            labels={{
                tank: de.tank_temp,
                setpoint: de.setpoint,
                effectiveSetpoint: de.effective_setpoint,
                charging: de.charging,
                active: de.active,
                inactive: de.inactive,
                program: de.program,
                circulation: de.circulation,
                boost: de.boost,
                boostActive: de.boost_active,
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
