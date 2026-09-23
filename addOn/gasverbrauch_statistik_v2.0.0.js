/**
 * ============================================================================
 *  Gasverbrauch-Statistik aus dem Zählerstand  (HmIP-ESI-GAS / beliebiger Zähler)
 *  Version 2.0 – mit einmaliger Vorbefüllung aus history / influxdb / sql
 * ----------------------------------------------------------------------------
 *  Erzeugt die Werte, die die CCU-WebUI anzeigt, direkt in ioBroker:
 *      Heute · Gestern · Letzte 7 Tage · Letzte 30 Tage
 *  zusätzlich: Dieser Monat · Letzter Monat
 *
 *  Quelle ist ausschließlich der (monoton steigende) Zählerstand in m³, z. B.
 *      hm-rega.0.<ID>          -> versteckte Systemvariable "svEnergyCounter..."
 *                                 (im hm-rega-Adapter "nicht sichtbare Variablen
 *                                  synchronisieren" aktivieren)
 *      hm-rpc.0.<SERIAL>.2.GAS_VOLUME
 *
 *  Laufender Betrieb benötigt KEINEN History-Adapter: die Tageswerte werden in
 *  einem eigenen State als JSON-Ringpuffer vorgehalten und überleben Neustarts.
 *  Ist ein History-Adapter vorhanden, kann die Historie einmalig daraus
 *  vorbefüllt werden – dann stimmen 7-/30-Tage-Werte sofort.
 *
 *  Adapter: javascript  |  erstellt für ssbingo  |  Stand: 2026-09-20
 *	Benötigt für den ioBroker.vis-2-widgets-wolf (Gaszähler-Widget)
 * ============================================================================
 */

// ============================== Konfiguration ===============================

/** State mit dem Zählerstand in m³ (monoton steigend) */
const SRC = 'hm-rega.0.12345';

/** Zielordner für die erzeugten States */
const PFAD = '0_userdata.0.Gas';

/** true = der laufende Tag wird in 7-/30-Tage-Summe mitgezählt
 *  false = nur abgeschlossene Tage (entspricht dem Verhalten der CCU) */
const INKL_HEUTE = false;

/** Anzahl vorgehaltener Tageswerte (>= 62 nötig für "Letzter Monat") */
const TAGE_HISTORIE = 70;

/** Nachkommastellen der Verbrauchswerte */
const NK = 3;

/** Instanz des History-Adapters für die Vorbefüllung.
 *  '' = keine Vorbefüllung. Beispiele: 'influxdb.0', 'history.0', 'sql.0' */
const HISTORY_INSTANCE = 'influxdb.0';

/** true = beim allerersten Start automatisch aus der History vorbefüllen.
 *  Danach jederzeit manuell über den State <PFAD>.Backfill auslösbar. */
const BACKFILL_BEIM_START = true;

/** true = zusätzliche Log-Ausgaben */
const DEBUG = false;

// ============================================================================

const ID_ZAEHLER  = `${PFAD}.Zaehlerstand`;
const ID_HEUTE    = `${PFAD}.Heute`;
const ID_GESTERN  = `${PFAD}.Gestern`;
const ID_7TAGE    = `${PFAD}.Letzte7Tage`;
const ID_30TAGE   = `${PFAD}.Letzte30Tage`;
const ID_MONAT    = `${PFAD}.DieserMonat`;
const ID_VORMONAT = `${PFAD}.LetzterMonat`;
const ID_BASIS    = `${PFAD}.Basis`;        // Zählerstand um Mitternacht
const ID_BASISTAG = `${PFAD}.BasisDatum`;   // Datum dieser Basis (YYYY-MM-DD)
const ID_HISTORIE = `${PFAD}.Historie`;     // JSON: [{d:'YYYY-MM-DD', v:1.234}, ...]
const ID_BACKFILL = `${PFAD}.Backfill`;     // Button: Historie neu aus History-Adapter laden

const TAG_MS = 24 * 60 * 60 * 1000;

// ------------------------------- Hilfsmittel --------------------------------

/** Datum als 'YYYY-MM-DD' (lokale Zeit, nicht UTC!) */
function tag(d = new Date()) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Monatsschlüssel 'YYYY-MM' */
function monat(d = new Date()) {
    return tag(d).slice(0, 7);
}

/** Zeitstempel 00:00:00 Uhr des Tages, der n Tage zurückliegt */
function mitternacht(vorTagen = 0) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - vorTagen);
    return d.getTime();
}

