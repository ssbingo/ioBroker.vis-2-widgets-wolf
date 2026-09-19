import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import DhwView from '../components/DhwView';
import { fmt, toBoolean, toNumber } from '../lib/fmt';
import { numberRange, selectOptions } from '../lib/objectMeta';
import { tankScale } from '../lib/tank';
import { THEME_OPTIONS } from '../lib/theme';
import WolfWidgetBase, { type WolfBaseRxData } from './WolfWidgetBase';

interface WolfDhwRxData extends WolfBaseRxData {
    oid_ww_temp?: string;
    oid_ww_soll?: string;
    oid_zeitprogramm?: string;
    oid_zirkulation?: string;
    oid_sofortladung?: string;
    oid_ww_soll_wirksam?: string;
    oid_ladung?: string;
    soll_min?: number | string;
    soll_max?: number | string;
    soll_step?: number | string;
    volumen?: number | string;
}

/** Wertebereich der Solltemperatur, wenn weder Attribut noch Objekt etwas angeben */
const SETPOINT_FALLBACK = { min: 15, max: 80, step: 1 };

/**
 * Warmwasser: Speichergrafik mit Sollmarke, Solltemperatur, Zeitprogramm, optional Zirkulation
 * und Sofortladung. Schreibt mit ack:false und zeigt „wird übernommen", bis die Quelle bestätigt.
 * Jedes Element erscheint nur mit verknüpftem Datenpunkt.
 */
export default class WolfDhw extends WolfWidgetBase<WolfDhwRxData> {
    /** Beschreibung des Widgets für die VIS-2-Palette und den Attribut-Editor */
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplWolfDhw',
            visSet: 'vis-2-widgets-wolf',
            visSetLabel: 'set_label',
            visSetColor: '#c2561f',
            visSetIcon: 'widgets/vis-2-widgets-wolf/img/vis-2-widgets-wolf.png',
            visName: 'WolfDhw',
            visWidgetLabel: 'dhw',
            // Gruppen mit einer Vorgabe (notfalls '') legt VIS-2 beim Platzieren ausgewählt an, die übrigen
            // abgewählt. Die Grenzen bleiben bewusst abgewählt: Sie überschreiben nur die Objektwerte.
            visAttrs: [
                {
                    name: 'common',
                    label: 'group_objects',
                    fields: [
                        { name: 'oid_ww_temp', type: 'id', label: 'oid_ww_temp', default: '' },
                        { name: 'oid_ww_soll', type: 'id', label: 'oid_ww_soll', default: '' },
                        { name: 'oid_zeitprogramm', type: 'id', label: 'oid_zeitprogramm', default: '' },
                        { name: 'oid_zirkulation', type: 'id', label: 'oid_zirkulation', default: '' },
                        { name: 'oid_sofortladung', type: 'id', label: 'oid_sofortladung', default: '' },
                    ],
                },
                {
                    name: 'readings',
                    label: 'group_readings',
                    fields: [
                        { name: 'oid_ww_soll_wirksam', type: 'id', label: 'oid_ww_soll_wirksam', default: '' },
                        { name: 'oid_ladung', type: 'id', label: 'oid_ladung', default: '' },
                    ],
                },
                {
                    name: 'limits',
                    label: 'group_limits',
                    fields: [
                        { name: 'soll_min', type: 'number', label: 'temp_min' },
                        { name: 'soll_max', type: 'number', label: 'temp_max' },
                        { name: 'soll_step', type: 'number', label: 'temp_step' },
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
                        { name: 'volumen', type: 'number', label: 'volumen', min: 0 },
                    ],
                },
            ],
            // 480: Platz für die Leiste „Übernehmen" im Bestätigungsmodus
            visDefaultStyle: { width: 360, height: 480 },
            visPrev: 'widgets/vis-2-widgets-wolf/img/prev_dhw.png',
        };
    }

    /** @returns schreibbare Objekte — für Grenzen, Schrittweite, Klartexte und Schreibrecht */
    protected metaIds(): Array<string | undefined> {
        const rx = this.state.rxData;
        return [rx.oid_ww_soll, rx.oid_zeitprogramm, rx.oid_zirkulation, rx.oid_sofortladung];
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
        const locale = this.locale();
        const range = numberRange(
            this.meta(rx.oid_ww_soll),
            { min: rx.soll_min, max: rx.soll_max, step: rx.soll_step },
            SETPOINT_FALLBACK,
        );
        const volume = toNumber(rx.volumen);
        const subtitle =
            rx.subtitle ||
            (volume ? this.tr('tank_volume').replace('{volume}', fmt(volume, 0, undefined, locale)) : '');

        return (
            <DhwView
                themeType={this.themeType()}
                title={rx.title || this.tr('dhw')}
                subtitle={subtitle}
                temp={this.objectNumber(rx.oid_ww_temp)}
                setpoint={this.numberControl(rx.oid_ww_soll, range)}
                effectiveSetpoint={rx.oid_ww_soll_wirksam ? this.objectNumber(rx.oid_ww_soll_wirksam) : undefined}
                charging={rx.oid_ladung ? toBoolean(this.objectValue(rx.oid_ladung)) : undefined}
                program={this.selectControl(rx.oid_zeitprogramm, selectOptions(this.meta(rx.oid_zeitprogramm)))}
                circulation={this.switchControl(rx.oid_zirkulation)}
                boost={this.switchControl(rx.oid_sofortladung)}
                scale={tankScale(range.max)}
                staged={this.writes.hasStaged()}
                onCommit={() => this.writes.commit()}
                onDiscard={() => this.writes.discard()}
                labels={{
                    tank: this.tr('tank_temp'),
                    setpoint: this.tr('setpoint'),
                    effectiveSetpoint: this.tr('effective_setpoint'),
                    charging: this.tr('charging'),
                    active: this.tr('active'),
                    inactive: this.tr('inactive'),
                    program: this.tr('program'),
                    circulation: this.tr('circulation'),
                    boost: this.tr('boost'),
                    boostActive: this.tr('boost_active'),
                    decrease: this.tr('decrease'),
                    increase: this.tr('increase'),
                    apply: this.tr('apply'),
                    discard: this.tr('discard'),
                    status: this.statusTexts(),
                }}
                locale={locale}
            />
        );
    }
}
