import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps } from '@iobroker/types-vis-2';

import { COUNTER_VARIANTS } from '../components/Counter';
import GasMeterView from '../components/GasMeterView';
import {
    baseValue,
    consumptionSince,
    LOOKBACK_DAYS,
    nextDayStart,
    startOfDay,
    startOfMonth,
    type HistoryEntry,
} from '../lib/consumption';
import { toBoolean, toNumber } from '../lib/fmt';
import { DEFAULT_BRENNWERT, DEFAULT_ZUSTANDSZAHL, monthlyCost } from '../lib/gas';
import { THEME_OPTIONS } from '../lib/theme';
import WolfWidgetBase, { attrNumber, type WolfBaseRxData, type WolfBaseState } from './WolfWidgetBase';

interface WolfGasMeterRxData extends WolfBaseRxData {
    oid_zaehlerstand?: string;
    oid_durchfluss?: string;
    oid_heute?: string;
    oid_monat?: string;
    oid_sensor_status?: string;
    oid_unreach?: string;
    oid_lowbat?: string;
    history_instance?: string;
    offset?: number | string;
    variant?: string;
    digits_int?: number | string;
    digits_dec?: number | string;
    schwelle?: number | string;
    max_flow?: number | string;
    brennwert?: number | string;
    zustandszahl?: number | string;
    arbeitspreis?: number | string;
    grundpreis?: number | string;
}

/** Zählerstände zu Tages- und Monatsbeginn aus dem Verlauf */
interface Bases {
    day: number | null;
    month: number | null;
}

interface WolfGasMeterState extends WolfBaseState {
    /** null: kein Verlauf abgefragt */
    bases: Bases | null;
}

/** Nur der Teil der Socket-Verbindung, den der Verlauf braucht */
interface HistoryReader {
    getHistory(id: string, options: ioBroker.GetHistoryOptions): Promise<HistoryEntry[] | null | undefined>;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Suchfenster vor dem Stichtag, von eng nach weit — Logging nur bei Änderung */
const WINDOWS = [HOUR, DAY, LOOKBACK_DAYS * DAY];
/** höchstens so viele Einträge je Abfrage */
const MAX_ENTRIES = 500;

/**
 * Anbindung des Gaszählers an VIS-2: Attribute und Objektwerte.
 *
 * Heute und Monat kommen aus verknüpften Objekten; fehlen die, rechnet das Widget sie aus dem
 * Verlauf des Zählerstands (sql, history, influxdb): Stand jetzt minus Stand zu Tages- bzw.
 * Monatsbeginn — zwei Abfragen am Tag. Für Sensoren wie den HmIP-ESI, die ab Einbau zählen,
 * gleicht ein Korrekturwert den Zählerstand an.
 * Die Darstellung liegt in components/GasMeterView und ist ohne ioBroker prüfbar (Sandbox).
 */
export default class WolfGasMeter extends WolfWidgetBase<WolfGasMeterRxData, WolfGasMeterState> {
    private baseKey = '';
    private baseTimer?: ReturnType<typeof setTimeout>;