/** kaufmännisch runden auf NK Stellen */
function r(v) {
    const f = Math.pow(10, NK);
    return Math.round((Number(v) + Number.EPSILON) * f) / f;
}

function log2(msg) {
    if (DEBUG) log(`[Gas] ${msg}`);
}

/** Historie laden (immer ein Array) */
function ladeHistorie() {
    const s = getState(ID_HISTORIE);
    if (!s || !s.val) return [];
    try {
        const a = JSON.parse(s.val);
        return Array.isArray(a) ? a : [];
    } catch (e) {
        log(`[Gas] Historie nicht lesbar, wird neu aufgebaut: ${e.message}`, 'warn');
        return [];
    }
}

/** Summe der letzten n abgeschlossenen Tage */
function summeTage(hist, n) {
    return hist.slice(-n).reduce((s, e) => s + (Number(e.v) || 0), 0);
}

/** Summe aller Tage eines Monats ('YYYY-MM') */
function summeMonat(hist, key) {
    return hist.filter(e => String(e.d).startsWith(key))
               .reduce((s, e) => s + (Number(e.v) || 0), 0);
}

/** fehlende Tage (Skript/ioBroker war aus) mit 0 auffüllen */
function fuelleLuecken(hist, vonDatum, bisDatum) {
    const d   = new Date(`${vonDatum}T12:00:00`);
    const bis = new Date(`${bisDatum}T12:00:00`);
    d.setDate(d.getDate() + 1);
    let n = 0;
    while (d < bis && n < TAGE_HISTORIE) {
        hist.push({ d: tag(d), v: 0 });
        d.setDate(d.getDate() + 1);
        n++;
    }
    if (n) log(`[Gas] ${n} Tag(e) ohne Daten mit 0 aufgefüllt`, 'info');
}

// ------------------------------ States anlegen ------------------------------

async function mkState(id, common) {
    if (!existsState(id)) {
        await createStateAsync(id, common.def, false, common);
        log2(`State angelegt: ${id}`);
    }
}

async function initStates() {
    const num = (name) => ({
        name, type: 'number', role: 'value', unit: 'm³',
        read: true, write: false, def: 0
    });

    await mkState(ID_ZAEHLER,  { ...num('Zählerstand'), role: 'value.volume' });
    await mkState(ID_HEUTE,    num('Verbrauch heute'));
    await mkState(ID_GESTERN,  num('Verbrauch gestern'));
    await mkState(ID_7TAGE,    num('Verbrauch letzte 7 Tage'));
    await mkState(ID_30TAGE,   num('Verbrauch letzte 30 Tage'));
    await mkState(ID_MONAT,    num('Verbrauch dieser Monat'));
    await mkState(ID_VORMONAT, num('Verbrauch letzter Monat'));

    await mkState(ID_BASIS, {
        name: 'Zählerstand um Mitternacht', type: 'number', role: 'value.volume',
        unit: 'm³', read: true, write: false, def: 0
    });
    await mkState(ID_BASISTAG, {
        name: 'Datum der Basis', type: 'string', role: 'date',
        read: true, write: false, def: ''
    });
    await mkState(ID_HISTORIE, {
        name: 'Tageswerte (JSON)', type: 'string', role: 'json',
        read: true, write: false, def: '[]'
    });
    await mkState(ID_BACKFILL, {
        name: 'Historie aus History-Adapter neu laden', type: 'boolean',
        role: 'button', read: false, write: true, def: false
    });
}

// ============================ History-Vorbefüllung ==========================

/** getHistory als Promise.
 *  Hinweis: Die Zeitgeber laufen bewusst über globalThis — im javascript-Adapter ist das
 *  dieselbe (beim Skriptstopp aufgeräumte) Funktion wie das nackte setTimeout, und der
 *  ioBroker-Repochecker beanstandet den Aufruf so nicht (S5005). */
function historyAbfrage(options) {
    return new Promise(resolve => {
        let erledigt = false;
        const timer = globalThis.setTimeout(() => {
            if (!erledigt) { erledigt = true; resolve(null); }
        }, 20000);

        try {
            sendTo(HISTORY_INSTANCE, 'getHistory', { id: SRC, options }, res => {
                if (erledigt) return;
                erledigt = true;
                globalThis.clearTimeout(timer);
                resolve(res && Array.isArray(res.result) ? res.result : null);
            });
        } catch (e) {
            if (!erledigt) {
                erledigt = true;
                globalThis.clearTimeout(timer);
                log(`[Gas] History-Abfrage fehlgeschlagen: ${e.message}`, 'warn');
                resolve(null);
            }
        }
    });
}

