/*
 * React liefert VIS-2 zur Laufzeit; es wird nie mitgebündelt und steht deshalb nur in
 * src-widgets-ts/package.json, nicht in den Abhängigkeiten des Adapters:
 */
// @repochecker: optional dependency 'react'
import { useEffect, useState } from 'react';

/**
 * Größe eines Elements, laufend über ResizeObserver.
 *
 * @param el Element oder null
 * @returns Breite und Höhe in Pixeln
 */
export function useSize(el: HTMLElement | null): { width: number; height: number } {
    const [size, setSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        if (!el) {
            return undefined;
        }
        const observer = new ResizeObserver(entries => {
            const r = entries[0]?.contentRect;
            if (r) {
                setSize({ width: Math.floor(r.width), height: Math.floor(r.height) });
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [el]);
    return size;
}
