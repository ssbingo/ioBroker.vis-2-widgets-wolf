import { describe, expect, it } from 'vitest';

import { MAX_CIRCUITS, schemaLayout, type Box } from './schemaLayout';

const inside = (y: number, box: Box): boolean => y > box.y && y < box.y + box.height;
const overlaps = (a: Box, b: Box): boolean => a.y < b.y + b.height && b.y < a.y + a.height;
/**
 * y-Werte eines Rohrpfads
 *
 * @param pipe Rohrpfad der Form „M x y H x V y H x"
 * @returns y des Abgangs am Verteiler und y am Verbraucher
 */
const pipeYs = (pipe: string): number[] => {
    const m = /^M(\d+) (\d+) H\d+ V(\d+) H\d+$/.exec(pipe);
    if (!m) {
        throw new Error(`unerwarteter Pfad ${pipe}`);
    }
    return [Number(m[2]), Number(m[3])];
};

describe('schemaLayout', () => {
    it('bildet die Anlage ab: Speicher und ein direkter Heizkreis, Außentemperatur', () => {
        const l = schemaLayout({ tank: true, circuits: 1, outside: true });
        expect(l.consumers.map(c => `${c.kind}${c.index}`)).toEqual(['tank0', 'circuit1']);
        expect(l.outside).not.toBeNull();
        expect(l.width).toBe(700);
    });

    it('führt Vor- und Rücklauf ins Heizgerät und in den Verteiler', () => {
        for (const circuits of [0, 1, 2, MAX_CIRCUITS]) {
            for (const tank of [true, false]) {
                const l = schemaLayout({ tank, circuits, outside: false });
                expect(inside(l.flowY, l.boiler)).toBe(true);
                expect(inside(l.returnY, l.boiler)).toBe(true);
                expect(inside(l.flowY, l.distributor)).toBe(true);
                expect(inside(l.returnY, l.distributor)).toBe(true);
                expect(l.flowY).toBeLessThan(l.returnY);
            }
        }
    });

    it('setzt jeden Abgang in den Verteiler und jedes Rohr mitten in seinen Verbraucher', () => {
        const l = schemaLayout({ tank: true, circuits: MAX_CIRCUITS, outside: true });
        for (const c of l.consumers) {
            const [outletY, connectY] = pipeYs(c.pipe);
            expect(inside(outletY, l.distributor)).toBe(true);
            expect(connectY).toBe(c.y + c.height / 2);
        }
    });

    it('lässt die Verbraucher nicht überlappen und alles in der Zeichenfläche', () => {
        const l = schemaLayout({ tank: true, circuits: MAX_CIRCUITS, outside: true });
        for (let i = 1; i < l.consumers.length; i++) {
            expect(overlaps(l.consumers[i - 1], l.consumers[i])).toBe(false);
        }
        const boxes: Box[] = [l.boiler, l.distributor, ...l.consumers, ...(l.outside ? [l.outside] : [])];
        for (const b of boxes) {
            expect(b.y).toBeGreaterThanOrEqual(0);
            expect(b.y + b.height).toBeLessThanOrEqual(l.height);
            expect(b.x + b.width).toBeLessThanOrEqual(l.width);
        }
    });

    it('begrenzt die Zahl der Heizkreise und wird ohne Außentemperatur schmaler', () => {
        expect(schemaLayout({ tank: false, circuits: 9, outside: false }).consumers).toHaveLength(MAX_CIRCUITS);
        expect(schemaLayout({ tank: false, circuits: -1, outside: false }).consumers).toHaveLength(0);
        expect(schemaLayout({ tank: false, circuits: 1, outside: false }).width).toBeLessThan(700);
    });
});
