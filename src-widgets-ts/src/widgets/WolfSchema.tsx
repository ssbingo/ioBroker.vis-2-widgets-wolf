import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import SchemaView, { type SchemaCircuit } from '../components/SchemaView';
import { toBoolean } from '../lib/fmt';
import { MAX_CIRCUITS } from '../lib/schemaLayout';
import { THEME_OPTIONS } from '../lib/theme';
import WolfWidgetBase, { attrNumber, type WolfBaseRxData } from './WolfWidgetBase';

interface WolfSchemaRxData extends WolfBaseRxData {
    oid_vorlauf?: string;
    oid_ruecklauf?: string;
    oid_brenner?: string;
    oid_modulation?: string;
    oid_pumpe?: string;
    oid_aussentemp?: string;
    show_ww?: boolean | string;
    oid_ww_temp?: string;
    oid_ww_ladung?: string;
    hk_count?: number | string;
    boiler_label?: string;
    show_aussen?: boolean | string;
    flow_animation?: boolean | string;
    /** Heizkreise 1…n aus der wiederholbaren Attributgruppe „hk" */
    [key: `hk_label${number}`]: string | undefined;
    [key: `oid_hk_vorlauf${number}`]: string | undefined;
    [key: `oid_hk_pumpe${number}`]: string | undefined;
}

/**
 * Anlagenschema: Heizgerät mit Flamme, Verteiler, Warmwasserspeicher, bis zu vier Heizkreise und
 * Außentemperatur. Die Flusspfeile laufen nur, wo Wasser fließt: Vor- und Rücklauf solange die
 * Kesselpumpe läuft (ohne Objekt: solange der Brenner brennt), der Speicher während der Ladung,
 * ein Heizkreis solange seine Pumpe läuft (ohne Objekt: wie das Heizgerät).
 */
