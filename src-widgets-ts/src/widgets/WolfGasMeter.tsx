import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';

import { COUNTER_VARIANTS } from '../components/Counter';
import GasMeterView from '../components/GasMeterView';
import { toNumber } from '../lib/fmt';
import { DEFAULT_BRENNWERT, DEFAULT_ZUSTANDSZAHL, monthlyCost } from '../lib/gas';
import { resolveTheme, THEME_OPTIONS } from '../lib/theme';
import { injectStyles } from '../styles/injectStyles';

interface WolfGasMeterRxData {
    oid_zaehlerstand?: string;
    oid_durchfluss?: string;
    oid_heute?: string;
    oid_monat?: string;
    variant?: string;
    digits_int?: number | string;
    digits_dec?: number | string;
    schwelle?: number | string;
    max_flow?: number | string;
    brennwert?: number | string;
    zustandszahl?: number | string;
    arbeitspreis?: number | string;
    grundpreis?: number | string;
    theme?: string;
    title?: string;
    subtitle?: string;
}

/**
 * Zahl aus einem Widget-Attribut; leere Felder liefern den Vorgabewert.
 *
 * @param value Attributwert
 * @param fallback Vorgabewert
 * @returns die Zahl
 */
function attrNumber(value: unknown, fallback: number): number {
    return toNumber(value) ?? fallback;
}

/**
 * Anbindung des Gaszählers an VIS-2: Attribute, Objektwerte, Theme.
 * Die Darstellung liegt in components/GasMeterView und ist ohne ioBroker prüfbar (Sandbox).
 */
export default class WolfGasMeter extends (window.visRxWidget as typeof VisRxWidget)<WolfGasMeterRxData> {
    /** wird von VIS-2 beim Laden des Widget-Sets gesetzt */
    static adapter: string;

    /** Beschreibung des Widgets für die VIS-2-Palette und den Attribut-Editor */
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplWolfGasMeter',
            visSet: 'vis-2-widgets-wolf',
            visSetLabel: 'set_label',
            visSetColor: '#c2561f',
            visName: 'WolfGasMeter',
            visWidgetLabel: 'gasmeter',
            // Jede Gruppe hat Felder mit Vorgabe (notfalls ''), sonst legt VIS-2 sie beim Platzieren
            // eines neuen Widgets abgewählt an und die Felder bleiben verborgen.
            visAttrs: [
                {
                    name: 'common',
                    label: 'group_objects',
                    fields: [
                        { name: 'oid_zaehlerstand', type: 'id', label: 'oid_zaehlerstand', default: '' },
                        { name: 'oid_durchfluss', type: 'id', label: 'oid_durchfluss', default: '' },
                        { name: 'oid_heute', type: 'id', label: 'oid_heute', default: '' },
                        { name: 'oid_monat', type: 'id', label: 'oid_monat', default: '' },
                    ],
                },
                {
                    name: 'counter',
                    label: 'group_counter',
                    fields: [
                        {
                            name: 'variant',
                            type: 'select',
                            label: 'variant',
                            default: 'A',
                            options: COUNTER_VARIANTS.map(v => ({ value: v, label: `variant_${v}` })),
                        },
                        { name: 'digits_int', type: 'number', label: 'digits_int', default: 5, min: 1, max: 9 },
                        { name: 'digits_dec', type: 'number', label: 'digits_dec', default: 3, min: 0, max: 4 },
                        { name: 'schwelle', type: 'number', label: 'schwelle', default: 0.02, min: 0, step: 0.01 },
                        { name: 'max_flow', type: 'number', label: 'max_flow', default: 4, min: 0.1, step: 0.1 },
                    ],
                },
                {
                    name: 'costs',
                    label: 'group_costs',
                    fields: [
                        {
                            name: 'brennwert',
                            type: 'number',
                            label: 'brennwert',
                            default: DEFAULT_BRENNWERT,
                            step: 0.001,
                        },
                        {
                            name: 'zustandszahl',
                            type: 'number',
                            label: 'zustandszahl',
                            default: DEFAULT_ZUSTANDSZAHL,
                            step: 0.0001,
                        },
                        { name: 'arbeitspreis', type: 'number', label: 'arbeitspreis', min: 0, step: 0.0001 },
                        { name: 'grundpreis', type: 'number', label: 'grundpreis', min: 0, step: 0.01 },
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
            visDefaultStyle: { width: 380, height: 330 },
            visPrev: 'widgets/vis-2-widgets-wolf/img/vis-2-widgets-wolf.png',
        };
    }

    /** VIS-2 fragt die Widget-Beschreibung auch an der Instanz ab */
    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return WolfGasMeter.getWidgetInfo();
    }

    /** Präfix der Übersetzungsschlüssel, passend zu translations.ts (prefix: true) */
    static getI18nPrefix(): string {
        return `${WolfGasMeter.adapter}_`;
    }

    /** Styles und Schriften einmal je Seite einfügen */
    componentDidMount(): void {
        super.componentDidMount();
        injectStyles();
    }

    /**
     * Aktueller Wert eines gebundenen Objekts als Zahl (VIS-2 abonniert oid_-Attribute selbst).
     *
     * @param oid Objekt-ID aus einem oid_-Attribut
     * @returns der Wert oder null
     */
    private objectNumber(oid: string | undefined): number | null {
        return oid ? toNumber(this.state.values[`${oid}.val`]) : null;
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
        const t = (key: string): string => WolfGasMeter.t(key);
        const month = this.objectNumber(rx.oid_monat);

        return (
            <GasMeterView
                themeType={resolveTheme(rx.theme, this.props.context.themeType)}
                title={rx.title || t('gasmeter')}
                subtitle={rx.subtitle}
                reading={this.objectNumber(rx.oid_zaehlerstand)}
                flow={this.objectNumber(rx.oid_durchfluss)}
                today={this.objectNumber(rx.oid_heute)}
                month={month}
                costMonth={monthlyCost(month, {
                    brennwert: toNumber(rx.brennwert) ?? undefined,
                    zustandszahl: toNumber(rx.zustandszahl) ?? undefined,
                    arbeitspreis: toNumber(rx.arbeitspreis) ?? undefined,
                    grundpreis: toNumber(rx.grundpreis) ?? undefined,
                })}
                variant={rx.variant || 'A'}
                threshold={attrNumber(rx.schwelle, 0.02)}
                maxFlow={attrNumber(rx.max_flow, 4)}
                intDigits={attrNumber(rx.digits_int, 5)}
                decDigits={attrNumber(rx.digits_dec, 3)}
                labels={{
                    flow: t('flow'),
                    today: t('today'),
                    month: t('month'),
                    costMonth: t('cost_month'),
                    consumption: t('consumption'),
                    noConsumption: t('no_consumption'),
                }}
                locale={WolfGasMeter.getLanguage()}
            />
        );
    }
}