    /**
     * @param props von VIS-2 übergebene Eigenschaften
     */
    constructor(props: VisRxWidgetProps) {
        super(props);
        this.state = { ...this.state, bases: null };
    }

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
                        {
                            name: 'oid_heute',
                            type: 'id',
                            label: 'oid_heute',
                            tooltip: 'consumption_tooltip',
                            default: '',
                        },
                        {
                            name: 'oid_monat',
                            type: 'id',
                            label: 'oid_monat',
                            tooltip: 'consumption_tooltip',
                            default: '',
                        },
                    ],
                },
                {
                    name: 'history',
                    label: 'group_history',
                    fields: [
                        {
                            name: 'history_instance',
                            type: 'instance',
                            adapter: '_dataSources',
                            label: 'history_instance',
                            tooltip: 'history_tooltip',
                            default: '',
                        },
                    ],
                },
                {
                    name: 'sensor',
                    label: 'group_sensor',
                    fields: [
                        { name: 'oid_sensor_status', type: 'id', label: 'oid_sensor_status', default: '' },
                        { name: 'oid_unreach', type: 'id', label: 'oid_unreach', default: '' },
                        { name: 'oid_lowbat', type: 'id', label: 'oid_lowbat', default: '' },
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
                        {
                            name: 'offset',
                            type: 'number',
                            label: 'offset',
                            tooltip: 'offset_tooltip',
                            default: 0,
                            step: 0.001,
                        },
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
            visDefaultStyle: { width: 380, height: 350 },
            visPrev: 'widgets/vis-2-widgets-wolf/img/vis-2-widgets-wolf.png',
        };
    }

    /** Verlauf abfragen */
    componentDidMount(): void {
        super.componentDidMount();
        void this.loadBases();
    }

    /** Zeitgeber für den Tageswechsel stoppen */
    componentWillUnmount(): void {
        clearTimeout(this.baseTimer);
        super.componentWillUnmount();
    }

    /**
     * Attribute im Editor geändert — Verlauf gegebenenfalls neu abfragen
     *
     * @param prevRxData Attribute vor der Änderung
     */
    onRxDataChanged(prevRxData: typeof this.state.rxData): void {
        super.onRxDataChanged(prevRxData);
        void this.loadBases();
    }

    /** @returns Verlaufsinstanz aus dem Attribut, sonst der Standard des Systems */
    private historyInstance(): string {
        return this.state.rxData.history_instance || this.props.context.systemConfig?.common?.defaultHistory || '';
    }

    /**
     * Liest die Zählerstände zu Tages- und Monatsbeginn — nur, wenn Heute oder Monat nicht aus
     * einem Objekt kommen. Einmal je Tag, danach zum nächsten Tagesbeginn erneut.
     */
    private async loadBases(): Promise<void> {
        const rx = this.state.rxData;
        const id = rx.oid_zaehlerstand;
        const instance = this.historyInstance();
        const now = new Date();
        const needed = !!id && !!instance && (!rx.oid_heute || !rx.oid_monat);
        const key = needed ? `${id}|${instance}|${startOfDay(now)}` : '';
        if (key === this.baseKey) {
            return;
        }
        this.baseKey = key;
        clearTimeout(this.baseTimer);
        if (!needed) {
            this.setState(s => ({ ...s, bases: null }));
            return;
        }
        this.baseTimer = globalThis.setTimeout(() => void this.loadBases(), nextDayStart(now) - now.getTime() + 5_000);
        let bases: Bases;
        try {
            const [day, month] = await Promise.all([
                this.readBase(id, instance, startOfDay(now), now.getTime()),
                this.readBase(id, instance, startOfMonth(now), now.getTime()),
            ]);
            bases = { day, month };
        } catch {
            // Instanz fehlt oder Objekt wird dort nicht aufgezeichnet: Heute/Monat bleiben leer
            bases = { day: null, month: null };
        }
        if (this.mounted && key === this.baseKey) {
            this.setState(s => ({ ...s, bases }));
        }
    }

    /**
     * Zählerstand zum Stichtag: letzter Wert davor (Fenster von eng nach weit), sonst erster danach.
     *
     * @param id Objekt des Zählerstands
     * @param instance Verlaufsinstanz, z. B. sql.0
     * @param boundary Stichtag in ms
     * @param now jetzt in ms
     * @returns Zählerstand oder null
     */
    private async readBase(id: string, instance: string, boundary: number, now: number): Promise<number | null> {
        const socket = this.props.context.socket as unknown as HistoryReader;
        const common: ioBroker.GetHistoryOptions = {
            instance,
            aggregate: 'none',
            removeBorderValues: true,
            count: MAX_ENTRIES,
            limit: MAX_ENTRIES,
        };
        for (const window of WINDOWS) {
            const before = await socket.getHistory(id, {
                ...common,
                start: boundary - window,
                end: boundary,
                returnNewestEntries: true,
            });
            const value = baseValue(before ?? [], []);
            if (value !== null) {
                return value;
            }
        }
        const after = await socket.getHistory(id, { ...common, start: boundary, end: now, count: 1, limit: 1 });
        return baseValue([], after ?? []);
    }

    /** @returns Hinweise zum Sensor aus den verknüpften Zustandsobjekten */
    private warnings(): string[] {
        const rx = this.state.rxData;
        const warnings: string[] = [];
        if (rx.oid_unreach && toBoolean(this.objectValue(rx.oid_unreach)) === true) {
            warnings.push(this.tr('warn_unreach'));
        }
        if (rx.oid_lowbat && toBoolean(this.objectValue(rx.oid_lowbat)) === true) {
            warnings.push(this.tr('warn_lowbat'));
        }
        const status = this.objectNumber(rx.oid_sensor_status);
        if (rx.oid_sensor_status && status !== null && status !== 0) {
            warnings.push(this.tr('warn_status'));
        }
        return warnings;
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
        // Rohwert des Objekts: Verlauf und Verbrauch rechnen ohne Korrektur, angezeigt wird mit
        const raw = this.objectNumber(rx.oid_zaehlerstand);
        const reading = raw === null ? null : raw + attrNumber(rx.offset, 0);
        const bases = this.state.bases;
        const today = rx.oid_heute ? this.objectNumber(rx.oid_heute) : consumptionSince(raw, bases?.day ?? null);
        const month = rx.oid_monat ? this.objectNumber(rx.oid_monat) : consumptionSince(raw, bases?.month ?? null);

        return (
            <GasMeterView
                themeType={this.themeType()}
                title={rx.title || this.tr('gasmeter')}
                subtitle={rx.subtitle}
                reading={reading}
                flow={this.objectNumber(rx.oid_durchfluss)}
                today={today}
                month={month}
                warnings={this.warnings()}
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
                    flow: this.tr('flow'),
                    today: this.tr('today'),
                    month: this.tr('month'),
                    costMonth: this.tr('cost_month'),
                    consumption: this.tr('consumption'),
                    noConsumption: this.tr('no_consumption'),
                }}
                locale={this.locale()}
            />
        );
    }
}
