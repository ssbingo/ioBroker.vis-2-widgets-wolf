/*
 * Verläufe in der Sandbox: synthetische Tagesgänge wie im Entwurf (Außentemperatur als Sinus,
 * Vorlauf in Heizphasen, Rücklauf darunter, Modulation als Fläche).
 */
import React, { useMemo } from 'react';

import type { TrendSeries } from '../components/TrendsChart';
import TrendsView from '../components/TrendsView';
import type { ChartPoint } from '../lib/chart';
import type { ThemeType } from '../lib/theme';
import de from '../i18n/de.json';

const HOUR = 3_600_000;
/** Zeitpunkt beim Laden der Sandbox — das Diagramm endet dort */
const LOADED = Date.now();

/** Eigenschaften der simulierten Kachel */
export interface SimTrendsProps {
    /** Hell oder dunkel */
    themeType: ThemeType;
    /** Unterzeile */
    subtitle: string;
    /** Zeitraum in Stunden */
    hours: number;
    /** Fläche (Modulation) zeigen */
    withArea: boolean;
}

/**
 * Verlaufskachel mit synthetischen Werten.
 *
 * @param props Varianten
 * @returns die Kachel
 */
export default function SimTrends(props: SimTrendsProps): React.JSX.Element {
    const { hours, withArea } = props;
    const { start, end, series, area } = useMemo(() => {
        const stop = LOADED;
        const begin = stop - hours * HOUR;
        const out: ChartPoint[] = [];
        const vl: ChartPoint[] = [];
        const rl: ChartPoint[] = [];
        const mod: ChartPoint[] = [];
        const steps = 150;
        for (let i = 0; i <= steps; i++) {
            const ts = begin + (i / steps) * (stop - begin);
            const h = new Date(ts).getHours() + new Date(ts).getMinutes() / 60;
            const on = (h > 5 && h < 9) || (h > 15 && h < 22);
            const flow = on ? 46 + 6 * Math.sin(i / 3) : 30 + 3 * Math.sin(i / 5);
            out.push({ ts, val: 6 + 5 * Math.sin(((h - 4) / 24) * 2 * Math.PI) });
            vl.push({ ts, val: flow });
            rl.push({ ts, val: flow - 9 - 2 * Math.sin(i / 4) });
            mod.push({ ts, val: on ? 45 + 25 * Math.sin(i / 2.4) : 0 });
        }
        const lines: TrendSeries[] = [
            { key: 'vl', label: 'Vorlauf', color: 'warm', points: vl },
            { key: 'rl', label: 'Rücklauf', color: 'cool', points: rl },
            { key: 'out', label: 'Außentemperatur', color: 'ok', points: out },
        ];
        const areaSeries: TrendSeries = { key: 'area', label: 'Modulation', color: 'accent', points: mod };
        return { start: begin, end: stop, series: lines, area: areaSeries };
    }, [hours]);

    return (
        <TrendsView
            themeType={props.themeType}
            title={de.trends}
            subtitle={props.subtitle}
            status="ready"
            series={series}
            area={withArea ? area : null}
            areaMax={100}
            start={start}
            end={end}
            yMin={null}
            yMax={null}
            unit="°C"
            areaUnit="%"
            labels={{
                loading: de.trend_loading,
                empty: de.trend_empty,
                error: de.trend_error,
                noInstance: de.trend_no_instance,
                chart: de.trend_chart,
                keyHint: de.trend_keys,
            }}
            locale="de-DE"
        />
    );
}
