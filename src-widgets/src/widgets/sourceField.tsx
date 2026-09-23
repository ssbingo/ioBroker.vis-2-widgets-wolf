/*
 * Attributfeld „Anlage" — wählt eine Instanz von wolf-smartset (ISM7) oder wolf (ISM8i) und trägt
 * deren Objekte in die Felder des Widgets ein. Wer keine Instanz wählt, verknüpft wie bisher von
 * Hand; gewählte Objekte lassen sich danach einzeln ändern.
 */
import type { RxWidgetInfoAttributesFieldInstance, WidgetData } from '@iobroker/types-vis-2';

import { sourceAssignment, valveDhwValue, WIDGET_SOURCES, wolfAdapterOf, type SourceObjects } from '../lib/wolfSource';

/** Nur der Teil der Verbindung, den das Vorbelegen braucht */
interface ObjectFinder {
    getObjectViewSystem?: (
        type: 'state',
        start: string,
        end: string,
    ) => Promise<Record<string, ioBroker.StateObject> | undefined>;
    getObject: (id: string) => Promise<ioBroker.Object | null | undefined>;
}

/** höchstes Zeichen — begrenzt die Objektabfrage auf die gewählte Instanz */
const LAST_CHAR = '香';

/**
 * Alle States der Instanz holen: nach Parameternummer für wolf-smartset, als Liste der IDs für
 * den ISM8i-Adapter.
 *
 * @param socket Verbindung zum ioBroker
 * @param instance Instanz wie „wolf-smartset.0"
 * @returns die gefundenen Objekte; leer, wenn die Abfrage scheitert
 */
async function readObjects(socket: ObjectFinder, instance: string): Promise<SourceObjects> {
    const objects: SourceObjects = { byParam: new Map(), ids: new Set() };
    if (!socket.getObjectViewSystem) {
        return objects;
    }
    const states = await socket
        .getObjectViewSystem('state', `${instance}.`, `${instance}.${LAST_CHAR}`)
        .catch(() => undefined);
    for (const [id, obj] of Object.entries(states ?? {})) {
        objects.ids.add(id);
        const param = (obj?.native as { ParameterId?: unknown } | undefined)?.ParameterId;
        if (typeof param === 'number' && !objects.byParam.has(param)) {
            objects.byParam.set(param, id);
        }
    }
    return objects;
}

/**
 * Feld „Anlage" für ein Widget.
 *
 * @param widget Widget-Kennung, z. B. tplWolfSchema
 * @returns das Attributfeld samt Vorbelegung beim Ändern
 */
export function sourceField(widget: string): RxWidgetInfoAttributesFieldInstance {
    return {
        name: 'source_instance',
        type: 'instance',
        label: 'source_instance',
        tooltip: 'source_instance_tooltip',
        // VIS-2 filtert mit einem Array von Adapternamen (Attributes/Widget/index.tsx);
        // die Typdeklaration von @iobroker/types-vis-2 nennt an dieser Stelle string
        adapters: ['wolf-smartset', 'wolf'] as unknown as string,
        default: '',
        onChange: async (_field, data, changeData, socket) => {
            const instance = String(data.source_instance ?? '').trim();
            const adapter = wolfAdapterOf(instance);
            if (!adapter) {
                return;
            }
            const finder = socket as unknown as ObjectFinder;
            const found = sourceAssignment(widget, instance, await readObjects(finder, instance));
            if (!found.length) {
                return;
            }
            const next: WidgetData = { ...data };
            for (const { attr, id } of found) {
                next[attr] = id;
            }
            // Zählfelder mitziehen, damit die belegten Gruppen auch sichtbar sind
            if (widget === 'tplWolfSchema' && found.some(f => f.attr === 'oid_hk_vorlauf1')) {
                next.hk_count = Math.max(1, Number(next.hk_count) || 0);
            }
            if (widget === 'tplWolfMessages') {
                const checks = found.filter(f => f.attr.startsWith('oid_check')).length;
                if (checks) {
                    next.checks = Math.max(checks, Number(next.checks) || 0);
                }
            }
            if (widget === 'tplWolfTrends') {
                const series = found.filter(f => f.attr.startsWith('oid_serie')).length;
                if (series) {
                    next.series_count = Math.max(series, Number(next.series_count) || 0);
                }
            }
            // Das Umschaltventil meldet je Adapter Zahl, Text oder Wahrheitswert
            const valve = found.find(f => f.attr === 'oid_3wuv');
            if (valve) {
                const obj = await finder.getObject(valve.id).catch(() => null);
                next.dhw_value = valveDhwValue(obj?.common?.type, adapter);
            }
            changeData(next);
        },
    };
}

/** Widgets, die eine Anlage vorbelegen können */
export const SOURCE_WIDGETS = Object.keys(WIDGET_SOURCES);