export default class WolfSchema extends WolfWidgetBase<WolfSchemaRxData> {
    /** Beschreibung des Widgets für die VIS-2-Palette und den Attribut-Editor */
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplWolfSchema',
            visSet: 'vis-2-widgets-wolf',
            visSetLabel: 'set_label',
            visSetColor: '#c2561f',
            visName: 'WolfSchema',
            visWidgetLabel: 'schema',
            // Jede Gruppe hat Felder mit Vorgabe (notfalls ''), sonst legt VIS-2 sie beim Platzieren
            // eines neuen Widgets abgewählt an und die Felder bleiben verborgen.
            visAttrs: [
                {
                    name: 'common',
                    label: 'group_objects',
                    fields: [
                        { name: 'oid_vorlauf', type: 'id', label: 'oid_vorlauf', default: '' },
                        { name: 'oid_ruecklauf', type: 'id', label: 'oid_ruecklauf', default: '' },
                        { name: 'oid_brenner', type: 'id', label: 'oid_brenner', default: '' },
                        { name: 'oid_modulation', type: 'id', label: 'oid_modulation', default: '' },
                        {
                            name: 'oid_pumpe',
                            type: 'id',
                            label: 'oid_pumpe',
                            tooltip: 'oid_pumpe_tooltip',
                            default: '',
                        },
                        { name: 'oid_aussentemp', type: 'id', label: 'oid_aussentemp', default: '' },
                    ],
                },
                {
                    name: 'dhw',
                    label: 'dhw',
                    fields: [
                        { name: 'show_ww', type: 'checkbox', label: 'show_ww', default: true },
                        { name: 'oid_ww_temp', type: 'id', label: 'oid_ww_temp', default: '' },
                        { name: 'oid_ww_ladung', type: 'id', label: 'oid_ladung', default: '' },
                    ],
                },
                {
                    name: 'circuits',
                    label: 'group_circuits',
                    fields: [
                        {
                            name: 'hk_count',
                            type: 'number',
                            label: 'hk_count',
                            default: 1,
                            min: 0,
                            max: MAX_CIRCUITS,
                        },
                    ],
                },
                {
                    // wiederholbar: VIS-2 legt die Felder als hk_label1 … hk_labelN usw. an
                    name: 'hk',
                    label: 'circuit',
                    indexFrom: 1,
                    indexTo: 'hk_count',
                    fields: [
                        { name: 'hk_label', type: 'text', label: 'hk_label', default: '' },
                        { name: 'oid_hk_vorlauf', type: 'id', label: 'oid_hk_vorlauf', default: '' },
                        { name: 'oid_hk_pumpe', type: 'id', label: 'oid_hk_pumpe', default: '' },
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
                        { name: 'boiler_label', type: 'text', label: 'boiler_label', default: '' },
                        { name: 'show_aussen', type: 'checkbox', label: 'show_aussen', default: true },
                        { name: 'flow_animation', type: 'checkbox', label: 'flow_animation', default: true },
                    ],
                },
            ],
            visDefaultStyle: { width: 640, height: 400 },
            visPrev: 'widgets/vis-2-widgets-wolf/img/vis-2-widgets-wolf.png',
        };
    }

    /**
     * @param oid Objekt-ID
     * @returns true, wenn das Objekt „an" meldet (bool, Zahl ≠ 0, z. B. Pumpe in %)
     */
    private isOn(oid: string | undefined): boolean {
        return !!oid && toBoolean(this.objectValue(oid)) === true;
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

        const burner = rx.oid_brenner ? this.isOn(rx.oid_brenner) : null;
        // Primärkreis: Pumpe, sonst Brenner
        const primaryActive = rx.oid_pumpe ? this.isOn(rx.oid_pumpe) : !!burner;

        const count = Math.max(0, Math.min(MAX_CIRCUITS, Math.round(attrNumber(rx.hk_count, 1))));
        const circuits: SchemaCircuit[] = [];
        for (let i = 1; i <= count; i++) {
            const pump = rx[`oid_hk_pumpe${i}`];
            circuits.push({
                label: rx[`hk_label${i}`] || `${this.tr('circuit')} ${i}`,
                temp: this.objectNumber(rx[`oid_hk_vorlauf${i}`]),
                active: pump ? this.isOn(pump) : primaryActive,
            });
        }

        const showTank = toBoolean(rx.show_ww) !== false;
        const showOutside = toBoolean(rx.show_aussen) !== false;

        return (
            <SchemaView
                themeType={this.themeType()}
                title={rx.title || this.tr('schema')}
                subtitle={rx.subtitle}
                boilerLabel={rx.boiler_label || this.tr('schema_boiler')}
                burner={burner}
                modulation={rx.oid_modulation ? this.objectNumber(rx.oid_modulation) : null}
                flowTemp={this.objectNumber(rx.oid_vorlauf)}
                returnTemp={rx.oid_ruecklauf ? this.objectNumber(rx.oid_ruecklauf) : undefined}
                primaryActive={primaryActive}
                tank={
                    showTank
                        ? {
                              temp: this.objectNumber(rx.oid_ww_temp),
                              // Ladung: eigenes Objekt, sonst wie das Heizgerät
                              active: rx.oid_ww_ladung ? this.isOn(rx.oid_ww_ladung) : primaryActive,
                          }
                        : null
                }
                circuits={circuits}
                outsideTemp={showOutside ? this.objectNumber(rx.oid_aussentemp) : undefined}
                animate={toBoolean(rx.flow_animation) !== false}
                labels={{
                    burnerOn: this.tr('burner_on'),
                    burnerOff: this.tr('burner_off'),
                    modulation: this.tr('modulation'),
                    distributor: this.tr('distributor'),
                    dhw: this.tr('dhw'),
                    outside: this.tr('outside'),
                    flow: this.tr('legend_flow'),
                    returnFlow: this.tr('return_temp'),
                    circuitOn: this.tr('legend_hk_on'),
                    circuitOff: this.tr('legend_hk_off'),
                    schema: this.tr('schema'),
                }}
                locale={this.locale()}
            />
        );
    }
}
