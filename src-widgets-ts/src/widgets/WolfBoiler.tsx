import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import BoilerView from '../components/BoilerView';
import { toBoolean } from '../lib/fmt';
import { THEME_OPTIONS } from '../lib/theme';
import { mapValue, parseValueMap, type ValueMap } from '../lib/valueMap';
import WolfWidgetBase, { attrNumber, type WolfBaseRxData } from './WolfWidgetBase';

interface WolfBoilerRxData extends WolfBaseRxData {
    oid_phase?: string;
    oid_brenner?: string;
    oid_modulation?: string;
    oid_druck?: string;
    oid_betriebsstunden?: string;
    oid_starts?: string;
    oid_vorlauf?: string;
    oid_ruecklauf?: string;
    phase_map?: string;
    druck_min?: number | string;
    druck_max?: number | string;
    druck_skala?: number | string;
}

/** Eingebaute Phasen, wenn weder Attribut noch Objekt Klartexte liefern */
const DEFAULT_PHASES = [0, 1, 2];

/**
 * Anbindung des Kesselstatus an VIS-2: Attribute, Objektwerte, Klartexte der Betriebsphase.
 * Die Darstellung liegt in components/BoilerView und ist ohne ioBroker prüfbar (Sandbox).
 */
export default class WolfBoiler extends WolfWidgetBase<WolfBoilerRxData> {
    /** Beschreibung des Widgets für die VIS-2-Palette und den Attribut-Editor */
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplWolfBoiler',
            visSet: 'vis-2-widgets-wolf',
            visSetLabel: 'set_label',
            visSetColor: '#c2561f',
            visSetIcon: 'widgets/vis-2-widgets-wolf/img/vis-2-widgets-wolf.png',
            visName: 'WolfBoiler',
            visWidgetLabel: 'boiler',
            // Jede Gruppe hat Felder mit Vorgabe (notfalls ''), sonst legt VIS-2 sie beim Platzieren
            // eines neuen Widgets abgewählt an und die Felder bleiben verborgen.
            visAttrs: [
                {
                    name: 'common',
                    label: 'group_objects',
                    fields: [
                        { name: 'oid_phase', type: 'id', label: 'oid_phase', default: '' },
                        { name: 'oid_brenner', type: 'id', label: 'oid_brenner', default: '' },
                        { name: 'oid_modulation', type: 'id', label: 'oid_modulation', default: '' },
                        { name: 'oid_druck', type: 'id', label: 'oid_druck', default: '' },
                        { name: 'oid_betriebsstunden', type: 'id', label: 'oid_betriebsstunden', default: '' },
                        { name: 'oid_starts', type: 'id', label: 'oid_starts', default: '' },
                        { name: 'oid_vorlauf', type: 'id', label: 'oid_vorlauf', default: '' },
                        { name: 'oid_ruecklauf', type: 'id', label: 'oid_ruecklauf', default: '' },
                    ],
                },
                {
                    name: 'pressure',
                    label: 'group_pressure',
                    fields: [
                        { name: 'druck_min', type: 'number', label: 'druck_min', default: 1.2, min: 0, step: 0.1 },
                        { name: 'druck_max', type: 'number', label: 'druck_max', default: 2.5, min: 0, step: 0.1 },
                        { name: 'druck_skala', type: 'number', label: 'druck_skala', default: 3, min: 1, step: 0.5 },
                    ],
                },
                {
                    name: 'phase',
                    label: 'group_phase',
                    fields: [{ name: 'phase_map', type: 'text', label: 'phase_map', default: '' }],
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
            visDefaultStyle: { width: 340, height: 390 },
            visPrev: 'widgets/vis-2-widgets-wolf/img/prev_boiler.png',
        };
    }

    /** @returns Phasen-Objekt, dessen Klartexte (common.states) gebraucht werden */
    protected metaIds(): Array<string | undefined> {
        return [this.state.rxData.oid_phase];
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
        const defaults: ValueMap = Object.fromEntries(DEFAULT_PHASES.map(n => [String(n), this.tr(`phase_${n}`)]));

        return (
            <BoilerView
                themeType={this.themeType()}
                title={rx.title || this.tr('boiler')}
                subtitle={rx.subtitle}
                phase={mapValue(
                    this.objectValue(rx.oid_phase),
                    parseValueMap(rx.phase_map),
                    this.meta(rx.oid_phase)?.states ?? {},
                    defaults,
                )}
                burner={rx.oid_brenner ? (toBoolean(this.objectValue(rx.oid_brenner)) ?? false) : null}
                showModulation={!!rx.oid_modulation}
                showPressure={!!rx.oid_druck}
                modulation={this.objectNumber(rx.oid_modulation)}
                pressure={this.objectNumber(rx.oid_druck)}
                pressureMin={attrNumber(rx.druck_min, 1.2)}
                pressureMax={attrNumber(rx.druck_max, 2.5)}
                pressureScale={attrNumber(rx.druck_skala, 3)}
                hours={this.objectNumber(rx.oid_betriebsstunden)}
                starts={this.objectNumber(rx.oid_starts)}
                flowTemp={this.objectNumber(rx.oid_vorlauf)}
                returnTemp={this.objectNumber(rx.oid_ruecklauf)}
                labels={{
                    modulation: this.tr('modulation'),
                    pressure: this.tr('pressure'),
                    hours: this.tr('hours'),
                    starts: this.tr('starts'),
                    flowTemp: this.tr('flow_temp'),
                    returnTemp: this.tr('return_temp'),
                    burnerOn: this.tr('burner_on'),
                    burnerOff: this.tr('burner_off'),
                }}
                locale={this.locale()}
            />
        );
    }
}
