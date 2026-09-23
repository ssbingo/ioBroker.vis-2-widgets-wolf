/*
 * Geometrie des Anlagenschemas (viewBox-Einheiten), abgeleitet aus dem Entwurf
 * doc/design/wolf-heizung.html, waagerecht gestrafft, damit Schrift und Werte auch in einer
 * 640 px breiten Kachel lesbar bleiben: Heizgerät links, Verteiler in der Mitte, rechts die Verbraucher
 * untereinander (Speicher, Heizkreise), oben rechts die Außentemperatur. Die Höhe wächst mit der
 * Zahl der Verbraucher.
 *
 * Für schmale Kacheln (Handy) gibt es ein Hochformat: Heizgerät und Außentemperatur oben, der
 * Verteiler als waagerechter Balken darunter, die Verbraucher darunter gestapelt. Die Schrift
 * bleibt so auch in 300 px Breite lesbar. Ohne React, damit testbar.
 */

/** Rechteck */
export interface Box {
    /** linke Kante */
    x: number;
    /** obere Kante */
    y: number;
    /** Breite */
    width: number;
    /** Höhe */
    height: number;
}

/** Ein Verbraucher mit seinem Rohr vom Verteiler */
export interface ConsumerLayout extends Box {
    /** Speicher oder Heizkreis */
    kind: 'tank' | 'circuit';
    /** Nummer des Heizkreises (1…4), beim Speicher 0 */
    index: number;
    /** SVG-Pfad vom Verteiler zum Verbraucher */
    pipe: string;
}

/** Gesamtgeometrie */
export interface SchemaLayout {
    /** Breite der viewBox */
    width: number;
    /** Höhe der viewBox */
    height: number;
    /** Heizgerät */
    boiler: Box;
    /** Verteilerbalken */
    distributor: Box;
    /** Vorlauf Heizgerät → Verteiler */
    flowPipe: string;
    /** Rücklauf Verteiler → Heizgerät */
    returnPipe: string;
    /** Rücklauftemperatur: Ort und ob Bezeichnung und Wert in einer Zeile stehen */
    returnLabel: TextSpot & { inline: boolean };
    /** Beschriftung des Verteilers */
    distributorLabel: TextSpot;
    /** Verbraucher von oben nach unten */
    consumers: ConsumerLayout[];
    /** Außentemperatur; null, wenn ausgeblendet */
    outside: Box | null;
}

/** Ort einer Beschriftung */
export interface TextSpot {
    /** Bezugspunkt waagerecht */
    x: number;
    /** Grundlinie */
    y: number;
    /** Ausrichtung am Bezugspunkt */
    anchor: 'start' | 'middle';
}

/** Querformat (Vorgabe) oder Hochformat für schmale Kacheln */
export type SchemaOrientation = 'landscape' | 'portrait';

/** Was dargestellt wird */
export interface SchemaOptions {
    /** Warmwasserspeicher */
    tank: boolean;
    /** Anzahl Heizkreise 0…4 */
    circuits: number;
    /** Außentemperatur */
    outside: boolean;
    /** Anordnung, Vorgabe Querformat */
    orientation?: SchemaOrientation;
}

const PAD = 20;
const BOILER = { x: 20, width: 150, height: 180 };
const DIST = { x: 300, width: 16 };
const CONSUMER_X = 410;
const TANK = { width: 96, height: 120 };
const CIRCUIT = { width: 130, height: 60 };
const GAP = 14;
/** Abstand der Abgänge am Verteiler */
const OUTLET_STEP = 35;
const OUTSIDE = { x: 570, width: 110, height: 80 };
/** Platz unter dem Rücklaufrohr für Bezeichnung und Wert */
export const RETURN_LABEL = 44;
/** höchstens so viele Heizkreise */
export const MAX_CIRCUITS = 4;

/** Hochformat: feste Maße, Breite 340 */
const PORTRAIT = {
    width: 340,
    boiler: { x: 20, y: PAD, width: 150, height: 180 },
    outside: { x: 190, y: PAD, width: 130, height: 80 },
    dist: { x: 30, y: 232, width: 130, height: 16 },
    flowX: 65,
    returnX: 125,
    consumerX: 180,
    outletStep: 22,
};

/**
 * Verbraucher untereinander ab `top`, jeweils mit dem Punkt, an dem das Rohr ankommt.
 *
 * @param options dargestellte Anlagenteile
 * @param x linke Kante der Verbraucher
 * @param top obere Kante des ersten Verbrauchers
 * @returns Verbraucher ohne Rohr und die Unterkante des letzten
 */
function stackConsumers(
    options: SchemaOptions,
    x: number,
    top: number,
): { stack: Array<Omit<ConsumerLayout, 'pipe'> & { connectY: number }>; bottom: number } {
    const circuits = Math.max(0, Math.min(MAX_CIRCUITS, Math.round(options.circuits)));
    const stack: Array<Omit<ConsumerLayout, 'pipe'> & { connectY: number }> = [];
    let y = top;
    if (options.tank) {
        stack.push({ kind: 'tank', index: 0, x, y, ...TANK, connectY: y + TANK.height / 2 });
        y += TANK.height + GAP;
    }
    for (let i = 1; i <= circuits; i++) {
        stack.push({ kind: 'circuit', index: i, x, y, ...CIRCUIT, connectY: y + CIRCUIT.height / 2 });
        y += CIRCUIT.height + GAP;
    }
    return { stack, bottom: stack.length ? y - GAP : top };
}

