import React from 'react';

import { fmtDateTime, type MessageRow } from '../lib/messages';
import type { ThemeType } from '../lib/theme';
import Led from './Led';

/** Anzeigewerte und Beschriftungen der Meldungen */
export interface MessagesViewProps {
    /** Hell oder dunkel */
    themeType: ThemeType;
    /** Überschrift */
    title: string;
    /** Unterzeile */
    subtitle?: string;
    /** mindestens eine Störung (Schweregrad err) — LED rot */
    fault: boolean;
    /** Zeilen, bereits sortiert und gekürzt */
    rows: MessageRow[];
    /** übersetzte Texte */
    labels: {
        faultOn: string;
        faultOff: string;
        none: string;
        since: string;
    };
    /** Sprachregion */
    locale?: string;
}

/**
 * Meldungen — Störungs-LED und Liste mit Schweregrad und Zeitpunkt. Darstellung ohne Zugriff
 * auf ioBroker.
 *
 * @param props Zeilen und Texte
 * @returns die Kachel
 */
export default function MessagesView(props: MessagesViewProps): React.JSX.Element {
    const { labels, locale } = props;
    return (
        <div
            className="wolf-w wolf-messages"
            data-wolf-theme={props.themeType}
        >
            <div className="wolf-head">
                <div>
                    <h3>{props.title}</h3>
                    {props.subtitle ? <div className="wolf-hint">{props.subtitle}</div> : null}
                </div>
                <Led
                    on={props.fault}
                    labelOn={labels.faultOn}
                    labelOff={labels.faultOff}
                />
            </div>

            {props.rows.length ? (
                <ul className="wolf-msgs">
                    {props.rows.map(row => (
                        <li key={row.key}>
                            <span className={`wolf-dot wolf-${row.severity}`} />
                            <div>
                                <div className="wolf-msg-t">{row.text}</div>
                                {row.ts !== null ? (
                                    <div className="wolf-msg-m">
                                        {row.since ? `${labels.since} ` : ''}
                                        {fmtDateTime(row.ts, locale)}
                                    </div>
                                ) : null}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="wolf-msg-none">{labels.none}</div>
            )}
        </div>
    );
}
