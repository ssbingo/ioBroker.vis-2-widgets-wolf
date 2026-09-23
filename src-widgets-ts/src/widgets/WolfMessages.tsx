import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo } from '@iobroker/types-vis-2';

import MessagesView from '../components/MessagesView';
import { toBoolean, toNumber } from '../lib/fmt';
import { isOk, parseMessages, SEVERITIES, sortRows, toSeverity, type MessageRow } from '../lib/messages';
import { objectName } from '../lib/objectMeta';
import { THEME_OPTIONS } from '../lib/theme';
import { mapValue, parseValueMap, type ValueMap } from '../lib/valueMap';
import { sourceField } from './sourceField';
import WolfWidgetBase, { attrNumber, type WolfBaseRxData } from './WolfWidgetBase';

interface WolfMessagesRxData extends WolfBaseRxData {
    checks?: number | string;
    oid_stoerung?: string;
    oid_stoercode?: string;
    code_map?: string;
    oid_meldungen?: string;
    max_rows?: number | string;
    show_ok?: boolean | string;
    /** Prüfungen 1…n aus der wiederholbaren Attributgruppe „check" */
    [key: `oid_check${number}`]: string | undefined;
    [key: `check_label${number}`]: string | undefined;
    [key: `ok_value${number}`]: string | undefined;
    [key: `severity${number}`]: string | undefined;
    [key: `fault_text${number}`]: string | undefined;
}

/** höchstens so viele Prüfungen */
const MAX_CHECKS = 8;

/**
 * Klartext aus common.states, nur wenn es für den Wert einen gibt.
 *
 * @param value Rohwert
 * @param states Klartexte des Objekts
 * @returns Klartext oder undefined
 */
function stateText(value: unknown, states: ValueMap | undefined): string | undefined {
    let key: string;
    if (typeof value === 'string') {
        key = value.trim();
    } else if (typeof value === 'number' || typeof value === 'boolean') {
        key = String(value);
    } else {
        return undefined;
    }
    return states && key in states ? states[key] : undefined;
}

/**
 * Meldungen: Zustandsprüfungen (bei Wolf über ISM7 z. B. TW-Vorlauf, TW-Abgas und die
 * Verbindung), Sammelstörung, Störcode mit Klartext und eine optionale Meldungsliste (JSON).
 * Die LED leuchtet rot, sobald eine Zeile den Schweregrad „Störung" hat.
 */
