import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps } from '@iobroker/types-vis-2';

import { SERIES_COLORS, type SeriesColor, type TrendSeries } from '../components/TrendsChart';
import TrendsView, { type TrendsStatus } from '../components/TrendsView';
import { AGGREGATES, CHART_POINTS, rangeMs, RANGES, toPoints, type Aggregate, type ChartPoint } from '../lib/chart';
import { toNumber } from '../lib/fmt';
import { objectName } from '../lib/objectMeta';
import { THEME_OPTIONS } from '../lib/theme';
import WolfWidgetBase, { attrNumber, type WolfBaseRxData, type WolfBaseState } from './WolfWidgetBase';

interface WolfTrendsRxData extends WolfBaseRxData {
    history_instance?: string;
    range?: string;
    aggregate?: string;
    refresh?: number | string;
    series_count?: number | string;
    oid_area?: string;
    area_label?: string;
    area_max?: number | string;
    area_unit?: string;
    unit?: string;
    y_min?: number | string;
    y_max?: number | string;
    /** Kurven 1…n aus der wiederholbaren Attributgruppe „serie" */
    [key: `oid_serie${number}`]: string | undefined;
    [key: `serie_label${number}`]: string | undefined;
    [key: `serie_color${number}`]: string | undefined;
}

/** geladener Verlauf */
interface Trend {
    status: TrendsStatus;
    /** Ende der letzten Abfrage in ms */
    end: number;
    /** Messpunkte je Objekt-ID */
    data: Record<string, ChartPoint[]>;
}

interface WolfTrendsState extends WolfBaseState {
    trend: Trend;
}

/** Nur der Teil der Socket-Verbindung, den der Verlauf braucht */
interface HistoryReader {
    getHistory(
        id: string,
        options: ioBroker.GetHistoryOptions,
    ): Promise<Array<{ val?: unknown; ts?: unknown }> | null | undefined>;
}

/** höchstens so viele Kurven */
const MAX_SERIES = 4;
/** Farbe je Kurve, wenn keine gewählt ist — wie im Entwurf: Vorlauf, Rücklauf, Außen */
const DEFAULT_COLORS: SeriesColor[] = ['warm', 'cool', 'ok', 'accent'];

/**
 * Verläufe: bis zu vier Kurven und eine Fläche im Hintergrund aus einem Verlaufsadapter (history,
 * sql, influxdb). Abfrage beim Start, bei geänderten Attributen und danach im eingestellten Takt;
 * dazwischen hängt das Widget den aktuellen Wert jeder Kurve am rechten Rand an.
 */
export default class WolfTrends extends WolfWidgetBase<WolfTrendsRxData, WolfTrendsState> {
    private loadKey = '';
    private loadTimer?: ReturnType<typeof setTimeout>;

    /**
     * @param props von VIS-2 übergebene Eigenschaften
     */
    constructor(props: VisRxWidgetProps) {
        super(props);
        this.state = { ...this.state, trend: { status: 'loading', end: Date.now(), data: {} } };
    }

