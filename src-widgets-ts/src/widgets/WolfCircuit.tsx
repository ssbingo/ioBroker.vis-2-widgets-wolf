import React from 'react';

import type {
    RxRenderWidgetProps,
    RxWidgetInfo,
    RxWidgetInfoAttributesFieldCheckbox,
    WidgetData,
} from '@iobroker/types-vis-2';

import CircuitView from '../components/CircuitView';
import type { Reading } from '../components/controls';
import { CIRCUIT_BLOCKS, type CircuitBlock } from '../lib/circuitBlocks';
import { toBoolean } from '../lib/fmt';
import { numberRange, selectOptions } from '../lib/objectMeta';
import { THEME_OPTIONS } from '../lib/theme';
import WolfWidgetBase, { type WolfBaseRxData } from './WolfWidgetBase';

interface WolfCircuitRxData extends WolfBaseRxData {
    oid_betriebsart?: string;
    oid_tagtemp?: string;
    oid_spartemp?: string;
    oid_korrektur?: string;
    oid_zeitprogramm?: string;
    oid_raumtemp?: string;
    oid_raumsoll?: string;
    oid_vorlauf_soll?: string;
    modes?: string;
    temp_min?: number | string;
    temp_max?: number | string;
    temp_step?: number | string;
    /** Schalter der Gruppe „Sichtbare Blöcke": show_betriebsart … show_vorlauf_soll */
    [key: `show_${string}`]: boolean | string | undefined;
}

/** Wertebereiche, wenn weder Attribut noch Objekt etwas angeben */
const TEMP_FALLBACK = { min: 5, max: 30, step: 0.5 };
const CORRECTION_FALLBACK = { min: -4, max: 4, step: 0.5 };

/**
 * Heizkreis-Bedienung: Betriebsart, Tag-/Spartemperatur, Sollwertkorrektur, Zeitprogramm.
 * Schreibt mit ack:false und zeigt „wird übernommen", bis die Quelle bestätigt.
 * Die Darstellung liegt in components/CircuitView und ist ohne ioBroker prüfbar (Sandbox).
 */
