/*
 * Heizkurve in der Sandbox — schreibt über die simulierte Quelle (useSimSource). Die
 * Außentemperatur wandert, die „Regelung" liefert den Vorlauf-Soll aus den bestätigten Werten
 * (mit etwas Abweichung zur Näherung), gelegentlich läuft eine Speicherladung.
 */
import React, { useEffect, useState } from 'react';

import type { Reading } from '../components/controls';
import HeatCurveView, { type CurveSetting } from '../components/HeatCurveView';
import { curvePoints, flowSetpoint, type CurveParams } from '../lib/heatCurve';
import type { NumberRange } from '../lib/objectMeta';
import type { ThemeType } from '../lib/theme';
import de from '../i18n/de.json';
import { useSimSource, type SimOptions } from './useSimSource';

const CORRECTION: NumberRange = { min: -4, max: 4, step: 0.5 };
const SLOPE: NumberRange = { min: 0, max: 3, step: 0.1 };
const LEVEL: NumberRange = { min: -5, max: 5, step: 0.5 };
const TICK_MS = 2000;

/** Eigenschaften der simulierten Kachel */
export interface SimHeatCurveProps extends SimOptions {
    /** Hell oder dunkel */
    themeType: ThemeType;
    /** Unterzeile */
    subtitle: string;
    /** Steilheit und Niveau schreibbar (andere Quelle als wolf-smartset) */
    writableSlope: boolean;
    /** Vorlauf-Soll der Regelung verknüpft; sonst wird der Betriebspunkt berechnet */
    controller: boolean;
    /** Krümmung n */
    exponent: number;
    /** Simulation läuft */
    running: boolean;
}

/**
 * Heizkurven-Kachel mit simulierter Quelle.
 *
 * @param props Varianten der Simulation
 * @returns die Kachel
 */
export default function SimHeatCurve(props: SimHeatCurveProps): React.JSX.Element {
    const sim = useSimSource({ correction: 1, slope: 1.5, level: 0 }, props);
    const { values, writes } = sim;
    const [outside, setOutside] = useState({ now: 4.2, avg: 5.1, charging: false, direction: -1 });

    useEffect(() => {
        if (!props.running) {
            return undefined;
        }
        const timer = setInterval(() => {
            const step = 0.4 + Math.random() * 0.4;
            const toggle = Math.random() < 0.1;
            setOutside(o => {
                const direction = o.now < -9 ? 1 : o.now > 12 ? -1 : o.direction;
                const now = o.now + direction * step;
                return {
                    now,
                    avg: o.avg + (now - o.avg) * 0.2,
                    charging: toggle ? !o.charging : o.charging,
                    direction,
                };
            });
        }, TICK_MS);
        return () => clearInterval(timer);
    }, [props.running]);

    const base = { roomSetpoint: 22, exponent: props.exponent, maxFlow: 80 };
    const shown = (id: string): number => Number(writes.display(id, values[id]));
    const params: CurveParams = {
        ...base,
        slope: shown('slope'),
        level: shown('level'),
        correction: shown('correction'),
    };
    const confirmed: CurveParams = {
        ...base,
        slope: Number(values.slope),
        level: Number(values.level),
        correction: Number(values.correction),
    };
    // „Regelung": bestätigte Werte, leicht gekrümmter als die Näherung; Ladung fordert 75 °C
    const controllerFlow = outside.charging ? 75 : flowSetpoint(outside.avg, { ...confirmed, exponent: 1.06 });
    const modelFlow = flowSetpoint(outside.avg, params);
    const pending = ['correction', 'slope', 'level'].some(id => ['pending', 'staged'].includes(writes.status(id)));

    const readings: Reading[] = [
        { label: de.outside, value: outside.now, unit: '°C', decimals: 1 },
        { label: de.outside_avg, value: outside.avg, unit: '°C', decimals: 1 },
        props.controller
            ? { label: de.flow_setpoint, value: controllerFlow, unit: '°C', decimals: 1 }
            : { label: de.curve_value, value: modelFlow, unit: '°C', decimals: 1 },
    ];
    const settings: CurveSetting[] = [
        {
            label: de.correction,
            unit: 'K',
            signed: true,
            control: sim.number('correction', CORRECTION),
            value: null,
            decimals: 1,
        },
        {
            label: de.slope,
            unit: '',
            signed: false,
            control: props.writableSlope ? sim.number('slope', SLOPE) : null,
            value: Number(values.slope),
            decimals: 1,
        },
    ];
    if (props.writableSlope) {
        settings.push({
            label: de.level,
            unit: 'K',
            signed: true,
            control: sim.number('level', LEVEL),
            value: null,
            decimals: 1,
        });
    }

    return (
        <HeatCurveView
            themeType={props.themeType}
            title={de.heatcurve}
            subtitle={props.subtitle}
            chart={{
                points: curvePoints(params, 20, -20),
                pending,
                point: {
                    outside: outside.avg,
                    flow: props.controller ? controllerFlow : modelFlow,
                    distorted: props.controller && outside.charging,
                },
                outsideMax: 20,
                outsideMin: -20,
                flowMin: 20,
                flowMax: 80,
                label: `${de.curve_label}. ${de.approximation}.`,
                locale: 'de-DE',
            }}
            settings={settings}
            readings={readings}
            distorted={props.controller && outside.charging}
            staged={writes.hasStaged()}
            onCommit={() => writes.commit()}
            onDiscard={() => writes.discard()}
            labels={{
                approximation: de.approximation,
                approximationHint: de.approximation_hint,
                distorted: de.distorted,
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
