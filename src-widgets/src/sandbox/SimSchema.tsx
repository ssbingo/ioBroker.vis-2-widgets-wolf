/*
 * Anlagenschema in der Sandbox: Brenner taktet, die Pumpe läuft mit, der Speicher lädt
 * gelegentlich, Temperaturen folgen dem Brenner. Mit verknüpftem Umschaltventil steht dieses
 * während der Ladung auf Warmwasser — dann stehen die Heizkreise still.
 */
import React, { useEffect, useState } from 'react';

import SchemaView, { type SchemaCircuit } from '../components/SchemaView';
import { circuitActive, tankActive } from '../lib/schemaFlow';
import type { ThemeType } from '../lib/theme';
import de from '../i18n/de.json';

const TICK_MS = 2000;

/** Eigenschaften der simulierten Kachel */
export interface SimSchemaProps {
    /** Hell oder dunkel */
    themeType: ThemeType;
    /** Unterzeile */
    subtitle: string;
    /** Bezeichnung des Heizgeräts */
    boilerLabel: string;
    /** Modulationsgrad liefern — wolf-smartset mit ISM7 liefert keinen */
    modulation: boolean;
    /** Heizkreise: Bezeichnung und ob die Pumpe läuft (null: wie das Heizgerät) */
    circuits: Array<{ label: string; pump: boolean | null }>;
    /** Simulation läuft */
    running: boolean;
    /** 3-Wege-Umschaltventil verknüpft: während der Ladung steht es auf Warmwasser */
    withValve?: boolean;
}

/**
 * Anlagenschema mit simulierten Werten.
 *
 * @param props Varianten der Simulation
 * @returns die Kachel
 */
export default function SimSchema(props: SimSchemaProps): React.JSX.Element {
    const [s, setS] = useState({
        burner: true,
        mod: 42,
        flow: 54.8,
        ret: 41.3,
        tank: 48.2,
        charging: false,
        outside: 6.2,
    });

    useEffect(() => {
        if (!props.running) {
            return undefined;
        }
        const timer = globalThis.setInterval(() => {
            const toggleBurner = Math.random() < 0.12;
            const toggleCharging = Math.random() < 0.1;
            const noise = Math.random();
            setS(o => {
                const burner = toggleBurner ? !o.burner : o.burner;
                const charging = toggleCharging ? !o.charging : o.charging;
                const flow = burner ? Math.min(68, o.flow + 0.6) : Math.max(30, o.flow - 0.4);
                return {
                    burner,
                    charging,
                    mod: burner ? Math.max(15, Math.min(100, o.mod + (noise - 0.4) * 20)) : 0,
                    flow,
                    ret: flow - 9 - noise * 2,
                    tank: charging ? Math.min(60, o.tank + 0.5) : Math.max(40, o.tank - 0.05),
                    outside: o.outside,
                };
            });
        }, TICK_MS);
        return () => globalThis.clearInterval(timer);
    }, [props.running]);

    const primary = s.burner || s.charging;
    // mit Ventil: es steht genau während der Speicherladung auf Warmwasser
    const valveToDhw = props.withValve ? s.charging : null;
    const circuits: SchemaCircuit[] = props.circuits.map((c, i) => ({
        label: c.label,
        temp: c.pump === false ? 24 : s.flow - i * 12,
        active: circuitActive(c.pump, primary, valveToDhw),
    }));

    return (
        <SchemaView
            themeType={props.themeType}
            title={de.schema}
            subtitle={props.subtitle}
            boilerLabel={props.boilerLabel}
            burner={s.burner}
            modulation={props.modulation ? s.mod : null}
            flowTemp={s.flow}
            returnTemp={s.ret}
            primaryActive={primary}
            tank={{ temp: s.tank, active: tankActive(s.charging, primary, valveToDhw) }}
            circuits={circuits}
            outsideTemp={s.outside}
            animate
            labels={{
                burnerOn: de.burner_on,
                burnerOff: de.burner_off,
                modulation: de.modulation,
                distributor: de.distributor,
                dhw: de.dhw,
                outside: de.outside,
                flow: de.legend_flow,
                returnFlow: de.return_temp,
                circuitOn: de.legend_hk_on,
                circuitOff: de.legend_hk_off,
                schema: de.schema,
            }}
            locale="de-DE"
        />
    );
}
