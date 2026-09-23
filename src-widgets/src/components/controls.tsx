import React from 'react';

import { fmt } from '../lib/fmt';
import { decimalsOf, stepValue, type NumberRange, type SelectOption } from '../lib/objectMeta';

/** Zustand eines Bedienelements aus Sicht der Schreib-Nachverfolgung */
export type ControlStatus = 'idle' | 'staged' | 'pending' | 'timeout' | 'locked';

/** Auswahl-Bedienelement (Betriebsart, Zeitprogramm) */
export interface SelectControl {
    /** Auswahl */
    options: SelectOption[];
    /** angezeigter Wert als Zeichenkette */
    value: string | null;
    /** Zustand */
    status: ControlStatus;
    /** Auswahl getroffen */
    onSelect: (value: string) => void;
}

/** Zahlen-Bedienelement (Temperaturen, Korrektur) */
export interface NumberControl {
    /** angezeigter Wert */
    value: number | null;
    /** Wertebereich */
    range: NumberRange;
    /** Zustand */
    status: ControlStatus;
    /** neuer Wert */
    onChange: (value: number) => void;
}

/** Schalter oder Knopf (Zirkulation, Sofortladung) */
export interface SwitchControl {
    /** angezeigter Zustand; null ohne Wert */
    value: boolean | null;
    /** Zustand */
    status: ControlStatus;
    /** umschalten */
    onToggle: (on: boolean) => void;
}

/** Übersetzte Zustandstexte */
export interface StatusTexts {
    /** Wert unterwegs, Bestätigung ausstehend */
    pending: string;
    /** vorgemerkt, wartet auf „Übernehmen" */
    staged: string;
    /** keine Bestätigung innerhalb der Wartezeit */
    timeout: string;
    /** Objekt nicht schreibbar */
    locked: string;
}

/**
 * Beschriftung eines Bedienelements mit Zustandshinweis rechts daneben.
 *
 * @param props Beschriftung, Zustand und Texte
 * @param props.label Beschriftung
 * @param props.status Zustand des Datenpunkts
 * @param props.texts übersetzte Zustandstexte
 * @returns die Zeile
 */
export function ControlLabel(props: { label: string; status: ControlStatus; texts: StatusTexts }): React.JSX.Element {
    return (
        <div className="wolf-ctl-label">
            <span className="wolf-label">{props.label}</span>
            <StatusNote
                status={props.status}
                texts={props.texts}
            />
        </div>
    );
}

/**
 * Zustandshinweis eines Bedienelements; im Ruhezustand nichts.
 *
 * @param props Zustand und Texte
 * @param props.status Zustand des Datenpunkts
 * @param props.texts übersetzte Zustandstexte
 * @returns der Hinweis oder null
 */
export function StatusNote(props: { status: ControlStatus; texts: StatusTexts }): React.JSX.Element | null {
    const { status } = props;
    if (status === 'idle') {
        return null;
    }
    return (
        <span
            className={`wolf-status wolf-status-${status}`}
            role={status === 'timeout' ? 'alert' : undefined}
        >
            {props.texts[status]}
        </span>
    );
}

/**
 * @param status Zustand
 * @returns true, solange der Wert unterwegs oder vorgemerkt ist
 */
export function isPending(status: ControlStatus): boolean {
    return status === 'pending' || status === 'staged';
}

/** Eigenschaften des Segmentschalters */
export interface SegmentedProps {
    /** Beschriftung für Screenreader */
    label: string;
    /** Auswahl */
    options: SelectOption[];
    /** aktueller Wert als Zeichenkette; null = keiner */
    value: string | null;
    /** Objekt nicht schreibbar */
    disabled: boolean;
    /** Wert unterwegs — der gewählte Knopf wird als „wird übernommen" gezeigt */
    pending: boolean;
    /** Auswahl getroffen */
    onSelect: (value: string) => void;
}

/**
 * Segmentschalter, z. B. für Betriebsart und Zeitprogramm.
 *
 * @param props Auswahl, Wert und Rückruf
 * @returns der Schalter
 */
