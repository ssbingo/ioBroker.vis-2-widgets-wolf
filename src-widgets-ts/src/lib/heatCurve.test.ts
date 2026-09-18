import { describe, expect, it } from 'vitest';

import { curvePoints, flowSetpoint, flowTicks, type CurveParams } from './heatCurve';

/** Einstellung der Anlage: Tag 22 °C, Korrektur +1, Steilheit 1,5, linear, Heizkörper */
const ANLAGE: CurveParams = { roomSetpoint: 22, slope: 1.5, level: 0, correction: 1, exponent: 1, maxFlow: 80 };

describe('flowSetpoint', () => {
    it('trifft die Orientierungswerte von Wolf für Heizkörper', () => {
        expect(flowSetpoint(-10, ANLAGE)).toBe(71);
        expect(flowSetpoint(8, ANLAGE)).toBe(44);
    });

    it('bleibt oberhalb des Raumsollwerts flach bei TR + N + K', () => {
        expect(flowSetpoint(25, ANLAGE)).toBe(23);
        expect(flowSetpoint(25, { ...ANLAGE, level: 2 })).toBe(25);
    });

    it('verschiebt die Kurve mit der Korrektur parallel', () => {
        const up = { ...ANLAGE, correction: 3 };
        expect(flowSetpoint(0, up) - flowSetpoint(0, ANLAGE)).toBe(2);
        expect(flowSetpoint(-5, up) - flowSetpoint(-5, ANLAGE)).toBe(2);
    });

    it('krümmt mit einem Exponenten über 1 nach oben', () => {
        const curved = { ...ANLAGE, exponent: 1.2 };
        expect(flowSetpoint(8, curved)).toBeGreaterThan(flowSetpoint(8, ANLAGE));
    });

    it('begrenzt auf das Vorlauf-Maximum', () => {
        expect(flowSetpoint(-20, { ...ANLAGE, slope: 2.5 })).toBe(80);
    });

    it('rechnet mit ungültigem Exponenten linear', () => {
        expect(flowSetpoint(-10, { ...ANLAGE, exponent: 0 })).toBe(71);
    });
});

describe('curvePoints', () => {
    it('liefert Stützpunkte von warm nach kalt einschließlich der Ränder', () => {
        const points = curvePoints(ANLAGE, 20, -20, 5);
        expect(points.map(p => p[0])).toEqual([20, 15, 10, 5, 0, -5, -10, -15, -20]);
        expect(points[6]).toEqual([-10, 71]);
    });
});

describe('flowTicks', () => {
    it('setzt Gitterlinien alle 20 K', () => {
        expect(flowTicks(20, 80)).toEqual([30, 50, 70]);
        expect(flowTicks(20, 50)).toEqual([30]);
    });
});