export default class WolfMessages extends WolfWidgetBase<WolfMessagesRxData> {
    /** Beschreibung des Widgets für die VIS-2-Palette und den Attribut-Editor */
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplWolfMessages',
            visSet: 'vis-2-widgets-wolf',
            visSetLabel: 'set_label',
            visSetColor: '#c2561f',
            visSetIcon: 'widgets/vis-2-widgets-wolf/img/vis-2-widgets-wolf.png',
            visName: 'WolfMessages',
            visWidgetLabel: 'messages',
            // Jede Gruppe hat Felder mit Vorgabe (notfalls ''), sonst legt VIS-2 sie beim Platzieren
            // eines neuen Widgets abgewählt an und die Felder bleiben verborgen.
            visAttrs: [
                {
                    name: 'common',
                    label: 'group_objects',
                    fields: [
                        sourceField('tplWolfMessages'),
                        {
                            name: 'checks',
                            type: 'number',
                            label: 'checks_count',
                            default: 3,
                            min: 0,
                            max: MAX_CHECKS,
                        },
                    ],
                },
                {
                    // wiederholbar: VIS-2 legt die Felder als oid_check1 … oid_checkN an
                    name: 'check',
                    label: 'group_check',
                    indexFrom: 1,
                    indexTo: 'checks',
                    fields: [
                        { name: 'oid_check', type: 'id', label: 'oid_check', default: '' },
                        { name: 'check_label', type: 'text', label: 'check_label', default: '' },
                        {
                            name: 'ok_value',
                            type: 'text',
                            label: 'ok_value',
                            tooltip: 'ok_value_tooltip',
                            default: '',
                        },
                        {
                            name: 'severity',
                            type: 'select',
                            label: 'severity',
                            default: 'err',
                            options: SEVERITIES.map(v => ({ value: v, label: `severity_${v}` })),
                        },
                        { name: 'fault_text', type: 'text', label: 'fault_text', default: '' },
                    ],
                },
                {
                    name: 'faults',
                    label: 'group_faults',
                    fields: [
                        { name: 'oid_stoerung', type: 'id', label: 'oid_stoerung', default: '' },
                        { name: 'oid_stoercode', type: 'id', label: 'oid_stoercode', default: '' },
                        { name: 'code_map', type: 'text', label: 'code_map', default: '' },
                        {
                            name: 'oid_meldungen',
                            type: 'id',
                            label: 'oid_meldungen',
                            tooltip: 'oid_meldungen_tooltip',
                            default: '',
                        },
                    ],
                },
                {
                    name: 'display',
                    label: 'group_display',
                    fields: [
                        {
                            name: 'theme',
                            type: 'select',
                            label: 'theme',
                            default: 'auto',
                            options: THEME_OPTIONS.map(v => ({ value: v, label: `theme_${v}` })),
                        },
                        { name: 'title', type: 'text', label: 'title', default: '' },
                        { name: 'subtitle', type: 'text', label: 'subtitle', default: '' },
                        { name: 'max_rows', type: 'number', label: 'max_rows', default: 5, min: 1, max: 20 },
                        { name: 'show_ok', type: 'checkbox', label: 'show_ok', default: true },
                    ],
                },
            ],
            visDefaultStyle: { width: 360, height: 400 },
            visPrev: 'widgets/vis-2-widgets-wolf/img/prev_messages.png',
        };
    }

    /** @returns Anzahl der konfigurierten Prüfungen */
    private checkCount(): number {
        return Math.max(0, Math.min(MAX_CHECKS, Math.round(attrNumber(this.state.rxData.checks, 3))));
    }

    /** @returns Objekte der Prüfungen und des Störcodes — für Namen und Klartexte */
    protected metaIds(): Array<string | undefined> {
        const rx = this.state.rxData;
        const ids: Array<string | undefined> = [rx.oid_stoercode];
        for (let i = 1; i <= this.checkCount(); i++) {
            ids.push(rx[`oid_check${i}`]);
        }
        return ids;
    }

    /**
     * @param oid Objekt-ID
     * @returns letzte Änderung des Zustands (lc), sonst letzte Aktualisierung (ts)
     */
    private changedAt(oid: string): number | null {
        return toNumber(this.state.values[`${oid}.lc`]) ?? toNumber(this.state.values[`${oid}.ts`]);
    }

    /** @returns alle Zeilen: Prüfungen, Sammelstörung, Störcode, Meldungsliste */
    private rows(): MessageRow[] {
        const rx = this.state.rxData;
        const lang = this.locale();
        const rows: MessageRow[] = [];

        for (let i = 1; i <= this.checkCount(); i++) {
            const oid = rx[`oid_check${i}`];
            if (!oid) {
                continue;
            }
            const meta = this.meta(oid);
            const value = this.objectValue(oid);
            const label = rx[`check_label${i}`] || objectName(meta, lang) || oid.split('.').pop() || oid;
            const ok = isOk(value, rx[`ok_value${i}`]);
            let severity: MessageRow['severity'];
            let status: string;
            if (ok === null) {
                severity = 'warn';
                status = this.tr('msg_unknown');
            } else if (ok) {
                severity = 'ok';
                status = stateText(value, meta?.states) || this.tr('msg_ok');
            } else {
                severity = toSeverity(rx[`severity${i}`], 'err');
                status = rx[`fault_text${i}`] || stateText(value, meta?.states) || this.tr('msg_fault');
            }
            rows.push({
                key: `check${i}`,
                severity,
                text: `${label}: ${status}`,
                ts: this.changedAt(oid),
                since: true,
            });
        }

        if (rx.oid_stoerung && toBoolean(this.objectValue(rx.oid_stoerung)) === true) {
            rows.push({
                key: 'collective',
                severity: 'err',
                text: this.tr('msg_collective'),
                ts: this.changedAt(rx.oid_stoerung),
                since: true,
            });
        }

        const code = rx.oid_stoercode ? toNumber(this.objectValue(rx.oid_stoercode)) : null;
        if (rx.oid_stoercode && code !== null && code !== 0) {
            const text = mapValue(code, parseValueMap(rx.code_map), this.meta(rx.oid_stoercode)?.states ?? {});
            rows.push({
                key: 'code',
                severity: 'err',
                text:
                    text === String(code)
                        ? `${this.tr('msg_code')} ${code}`
                        : `${this.tr('msg_code')} ${code} — ${text}`,
                ts: this.changedAt(rx.oid_stoercode),
                since: true,
            });
        }

        if (rx.oid_meldungen) {
            rows.push(...parseMessages(this.objectValue(rx.oid_meldungen)));
        }
        return rows;
    }

    /**
     * Darstellung mit den aktuellen Werten
     *
     * @param props von VIS-2 übergebene Render-Eigenschaften
     * @returns die Kachel
     */
    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const rx = this.state.rxData;
        const all = this.rows();
        const showOk = toBoolean(rx.show_ok) !== false;
        const shown = sortRows(showOk ? all : all.filter(r => r.severity !== 'ok')).slice(
            0,
            Math.max(1, Math.round(attrNumber(rx.max_rows, 5))),
        );

        return (
            <MessagesView
                themeType={this.themeType()}
                title={rx.title || this.tr('messages')}
                subtitle={rx.subtitle}
                fault={all.some(r => r.severity === 'err')}
                rows={shown}
                labels={{
                    faultOn: this.tr('fault_on'),
                    faultOff: this.tr('fault_off'),
                    none: this.tr('msg_none'),
                    since: this.tr('since'),
                }}
                locale={this.locale()}
            />
        );
    }
}
