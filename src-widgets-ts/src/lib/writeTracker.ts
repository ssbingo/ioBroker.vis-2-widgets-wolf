import { toBoolean } from './fmt';

/** Werte, die ein Bedienelement schreiben kann */
export type WriteValue = string | number | boolean | null;

/** Zustand eines Datenpunkts aus Sicht der Bedienung */
export type WriteStatus = 'idle' | 'staged' | 'pending' | 'timeout';

interface Entry {
    value: WriteValue;
    /** zuletzt von der Quelle bestätigter Wert (ack:true), sofern bekannt */
    confirmed: unknown;
    phase: 'debounce' | 'staged' | 'pending' | 'timeout';
    debounceTimer?: ReturnType<typeof setTimeout>;
    timeoutTimer?: ReturnType<typeof setTimeout>;
}

/** Einstellungen der Schreib-Nachverfolgung */
export interface WriteTrackerOptions {
    /** schreibt den Wert mit ack:false, z. B. context.setValue */
    write: (id: string, value: WriteValue) => void;
    /** meldet jede Zustandsänderung, damit das Widget neu zeichnet */
    onChange: () => void;
    /** Entprellung in ms, Vorgabe 800 */
    debounceMs?: number;
    /** Wartezeit auf ack:true in ms, Vorgabe 10 000 */
    timeoutMs?: number;
    /** Änderungen erst nach commit() schreiben */
    confirm?: boolean;
}

/**
 * Vergleicht einen geschriebenen mit einem bestätigten Wert. Quellen bestätigen Zahlen
 * gelegentlich als Zeichenkette und Schalter als 0/1 — beides gilt als gleich.
 *
 * @param a erster Wert
 * @param b zweiter Wert
 * @returns true bei gleichem Wert
 */
export function sameValue(a: unknown, b: unknown): boolean {
    if (typeof a === 'boolean' || typeof b === 'boolean') {
        return toBoolean(a) === toBoolean(b) && toBoolean(a) !== null;
    }
    const numeric = (v: unknown): number | null =>
        typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : null;
    const na = numeric(a);
    const nb = numeric(b);
    if (na !== null && nb !== null && Number.isFinite(na) && Number.isFinite(nb)) {
        return Math.abs(na - nb) < 1e-9;
    }
    return a === b;
}

/**
 * Schreib-Nachverfolgung für Bedienelemente.
 *
 * Ablauf: request() → (Entprellung oder „Übernehmen") → write() mit ack:false → „wird übernommen",
 * bis die Quelle genau diesen Wert mit ack:true bestätigt. Ein ack:true mit anderem Wert — etwa eine
 * ältere Cloud-Abfrage — beendet das Warten nicht. Nach der Wartezeit zeigt das Widget den zuletzt
 * bestätigten Wert und meldet die fehlende Bestätigung, bis eine passende Bestätigung doch noch kommt.
 *
 * Wichtig: ioBroker speichert den geschriebenen Befehl (ack:false) als aktuellen Wert. Der
 * „Ist-Wert" des Objekts ist nach dem Schreiben also der unbestätigte Befehl — deshalb merkt sich
 * die Nachverfolgung beim Anfordern den bestätigten Wert.
 *
 * Ohne React und ohne ioBroker, damit Entprellung und Zeitüberschreitung testbar sind.
 */
export class WriteTracker {
    private readonly entries = new Map<string, Entry>();
    private readonly opts: Required<WriteTrackerOptions>;

    /**
     * @param options Schreibfunktion, Rückruf und Zeiten
     */
    constructor(options: WriteTrackerOptions) {
        this.opts = { debounceMs: 800, timeoutMs: 10_000, confirm: false, ...options };
    }

    /**
     * Zeiten und Bestätigungsmodus nachträglich ändern, z. B. nach geänderten Widget-Attributen.
     *
     * @param options nur die zu ändernden Werte
     */
    configure(options: Partial<Pick<WriteTrackerOptions, 'debounceMs' | 'timeoutMs' | 'confirm'>>): void {
        for (const [key, value] of Object.entries(options)) {
            if (value !== undefined) {
                (this.opts as unknown as Record<string, unknown>)[key] = value;
            }
        }
    }