export function Segmented(props: SegmentedProps): React.JSX.Element {
    return (
        <div
            className="wolf-seg"
            role="group"
            aria-label={props.label}
        >
            {props.options.map(o => {
                const active = o.value === props.value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        aria-pressed={active}
                        disabled={props.disabled}
                        className={active && props.pending ? 'wolf-pending' : undefined}
                        onClick={() => props.onSelect(o.value)}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

/** Eigenschaften des Steppers */
export interface StepperProps {
    /** Beschriftung für Screenreader */
    label: string;
    /** angezeigter Wert (gewünscht oder Ist) */
    value: number | null;
    /** Wertebereich */
    range: NumberRange;
    /** Einheit neben dem Wert */
    unit: string;
    /** Objekt nicht schreibbar */
    disabled: boolean;
    /** Wert unterwegs — wird gedämpft gezeigt */
    pending: boolean;
    /** kleine Ausführung für Nebenwerte */
    compact?: boolean;
    /** Vorzeichen auch bei positiven Werten, z. B. Korrektur +1,0 */
    signed?: boolean;
    /** Schieberegler unter dem Wert */
    slider?: boolean;
    /** Sprachregion */
    locale?: string;
    /** Beschriftungen der Knöpfe */
    labels: { decrease: string; increase: string };
    /** neuer Wert */
    onChange: (value: number) => void;
}

/**
 * Stepper mit −/+ und optionalem Schieberegler; rechnet im Raster der Schrittweite.
 *
 * @param props Wert, Bereich und Rückruf
 * @returns der Stepper
 */
export function Stepper(props: StepperProps): React.JSX.Element {
    const { value, range } = props;
    const decimals = decimalsOf(range.step);
    const text = fmt(value, decimals, undefined, props.locale);
    const shown = props.signed && value !== null && value > 0 ? `+${text}` : text;
    return (
        <>
            <div className={props.compact ? 'wolf-stepper wolf-stepper-compact' : 'wolf-stepper'}>
                <button
                    className="wolf-step-btn"
                    type="button"
                    aria-label={`${props.label}: ${props.labels.decrease}`}
                    disabled={props.disabled || (value !== null && value <= range.min)}
                    onClick={() => props.onChange(stepValue(value, -1, range))}
                >
                    −
                </button>
                <div
                    className={props.pending ? 'wolf-big wolf-pending' : 'wolf-big'}
                    aria-live="polite"
                >
                    {shown}
                    <small>{props.unit}</small>
                </div>
                <button
                    className="wolf-step-btn"
                    type="button"
                    aria-label={`${props.label}: ${props.labels.increase}`}
                    disabled={props.disabled || (value !== null && value >= range.max)}
                    onClick={() => props.onChange(stepValue(value, 1, range))}
                >
                    +
                </button>
            </div>
            {props.slider ? (
                <input
                    className="wolf-range"
                    type="range"
                    aria-label={props.label}
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    value={value ?? range.min}
                    disabled={props.disabled}
                    onChange={e => props.onChange(Number(e.target.value))}
                />
            ) : null}
        </>
    );
}

/**
 * Ein/Aus-Schalter, z. B. Zirkulation. Schaltet erst um, wenn die Quelle bestätigt —
 * bis dahin steht der gewünschte Zustand gedämpft da.
 *
 * @param props Beschriftung, Schalter und Zustandstexte
 * @param props.label Beschriftung
 * @param props.control Zustand und Rückruf
 * @param props.texts übersetzte Zustandstexte
 * @returns der Schalter
 */
export function Toggle(props: { label: string; control: SwitchControl; texts: StatusTexts }): React.JSX.Element {
    const { control } = props;
    const on = control.value === true;
    return (
        <div className="wolf-switch">
            <span className="wolf-switch-text">
                <span>{props.label}</span>
                <StatusNote
                    status={control.status}
                    texts={props.texts}
                />
            </span>
            <button
                type="button"
                aria-label={props.label}
                aria-pressed={on}
                className={isPending(control.status) ? 'wolf-pending' : undefined}
                disabled={control.status === 'locked'}
                onClick={() => control.onToggle(!on)}
            />
        </div>
    );
}

/**
 * Knopf mit zwei Zuständen, z. B. „Sofortladung starten" / „Sofortladung läuft".
 *
 * @param props Beschriftungen, Schalter und Zustandstexte
 * @param props.label Beschriftung im Ruhezustand
 * @param props.activeLabel Beschriftung, solange der Zustand ein ist
 * @param props.control Zustand und Rückruf
 * @param props.texts übersetzte Zustandstexte
 * @returns der Knopf
 */
export function PressButton(props: {
    label: string;
    activeLabel: string;
    control: SwitchControl;
    texts: StatusTexts;
}): React.JSX.Element {
    const { control } = props;
    const on = control.value === true;
    return (
        <div className="wolf-press">
            <button
                type="button"
                className={isPending(control.status) ? 'wolf-primary wolf-pending' : 'wolf-primary'}
                aria-pressed={on}
                disabled={control.status === 'locked'}
                onClick={() => control.onToggle(!on)}
            >
                {on ? props.activeLabel : props.label}
            </button>
            <StatusNote
                status={control.status}
                texts={props.texts}
            />
        </div>
    );
}

/**
 * Leiste „Übernehmen / Verwerfen" für den Bestätigungsmodus.
 *
 * @param props Rückrufe und Beschriftungen
 * @param props.onCommit Übernehmen
 * @param props.onDiscard Verwerfen
 * @param props.labels Beschriftungen
 * @param props.labels.apply Text für Übernehmen
 * @param props.labels.discard Text für Verwerfen
 * @returns die Leiste
 */
export function ConfirmBar(props: {
    onCommit: () => void;
    onDiscard: () => void;
    labels: { apply: string; discard: string };
}): React.JSX.Element {
    return (
        <div className="wolf-confirm">
            <button
                className="wolf-primary"
                type="button"
                onClick={props.onCommit}
            >
                {props.labels.apply}
            </button>
            <button
                className="wolf-secondary"
                type="button"
                onClick={props.onDiscard}
            >
                {props.labels.discard}
            </button>
        </div>
    );
}

/** Ein Anzeigewert im Kennwert-Raster */
export interface Reading {
    /** Beschriftung */
    label: string;
    /** Wert */
    value: number | null;
    /** Einheit */
    unit: string;
    /** Nachkommastellen */
    decimals: number;
}

/**
 * Kennwert-Raster für Anzeigewerte.
 *
 * @param props Werte und Sprachregion
 * @param props.readings anzuzeigende Werte
 * @param props.locale Sprachregion
 * @returns das Raster, null ohne Werte
 */
export function Readings(props: { readings: Reading[]; locale?: string }): React.JSX.Element | null {
    if (!props.readings.length) {
        return null;
    }
    return (
        <div className="wolf-kv wolf-kv-auto">
            {props.readings.map(r => (
                <div key={r.label}>
                    <div className="wolf-label">{r.label}</div>
                    <div className="wolf-v wolf-num">
                        {fmt(r.value, r.decimals, undefined, props.locale)}
                        <small>{r.unit}</small>
                    </div>
                </div>
            ))}
        </div>
    );
}