/**
 * Hochformat: Abgänge unten am Verteiler, der oberste Verbraucher am weitesten rechts —
 * so kreuzen sich die Rohre nicht.
 *
 * @param options dargestellte Anlagenteile
 * @returns Geometrie in viewBox-Einheiten
 */
function portraitLayout(options: SchemaOptions): SchemaLayout {
    const P = PORTRAIT;
    const distBottom = P.dist.y + P.dist.height;
    const { stack, bottom: consumersBottom } = stackConsumers(options, P.consumerX, distBottom + 30);
    const distRight = P.dist.x + P.dist.width;
    const consumers: ConsumerLayout[] = stack.map(({ connectY, ...c }, i) => {
        const outletX = distRight - 14 - i * P.outletStep;
        return { ...c, pipe: `M${outletX} ${distBottom} V${connectY} H${P.consumerX}` };
    });
    const boilerBottom = P.boiler.y + P.boiler.height;
    const outside: Box | null = options.outside ? { ...P.outside } : null;
    return {
        width: P.width,
        height: Math.max(consumersBottom, distBottom, boilerBottom, outside ? P.outside.y + P.outside.height : 0) + PAD,
        boiler: { ...P.boiler },
        distributor: { ...P.dist },
        flowPipe: `M${P.flowX} ${boilerBottom} V${P.dist.y}`,
        returnPipe: `M${P.returnX} ${boilerBottom} V${P.dist.y}`,
        // zwischen Heizgerät und Verteiler ist nur Platz für eine Zeile
        returnLabel: { x: P.returnX + 10, y: boilerBottom + 21, anchor: 'start', inline: true },
        distributorLabel: { x: distRight + 8, y: P.dist.y + 12, anchor: 'start' },
        consumers,
        outside,
    };
}

/**
 * @param options dargestellte Anlagenteile
 * @returns Geometrie in viewBox-Einheiten
 */
export function schemaLayout(options: SchemaOptions): SchemaLayout {
    if (options.orientation === 'portrait') {
        return portraitLayout(options);
    }

    const { stack, bottom: consumersBottom } = stackConsumers(options, CONSUMER_X, PAD);

    // Verteiler mittig zu den Verbrauchern, mindestens so hoch wie für Vor- und Rücklauf nötig
    const outlets = stack.length;
    const distHeight = 50 + Math.max(0, outlets - 1) * OUTLET_STEP;
    const center = stack.length ? (PAD + consumersBottom) / 2 : PAD + BOILER.height / 2;
    const distTop = Math.round(Math.max(PAD + 14, center - distHeight / 2));
    const distributor: Box = { x: DIST.x, y: distTop, width: DIST.width, height: distHeight };
    const flowY = distTop + 10;
    const returnY = distTop + distHeight - 8;

    // Heizgerät mittig zu Vor- und Rücklauf
    const boilerY = Math.round(Math.max(PAD, (flowY + returnY) / 2 - BOILER.height / 2));
    const boiler: Box = { x: BOILER.x, y: boilerY, width: BOILER.width, height: BOILER.height };
    const boilerRight = BOILER.x + BOILER.width;
    const distRight = DIST.x + DIST.width;

    // Abgänge gestaffelt, damit sich die senkrechten Rohrstücke nicht überdecken
    const consumers: ConsumerLayout[] = stack.map(({ connectY, ...c }, i) => {
        const outletY = distTop + 25 + i * OUTLET_STEP;
        const elbowX = 336 + i * 14;
        return { ...c, pipe: `M${distRight} ${outletY} H${elbowX} V${connectY} H${CONSUMER_X}` };
    });

    const outside: Box | null = options.outside
        ? { x: OUTSIDE.x, y: PAD, width: OUTSIDE.width, height: OUTSIDE.height }
        : null;
    // unter dem Rücklauf stehen Bezeichnung und Wert in zwei Zeilen
    const bottom = Math.max(
        consumersBottom,
        boilerY + BOILER.height,
        distTop + distHeight,
        returnY + RETURN_LABEL,
        outside ? PAD + OUTSIDE.height : 0,
    );

    return {
        width: outside ? OUTSIDE.x + OUTSIDE.width + 20 : CONSUMER_X + CIRCUIT.width + 20,
        height: bottom + PAD,
        boiler,
        distributor,
        flowPipe: `M${boilerRight} ${flowY} H${DIST.x}`,
        returnPipe: `M${boilerRight} ${returnY} H${DIST.x}`,
        returnLabel: { x: (boilerRight + DIST.x) / 2, y: returnY + 22, anchor: 'middle', inline: false },
        distributorLabel: { x: DIST.x + DIST.width / 2, y: distTop - 8, anchor: 'middle' },
        consumers,
        outside,
    };
}
