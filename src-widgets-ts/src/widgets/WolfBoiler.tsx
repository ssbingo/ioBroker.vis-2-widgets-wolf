import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';

import BoilerView from '../components/BoilerView';
import { toNumber } from '../lib/fmt';
import { resolveTheme, THEME_OPTIONS } from '../lib/theme';
import { mapValue, parseValueMap, statesToValueMap, type ValueMap } from '../lib/valueMap';
import { injectStyles } from '../styles/injectStyles';

interface WolfBoilerRxData {
    oid_phase?: string;
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
    theme?: string;
    title?: string;
    subtitle?: string;
}

interface WolfBoilerState extends VisRxWidgetState {
    /** Klartexte aus common.states des Phasen-Objekts */
    phaseStates: ValueMap;
}

/** Nur der Teil der Socket-Verbindung, den das Widget braucht */
interface ObjectReader {
    getObject(id: string): Promise<ioBroker.Object | null | undefined>;
}

/** Eingebaute Phasen, wenn weder Attribut noch Objekt Klartexte liefern */
const DEFAULT_PHASES = [0, 1, 2];

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
 * Anbindung des Kesselstatus an VIS-2: Attribute, Objektwerte, Klartexte der Betriebsphase, Theme.
 * Die Darstellung liegt in components/BoilerView und ist ohne ioBroker prüfbar (Sandbox).
 */
export default class WolfBoiler extends (window.visRxWidget as typeof VisRxWidget)<WolfBoilerRxData, WolfBoilerState> {
    /** wird von VIS-2 beim Laden des Widget-Sets gesetzt */
    static adapter: string;

    private mounted = false;

    /**
     * Startzustand ohne Klartexte aus dem Objekt
     *
     * @param props von VIS-2 übergebene Eigenschaften
     */
    constructor(props: VisRxWidgetProps) {
        super(props);
        this.state = { ...this.state, phaseStates: {} };
    }

    /** Beschreibung des Widgets für die VIS-2-Palette und den Attribut-Editor */
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplWolfBoiler',
            visSet: 'vis-2-widgets-wolf',
            visSetLabel: 'set_label',
            visSetColor: '#c2561f',
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
            visPrev: 'widgets/vis-2-widgets-wolf/img/vis-2-widgets-wolf.png',
        };
    }

    /** VIS-2 fragt die Widget-Beschreibung auch an der Instanz ab */
    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return WolfBoiler.getWidgetInfo();
    }

    /** Präfix der Übersetzungsschlüssel, passend zu translations.ts (prefix: true) */
    static getI18nPrefix(): string {
        return `${WolfBoiler.adapter}_`;
    }

    /** Styles einfügen und die Klartexte der Betriebsphase laden */
    componentDidMount(): void {
        super.componentDidMount();
        this.mounted = true;
        injectStyles();
        void this.loadPhaseStates();
    }

    /** Beim Entfernen keine späten Antworten mehr übernehmen */
    componentWillUnmount(): void {
        this.mounted = false;
        super.componentWillUnmount();
    }

    /**
     * Attribute im Editor geändert — bei neuer Phasen-ID die Klartexte neu laden.
     *
     * @param prevRxData Attribute vor der Änderung
     */
    onRxDataChanged(prevRxData: typeof this.state.rxData): void {
        super.onRxDataChanged(prevRxData);
        if (prevRxData.oid_phase !== this.state.rxData.oid_phase) {
            void this.loadPhaseStates();
        }
    }

    /** Liest common.states des Phasen-Objekts, z. B. { "0": "Standby", "1": "Heizbetrieb" } */
    private async loadPhaseStates(): Promise<void> {
        const oid = this.state.rxData.oid_phase;
        let phaseStates: ValueMap = {};
        if (oid) {
            try {
                const socket = this.props.context.socket as ObjectReader;
                const obj = await socket.getObject(oid);
                phaseStates = statesToValueMap(obj?.common?.states);
            } catch {
                // ohne Lesezugriff auf das Objekt bleiben Attribut und Vorgaben
            }
        }
        // nur übernehmen, wenn das Widget noch steht und die ID sich nicht geändert hat
        if (this.mounted && oid === this.state.rxData.oid_phase) {
            this.setState({ phaseStates });
        }
    }

    /**
     * Aktueller Wert eines gebundenen Objekts (VIS-2 abonniert oid_-Attribute selbst).
     *
     * @param oid Objekt-ID aus einem oid_-Attribut
     * @returns der Rohwert oder undefined
     */
    private objectValue(oid: string | undefined): unknown {
        return oid ? this.state.values[`${oid}.val`] : undefined;
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
        const t = (key: string): string => WolfBoiler.t(key);
        const defaults: ValueMap = Object.fromEntries(DEFAULT_PHASES.map(n => [String(n), t(`phase_${n}`)]));
        const num = (oid: string | undefined): number | null => toNumber(this.objectValue(oid));

        return (
            <BoilerView
                themeType={resolveTheme(rx.theme, this.props.context.themeType)}
                title={rx.title || t('boiler')}
                subtitle={rx.subtitle}
                phase={mapValue(
                    this.objectValue(rx.oid_phase),
                    parseValueMap(rx.phase_map),
                    this.state.phaseStates,
                    defaults,
                )}
                modulation={num(rx.oid_modulation)}
                pressure={num(rx.oid_druck)}
                pressureMin={attrNumber(rx.druck_min, 1.2)}
                pressureMax={attrNumber(rx.druck_max, 2.5)}
                pressureScale={attrNumber(rx.druck_skala, 3)}
                hours={num(rx.oid_betriebsstunden)}
                starts={num(rx.oid_starts)}
                flowTemp={num(rx.oid_vorlauf)}
                returnTemp={num(rx.oid_ruecklauf)}
                labels={{
                    modulation: t('modulation'),
                    pressure: t('pressure'),
                    hours: t('hours'),
                    starts: t('starts'),
                    flowTemp: t('flow_temp'),
                    returnTemp: t('return_temp'),
                }}
                locale={WolfBoiler.getLanguage()}
            />
        );
    }
}