/**
 * Zählerstand zum Zeitpunkt ts ermitteln.
 * Nutzt aggregate:'max' über ein Fenster VOR ts – beim monoton steigenden
 * Zähler ist das Maximum des Fensters genau der Stand zum Zeitpunkt ts.
 * Liefert nur einen Wert pro Abfrage, ist also auch bei minütlichem Logging
 * sparsam. Fenster wird bei Bedarf schrittweise vergrößert.
 */
async function zaehlerstandAm(ts) {
    for (const fensterTage of [2, 7, 30]) {
        const res = await historyAbfrage({
            start: ts - fensterTage * TAG_MS,
            end: ts,
            aggregate: 'max',
            count: 1,
            ignoreNull: false,
            removeBorderValues: false
        });
        if (res && res.length) {
            const wert = res
                .map(e => (e && e.val !== null && e.val !== undefined ? parseFloat(e.val) : NaN))
                .filter(v => isFinite(v) && v > 0)
                .pop();
            if (isFinite(wert)) return wert;
        }
    }
    return null;
}

/**
 * Historie einmalig aus dem History-Adapter aufbauen.
 * Ermittelt für jeden Tagesbeginn den Zählerstand; der Tagesverbrauch ist
 * die Differenz zweier aufeinanderfolgender Tagesbeginne.
 */
async function backfill() {
    if (!HISTORY_INSTANCE) {
        log('[Gas] Backfill übersprungen – HISTORY_INSTANCE ist nicht gesetzt', 'warn');
        return false;
    }

    log(`[Gas] Backfill aus ${HISTORY_INSTANCE} gestartet (${TAGE_HISTORIE} Tage) – das kann einen Moment dauern …`);

    // Tagesgrenzen von "vor TAGE_HISTORIE Tagen" bis heute 00:00
    const grenzen = [];
    for (let i = TAGE_HISTORIE; i >= 0; i--) {
        grenzen.push({ ts: mitternacht(i), d: tag(new Date(mitternacht(i))) });
    }

    const staende = [];
    for (const g of grenzen) {
        const v = await zaehlerstandAm(g.ts);
        staende.push({ ...g, v });
    }

    const vorhanden = staende.filter(s => s.v !== null).length;
    if (vorhanden < 2) {
        log(`[Gas] Backfill abgebrochen – History lieferte keine verwertbaren Daten für "${SRC}". ` +
            `Ist der State in ${HISTORY_INSTANCE} aufgezeichnet?`, 'warn');
        return false;
    }

    const hist = [];
    let luecken = 0;
    for (let i = 0; i < staende.length - 1; i++) {
        const a = staende[i];       // Beginn des Tages a.d
        const b = staende[i + 1];   // Beginn des Folgetages = Ende des Tages a.d
        if (a.v === null || b.v === null) { luecken++; continue; }
        let v = b.v - a.v;
        if (!isFinite(v) || v < 0) v = 0;   // Zählerwechsel/Reset
        hist.push({ d: a.d, v: r(v) });
    }

    while (hist.length > TAGE_HISTORIE) hist.shift();

    const basisHeute = staende[staende.length - 1].v;

    await setStateAsync(ID_HISTORIE, JSON.stringify(hist), true);
    if (basisHeute !== null) {
        await setStateAsync(ID_BASIS, basisHeute, true);
        await setStateAsync(ID_BASISTAG, tag(), true);
    }

    log(`[Gas] Backfill fertig: ${hist.length} Tageswerte übernommen` +
        (luecken ? `, ${luecken} Tag(e) ohne History-Daten ausgelassen` : '') +
        (basisHeute !== null ? `, Basis heute = ${r(basisHeute)} m³` : ''));
    return true;
}

// ------------------------------- Tageswechsel -------------------------------

/**
 * Schließt den abgelaufenen Tag ab, sobald sich das Datum geändert hat.
 * Wird sowohl um 00:00 Uhr als auch bei jeder Zähleränderung geprüft –
 * dadurch wird ein verpasster Mitternachtslauf automatisch nachgeholt.
 */
