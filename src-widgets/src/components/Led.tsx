import React from 'react';

/** Eigenschaften der Status-LED */
export interface LedProps {
    /** true = aktiv (rot, pulsierend), false = Ruhe (grün) */
    on: boolean;
    /** Beschriftung im aktiven Zustand */
    labelOn?: string;
    /** Beschriftung im Ruhezustand */
    labelOff?: string;
}

/**
 * Glasige Status-LED mit Einfassung. Die Farben bilden ein reales Bauteil nach und sind
 * deshalb im hellen wie im dunklen Theme gleich.
 *
 * @param props Zustand und Beschriftungen
 * @returns die LED
 */
export default function Led(props: LedProps): React.JSX.Element {
    const state = props.on ? 'wolf-on' : 'wolf-off';
    const text = props.on ? props.labelOn : props.labelOff;
    return (
        <div
            className="wolf-led-box"
            role="status"
            aria-label={text}
        >
            <div className="wolf-bezel">
                <div className={`wolf-led ${state}`} />
            </div>
            {text ? <div className={`wolf-led-txt ${state}`}>{text}</div> : null}
        </div>
    );
}
