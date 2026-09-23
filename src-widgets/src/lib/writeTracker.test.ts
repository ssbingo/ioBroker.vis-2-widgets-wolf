import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sameValue, WriteTracker, type WriteValue } from './writeTracker';

const ID = 'wolf-smartset.0.Benutzer.Heizung.058_Direkter_Heizkreis.1000000000';

function setup(options: { confirm?: boolean; debounceMs?: number; timeoutMs?: number } = {}): {
    tracker: WriteTracker;
    writes: Array<[string, WriteValue]>;
    changes: () => number;
} {
    const writes: Array<[string, WriteValue]> = [];
    let changes = 0;
    const tracker = new WriteTracker({
        write: (id, value) => writes.push([id, value]),
        onChange: () => changes++,
        ...options,
    });
    return { tracker, writes, changes: () => changes };
}

describe('sameValue', () => {
    it('vergleicht Zahlen, numerische Zeichenketten und Schalter tolerant', () => {
        expect(sameValue(22.5, 22.5)).toBe(true);
        expect(sameValue(22.5, '22.5')).toBe(true);
        expect(sameValue(0.1 + 0.2, 0.3)).toBe(true);
        expect(sameValue(true, 1)).toBe(true);
        expect(sameValue(false, 0)).toBe(true);
        expect(sameValue('Ein', true)).toBe(true);
    });

    it('unterscheidet verschiedene Werte', () => {
        expect(sameValue(22.5, 22)).toBe(false);
        expect(sameValue(true, false)).toBe(false);
        expect(sameValue('a', 'b')).toBe(false);
        expect(sameValue(true, null)).toBe(false);
    });
});

describe('WriteTracker', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('entprellt: mehrere Anforderungen führen zu einem Schreibvorgang mit dem letzten Wert', () => {
        const { tracker, writes } = setup({ debounceMs: 800 });
        tracker.request(ID, 22);
        vi.advanceTimersByTime(500);
        tracker.request(ID, 22.5);
        vi.advanceTimersByTime(500);
        tracker.request(ID, 23);
        expect(writes).toEqual([]);
        expect(tracker.status(ID)).toBe('pending');
        expect(tracker.display(ID, 21)).toBe(23);
        vi.advanceTimersByTime(800);
        expect(writes).toEqual([[ID, 23]]);
    });

    it('schreibt sofort, wenn verlangt', () => {
        const { tracker, writes } = setup();
        tracker.request(ID, 3, true);
        expect(writes).toEqual([[ID, 3]]);
        expect(tracker.status(ID)).toBe('pending');
    });

    it('wartet auf ack:true mit dem geschriebenen Wert', () => {
        const { tracker } = setup();
        tracker.request(ID, 22.5, true);
        tracker.onState(ID, { val: 22.5, ack: false }); // eigenes Echo
        expect(tracker.status(ID)).toBe('pending');
        tracker.onState(ID, { val: 22, ack: true }); // ältere Cloud-Abfrage
        expect(tracker.status(ID)).toBe('pending');
        expect(tracker.display(ID, 22)).toBe(22.5);
        tracker.onState(ID, { val: 22.5, ack: true }); // Bestätigung
        expect(tracker.status(ID)).toBe('idle');
        expect(tracker.display(ID, 22.5)).toBe(22.5);
    });

    it('meldet die Zeitüberschreitung und zeigt ohne bekannten bestätigten Wert den Ist-Wert', () => {
        const { tracker } = setup({ timeoutMs: 10_000 });
        tracker.request(ID, 24, true);
        vi.advanceTimersByTime(9_999);
        expect(tracker.status(ID)).toBe('pending');
        vi.advanceTimersByTime(1);
        expect(tracker.status(ID)).toBe('timeout');
        expect(tracker.display(ID, 22)).toBe(22);
    });

    it('zeigt nach der Zeitüberschreitung den zuletzt bestätigten Wert, nicht den Befehl', () => {
        // ioBroker hält nach dem Schreiben den Befehl (ack:false) als aktuellen Wert
        const { tracker } = setup({ timeoutMs: 10_000 });
        tracker.request(ID, 18.5, true, 18);
        vi.advanceTimersByTime(10_000);
        expect(tracker.status(ID)).toBe('timeout');
        expect(tracker.display(ID, 18.5)).toBe(18);
    });

    it('behält den bestätigten Wert über mehrere Anforderungen hinweg', () => {
        const { tracker } = setup({ debounceMs: 800, timeoutMs: 1_000 });
        tracker.request(ID, 18.5, false, 18);
        tracker.request(ID, 19, false, undefined); // zweiter Klick, Objekt hält schon keinen bestätigten Wert
        vi.advanceTimersByTime(800 + 1_000);
        expect(tracker.display(ID, 19)).toBe(18);
    });

    it('nimmt eine späte, passende Bestätigung nach der Zeitüberschreitung noch an', () => {
        const { tracker } = setup({ timeoutMs: 1_000 });
        tracker.request(ID, 24, true);
        vi.advanceTimersByTime(1_000);
        expect(tracker.status(ID)).toBe('timeout');
        tracker.onState(ID, { val: 24, ack: true });
        expect(tracker.status(ID)).toBe('idle');
    });

    it('merkt im Bestätigungsmodus vor und schreibt erst mit commit()', () => {
        const { tracker, writes } = setup({ confirm: true });
        tracker.request(ID, 21);
        tracker.request('b', true);
        vi.advanceTimersByTime(5_000);
        expect(writes).toEqual([]);
        expect(tracker.hasStaged()).toBe(true);
        expect(tracker.status(ID)).toBe('staged');
        tracker.commit();
        expect(writes).toEqual([
            [ID, 21],
            ['b', true],
        ]);
        expect(tracker.hasStaged()).toBe(false);
        expect(tracker.status(ID)).toBe('pending');
    });

    it('verwirft vorgemerkte Änderungen', () => {
        const { tracker, writes } = setup({ confirm: true });
        tracker.request(ID, 21);
        tracker.discard();
        expect(tracker.status(ID)).toBe('idle');
        expect(tracker.display(ID, 22)).toBe(22);
        expect(writes).toEqual([]);
    });

    it('übernimmt geänderte Einstellungen', () => {
        const { tracker, writes } = setup({ debounceMs: 800 });
        tracker.configure({ debounceMs: 0, confirm: undefined });
        tracker.request(ID, 20);
        expect(writes).toEqual([[ID, 20]]);
    });

    it('stoppt beim Aufräumen alle Zeitgeber', () => {
        const { tracker, writes, changes } = setup({ debounceMs: 800 });
        tracker.request(ID, 20);
        const before = changes();
        tracker.dispose();
        vi.advanceTimersByTime(20_000);
        expect(writes).toEqual([]);
        expect(changes()).toBe(before);
    });

    it('meldet einen Fehler beim Schreiben sofort als fehlende Bestätigung', () => {
        const tracker = new WriteTracker({
            write: () => {
                throw new Error('keine Verbindung');
            },
            onChange: () => undefined,
        });
        tracker.request(ID, 20, true);
        expect(tracker.status(ID)).toBe('timeout');
    });
});