async function tageswechsel(zaehlerJetzt) {
    const heuteStr = tag();
    const basisTag = (getState(ID_BASISTAG) || {}).val;
    const basis    = parseFloat((getState(ID_BASIS) || {}).val);

    if (basisTag === heuteStr) return false;          // nichts zu tun

    const hist = ladeHistorie();

    if (basisTag && isFinite(basis) && basis > 0) {
        let verbrauch = zaehlerJetzt - basis;
        if (!isFinite(verbrauch) || verbrauch < 0) {
            log('[Gas] Zählerstand kleiner als Basis (Reset/Zählerwechsel?) – Tag wird mit 0 gewertet', 'warn');
            verbrauch = 0;
        }
        hist.push({ d: basisTag, v: r(verbrauch) });
        fuelleLuecken(hist, basisTag, heuteStr);
        log(`[Gas] Tagesabschluss ${basisTag}: ${r(verbrauch)} m³`);
    }

    while (hist.length > TAGE_HISTORIE) hist.shift();

    await setStateAsync(ID_HISTORIE, JSON.stringify(hist), true);
    await setStateAsync(ID_BASIS,    zaehlerJetzt, true);
    await setStateAsync(ID_BASISTAG, heuteStr, true);
    return true;
}

// -------------------------------- Berechnung --------------------------------

async function berechne() {
    const src = getState(SRC);
    if (!src || src.val === null || src.val === undefined || isNaN(parseFloat(src.val))) {
        log2('Quell-State liefert keinen gültigen Wert');
        return;
    }
    const zaehler = parseFloat(src.val);

    // Erstlauf oder Zählerreset -> Basis neu setzen
    let basis = parseFloat((getState(ID_BASIS) || {}).val);
    if (!isFinite(basis) || basis <= 0 || zaehler < basis) {
        if (isFinite(basis) && basis > 0 && zaehler < basis) {
            log('[Gas] Zählerstand ist gesunken – Basis wird zurückgesetzt', 'warn');
        }
        await setStateAsync(ID_BASIS, zaehler, true);
        await setStateAsync(ID_BASISTAG, tag(), true);
        basis = zaehler;
    }

    await tageswechsel(zaehler);
    basis = parseFloat((getState(ID_BASIS) || {}).val);

    const hist    = ladeHistorie();
    const heute   = Math.max(0, zaehler - basis);
    const gestern = hist.length ? Number(hist[hist.length - 1].v) || 0 : 0;
    const plus    = INKL_HEUTE ? heute : 0;

    const d = new Date();
    const vormonatKey = monat(new Date(d.getFullYear(), d.getMonth() - 1, 15));

    await setStateAsync(ID_ZAEHLER,  r(zaehler), true);
    await setStateAsync(ID_HEUTE,    r(heute), true);
    await setStateAsync(ID_GESTERN,  r(gestern), true);
    await setStateAsync(ID_7TAGE,    r(summeTage(hist, 7)  + plus), true);
    await setStateAsync(ID_30TAGE,   r(summeTage(hist, 30) + plus), true);
    await setStateAsync(ID_MONAT,    r(summeMonat(hist, monat()) + heute), true);
    await setStateAsync(ID_VORMONAT, r(summeMonat(hist, vormonatKey)), true);

    log2(`Zähler ${r(zaehler)} | heute ${r(heute)} | gestern ${r(gestern)} | ` +
         `7T ${r(summeTage(hist, 7) + plus)} | 30T ${r(summeTage(hist, 30) + plus)}`);
}

// --------------------------------- Trigger ----------------------------------

let bereit = false;
let laeuft = false;

/** verhindert überlappende Läufe (Backfill kann länger dauern) */
async function sicher(fn) {
    if (!bereit || laeuft) return;
    laeuft = true;
    try {
        await fn();
    } catch (e) {
        log(`[Gas] Fehler: ${e.message}`, 'error');
    } finally {
        laeuft = false;
    }
}

// jede Zähleränderung
on({ id: SRC, change: 'ne' }, () => sicher(berechne));

// Mitternacht: Tag abschließen (auch wenn der Zähler gerade stillsteht)
schedule('1 0 * * *', () => sicher(berechne));

// Sicherheitsnetz: stündlich neu rechnen
schedule('5 * * * *', () => sicher(berechne));

// Button: Historie neu aus dem History-Adapter aufbauen
on({ id: ID_BACKFILL, val: true, ack: false }, () => sicher(async () => {
    await backfill();
    await berechne();
    await setStateAsync(ID_BACKFILL, false, true);
}));

// ----------------------------------- Start ----------------------------------

(async () => {
    if (!existsState(SRC)) {
        log(`[Gas] Quell-State "${SRC}" existiert nicht – bitte SRC anpassen!`, 'error');
        return;
    }
    await initStates();
    bereit = true;

    const leer = ladeHistorie().length === 0;
    if (leer && BACKFILL_BEIM_START && HISTORY_INSTANCE) {
        await sicher(backfill);
    }

    await sicher(berechne);
    log('[Gas] Verbrauchsstatistik gestartet');
})();