    /** Beschreibung des Widgets für die VIS-2-Palette und den Attribut-Editor */
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplWolfTrends',
            visSet: 'vis-2-widgets-wolf',
            visSetLabel: 'set_label',
            visSetColor: '#c2561f',
            visName: 'WolfTrends',
            visWidgetLabel: 'trends',
            // Jede Gruppe hat Felder mit Vorgabe (notfalls ''), sonst legt VIS-2 sie beim Platzieren
            // eines neuen Widgets abgewählt an und die Felder bleiben verborgen.
            visAttrs: [
                {
                    name: 'common',
                    label: 'group_source',
                    fields: [
                        {
                            name: 'history_instance',
                            type: 'instance',
                            adapter: '_dataSources',
                            label: 'history_instance',
                            default: '',
                        },
                        {
                            name: 'range',
                            type: 'select',
                            label: 'range',
                            default: '24h',
                            options: Object.keys(RANGES).map(v => ({ value: v, label: `range_${v}` })),
                        },
                        {
                            name: 'aggregate',
                            type: 'select',
                            label: 'aggregate',
                            default: 'average',
                            options: AGGREGATES.map(v => ({ value: v, label: `aggregate_${v}` })),
                        },
                        { name: 'refresh', type: 'number', label: 'refresh', default: 5, min: 1, max: 60 },
                        {
                            name: 'series_count',
                            type: 'number',
                            label: 'series_count',
                            default: 3,
                            min: 1,
                            max: MAX_SERIES,
                        },
                    ],
                },
                {
                    // wiederholbar: VIS-2 legt die Felder als oid_serie1 … oid_serieN usw. an
                    name: 'serie',
                    label: 'group_series',
                    indexFrom: 1,
                    indexTo: 'series_count',
                    fields: [
                        { name: 'oid_serie', type: 'id', label: 'oid_serie', default: '' },
                        { name: 'serie_label', type: 'text', label: 'serie_label', default: '' },
                        {
                            name: 'serie_color',
                            type: 'select',
                            label: 'serie_color',
                            options: SERIES_COLORS.map(v => ({ value: v, label: `color_${v}` })),
                        },
                    ],
                },
                {
                    name: 'area',
                    label: 'group_area',
                    fields: [
                        { name: 'oid_area', type: 'id', label: 'oid_area', default: '' },
                        { name: 'area_label', type: 'text', label: 'area_label', default: '' },
                        { name: 'area_max', type: 'number', label: 'area_max', default: 100, min: 1 },
                        { name: 'area_unit', type: 'text', label: 'area_unit', default: '%' },
                    ],
                },
                {
                    name: 'axis',
                    label: 'group_axis',
                    fields: [
                        { name: 'unit', type: 'text', label: 'unit', default: '°C' },
                        { name: 'y_min', type: 'number', label: 'y_min' },
                        { name: 'y_max', type: 'number', label: 'y_max' },
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
            visDefaultStyle: { width: 640, height: 360 },
            visPrev: 'widgets/vis-2-widgets-wolf/img/vis-2-widgets-wolf.png',
        };
    }

    /** @returns Objekt-IDs der Kurven in Reihenfolge, leere ausgelassen */
    private seriesIds(): Array<{ index: number; id: string }> {
        const rx = this.state.rxData;
        const count = Math.max(1, Math.min(MAX_SERIES, Math.round(attrNumber(rx.series_count, 3))));
        const ids: Array<{ index: number; id: string }> = [];
        for (let i = 1; i <= count; i++) {
            const id = rx[`oid_serie${i}`];
            if (id) {
                ids.push({ index: i, id });
            }
        }
        return ids;
    }

    /** @returns Objekte der Kurven und der Fläche — für die Namen */
    protected metaIds(): Array<string | undefined> {
        return [...this.seriesIds().map(s => s.id), this.state.rxData.oid_area];
    }

    /** Verlauf laden */
    componentDidMount(): void {
        super.componentDidMount();
        void this.load();
    }

    /** Zeitgeber stoppen */
    componentWillUnmount(): void {
        globalThis.clearTimeout(this.loadTimer);
        super.componentWillUnmount();
    }

    /**
     * Attribute im Editor geändert — bei anderer Quelle, Kurve oder Zeitraum neu laden
     *
     * @param prevRxData Attribute vor der Änderung
     */
    onRxDataChanged(prevRxData: typeof this.state.rxData): void {
        super.onRxDataChanged(prevRxData);
        void this.load();
    }

    /** @returns Verlaufsinstanz aus dem Attribut, sonst der Standard des Systems */
    private historyInstance(): string {
        return this.state.rxData.history_instance || this.props.context.systemConfig?.common?.defaultHistory || '';
    }

    /**
     * Fragt die Verläufe aller Kurven und der Fläche ab und plant die nächste Abfrage.
     *
     * @param force auch bei unveränderten Attributen (Takt)
     */
    private async load(force = false): Promise<void> {
        const rx = this.state.rxData;
        const instance = this.historyInstance();
        const ids = [...new Set([...this.seriesIds().map(s => s.id), rx.oid_area].filter((id): id is string => !!id))];
        const range = rangeMs(rx.range);
        const aggregate: Aggregate = AGGREGATES.includes(rx.aggregate as Aggregate)
            ? (rx.aggregate as Aggregate)
            : 'average';
        const key = JSON.stringify([ids, instance, range, aggregate]);
        if (!force && key === this.loadKey) {
            return;
        }
        this.loadKey = key;
        globalThis.clearTimeout(this.loadTimer);
        this.loadTimer = globalThis.setTimeout(
            () => void this.load(true),
            Math.max(1, attrNumber(rx.refresh, 5)) * 60_000,
        );

        const end = Date.now();
        if (!instance || !ids.length) {
            this.setTrend({ status: instance ? 'empty' : 'noInstance', end, data: {} }, key);
            return;
        }
        if (!force) {
            this.setState(s => ({ ...s, trend: { ...s.trend, status: 'loading' } }));
        }
        const socket = this.props.context.socket as unknown as HistoryReader;
        const options: ioBroker.GetHistoryOptions =
            aggregate === 'none'
                ? { instance, start: end - range, end, aggregate, count: 2000, limit: 2000, returnNewestEntries: true }
                : { instance, start: end - range, end, aggregate, count: CHART_POINTS };
        try {
            const results = await Promise.all(ids.map(id => socket.getHistory(id, options).then(toPoints)));
            const data: Record<string, ChartPoint[]> = {};
            ids.forEach((id, i) => (data[id] = results[i]));
            this.setTrend({ status: results.some(r => r.length) ? 'ready' : 'empty', end, data }, key);
        } catch {
            this.setTrend({ status: 'error', end, data: {} }, key);
        }
    }

    /**
     * Übernimmt ein Ergebnis, wenn es noch zu den aktuellen Attributen passt.
     *
     * @param trend Ergebnis
     * @param key Schlüssel der Abfrage
     */
    private setTrend(trend: Trend, key: string): void {
        if (this.mounted && key === this.loadKey) {
            this.setState(s => ({ ...s, trend }));
        }
    }

    /**
     * Messpunkte einer Kurve mit dem aktuellen Wert am rechten Rand.
     *
     * @param id Objekt-ID
     * @param now jetzt in ms
     * @returns Messpunkte
     */
    private pointsWithLive(id: string, now: number): ChartPoint[] {
        const points = this.state.trend.data[id] ?? [];
        const live = this.objectNumber(id);
        if (live === null || (points.length && points[points.length - 1].ts >= now)) {
            return points;
        }
        return [...points, { ts: now, val: live }];
    }

    /**
     * @param id Objekt-ID
     * @param label Bezeichnung aus dem Attribut
     * @returns Bezeichnung, sonst Objektname, sonst letzter Teil der ID
     */
    private labelFor(id: string, label: string | undefined): string {
        return label || objectName(this.meta(id), this.locale()) || id.split('.').pop() || id;
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
        const trend = this.state.trend;
        const end = Math.max(trend.end, Date.now());
        const start = end - rangeMs(rx.range);

        const series: TrendSeries[] = this.seriesIds().map(({ index, id }) => {
            const color = rx[`serie_color${index}`];
            return {
                key: `s${index}`,
                label: this.labelFor(id, rx[`serie_label${index}`]),
                color: SERIES_COLORS.includes(color as SeriesColor)
                    ? (color as SeriesColor)
                    : DEFAULT_COLORS[(index - 1) % DEFAULT_COLORS.length],
                points: this.pointsWithLive(id, end),
            };
        });
        const area: TrendSeries | null = rx.oid_area
            ? {
                  key: 'area',
                  label: this.labelFor(rx.oid_area, rx.area_label),
                  color: 'accent',
                  points: this.pointsWithLive(rx.oid_area, end),
              }
            : null;

        return (
            <TrendsView
                themeType={this.themeType()}
                title={rx.title || this.tr('trends')}
                subtitle={rx.subtitle || this.tr(`range_${rx.range && rx.range in RANGES ? rx.range : '24h'}`)}
                status={trend.status}
                series={series}
                area={area}
                areaMax={Math.max(1, attrNumber(rx.area_max, 100))}
                start={start}
                end={end}
                yMin={toNumber(rx.y_min)}
                yMax={toNumber(rx.y_max)}
                unit={rx.unit ?? '°C'}
                areaUnit={rx.area_unit ?? '%'}
                labels={{
                    loading: this.tr('trend_loading'),
                    empty: this.tr('trend_empty'),
                    error: this.tr('trend_error'),
                    noInstance: this.tr('trend_no_instance'),
                    chart: this.tr('trend_chart'),
                }}
                locale={this.locale()}
            />
        );
    }
}
