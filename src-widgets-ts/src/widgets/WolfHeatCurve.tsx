import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import type { NumberControl, Reading } from '../components/controls';
import type { CurvePoint } from '../components/HeatCurveChart';
import HeatCurveView, { type CurveSetting } from '../components/HeatCurveView';
import { fmt, toBoolean } from '../lib/fmt';
import { curvePoints, flowSetpoint, type CurveParams } from '../lib/heatCurve';
import { decimalsOf, numberRange, type NumberRange } from '../lib/objectMeta';
import { THEME_OPTIONS } from '../lib/theme';
import { sourceField } from './sourceField';
import WolfWidgetBase, { attrNumber, type WolfBaseRxData } from './WolfWidgetBase';

interface WolfHeatCurveRxData extends WolfBaseRxData {
    oid_korrektur?: string;
    oid_steilheit?: string;
    oid_niveau?: string;
    oid_aussentemp?: string;
    oid_aussentemp_mittel?: string;
    oid_vorlauf_soll?: string;
    oid_raumsoll?: string;
    oid_ladung?: string;
    raumsoll?: number | string;
    exponent?: number | string;
    vl_max?: number | string;
}

/** Wertebereiche, wenn das Objekt nichts angibt */
const CORRECTION_FALLBACK: NumberRange = { min: -4, max: 4, step: 0.5 };
const SLOPE_FALLBACK: NumberRange = { min: 0, max: 3, step: 0.1 };
const LEVEL_FALLBACK: NumberRange = { min: -5, max: 5, step: 0.5 };
/** Außentemperatur-Achse: warm links, kalt rechts */
const OUTSIDE_MAX = 20;
const OUTSIDE_MIN = -20;
const FLOW_MIN = 20;

/**
 * Heizkurve: Näherungskurve (lib/heatCurve.ts — keine Wolf-Formel) mit dem Betriebspunkt der
 * Regelung. Bedienbar ist, was das Objekt erlaubt: bei wolf-smartset nur die Sollwertkorrektur,
 * die Steilheit ist dort nur lesend.
 */
