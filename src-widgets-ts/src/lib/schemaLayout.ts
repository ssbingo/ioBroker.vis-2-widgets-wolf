/*
 * Geometrie des Anlagenschemas (viewBox-Einheiten), abgeleitet aus dem Entwurf
 * doc/design/wolf-heizung.html, waagerecht gestrafft, damit Schrift und Werte auch in einer
 * 640 px breiten Kachel lesbar bleiben: Heizgerät links, Verteiler in der Mitte, rechts die Verbraucher
 * untereinander (Speicher, Heizkreise), oben rechts die Außentemperatur. Die Höhe wächst mit der
 * Zahl der Verbraucher. Ohne React, damit testbar.
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
    /** Höhe des Vorlaufrohrs */
    flowY: number;
    /** Höhe des Rücklaufrohrs */
    returnY: number;
    /** Verbraucher von oben nach unten */
    consumers: ConsumerLayout[];
    /** Außentemperatur; null, wenn ausgeblendet */
    outside: Box | null;
}

/** Was dargestellt wird */
export interface SchemaOptions {
    /** Warmwasserspeicher */
    tank: boolean;
    /** Anzahl Heizkreise 0…4 */
    circuits: number;
    /** Außentemperatur */
    outside: boolean;
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

/**
 * @param options dargestellte Anlagenteile
 * @returns Geometrie in viewBox-Einheiten
 */
export function schemaLayout(options: SchemaOptions): SchemaLayout {
    const circuits = Math.max(0, Math.min(MAX_CIRCUITS, Math.round(options.circuits)));

    // Verbraucher untereinander, jeweils mit dem Punkt, an dem das Rohr ankommt
    const stack: Array<Omit<ConsumerLayout, 'pipe'> & { connectY: number }> = [];
    let y = PAD;
    if (options.tank) {
        stack.push({ kind: 'tank', index: 0, x: CONSUMER_X, y, ...TANK, connectY: y + TANK.height / 2 });
        y += TANK.height + GAP;
    }
    for (let i = 1; i <= circuits; i++) {
        stack.push({ kind: 'circuit', index: i, x: CONSUMER_X, y, ...CIRCUIT, connectY: y + CIRCUIT.height / 2 });
        y += CIRCUIT.height + GAP;
    }
    const consumersBottom = stack.length ? y - GAP : PAD;

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
        flowY,
        returnY,
        consumers,
        outside,
    };
}
