import { describe, expect, it } from 'vitest';

import { MAX_CIRCUITS, schemaLayout, type Box, type SchemaLayout, type SchemaOrientation } from './schemaLayout';

const insideY = (y: number, box: Box): boolean => y > box.y && y < box.y + box.height;
const insideX = (x: number, box: Box): boolean => x > box.x && x < box.x + box.width;
const overlaps = (a: Box, b: Box): boolean =>
    a.y < b.y + b.height && b.y < a.y + a.height && a.x < b.x + b.width && b.x < a.x + a.width;

/**
 * Zahlen eines Rohrpfads
 *
 * @param pipe Pfad aus M, H und V
 * @returns alle Zahlen in Reihenfolge
 */
const nums = (pipe: string): number[] => (pipe.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

/**
 * alle Kombinationen, die das Widget darstellen kann
 *
 * @param orientation Quer- oder Hochformat
 * @returns Geometrie je Kombination aus Heizkreisen, Speicher und Außentemperatur
 */
function variants(orientation: SchemaOrientation): SchemaLayout[] {
    const all: SchemaLayout[] = [];
    for (const circuits of [0, 1, 2, 3, MAX_CIRCUITS]) {
        for (const tank of [true, false]) {
            for (const outside of [true, false]) {
                all.push(schemaLayout({ tank, circuits, outside, orientation }));
            }
        }
    }
    return all;
}

/**
 * Jede Box liegt in der Zeichenfläche, keine überlappt eine andere.
 *
 * @param l Geometrie
 */
function expectTidy(l: SchemaLayout): void {
    const boxes: Box[] = [l.boiler, l.distributor, ...l.consumers, ...(l.outside ? [l.outside] : [])];
    for (const b of boxes) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(l.width);
        expect(b.y + b.height).toBeLessThanOrEqual(l.height);
    }
    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            expect(overlaps(boxes[i], boxes[j])).toBe(false);
        }
    }
}

describe('schemaLayout — Querformat', () => {
    it('bildet die Anlage ab: Speicher und ein direkter Heizkreis, Außentemperatur', () => {
        const l = schemaLayout({ tank: true, circuits: 1, outside: true });
        expect(l.consumers.map(c => `${c.kind}${c.index}`)).toEqual(['tank0', 'circuit1']);
        expect(l.outside).not.toBeNull();
        expect(l.width).toBe(700);
    });

    it('führt Vor- und Rücklauf ins Heizgerät und in den Verteiler', () => {
        for (const l of variants('landscape')) {
            const [, flowY] = nums(l.flowPipe);
            const [, returnY] = nums(l.returnPipe);
            for (const y of [flowY, returnY]) {
                expect(insideY(y, l.boiler)).toBe(true);
                expect(insideY(y, l.distributor)).toBe(true);
            }
            expect(flowY).toBeLessThan(returnY);
        }
    });

    it('setzt jeden Abgang in den Verteiler und jedes Rohr mitten in seinen Verbraucher', () => {
        const l = schemaLayout({ tank: true, circuits: MAX_CIRCUITS, outside: true });
        for (const c of l.consumers) {
            const [, outletY, , connectY] = nums(c.pipe);
            expect(insideY(outletY, l.distributor)).toBe(true);
            expect(connectY).toBe(c.y + c.height / 2);
        }
    });

    it('hält alles in der Zeichenfläche ohne Überlappung', () => {
        for (const l of variants('landscape')) {
            expectTidy(l);
        }
    });

    it('begrenzt die Zahl der Heizkreise und wird ohne Außentemperatur schmaler', () => {
        expect(schemaLayout({ tank: false, circuits: 9, outside: false }).consumers).toHaveLength(MAX_CIRCUITS);
        expect(schemaLayout({ tank: false, circuits: -1, outside: false }).consumers).toHaveLength(0);
        expect(schemaLayout({ tank: false, circuits: 1, outside: false }).width).toBeLessThan(700);
    });
});

describe('schemaLayout — Hochformat für schmale Kacheln', () => {
    it('ist schmal genug für eine Handy-Kachel', () => {
        const l = schemaLayout({ tank: true, circuits: 1, outside: true, orientation: 'portrait' });
        expect(l.width).toBe(340);
        expect(l.consumers.map(c => `${c.kind}${c.index}`)).toEqual(['tank0', 'circuit1']);
    });

    it('führt Vor- und Rücklauf von unten aus dem Heizgerät oben in den Verteiler', () => {
        for (const l of variants('portrait')) {
            for (const pipe of [l.flowPipe, l.returnPipe]) {
                const [x, fromY, toY] = nums(pipe);
                expect(insideX(x, l.boiler)).toBe(true);
                expect(insideX(x, l.distributor)).toBe(true);
                expect(fromY).toBe(l.boiler.y + l.boiler.height);
                expect(toY).toBe(l.distributor.y);
            }
        }
    });

    it('führt jedes Rohr vom Verteiler mitten in seinen Verbraucher, ohne dass sich Rohre kreuzen', () => {
        for (const l of variants('portrait')) {
            const pipes = l.consumers.map(c => {
                const [x, fromY, toY, endX] = nums(c.pipe);
                expect(insideX(x, l.distributor)).toBe(true);
                expect(fromY).toBe(l.distributor.y + l.distributor.height);
                expect(toY).toBe(c.y + c.height / 2);
                expect(endX).toBe(c.x);
                return { x, fromY, toY, endX };
            });
            // senkrechtes Stück von j gegen waagerechtes Stück von i
            for (const a of pipes) {
                for (const b of pipes) {
                    if (a === b) {
                        continue;
                    }
                    const crosses = b.x > a.x && b.x < a.endX && a.toY > b.fromY && a.toY < b.toY;
                    expect(crosses).toBe(false);
                }
            }
        }
    });

    it('hält alles in der Zeichenfläche ohne Überlappung', () => {
        for (const l of variants('portrait')) {
            expectTidy(l);
        }
    });
});