export default class WolfCircuit extends WolfWidgetBase<WolfCircuitRxData> {
    /** Beschreibung des Widgets für die VIS-2-Palette und den Attribut-Editor */
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplWolfCircuit',
            visSet: 'vis-2-widgets-wolf',
            visSetLabel: 'set_label',
            visSetColor: '#c2561f',
            visSetIcon: 'widgets/vis-2-widgets-wolf/img/vis-2-widgets-wolf.png',
            visName: 'WolfCircuit',
            visWidgetLabel: 'circuit',
            // Jede Gruppe hat Felder mit Vorgabe (notfalls ''), sonst legt VIS-2 sie beim Platzieren
            // eines neuen Widgets abgewählt an und die Felder bleiben verborgen.
            visAttrs: [
                {
                    name: 'common',
                    label: 'group_objects',
                    fields: [
                        { name: 'oid_betriebsart', type: 'id', label: 'oid_betriebsart', default: '' },
                        { name: 'oid_tagtemp', type: 'id', label: 'oid_tagtemp', default: '' },
                        { name: 'oid_spartemp', type: 'id', label: 'oid_spartemp', default: '' },
                        { name: 'oid_korrektur', type: 'id', label: 'oid_korrektur', default: '' },
                        { name: 'oid_zeitprogramm', type: 'id', label: 'oid_zeitprogramm', default: '' },
                    ],
                },
                {
                    name: 'readings',
                    label: 'group_readings',
                    fields: [
                        { name: 'oid_raumtemp', type: 'id', label: 'oid_raumtemp', default: '' },
                        { name: 'oid_raumsoll', type: 'id', label: 'oid_raumsoll', default: '' },
                        { name: 'oid_vorlauf_soll', type: 'id', label: 'oid_vorlauf_soll', default: '' },
                    ],
                },
                {
                    name: 'blocks',
                    label: 'group_blocks',
                    // Ein Schalter je Block — so lässt sich die Kachel kürzen, ohne die
                    // Verknüpfung zu verlieren. Ohne Objekt gibt es nichts zu zeigen, dann
                    // bleibt auch der Schalter verborgen.
                    fields: CIRCUIT_BLOCKS.map((name): RxWidgetInfoAttributesFieldCheckbox => ({
                        name: `show_${name}`,
                        type: 'checkbox',
                        label: `show_${name}`,
                        default: true,
                        hidden: (data: WidgetData) => !data[`oid_${name}`],
                    })),
                },
                {
                    name: 'limits',
                    label: 'group_limits',
                    fields: [
                        { name: 'modes', type: 'text', label: 'modes', default: '' },
                        { name: 'temp_min', type: 'number', label: 'temp_min' },
                        { name: 'temp_max', type: 'number', label: 'temp_max' },
                        { name: 'temp_step', type: 'number', label: 'temp_step' },
                    ],
                },
                {
                    name: 'writing',
                    label: 'group_writing',
                    fields: [
                        { name: 'write_delay', type: 'number', label: 'write_delay', default: 800, min: 0, max: 5000 },
                        {
                            name: 'write_timeout',
                            type: 'number',
                            label: 'write_timeout',
                            default: 10,
                            min: 1,
                            max: 300,
                        },
                        { name: 'confirm', type: 'checkbox', label: 'confirm', default: false },
                    ],
                },
                {
                    name: 'display',
                    label: 'group_display',
                    fields: [
                        {
                            name: 'theme',
                            type: 'select',
                            label: 'theme',
                            default: 'auto',
                            options: THEME_OPTIONS.map(v => ({ value: v, label: `theme_${v}` })),
                        },
                        { name: 'title', type: 'text', label: 'title', default: '' },
                        { name: 'subtitle', type: 'text', label: 'subtitle', default: '' },
                    ],
                },
            ],
            // 620: Platz für die Leiste „Übernehmen" im Bestätigungsmodus
            visDefaultStyle: { width: 360, height: 620 },
            visPrev: 'widgets/vis-2-widgets-wolf/img/prev_circuit.png',
        };
    }

    /** @returns schreibbare Objekte — für Grenzen, Schrittweite, Klartexte und Schreibrecht */
    protected metaIds(): Array<string | undefined> {
        const rx = this.state.rxData;
        return [rx.oid_betriebsart, rx.oid_tagtemp, rx.oid_spartemp, rx.oid_korrektur, rx.oid_zeitprogramm];
    }

    /**
     * Darstellung mit den aktuellen Werten
     *
     * @param props von VIS-2 übergebene Render-Eigenschaften
     * @returns die Kachel
     */
    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const rx = this.state.rxData;
        const tempAttrs = { min: rx.temp_min, max: rx.temp_max, step: rx.temp_step };
        // Objekt-ID nur, wenn der Block in der Gruppe „Sichtbare Blöcke" eingeschaltet ist (Vorgabe an)
        const oid = (name: CircuitBlock): string | undefined =>
            toBoolean(rx[`show_${name}`]) === false ? undefined : rx[`oid_${name}`];
        const readings: Reading[] = [];
        const addReading = (name: CircuitBlock, label: string): void => {
            const id = oid(name);
            if (id) {
                readings.push({ label, value: this.objectNumber(id), unit: '°C', decimals: 1 });
            }
        };
        addReading('raumtemp', this.tr('room_actual'));
        addReading('raumsoll', this.tr('room_setpoint'));
        addReading('vorlauf_soll', this.tr('flow_setpoint'));

        return (
            <CircuitView
                themeType={this.themeType()}
                title={rx.title || this.tr('circuit')}
                subtitle={rx.subtitle}
                mode={this.selectControl(oid('betriebsart'), selectOptions(this.meta(rx.oid_betriebsart), rx.modes))}
                dayTemp={this.numberControl(
                    oid('tagtemp'),
                    numberRange(this.meta(rx.oid_tagtemp), tempAttrs, TEMP_FALLBACK),
                )}
                ecoTemp={this.numberControl(
                    oid('spartemp'),
                    numberRange(this.meta(rx.oid_spartemp), tempAttrs, TEMP_FALLBACK),
                )}
                correction={this.numberControl(
                    oid('korrektur'),
                    numberRange(this.meta(rx.oid_korrektur), {}, CORRECTION_FALLBACK),
                )}
                program={this.selectControl(oid('zeitprogramm'), selectOptions(this.meta(rx.oid_zeitprogramm)))}
                readings={readings}
                staged={this.writes.hasStaged()}
                onCommit={() => this.writes.commit()}
                onDiscard={() => this.writes.discard()}
                labels={{
                    mode: this.tr('mode'),
                    dayTemp: this.tr('day_temp'),
                    ecoTemp: this.tr('eco_temp'),
                    correction: this.tr('correction'),
                    program: this.tr('program'),
                    decrease: this.tr('decrease'),
                    increase: this.tr('increase'),
                    apply: this.tr('apply'),
                    discard: this.tr('discard'),
                    status: this.statusTexts(),
                }}
                locale={this.locale()}
            />
        );
    }
}