export default class WolfHeatCurve extends WolfWidgetBase<WolfHeatCurveRxData> {
    /** Beschreibung des Widgets für die VIS-2-Palette und den Attribut-Editor */
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplWolfHeatCurve',
            visSet: 'vis-2-widgets-wolf',
            visSetLabel: 'set_label',
            visSetColor: '#c2561f',
            visSetIcon: 'widgets/vis-2-widgets-wolf/img/vis-2-widgets-wolf.png',
            visName: 'WolfHeatCurve',
            visWidgetLabel: 'heatcurve',
            // Jede Gruppe hat Felder mit Vorgabe (notfalls ''), sonst legt VIS-2 sie beim Platzieren
            // eines neuen Widgets abgewählt an und die Felder bleiben verborgen.
            visAttrs: [
                {
                    name: 'common',
                    label: 'group_objects',
                    fields: [
                        sourceField('tplWolfHeatCurve'),
                        { name: 'oid_korrektur', type: 'id', label: 'oid_korrektur', default: '' },
                        { name: 'oid_steilheit', type: 'id', label: 'oid_steilheit', default: '' },
                        { name: 'oid_niveau', type: 'id', label: 'oid_niveau', default: '' },
                    ],
                },
                {
                    name: 'readings',
                    label: 'group_readings',
                    fields: [
                        { name: 'oid_aussentemp', type: 'id', label: 'oid_aussentemp', default: '' },
                        { name: 'oid_aussentemp_mittel', type: 'id', label: 'oid_aussentemp_mittel', default: '' },
                        { name: 'oid_vorlauf_soll', type: 'id', label: 'oid_vorlauf_soll', default: '' },
                        { name: 'oid_raumsoll', type: 'id', label: 'oid_raumsoll_tr', default: '' },
                        { name: 'oid_ladung', type: 'id', label: 'oid_ladung', default: '' },
                    ],
                },
                {
                    name: 'model',
                    label: 'group_model',
                    fields: [
                        { name: 'raumsoll', type: 'number', label: 'raumsoll', default: 20, min: 5, max: 30 },
                        {
                            name: 'exponent',
                            type: 'number',
                            label: 'exponent',
                            default: 1,
                            min: 0.5,
                            max: 2,
                            step: 0.05,
                        },
                        { name: 'vl_max', type: 'number', label: 'vl_max', default: 80, min: 30, max: 95 },
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
            visDefaultStyle: { width: 360, height: 500 },
            visPrev: 'widgets/vis-2-widgets-wolf/img/prev_heatcurve.png',
        };
    }

    /** @returns Objekte mit Grenzen und Schreibrecht */
    protected metaIds(): Array<string | undefined> {
        const rx = this.state.rxData;
        return [rx.oid_korrektur, rx.oid_steilheit, rx.oid_niveau];
    }

    /**
     * Stepper nur für ein nachweislich schreibbares Objekt — sonst erscheint der Wert als
     * Anzeigewert (wolf-smartset: Steilheit write: false).
     *
     * @param oid Objekt-ID
     * @param fallback Wertebereich ohne Angaben im Objekt
     * @returns Bedienelement oder null
     */
    private writableControl(oid: string | undefined, fallback: NumberRange): NumberControl | null {
        const meta = this.meta(oid);
        return meta?.write === true ? this.numberControl(oid, numberRange(meta, {}, fallback)) : null;
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

        const correction = this.numberControl(
            rx.oid_korrektur,
            numberRange(this.meta(rx.oid_korrektur), {}, CORRECTION_FALLBACK),
        );
        const slope = this.writableControl(rx.oid_steilheit, SLOPE_FALLBACK);
        const level = this.writableControl(rx.oid_niveau, LEVEL_FALLBACK);

        // Kurve aus den angezeigten Werten — während des Schreibens also schon mit dem gewünschten
        const slopeValue = this.shownNumber(rx.oid_steilheit);
        const params: CurveParams | null =
            slopeValue === null
                ? null
                : {
                      roomSetpoint: this.objectNumber(rx.oid_raumsoll) ?? attrNumber(rx.raumsoll, 20),
                      slope: slopeValue,
                      level: this.shownNumber(rx.oid_niveau) ?? 0,
                      correction: this.shownNumber(rx.oid_korrektur) ?? 0,
                      exponent: attrNumber(rx.exponent, 1),
                      maxFlow: attrNumber(rx.vl_max, 80),
                  };
        const pending = [rx.oid_korrektur, rx.oid_steilheit, rx.oid_niveau].some(oid => {
            const status = this.writeStatus(oid);
            return status === 'pending' || status === 'staged';
        });

        // Betriebspunkt: gemittelte Außentemperatur (Wolf A04) und Vorlauf-Soll der Regelung
        const outside = this.objectNumber(rx.oid_aussentemp);
        const outsideAvg = this.objectNumber(rx.oid_aussentemp_mittel);
        const pointOutside = outsideAvg ?? outside;
        const controllerFlow = this.objectNumber(rx.oid_vorlauf_soll);
        const modelFlow = params && pointOutside !== null ? flowSetpoint(pointOutside, params) : null;
        const pointFlow = rx.oid_vorlauf_soll ? controllerFlow : modelFlow;
        const distorted = !!rx.oid_ladung && toBoolean(this.objectValue(rx.oid_ladung)) === true;
        const point: CurvePoint | null =
            pointOutside !== null && pointFlow !== null ? { outside: pointOutside, flow: pointFlow, distorted } : null;

        const settings: CurveSetting[] = [];
        if (correction) {
            settings.push({
                label: this.tr('correction'),
                unit: 'K',
                signed: true,
                control: correction,
                value: null,
                decimals: 1,
            });
        }
        if (rx.oid_steilheit) {
            const step = this.meta(rx.oid_steilheit)?.step ?? SLOPE_FALLBACK.step;
            settings.push({
                label: this.tr('slope'),
                unit: '',
                signed: false,
                control: slope,
                value: slopeValue,
                decimals: decimalsOf(step),
            });
        }
        if (rx.oid_niveau) {
            settings.push({
                label: this.tr('level'),
                unit: 'K',
                signed: true,
                control: level,
                value: this.objectNumber(rx.oid_niveau),
                decimals: 1,
            });
        }

        // höchstens drei Anzeigewerte, damit sie in eine Zeile passen; der Vorlauf-Soll der Regelung
        // steht zusätzlich am Betriebspunkt im Diagramm
        const readings: Reading[] = [];
        if (rx.oid_aussentemp) {
            readings.push({ label: this.tr('outside'), value: outside, unit: '°C', decimals: 1 });
        }
        if (rx.oid_aussentemp_mittel) {
            readings.push({ label: this.tr('outside_avg'), value: outsideAvg, unit: '°C', decimals: 1 });
        }
        if (rx.oid_vorlauf_soll) {
            readings.push({ label: this.tr('flow_setpoint'), value: controllerFlow, unit: '°C', decimals: 1 });
        } else if (modelFlow !== null) {
            readings.push({ label: this.tr('curve_value'), value: modelFlow, unit: '°C', decimals: 1 });
        }

        const chartLabel = [
            this.tr('curve_label'),
            this.tr('approximation'),
            point
                ? `${this.tr('outside_avg_long')} ${fmt(point.outside, 1, '°C', locale)}, ${this.tr('flow_setpoint')} ${fmt(point.flow, 1, '°C', locale)}`
                : '',
        ]
            .filter(Boolean)
            .join('. ');

        return (
            <HeatCurveView
                themeType={this.themeType()}
                title={rx.title || this.tr('heatcurve')}
                subtitle={rx.subtitle}
                chart={{
                    points: params ? curvePoints(params, OUTSIDE_MAX, OUTSIDE_MIN) : [],
                    pending,
                    point,
                    outsideMax: OUTSIDE_MAX,
                    outsideMin: OUTSIDE_MIN,
                    flowMin: FLOW_MIN,
                    flowMax: attrNumber(rx.vl_max, 80),
                    label: chartLabel,
                    locale,
                }}
                settings={settings}
                readings={readings}
                distorted={distorted}
                staged={this.writes.hasStaged()}
                onCommit={() => this.writes.commit()}
                onDiscard={() => this.writes.discard()}
                labels={{
                    approximation: this.tr('approximation'),
                    approximationHint: this.tr('approximation_hint'),
                    distorted: this.tr('distorted'),
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