    /**
     * Neuen Wert anfordern. Ersetzt eine noch offene Anforderung für denselben Datenpunkt.
     *
     * @param id Objekt-ID
     * @param value gewünschter Wert
     * @param immediate ohne Entprellung schreiben (z. B. Segmentschalter, Knopf)
     * @param confirmed aktueller Wert, wenn er bestätigt ist (ack:true); sonst undefined
     */
    request(id: string, value: WriteValue, immediate = false, confirmed?: unknown): void {
        // eine noch offene Anforderung kennt den bestätigten Wert von vor dem ersten Schreiben
        const previous = this.entries.get(id);
        this.clear(id);
        const entry: Entry = { value, confirmed: previous ? previous.confirmed : confirmed, phase: 'debounce' };
        this.entries.set(id, entry);
        if (this.opts.confirm) {
            entry.phase = 'staged';
        } else if (immediate || this.opts.debounceMs <= 0) {
            this.send(id);
            return;
        } else {
            entry.debounceTimer = setTimeout(() => this.send(id), this.opts.debounceMs);
        }
        this.opts.onChange();
    }

    /** Alle vorgemerkten Änderungen schreiben („Übernehmen") */
    commit(): void {
        for (const [id, entry] of this.entries) {
            if (entry.phase === 'staged') {
                this.send(id);
            }
        }
    }

    /** Alle vorgemerkten Änderungen verwerfen */
    discard(): void {
        for (const [id, entry] of [...this.entries]) {
            if (entry.phase === 'staged') {
                this.entries.delete(id);
            }
        }
        this.opts.onChange();
    }

    /** @returns true, wenn Änderungen auf „Übernehmen" warten */
    hasStaged(): boolean {
        return [...this.entries.values()].some(e => e.phase === 'staged');
    }

    /**
     * @param id Objekt-ID
     * @returns Zustand aus Sicht der Bedienung
     */
    status(id: string): WriteStatus {
        const phase = this.entries.get(id)?.phase;
        if (!phase) {
            return 'idle';
        }
        return phase === 'debounce' ? 'pending' : phase;
    }

    /**
     * Anzuzeigender Wert: der gewünschte, solange er unterwegs ist; nach einer Zeitüberschreitung
     * der zuletzt bestätigte; sonst der Ist-Wert des Objekts.
     *
     * @param id Objekt-ID
     * @param actual Ist-Wert aus dem Objekt
     * @returns anzuzeigender Wert
     */
    display(id: string, actual: unknown): unknown {
        const entry = this.entries.get(id);
        if (!entry) {
            return actual;
        }
        if (entry.phase === 'timeout') {
            return entry.confirmed === undefined ? actual : entry.confirmed;
        }
        return entry.value;
    }

    /**
     * Zustandsmeldung der Quelle auswerten.
     *
     * @param id Objekt-ID
     * @param state Zustand mit val und ack
     */
    onState(id: string, state: { val?: unknown; ack?: boolean } | null | undefined): void {
        const entry = this.entries.get(id);
        if (!entry || !state || state.ack !== true) {
            return;
        }
        if ((entry.phase === 'pending' || entry.phase === 'timeout') && sameValue(state.val, entry.value)) {
            this.clear(id);
            this.opts.onChange();
        }
    }

    /** Alle Zeitgeber stoppen, z. B. beim Entfernen des Widgets */
    dispose(): void {
        for (const id of [...this.entries.keys()]) {
            this.clear(id);
        }
    }

    private send(id: string): void {
        const entry = this.entries.get(id);
        if (!entry) {
            return;
        }
        clearTimeout(entry.debounceTimer);
        entry.phase = 'pending';
        try {
            this.opts.write(id, entry.value);
            entry.timeoutTimer = setTimeout(() => {
                entry.phase = 'timeout';
                this.opts.onChange();
            }, this.opts.timeoutMs);
        } catch {
            entry.phase = 'timeout';
        }
        this.opts.onChange();
    }

    private clear(id: string): void {
        const entry = this.entries.get(id);
        if (entry) {
            clearTimeout(entry.debounceTimer);
            clearTimeout(entry.timeoutTimer);
            this.entries.delete(id);
        }
    }
}
