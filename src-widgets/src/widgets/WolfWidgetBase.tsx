import type { RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';

import type { NumberControl, SelectControl, StatusTexts, SwitchControl } from '../components/controls';
import { toBoolean, toNumber } from '../lib/fmt';
import { switchValue, toObjectMeta, type NumberRange, type ObjectMeta, type SelectOption } from '../lib/objectMeta';
import { resolveTheme, type ThemeType } from '../lib/theme';
import { sameValue, WriteTracker, type WriteStatus, type WriteValue } from '../lib/writeTracker';
import { injectStyles } from '../styles/injectStyles';

/** Attribute, die jedes Widget kennt */
export interface WolfBaseRxData {
    /** Farbschema: auto (wie VIS-2), light, dark */
    theme?: string;
    /** Überschrift der Kachel */
    title?: string;
    /** Unterzeile der Kachel */
    subtitle?: string;
    /** Entprellung in ms vor dem Schreiben */
    write_delay?: number | string;
    /** Wartezeit auf ack:true in s */
    write_timeout?: number | string;
    /** Änderungen erst nach „Übernehmen" schreiben */
    confirm?: boolean | string;
}

/** Zustand, den die Basis für jedes Widget verwaltet */
export interface WolfBaseState extends VisRxWidgetState {
    /** Metadaten der Objekte aus metaIds(), nach Objekt-ID */
    meta: Record<string, ObjectMeta>;
    /** zählt Änderungen der Schreib-Nachverfolgung, damit das Widget neu zeichnet */
    writeTick: number;
}

/** Nur der Teil der Socket-Verbindung, den die Basis braucht */
interface ObjectReader {
    getObject(id: string): Promise<ioBroker.Object | null | undefined>;
}

/**
 * Zahl aus einem Widget-Attribut; leere Felder liefern den Vorgabewert.
 *
 * @param value Attributwert
 * @param fallback Vorgabewert
 * @returns die Zahl
 */
export function attrNumber(value: unknown, fallback: number): number {
    return toNumber(value) ?? fallback;
}

/**
 * Gemeinsame Anbindung aller Wolf-Widgets an VIS-2: Übersetzungspräfix, Farbschema, Sprache,
 * Objektwerte, Objekt-Metadaten (Grenzen, Schrittweite, Klartexte, Schreibrecht) und Schreiben
 * mit ack-Nachverfolgung. Die Darstellung liegt jeweils in components/ und kennt ioBroker nicht.
 */
export default abstract class WolfWidgetBase<
    TRxData extends WolfBaseRxData,
    TState extends WolfBaseState = WolfBaseState,
> extends (window.visRxWidget as typeof VisRxWidget)<TRxData, TState> {
    /** wird von VIS-2 beim Laden des Widget-Sets an der jeweiligen Widget-Klasse gesetzt */
    static adapter: string;

    protected mounted = false;
    protected readonly writes: WriteTracker;
    private metaKey = '';

    /**
     * Startzustand ohne Metadaten; Schreiben geht über context.setValue (ack:false)
     *
     * @param props von VIS-2 übergebene Eigenschaften
     */
    constructor(props: VisRxWidgetProps) {
        super(props);
        this.state = { ...this.state, meta: {}, writeTick: 0 };
        this.writes = new WriteTracker({
            write: (id, value) => this.props.context.setValue(id, value),
            onChange: () => {
                if (this.mounted) {
                    this.setState(s => ({ ...s, writeTick: s.writeTick + 1 }));
                }
            },
        });
    }

    /** Präfix der Übersetzungsschlüssel, passend zu translations.ts (prefix: true) */
    static getI18nPrefix(): string {
        return `${this.adapter}_`;
    }

    /** VIS-2 fragt die Widget-Beschreibung auch an der Instanz ab */
    getWidgetInfo(): RxWidgetInfo {
        return (this.constructor as unknown as { getWidgetInfo(): RxWidgetInfo }).getWidgetInfo();
    }

    /**
     * Objekt-IDs, deren Metadaten das Widget braucht (Klartexte, Grenzen, Schreibrecht).
     *
     * @returns IDs aus den Attributen; leere Einträge werden ignoriert
     */
    // eslint-disable-next-line class-methods-use-this
    protected metaIds(): Array<string | undefined> {
        return [];
    }

    /** Styles einfügen, Schreib-Einstellungen übernehmen, Metadaten laden */
    componentDidMount(): void {
        super.componentDidMount();
        this.mounted = true;
        injectStyles();
        this.applyWriteOptions();
        void this.loadMeta();
    }

    /** Zeitgeber stoppen und keine späten Antworten mehr übernehmen */
    componentWillUnmount(): void {
        this.mounted = false;
        this.writes.dispose();
        super.componentWillUnmount();
    }

    /**
     * Attribute im Editor geändert
     *
     * @param prevRxData Attribute vor der Änderung
     */
    onRxDataChanged(prevRxData: typeof this.state.rxData): void {
        super.onRxDataChanged(prevRxData);
        this.applyWriteOptions();
        void this.loadMeta();
    }

    /**
     * Zustandsmeldung von VIS-2 — beendet das Warten auf die Bestätigung eines Schreibvorgangs.
     *
     * @param id Objekt-ID
     * @param state Zustand mit val und ack
     */
    onStateUpdated(id: string, state: ioBroker.State): void {
        super.onStateUpdated(id, state);
        this.writes.onState(id, state);
    }

    /**
     * Übersetzung mit dem Präfix des Widget-Sets
     *
     * @param key Schlüssel aus i18n/*.json
     * @returns übersetzter Text
     */
    protected tr(key: string): string {
        return (this.constructor as typeof VisRxWidget).t(key);
    }

    /** @returns Sprachregion von VIS-2 für die Zahlformatierung */
    protected locale(): string {
        return (this.constructor as typeof VisRxWidget).getLanguage();
    }

    /** @returns Farbschema aus dem Attribut "theme", bei "auto" wie VIS-2 */
    protected themeType(): ThemeType {
        return resolveTheme(this.state.rxData.theme, this.props.context.themeType);
    }

    /**
     * Ist-Wert eines gebundenen Objekts (VIS-2 abonniert oid_-Attribute selbst).
     *
     * @param oid Objekt-ID aus einem oid_-Attribut
     * @returns Rohwert oder undefined
     */
    protected objectValue(oid: string | undefined): unknown {
        return oid ? this.state.values[`${oid}.val`] : undefined;
    }

    /**
     * @param oid Objekt-ID
     * @returns Ist-Wert als Zahl oder null
     */
    protected objectNumber(oid: string | undefined): number | null {
        return toNumber(this.objectValue(oid));
    }

    /**
     * Anzuzeigender Wert: der gewünschte, solange er auf Bestätigung wartet, sonst der Ist-Wert.
     *
     * @param oid Objekt-ID
     * @returns Wert
     */
    protected shownValue(oid: string | undefined): unknown {
        return oid ? this.writes.display(oid, this.objectValue(oid)) : undefined;
    }

    /**
     * @param oid Objekt-ID
     * @returns angezeigter Wert als Zahl oder null
     */
    protected shownNumber(oid: string | undefined): number | null {
        return toNumber(this.shownValue(oid));
    }

    /**
     * @param oid Objekt-ID
     * @returns Metadaten, sobald geladen
     */
    protected meta(oid: string | undefined): ObjectMeta | undefined {
        return oid ? this.state.meta[oid] : undefined;
    }

    /**
     * Darf das Widget diesen Datenpunkt schreiben? Nicht im Editor und nicht bei common.write: false.
     *
     * @param oid Objekt-ID
     * @returns true, wenn schreibbar
     */
    protected canWrite(oid: string | undefined): boolean {
        return !!oid && !this.props.editMode && (this.meta(oid)?.write ?? true);
    }

    /**
     * Zustand eines Datenpunkts für die Anzeige neben dem Bedienelement.
     *
     * @param oid Objekt-ID
     * @returns Zustand, "locked" für schreibgeschützte Objekte
     */
    protected writeStatus(oid: string | undefined): WriteStatus | 'locked' {
        if (!oid) {
            return 'idle';
        }
        if (!this.props.editMode && this.meta(oid)?.write === false) {
            return 'locked';
        }
        return this.writes.status(oid);
    }

    /**
     * Wert schreiben — mit Entprellung oder sofort, nachverfolgt bis zur Bestätigung.
     * Ein unveränderter Wert wird nicht geschrieben.
     *
     * @param oid Objekt-ID
     * @param value gewünschter Wert
     * @param immediate ohne Entprellung (Segmentschalter, Knöpfe)
     */
    protected writeValue(oid: string | undefined, value: WriteValue, immediate = false): void {
        if (!oid || !this.canWrite(oid)) {
            return;
        }
        const actual = this.objectValue(oid);
        const acknowledged = this.state.values[`${oid}.ack`] === true;
        if (this.writes.status(oid) === 'idle' && acknowledged && sameValue(value, actual)) {
            return;
        }
        this.writes.request(oid, value, immediate, acknowledged ? actual : undefined);
    }

    /**
     * Zahlen-Bedienelement für einen Datenpunkt — mit Wert, Zustand und entprelltem Schreiben.
     *
     * @param oid Objekt-ID; leer blendet das Element aus
     * @param range Wertebereich
     * @returns Bedienelement oder null
     */
    protected numberControl(oid: string | undefined, range: NumberRange): NumberControl | null {
        if (!oid) {
            return null;
        }
        return {
            value: this.shownNumber(oid),
            range,
            status: this.writeStatus(oid),
            onChange: value => this.writeValue(oid, value),
        };
    }

    /**
     * Auswahl-Bedienelement für einen Datenpunkt — schreibt sofort, Zahlen als Zahl.
     *
     * @param oid Objekt-ID; leer blendet das Element aus
     * @param options Auswahl
     * @returns Bedienelement oder null
     */
    protected selectControl(oid: string | undefined, options: SelectOption[]): SelectControl | null {
        if (!oid) {
            return null;
        }
        const shown = this.shownValue(oid);
        return {
            options,
            value:
                typeof shown === 'string' || typeof shown === 'number' || typeof shown === 'boolean'
                    ? String(shown)
                    : null,
            status: this.writeStatus(oid),
            onSelect: value => {
                const n = Number(value);
                this.writeValue(oid, value.trim() !== '' && Number.isFinite(n) ? n : value, true);
            },
        };
    }

    /**
     * Schalter für einen Datenpunkt — schreibt sofort, im Typ des Objekts (0/1 oder true/false).
     *
     * @param oid Objekt-ID; leer blendet das Element aus
     * @returns Bedienelement oder null
     */
    protected switchControl(oid: string | undefined): SwitchControl | null {
        if (!oid) {
            return null;
        }
        return {
            value: toBoolean(this.shownValue(oid)),
            status: this.writeStatus(oid),
            onToggle: on => this.writeValue(oid, switchValue(this.meta(oid), on), true),
        };
    }

    /** @returns übersetzte Zustandstexte der Bedienelemente */
    protected statusTexts(): StatusTexts {
        return {
            pending: this.tr('status_pending'),
            staged: this.tr('status_staged'),
            timeout: this.tr('status_timeout'),
            locked: this.tr('status_locked'),
        };
    }

    private applyWriteOptions(): void {
        const rx = this.state.rxData;
        this.writes.configure({
            debounceMs: attrNumber(rx.write_delay, 800),
            timeoutMs: attrNumber(rx.write_timeout, 10) * 1000,
            confirm: toBoolean(rx.confirm) === true,
        });
    }

    /** Liest die Metadaten der benötigten Objekte; nur bei geänderter ID-Liste */
    private async loadMeta(): Promise<void> {
        const ids = [...new Set(this.metaIds().filter((id): id is string => !!id))];
        const key = ids.join('|');
        if (key === this.metaKey) {
            return;
        }
        this.metaKey = key;
        const socket = this.props.context.socket as ObjectReader;
        const meta: Record<string, ObjectMeta> = {};
        for (const id of ids) {
            try {
                meta[id] = toObjectMeta(await socket.getObject(id));
            } catch {
                // ohne Lesezugriff auf das Objekt: schreibbar, ohne Grenzen und Klartexte
                meta[id] = toObjectMeta(null);
            }
        }
        if (this.mounted && key === this.metaKey) {
            this.setState(s => ({ ...s, meta }));
        }
    }
}
