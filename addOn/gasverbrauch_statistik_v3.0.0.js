/**
 * ============================================================================
 *  Gasverbrauch-Statistik, Abgleich, Durchfluss und Abrechnung
 *  für den HmIP-ESI-GAS (oder jeden anderen Impulszähler)
 *  Version 3.0.0
 * ----------------------------------------------------------------------------
 *  Werte wie in der CCU-WebUI, direkt in ioBroker:
 *      Heute · Gestern · Letzte 7 Tage · Letzte 30 Tage
 *      Dieser Monat · Letzter Monat
 *
 *  darüber hinaus:
 *      Durchfluss  – aus der Zähleränderung, geht nach NULL_NACH_MIN Minuten
 *                    ohne Impuls zuverlässig auf 0 (der GAS_FLOW des Geräts
 *                    braucht dafür bis zu 2 Stunden)
 *      Abgleich    – abgelesene Zählerstände als Ankerpunkte; daraus ein
 *                    Korrekturfaktor gegen verlorene Impulse und ein
 *                    abrechnungsfähiger Zählerstand
 *      Kosten      – m³ -> kWh -> Euro, mit Grundpreis, MwSt und Abschlag
 *      Berichte    – Tagesübersicht per Telegram, Monatsabrechnung per
 *                    Telegram und E-Mail, wahlweise mit PDF im Anhang
 *
 *  Quelle ist ausschließlich der (monoton steigende) Zählerstand in m³:
 *      hm-rega.0.<ID>  -> versteckte Systemvariable "svEnergyCounter..."
 *                         (im hm-rega-Adapter "nicht sichtbare Variablen
 *                          synchronisieren" aktivieren)
 *  hm-rpc liefert für den ESI-GAS KEINEN Gesamtzählerstand.
 *
 *  Laufender Betrieb benötigt KEINEN History-Adapter: die Tageswerte werden in
 *  einem eigenen State als JSON-Ringpuffer vorgehalten und überleben Neustarts.
 *  Ist ein History-Adapter vorhanden, kann die Historie einmalig daraus
 *  vorbefüllt werden – dann stimmen 7-/30-Tage-Werte sofort.
 *
 *  Für das PDF wird das npm-Modul "pdfkit" benötigt. In den Einstellungen der
 *  javascript-Instanz unter "Zusätzliche NPM-Module" eintragen: pdfkit
 *  Fehlt es, laufen Telegram und E-Mail trotzdem – nur ohne Anhang.
 *
 *  Adapter: javascript  |  erstellt für ssbingo  |  Stand: 2026-09-23
 *	Benötigt für den ioBroker.vis-2-widgets-wolf (Gaszähler-Widget)
 * ============================================================================
 */

// ============================== Konfiguration ===============================

/** State mit dem Zählerstand in m³ – hm-rega-Systemvariable svEnergyCounter... */
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

// ---- Abgleich auf den echten Zähler ----------------------------------------

/** true = abgelesene Zählerstände als Ankerpunkte verwenden und den
 *  Zählerstand darauf korrigieren (gegen verlorene Impulse) */
const KORREKTUR_AKTIV = true;

/** true = Korrekturfaktor automatisch aus je zwei Ablesungen bilden
 *  false = fester Faktor FAKTOR_MANUELL */
const FAKTOR_AUTO = true;

/** fester Faktor, wenn FAKTOR_AUTO = false (1 = keine Skalierung) */
const FAKTOR_MANUELL = 1;

/** Plausibilitätsgrenzen für den Faktor. Außerhalb wird der alte Faktor
 *  behalten und eine Warnung protokolliert. */
const FAKTOR_MIN = 0.8;
const FAKTOR_MAX = 1.25;

/** Mindestverbrauch in m³ zwischen zwei Ablesungen für einen neuen Faktor */
const FAKTOR_MIN_VERBRAUCH = 2;

/** Schutz vor Tippfehlern: Weicht eine Ablesung um mehr als so viele m³ vom
 *  erwarteten Stand ab, wird sie abgelehnt. Gilt nicht für die erste Ablesung. */
const ABLESUNG_MAX_SPRUNG = 5;

// ---- Durchfluss -------------------------------------------------------------

/** true = Durchfluss aus der Zähleränderung berechnen */
const DURCHFLUSS_AKTIV = true;

/** Glättungsfenster in Minuten. Größer = ruhiger, reagiert aber träger */
const FENSTER_MIN = 10;

/** ohne Zähleränderung für so viele Minuten -> Durchfluss = 0.
 *  Muss größer sein als der Impulsabstand bei kleinster Last
 *  (0,01 m³/Imp bei 0,1 m³/h = 1 Impuls alle 6 min) */
const NULL_NACH_MIN = 10;

/** Abstand zweier Zähleränderungen, ab dem eine Pause angenommen wird */
const LUECKE_MIN = 7;

/** Angenommene Dauer der ersten Änderung nach einer Pause
 *  (CCU-Einstellung A = 0 -> ca. 3 min, Standard A = 1 -> ca. 6 min) */
const ANLAUF_MIN = 3;

/** Plausibilitätsgrenze in m³/h (G4-Zähler: Qmax 6 m³/h) */
const MAX_DURCHFLUSS = 10;

// ---- Tarif und Kosten -------------------------------------------------------
//  Alle Preise NETTO. MwSt wird in der Abrechnung getrennt ausgewiesen.
//
//  ACHTUNG: Zahlen immer mit Dezimal-PUNKT schreiben, nie mit Komma.
//           richtig: 0.9612   falsch: 0,9612  (führt zum Syntaxfehler)
//           Die Ausgabe in Telegram, E-Mail und PDF wird trotzdem deutsch
//           formatiert – das erledigt die Funktion nf().

/** Brennwert in kWh/m³ – steht auf der Gasrechnung (typisch 9,5 bis 11,5) */
const BRENNWERT = 11.2;

/** Zustandszahl – steht auf der Gasrechnung (typisch 0,90 bis 1,00) */
const ZUSTANDSZAHL = 0.9500;

/** Arbeitspreis in ct/kWh, netto */
const ARBEITSPREIS_CT_KWH = 8.90;

/** Grundpreis in Euro pro Monat, netto */
const GRUNDPREIS_EUR_MONAT = 12.50;

/** Mehrwertsteuersatz in Prozent */
const MWST_PROZENT = 19;

/** Monatlicher Abschlag in Euro, brutto. 0 = keine Abschlagsverrechnung */
const ABSCHLAG_EUR = 120.00;

/** Kopfdaten für Abrechnung und PDF */
const KUNDE = {
    name:          'max Mustermann',
    anschrift:     '',                  // z. B. 'Musterweg 1, 12345 Heimatstadt'
    lieferant:     '',                  // z. B. 'Stadtwerke Heimatstadt'
    tarif:         '',                  // z. B. 'Erdgas Basis'
    vertragskonto: '',                  // Vertrags-/Kundennummer
    zaehlernummer: ''                   // Nummer des Gaszählers
};

// ---- Berichte ---------------------------------------------------------------

/** Instanz des Telegram-Adapters. '' = kein Telegram */
const TELEGRAM_INSTANZ = 'telegram.0';

/** Empfänger im Telegram-Adapter. '' = an alle registrierten Nutzer */
const TELEGRAM_USER = '';

/** true = Tagesübersicht per Telegram */
const TAGESBERICHT_AKTIV = true;

/** Zeitpunkt der Tagesübersicht (cron). 00:01 Uhr = Bilanz des Vortags */
const TAGESBERICHT_CRON = '1 0 * * *';

/** true = Monatsabrechnung per Telegram und E-Mail */
const MONATSBERICHT_AKTIV = true;

/** Zeitpunkt der Monatsabrechnung (cron). Am 1. um 00:10 Uhr für den
 *  abgeschlossenen Vormonat – der Tagesabschluss ist dann bereits gelaufen. */
const MONATSBERICHT_CRON = '10 0 1 * *';

/** Instanz des E-Mail-Adapters. '' = kein E-Mail-Versand */
const EMAIL_INSTANZ = 'email.0';

/** Absender und Empfänger. '' beim Absender = Standard der Instanz */
const EMAIL_VON = '';
const EMAIL_AN  = 'max.mustermann@eigenemail.com';

/** true = PDF erzeugen (benötigt das npm-Modul pdfkit) */
const PDF_AKTIV = true;

/** Ablageort der PDF-Dateien. Muss für ioBroker beschreibbar sein. */
const PDF_PFAD = '/opt/iobroker/iobroker-data/gasabrechnung';

/** Schriftdateien für das PDF. Vorhanden auf den meisten Debian-Systemen.
 *  Fehlen sie, wird die eingebaute Helvetica benutzt – dann fehlt je nach
 *  PDF-Betrachter das hochgestellte ³ in "m³". */
const PDF_SCHRIFT      = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const PDF_SCHRIFT_FETT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

/** true = PDF zusätzlich als Dokument über Telegram senden */
const PDF_PER_TELEGRAM = true;

/** true = dezente Symbole in den Nachrichten */
const SYMBOLE = true;

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

// Durchfluss
const ID_FLOW     = `${PFAD}.Durchfluss`;
const ID_FLOW_AKT = `${PFAD}.VerbrauchAktiv`;
const ID_LETZTE   = `${PFAD}.ZaehlerLetzteAenderung`;

// Abgleich
const ID_ROH      = `${PFAD}.ZaehlerstandRoh`;
const ID_ABLESUNG = `${PFAD}.Ablesung`;
const ID_ABL_WERT = `${PFAD}.LetzteAblesung`;
const ID_ABL_ZEIT = `${PFAD}.LetzteAblesungZeit`;
const ID_FAKTOR   = `${PFAD}.Korrekturfaktor`;
const ID_ABW      = `${PFAD}.AbweichungLetzteAblesung`;
const ID_ABW_PROZ = `${PFAD}.AbweichungProzent`;
const ID_ANKER    = `${PFAD}.Anker`;

// Energie und Kosten
const ID_KWH_HEUTE   = `${PFAD}.Kosten.EnergieHeute`;
const ID_KWH_MONAT   = `${PFAD}.Kosten.EnergieMonat`;
const ID_EUR_HEUTE   = `${PFAD}.Kosten.KostenHeute`;
const ID_EUR_MONAT   = `${PFAD}.Kosten.KostenMonat`;
const ID_EUR_PROGN   = `${PFAD}.Kosten.PrognoseMonat`;
const ID_SALDO_JAHR  = `${PFAD}.Kosten.SaldoJahr`;

// Berichte
const ID_MONATSSTAND = `${PFAD}.Bericht.Monatsstaende`;   // JSON {'YYYY-MM': stand}
const ID_ARCHIV      = `${PFAD}.Bericht.Monatsarchiv`;    // JSON {'YYYY-MM': {...}}
const ID_SEND_TAG    = `${PFAD}.Bericht.TagesberichtSenden`;
const ID_SEND_MONAT  = `${PFAD}.Bericht.MonatsberichtSenden`;
const ID_LETZTER_BER = `${PFAD}.Bericht.LetzterMonatsbericht`;
const ID_PDF_PFAD    = `${PFAD}.Bericht.LetztePdfDatei`;
const ID_MONATSWAHL  = `${PFAD}.Bericht.MonatFuerBericht`;   // 'YYYY-MM', leer = Vormonat

const TAG_MS = 24 * 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

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

/** 'YYYY-MM' -> 'September 2026' */
const MONATSNAMEN = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
                     'August', 'September', 'Oktober', 'November', 'Dezember'];
function monatsName(key) {
    const [j, m] = String(key).split('-').map(Number);
    return `${MONATSNAMEN[m - 1]} ${j}`;
}

/** 'YYYY-MM-DD' -> 'TT.MM.JJJJ' */
function datumDe(iso) {
    const [j, m, t] = String(iso).split('-');
    return `${t}.${m}.${j}`;
}

/** Monatsschlüssel verschieben */
function monatPlus(key, delta) {
    const [j, m] = String(key).split('-').map(Number);
    const d = new Date(j, m - 1 + delta, 1);
    return monat(d);
}

/** Anzahl Tage eines Monats 'YYYY-MM' */
function tageImMonat(key) {
    const [j, m] = String(key).split('-').map(Number);
    return new Date(j, m, 0).getDate();
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

/** auf 6 Stellen runden (Faktor) */
function r6(v) {
    return Math.round((Number(v) + Number.EPSILON) * 1e6) / 1e6;
}

/** auf 2 Stellen runden (Geld) */
function r2(v) {
    return Math.round((Number(v) + Number.EPSILON) * 100) / 100;
}

/** deutsche Zahlenformatierung, ohne Abhängigkeit von der ICU-Ausstattung */
function nf(v, dec = 3) {
    const n = Number(v);
    if (!isFinite(n)) return '–';
    const s = Math.abs(n).toFixed(dec);
    const teile = s.split('.');
    teile[0] = teile[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (n < 0 ? '-' : '') + teile[0] + (teile[1] ? ',' + teile[1] : '');
}

function eur(v)  { return `${nf(v, 2)} €`; }
function sym(s)  { return SYMBOLE ? s : ''; }

function log2(msg) {
    if (DEBUG) log(`[Gas] ${msg}`);
}

/** JSON-State lesen */
function jsonState(id, fallback) {
    const s = getState(id);
    if (!s || !s.val) return fallback;
    try {
        const o = JSON.parse(s.val);
        return o === null || o === undefined ? fallback : o;
    } catch (e) {
        log(`[Gas] ${id} nicht lesbar: ${e.message}`, 'warn');
        return fallback;
    }
}

/** Historie laden (immer ein Array) */
function ladeHistorie() {
    const a = jsonState(ID_HISTORIE, []);
    return Array.isArray(a) ? a : [];
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

    if (KORREKTUR_AKTIV) {
        await mkState(ID_ROH, {
            name: 'Zählerstand der CCU (unkorrigiert)', type: 'number',
            role: 'value.volume', unit: 'm³', read: true, write: false, def: 0
        });
        await mkState(ID_ABLESUNG, {
            name: 'Abgelesener Zählerstand eintragen', type: 'number',
            role: 'value', unit: 'm³', read: true, write: true, def: 0
        });
        await mkState(ID_ABL_WERT, {
            name: 'Zuletzt übernommene Ablesung', type: 'number',
            role: 'value.volume', unit: 'm³', read: true, write: false, def: 0
        });
        await mkState(ID_ABL_ZEIT, {
            name: 'Zeitpunkt der letzten Ablesung', type: 'number',
            role: 'value.time', read: true, write: false, def: 0
        });
        await mkState(ID_FAKTOR, {
            name: 'Korrekturfaktor', type: 'number', role: 'value',
            read: true, write: false, def: 1
        });
        await mkState(ID_ABW, {
            name: 'Korrektur bei der letzten Ablesung', type: 'number',
            role: 'value', unit: 'm³', read: true, write: false, def: 0
        });
        await mkState(ID_ABW_PROZ, {
            name: 'Impulsverlust', type: 'number', role: 'value',
            unit: '%', read: true, write: false, def: 0
        });
        await mkState(ID_ANKER, {
            name: 'Ankerpunkt (JSON)', type: 'string', role: 'json',
            read: true, write: false, def: ''
        });
    }

    if (DURCHFLUSS_AKTIV) {
        await mkState(ID_FLOW, {
            name: 'Durchfluss (berechnet)', type: 'number', role: 'value',
            unit: 'm³/h', read: true, write: false, def: 0
        });
        await mkState(ID_FLOW_AKT, {
            name: 'Gasverbrauch aktiv', type: 'boolean', role: 'indicator',
            read: true, write: false, def: false
        });
        await mkState(ID_LETZTE, {
            name: 'Letzte Änderung des Zählerstands', type: 'number',
            role: 'value.time', read: true, write: false, def: 0
        });
    }

    // Energie und Kosten
    const kwhState = (id, name) => mkState(id, {
        name, type: 'number', role: 'value.power.consumption', unit: 'kWh',
        read: true, write: false, def: 0
    });
    const eurState = (id, name) => mkState(id, {
        name, type: 'number', role: 'value', unit: '€',
        read: true, write: false, def: 0
    });
    await kwhState(ID_KWH_HEUTE, 'Energie heute');
    await kwhState(ID_KWH_MONAT, 'Energie dieser Monat');
    await eurState(ID_EUR_HEUTE, 'Kosten heute');
    await eurState(ID_EUR_MONAT, 'Kosten dieser Monat');
    await eurState(ID_EUR_PROGN, 'Prognose Monatskosten');
    await eurState(ID_SALDO_JAHR, 'Saldo Abschlag gegen Kosten (Jahr)');

    // Berichte
    await mkState(ID_MONATSSTAND, {
        name: 'Zählerstände zum Monatsanfang (JSON)', type: 'string',
        role: 'json', read: true, write: false, def: '{}'
    });
    await mkState(ID_ARCHIV, {
        name: 'Archiv abgerechneter Monate (JSON)', type: 'string',
        role: 'json', read: true, write: false, def: '{}'
    });
    await mkState(ID_SEND_TAG, {
        name: 'Tagesbericht jetzt senden', type: 'boolean', role: 'button',
        read: false, write: true, def: false
    });
    await mkState(ID_SEND_MONAT, {
        name: 'Monatsbericht jetzt senden', type: 'boolean', role: 'button',
        read: false, write: true, def: false
    });
    await mkState(ID_LETZTER_BER, {
        name: 'Zuletzt abgerechneter Monat', type: 'string', role: 'text',
        read: true, write: false, def: ''
    });
    await mkState(ID_PDF_PFAD, {
        name: 'Zuletzt erzeugte PDF-Datei', type: 'string', role: 'text',
        read: true, write: false, def: ''
    });
    await mkState(ID_MONATSWAHL, {
        name: 'Monat für den Bericht (YYYY-MM, leer = Vormonat)', type: 'string',
        role: 'text', read: true, write: true, def: ''
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
    const monatsStaende = jsonState(ID_MONATSSTAND, {});
    for (let i = 0; i < staende.length - 1; i++) {
        const a = staende[i];       // Beginn des Tages a.d
        const b = staende[i + 1];   // Beginn des Folgetages = Ende des Tages a.d
        if (a.v === null || b.v === null) { luecken++; continue; }
        let v = b.v - a.v;
        if (!isFinite(v) || v < 0) v = 0;   // Zählerwechsel/Reset
        hist.push({ d: a.d, v: r(v) });
        if (a.d.endsWith('-01')) monatsStaende[a.d.slice(0, 7)] = r(a.v);
    }

    while (hist.length > TAGE_HISTORIE) hist.shift();

    const basisHeute = staende[staende.length - 1].v;

    await setStateAsync(ID_HISTORIE, JSON.stringify(hist), true);
    await setStateAsync(ID_MONATSSTAND, JSON.stringify(monatsStaende), true);
    if (basisHeute !== null) {
        await setStateAsync(ID_BASIS, basisHeute, true);
        await setStateAsync(ID_BASISTAG, tag(), true);
    }

    log(`[Gas] Backfill fertig: ${hist.length} Tageswerte übernommen` +
        (luecken ? `, ${luecken} Tag(e) ohne History-Daten ausgelassen` : '') +
        (basisHeute !== null ? `, Basis heute = ${r(basisHeute)} m³` : ''));
    return true;
}

// ============================ Abgleich / Korrektur ==========================
//
//      korrigiert = Ablesung(Anker) + Faktor × (Rohwert − Rohwert(Anker))
//      Faktor     = echter Verbrauch / von der CCU gezählter Verbrauch

let anker = null;   // {t, ablesung, roh, faktor}

function ankerLaden() {
    const a = jsonState(ID_ANKER, null);
    return (a && isFinite(a.roh) && isFinite(a.ablesung) && isFinite(a.faktor)) ? a : null;
}

/** Rohwert der CCU -> korrigierter Zählerstand */
function korrigiere(roh) {
    if (!KORREKTUR_AKTIV || !anker || !isFinite(roh)) return roh;
    return anker.ablesung + anker.faktor * (roh - anker.roh);
}

async function ankerSpeichern(a) {
    anker = a;
    await setStateAsync(ID_ANKER, JSON.stringify(a), true);
    await setStateAsync(ID_FAKTOR, r6(a.faktor), true);
    await setStateAsync(ID_ABL_WERT, r(a.ablesung), true);
    await setStateAsync(ID_ABL_ZEIT, a.t, true);
}

/** Rohwert gesunken (Offset in der CCU geändert, Gerätetausch)?
 *  Dann den Anker nachziehen, damit der korrigierte Stand stetig bleibt. */
async function ankerPruefen(roh) {
    if (!KORREKTUR_AKTIV || !anker || !isFinite(roh) || roh >= anker.roh) return false;
    const letzterKorr = parseFloat((getState(ID_ZAEHLER) || {}).val);
    const halten = isFinite(letzterKorr) && letzterKorr > 0 ? letzterKorr : korrigiere(anker.roh);
    log(`[Gas] Rohwert der CCU ist gesunken (${r(roh)}) – Ankerpunkt wird auf ${r(halten)} m³ nachgezogen`, 'warn');
    await ankerSpeichern({ t: Date.now(), ablesung: halten, roh, faktor: anker.faktor });
    return true;
}

/** Neue Ablesung übernehmen: Faktor nachführen, Anker setzen, Tagesbasis mitziehen */
async function neueAblesung(ablesung, t) {
    if (!KORREKTUR_AKTIV) {
        log('[Gas] Ablesung ignoriert – KORREKTUR_AKTIV ist false', 'warn');
        return;
    }
    const st = getState(SRC);
    const roh = st ? parseFloat(st.val) : NaN;
    if (!isFinite(roh)) {
        log('[Gas] Ablesung ignoriert – kein gültiger Zählerstand der CCU', 'warn');
        return;
    }
    if (!isFinite(ablesung) || ablesung <= 0) {
        log(`[Gas] Ablesung ${ablesung} ist unplausibel – ignoriert`, 'warn');
        return;
    }
    if (anker && ablesung < anker.ablesung) {
        log(`[Gas] Ablesung ${r(ablesung)} liegt unter der letzten Ablesung ${r(anker.ablesung)} – ignoriert`, 'warn');
        return;
    }

    const altKorrigiert = korrigiere(roh);

    if (anker && Math.abs(ablesung - altKorrigiert) > ABLESUNG_MAX_SPRUNG) {
        log(`[Gas] Ablesung ${r(ablesung)} weicht um ${r(ablesung - altKorrigiert)} m³ vom erwarteten ` +
            `Stand ${r(altKorrigiert)} ab (Grenze ${ABLESUNG_MAX_SPRUNG} m³) – ignoriert. ` +
            'Bei echter Abweichung ABLESUNG_MAX_SPRUNG anheben.', 'warn');
        return;
    }

    let faktor = anker ? anker.faktor : (FAKTOR_AUTO ? 1 : FAKTOR_MANUELL);
    let hinweis = '';

    if (anker && FAKTOR_AUTO) {
        const rohVerbrauch  = roh - anker.roh;
        const echtVerbrauch = ablesung - anker.ablesung;
        if (rohVerbrauch >= FAKTOR_MIN_VERBRAUCH && echtVerbrauch > 0) {
            const neu = echtVerbrauch / rohVerbrauch;
            if (neu >= FAKTOR_MIN && neu <= FAKTOR_MAX) {
                faktor = neu;
                hinweis = `, neuer Faktor ${r6(neu)} (Verlust ${r((neu - 1) * 100)} %)`;
                await setStateAsync(ID_ABW_PROZ, r((neu - 1) * 100), true);
            } else {
                hinweis = `, Faktor ${r6(neu)} außerhalb ${FAKTOR_MIN}–${FAKTOR_MAX} – alter Faktor behalten`;
                log(`[Gas] Berechneter Faktor ${r6(neu)} unplausibel – bitte Ablesung prüfen`, 'warn');
            }
        } else {
            hinweis = `, Faktor unverändert (erst ab ${FAKTOR_MIN_VERBRAUCH} m³ Verbrauch zwischen zwei Ablesungen)`;
        }
    } else if (!FAKTOR_AUTO) {
        faktor = FAKTOR_MANUELL;
    }

    const sprung = ablesung - altKorrigiert;

    await ankerSpeichern({ t, ablesung, roh, faktor });
    await setStateAsync(ID_ABW, r(sprung), true);

    // Tagesbasis mitziehen, damit "Heute" durch den Sprung nicht verfälscht wird
    const basisSt = parseFloat((getState(ID_BASIS) || {}).val);
    if (isFinite(basisSt)) await setStateAsync(ID_BASIS, basisSt + sprung, true);

    // Durchflussberechnung neu aufsetzen, damit der Sprung kein Spitzenwert wird
    proben = [{ t, v: ablesung }];

    log(`[Gas] Ablesung ${r(ablesung)} m³ übernommen – Korrektur ${sprung >= 0 ? '+' : ''}${r(sprung)} m³${hinweis}`);
}

// ================================ Durchfluss ================================
//
//  Jede Änderung des Zählerstands ist eine Probe {t, v}.
//  Durchfluss = Δv / Δt zwischen neuester Probe und einem Anker am Beginn des
//  Glättungsfensters. Nach einer Pause (> LUECKE_MIN) wird angenommen, dass der
//  Verbrauch innerhalb von ANLAUF_MIN angefallen ist. Eine minütliche Prüfung
//  setzt 0, sobald NULL_NACH_MIN keine Änderung kam.

let proben = [];            // [{t: ms, v: m³}, ...] aufsteigend
let flowAktuell = null;     // zuletzt geschriebener Wert

async function setzeDurchfluss(f) {
    let wert = isFinite(f) ? Math.min(Math.max(f, 0), MAX_DURCHFLUSS) : 0;
    if (isFinite(f) && f > MAX_DURCHFLUSS) {
        log(`[Gas] Durchfluss ${r(f)} m³/h unplausibel – begrenzt auf ${MAX_DURCHFLUSS}`, 'warn');
    }
    wert = r(wert);
    if (wert === flowAktuell) return;
    flowAktuell = wert;
    await setStateAsync(ID_FLOW, wert, true);
    await setStateAsync(ID_FLOW_AKT, wert > 0, true);
    log2(`Durchfluss ${wert} m³/h`);
}

async function durchflussUpdate(v, t) {
    if (!DURCHFLUSS_AKTIV || !isFinite(v) || !isFinite(t)) return;

    const letzte = proben[proben.length - 1];

    if (!letzte) {                          // erste Probe nach Start
        proben = [{ t, v }];
        await setStateAsync(ID_LETZTE, t, true);
        return;
    }
    if (v === letzte.v) return;             // keine echte Änderung
    if (t <= letzte.t) return;              // Zeitstempel nicht neuer

    await setStateAsync(ID_LETZTE, t, true);

    if (v < letzte.v) {                     // Zähler gesunken -> neu beginnen
        proben = [{ t, v }];
        await setzeDurchfluss(0);
        return;
    }

    if (t - letzte.t > LUECKE_MIN * MIN_MS) {   // Anlauf nach Pause
        const f = (v - letzte.v) / (ANLAUF_MIN / 60);
        proben = [{ t: t - ANLAUF_MIN * MIN_MS, v: letzte.v }, { t, v }];
        await setzeDurchfluss(f);
        return;
    }

    proben.push({ t, v });                  // Normalfall: gleitendes Fenster
    const grenze = t - FENSTER_MIN * MIN_MS;
    while (proben.length > 2 && proben[1].t <= grenze) proben.shift();

    const a = proben[0];
    await setzeDurchfluss((v - a.v) / ((t - a.t) / 3600000));
}

/** minütlich: ohne Zähleränderung -> 0 */
async function durchflussNullPruefung() {
    if (!DURCHFLUSS_AKTIV) return;
    const letzte = proben[proben.length - 1];
    if (!letzte) return;
    if (Date.now() - letzte.t > NULL_NACH_MIN * MIN_MS && flowAktuell !== 0) {
        await setzeDurchfluss(0);
    }
}

// ------------------------------- Tageswechsel -------------------------------

/** Zählerstand zum Monatsanfang festhalten (Grundlage der Abrechnung) */
async function monatsstandSetzen(key, stand) {
    const st = jsonState(ID_MONATSSTAND, {});
    if (st[key] !== undefined) return;
    st[key] = r(stand);
    // nur die letzten 26 Monate vorhalten
    const keys = Object.keys(st).sort();
    while (keys.length > 26) delete st[keys.shift()];
    await setStateAsync(ID_MONATSSTAND, JSON.stringify(st), true);
    log(`[Gas] Zählerstand zum Monatsanfang ${key}: ${r(stand)} m³`);
}

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

    // Monatsanfang: Zählerstand als Abrechnungsgrundlage sichern
    if (heuteStr.endsWith('-01')) await monatsstandSetzen(monat(), zaehlerJetzt);

    return true;
}

// ----------------------------- Kosten und Energie ---------------------------

/**
 * Kostenaufstellung für eine Verbrauchsmenge.
 * @param {number} m3          Verbrauch in m³
 * @param {number} tage        abgerechnete Tage (für den anteiligen Grundpreis)
 * @param {number} tageBasis   Tage des vollen Monats (Default: 30)
 */
function kosten(m3, tage = 1, tageBasis = 30) {
    const menge       = Math.max(0, Number(m3) || 0);
    const kwh         = menge * ZUSTANDSZAHL * BRENNWERT;
    const arbeitNetto = kwh * ARBEITSPREIS_CT_KWH / 100;
    const anteil      = tageBasis > 0 ? tage / tageBasis : 1;
    const grundNetto  = GRUNDPREIS_EUR_MONAT * anteil;
    const netto       = arbeitNetto + grundNetto;
    const mwst        = netto * MWST_PROZENT / 100;
    const brutto      = netto + mwst;
    return {
        m3: menge, kwh, arbeitNetto, grundNetto, anteil, netto, mwst, brutto,
        tage, tageBasis,
        // abgeleitete Kennzahlen, damit die Abrechnung nachvollziehbar bleibt
        bruttoProM3:  menge > 0 ? brutto / menge : 0,
        bruttoProKwh: kwh > 0 ? brutto / kwh : 0,
        bruttoProTag: tage > 0 ? brutto / tage : 0
    };
}

// -------------------------------- Berechnung --------------------------------

async function berechne() {
    const src = getState(SRC);
    if (!src || src.val === null || src.val === undefined || isNaN(parseFloat(src.val))) {
        log2('Quell-State liefert keinen gültigen Wert');
        return;
    }
    const roh = parseFloat(src.val);

    await ankerPruefen(roh);

    const zaehler = korrigiere(roh);
    if (KORREKTUR_AKTIV) await setStateAsync(ID_ROH, r(roh), true);

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

    // Monatsstand nachtragen, falls er noch fehlt (Erstlauf mitten im Monat)
    const monatsStaende = jsonState(ID_MONATSSTAND, {});
    if (monatsStaende[monat()] === undefined) {
        const hist0 = ladeHistorie();
        const bisher = summeMonat(hist0, monat());
        await monatsstandSetzen(monat(), basis - bisher);
    }

    const hist    = ladeHistorie();
    const heute   = Math.max(0, zaehler - basis);
    const gestern = hist.length ? Number(hist[hist.length - 1].v) || 0 : 0;
    const plus    = INKL_HEUTE ? heute : 0;

    const d = new Date();
    const vormonatKey = monatPlus(monat(), -1);
    const monatM3     = summeMonat(hist, monat()) + heute;

    await setStateAsync(ID_ZAEHLER,  r(zaehler), true);
    await setStateAsync(ID_HEUTE,    r(heute), true);
    await setStateAsync(ID_GESTERN,  r(gestern), true);
    await setStateAsync(ID_7TAGE,    r(summeTage(hist, 7)  + plus), true);
    await setStateAsync(ID_30TAGE,   r(summeTage(hist, 30) + plus), true);
    await setStateAsync(ID_MONAT,    r(monatM3), true);
    await setStateAsync(ID_VORMONAT, r(summeMonat(hist, vormonatKey)), true);

    // Energie und Kosten
    const tagNr    = d.getDate();
    const tageMon  = tageImMonat(monat());
    const kHeute   = kosten(heute, 1, tageMon);
    const kMonat   = kosten(monatM3, tagNr, tageMon);
    const prognose = kosten(tagNr > 0 ? monatM3 / tagNr * tageMon : 0, tageMon, tageMon);

    await setStateAsync(ID_KWH_HEUTE, r2(kHeute.kwh), true);
    await setStateAsync(ID_KWH_MONAT, r2(kMonat.kwh), true);
    await setStateAsync(ID_EUR_HEUTE, r2(kHeute.brutto), true);
    await setStateAsync(ID_EUR_MONAT, r2(kMonat.brutto), true);
    await setStateAsync(ID_EUR_PROGN, r2(prognose.brutto), true);

    log2(`Zähler ${r(zaehler)} | heute ${r(heute)} | gestern ${r(gestern)} | ` +
         `Monat ${r(monatM3)} m³ = ${eur(kMonat.brutto)}`);
}

// ============================= Daten für Berichte ===========================

/** Tageswerte eines Monats, aufsteigend */
function tageDesMonats(key) {
    return ladeHistorie()
        .filter(e => String(e.d).startsWith(key))
        .map(e => ({ d: e.d, v: Number(e.v) || 0 }));
}

/**
 * Alle Daten einer Monatsabrechnung.
 * Bevorzugt die gesicherten Zählerstände zum Monatsanfang; fehlen sie,
 * wird auf die Summe der Tageswerte zurückgefallen.
 */
function monatsDaten(key) {
    const staende  = jsonState(ID_MONATSSTAND, {});
    const tage     = tageDesMonats(key);
    const summe    = tage.reduce((s, e) => s + e.v, 0);

    const standVon = isFinite(staende[key]) ? Number(staende[key]) : null;
    const naechst  = monatPlus(key, 1);
    let standBis   = isFinite(staende[naechst]) ? Number(staende[naechst]) : null;
    if (standBis === null && monat() === naechst) {
        const b = parseFloat((getState(ID_BASIS) || {}).val);   // Basis vom 1. des Folgemonats
        if (isFinite(b)) standBis = b;
    }

    let m3 = summe;
    let quelle = 'Summe der Tageswerte';
    if (standVon !== null && standBis !== null && standBis >= standVon) {
        m3 = standBis - standVon;
        quelle = 'Differenz der Zählerstände';
    }

    const anzahlTage = tage.length || tageImMonat(key);
    const k          = kosten(m3, anzahlTage, tageImMonat(key));

    // Vormonat zum Vergleich
    const vorKey = monatPlus(key, -1);
    const vorM3  = summeMonat(ladeHistorie(), vorKey);
    const vorK   = kosten(vorM3, tageImMonat(vorKey), tageImMonat(vorKey));

    // Extremwerte
    let maxTag = null, minTag = null;
    for (const e of tage) {
        if (!maxTag || e.v > maxTag.v) maxTag = e;
        if (!minTag || e.v < minTag.v) minTag = e;
    }

    const saldo = ABSCHLAG_EUR > 0 ? ABSCHLAG_EUR - k.brutto : 0;

    return {
        key, name: monatsName(key),
        von: `${key}-01`,
        bis: `${key}-${String(tageImMonat(key)).padStart(2, '0')}`,
        standVon, standBis, quelle,
        m3, tage, anzahlTage, kosten: k,
        schnittProTag: anzahlTage > 0 ? m3 / anzahlTage : 0,
        maxTag, minTag,
        vorM3, vorKosten: vorK.brutto,
        deltaProzent: vorM3 > 0 ? (m3 - vorM3) / vorM3 * 100 : null,
        abschlag: ABSCHLAG_EUR, saldo,
        faktor: anker ? anker.faktor : 1,
        erstellt: new Date()
    };
}

/** Daten der Tagesübersicht für einen abgeschlossenen Tag */
function tagesDaten(datum) {
    const hist = ladeHistorie();
    const idx  = datum ? hist.findIndex(e => e.d === datum) : hist.length - 1;
    if (idx < 0 || !hist.length) return null;

    const e       = hist[idx];
    const vortag  = idx > 0 ? hist[idx - 1] : null;
    const key     = e.d.slice(0, 7);
    const tagNr   = Number(e.d.slice(8, 10));
    const tageMon = tageImMonat(key);

    // Monatswerte bis einschließlich dieses Tages
    const bisher = hist.filter(x => x.d.startsWith(key) && x.d <= e.d)
                       .reduce((s, x) => s + (Number(x.v) || 0), 0);

    const kTag      = kosten(e.v, 1, tageMon);
    const kMonat    = kosten(bisher, tagNr, tageMon);
    const hochM3    = tagNr > 0 ? bisher / tagNr * tageMon : 0;
    const kPrognose = kosten(hochM3, tageMon, tageMon);

    return {
        datum: e.d, m3: e.v, kosten: kTag,
        vortagM3: vortag ? Number(vortag.v) || 0 : null,
        delta: vortag && vortag.v > 0 ? (e.v - vortag.v) / vortag.v * 100 : null,
        monatKey: key, monatM3: bisher, monatKosten: kMonat,
        schnitt: tagNr > 0 ? bisher / tagNr : 0,
        prognoseM3: hochM3, prognoseKosten: kPrognose,
        zaehlerstand: parseFloat((getState(ID_ZAEHLER) || {}).val) || 0,
        tagNr, tageMon
    };
}

// ================================ Nachrichten ===============================

/** Zeile für eine feste Breite auffüllen (monospace-Blöcke) */
function zeile(label, wert, breite = 14) {
    return `${String(label).padEnd(breite, ' ')}${wert}`;
}

/** Trendpfeil */
function trend(delta) {
    if (delta === null || !isFinite(delta)) return '';
    if (Math.abs(delta) < 0.5) return SYMBOLE ? ' ●  ±0 %' : ' ±0 %';
    const pf = delta > 0 ? (SYMBOLE ? '▲' : '+') : (SYMBOLE ? '▼' : '-');
    return ` ${pf} ${nf(Math.abs(delta), 1)} %`;
}

/** Telegram-Text der Tagesübersicht (parse_mode HTML) */
function textTagesbericht(t) {
    const wt = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const d  = new Date(`${t.datum}T12:00:00`);

    const block1 = [
        zeile('Verbrauch', `${nf(t.m3, 3)} m³`),
        zeile('Energie', `${nf(t.kosten.kwh, 1)} kWh`),
        zeile('Kosten', eur(t.kosten.brutto)),
        zeile('Vortag', t.vortagM3 === null ? '–' : `${nf(t.vortagM3, 3)} m³${trend(t.delta)}`),
        zeile('Zählerstand', `${nf(t.zaehlerstand, 3)} m³`)
    ].join('\n');

    const block2 = [
        zeile('Verbrauch', `${nf(t.monatM3, 3)} m³`),
        zeile('Kosten', eur(t.monatKosten.brutto)),
        zeile('Ø pro Tag', `${nf(t.schnitt, 3)} m³`),
        zeile('Prognose', `${nf(t.prognoseM3, 1)} m³ · ${eur(t.prognoseKosten.brutto)}`)
    ].join('\n');

    return `${sym('🔹 ')}<b>Gasverbrauch – ${wt[d.getDay()]}, ${datumDe(t.datum)}</b>\n` +
           `<pre>${block1}</pre>\n` +
           `<b>${monatsName(t.monatKey)} · Tag ${t.tagNr} von ${t.tageMon}</b>\n` +
           `<pre>${block2}</pre>`;
}

/** Telegram-Text der Monatsabrechnung (parse_mode HTML) */
function textMonatsbericht(m) {
    const k = m.kosten;
    const verbrauch = [
        zeile('Zeitraum', `${datumDe(m.von)} – ${datumDe(m.bis)}`),
        zeile('Anfangsstand', m.standVon === null ? '–' : `${nf(m.standVon, 3)} m³`),
        zeile('Endstand', m.standBis === null ? '–' : `${nf(m.standBis, 3)} m³`),
        zeile('Verbrauch', `${nf(m.m3, 3)} m³`),
        zeile('Energie', `${nf(k.kwh, 1)} kWh`),
        zeile('Ø pro Tag', `${nf(m.schnittProTag, 3)} m³`),
        zeile('Vormonat', m.vorM3 > 0 ? `${nf(m.vorM3, 3)} m³${trend(m.deltaProzent)}` : 'keine Daten')
    ].join('\n');

    const kostenBlock = [
        zeile('Arbeitspreis', `${eur(k.arbeitNetto)} netto`),
        zeile('Grundpreis', `${eur(k.grundNetto)} netto`),
        zeile('Summe netto', eur(k.netto)),
        zeile(`MwSt ${nf(MWST_PROZENT, 0)} %`, eur(k.mwst)),
        zeile('Gesamt', `${eur(k.brutto)}`)
    ].join('\n');

    let saldoBlock = '';
    if (ABSCHLAG_EUR > 0) {
        const status = m.saldo >= 0 ? 'Guthaben' : 'Nachzahlung';
        saldoBlock = `\n<b>Abschlag</b>\n<pre>` + [
            zeile('Abschlag', eur(m.abschlag)),
            zeile('Kosten', eur(k.brutto)),
            zeile(status, eur(Math.abs(m.saldo)))
        ].join('\n') + '</pre>';
    }

    return `${sym('🔸 ')}<b>Gasabrechnung ${m.name}</b>\n` +
           `<pre>${verbrauch}</pre>\n` +
           `<b>Kosten</b>\n<pre>${kostenBlock}</pre>${saldoBlock}`;
}

// ------------------------------- E-Mail (HTML) ------------------------------

const FARBE = {
    dunkel: '#0d3b66',
    hell:   '#f5f7fa',
    linie:  '#d9e0e8',
    text:   '#1d2229',
    grau:   '#5a6675',
    gruen:  '#1b7f4d',
    rot:    '#b3261e',
    akzent: '#f0a500'
};

function kachel(titel, wert, zusatz) {
    return `<td style="padding:0 6px 0 0;width:33%;vertical-align:top;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${FARBE.hell};border:1px solid ${FARBE.linie};border-radius:8px;">
        <tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;">
          <div style="font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:${FARBE.grau};">${titel}</div>
          <div style="font-size:22px;font-weight:bold;color:${FARBE.dunkel};padding-top:4px;">${wert}</div>
          <div style="font-size:12px;color:${FARBE.grau};padding-top:2px;">${zusatz || '&nbsp;'}</div>
        </td></tr>
      </table></td>`;
}

function tabellenZeile(a, b, c, fett) {
    const st = `padding:9px 12px;border-bottom:1px solid ${FARBE.linie};font-family:Arial,Helvetica,sans-serif;font-size:13px;` +
               (fett ? `font-weight:bold;color:${FARBE.dunkel};` : `color:${FARBE.text};`);
    return `<tr>
      <td style="${st}">${a}</td>
      <td style="${st}color:${FARBE.grau};font-size:12px;">${b || ''}</td>
      <td style="${st}text-align:right;white-space:nowrap;">${c}</td>
    </tr>`;
}

function tabelle(titel, zeilen) {
    return `<h2 style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${FARBE.dunkel};
        margin:26px 0 8px 0;padding-bottom:6px;border-bottom:2px solid ${FARBE.dunkel};">${titel}</h2>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${zeilen.join('')}</table>`;
}

/** vollständige HTML-Monatsabrechnung für die E-Mail */
function htmlMonatsbericht(m) {
    const k = m.kosten;
    const kopf = [KUNDE.name, KUNDE.anschrift, KUNDE.lieferant && `Lieferant: ${KUNDE.lieferant}`,
                  KUNDE.tarif && `Tarif: ${KUNDE.tarif}`,
                  KUNDE.vertragskonto && `Vertragskonto: ${KUNDE.vertragskonto}`,
                  KUNDE.zaehlernummer && `Zählernummer: ${KUNDE.zaehlernummer}`]
                 .filter(Boolean).join(' · ');

    const zaehler = tabelle('Zählerstände', [
        tabellenZeile('Zählerstand am ' + datumDe(m.von), 'Beginn des Abrechnungszeitraums',
                      m.standVon === null ? '–' : `${nf(m.standVon, 3)} m³`),
        tabellenZeile('Zählerstand am ' + datumDe(monatPlus(m.key, 1) + '-01'), 'Ende des Abrechnungszeitraums',
                      m.standBis === null ? '–' : `${nf(m.standBis, 3)} m³`),
        tabellenZeile('Verbrauch', m.quelle, `${nf(m.m3, 3)} m³`, true),
        tabellenZeile('Korrekturfaktor', 'Ausgleich verlorener Impulse, aus Ablesungen ermittelt',
                      nf(m.faktor, 4))
    ]);

    const energie = tabelle('Umrechnung in Energie', [
        tabellenZeile('Verbrauch', 'gemessenes Volumen', `${nf(m.m3, 3)} m³`),
        tabellenZeile('Zustandszahl', 'Z-Zahl laut Vertrag', nf(ZUSTANDSZAHL, 4)),
        tabellenZeile('Brennwert', 'kWh je m³ laut Vertrag', nf(BRENNWERT, 4)),
        tabellenZeile('Energiemenge',
            `${nf(m.m3, 3)} m³ × ${nf(ZUSTANDSZAHL, 4)} × ${nf(BRENNWERT, 4)}`,
            `${nf(k.kwh, 2)} kWh`, true)
    ]);

    const kostenTab = tabelle('Kosten', [
        tabellenZeile('Arbeitspreis',
            `${nf(k.kwh, 2)} kWh × ${nf(ARBEITSPREIS_CT_KWH, 2)} ct/kWh`, eur(k.arbeitNetto)),
        tabellenZeile('Grundpreis',
            `${eur(GRUNDPREIS_EUR_MONAT)}/Monat × ${nf(k.anteil * 100, 1)} % (${k.tage} von ${k.tageBasis} Tagen)`,
            eur(k.grundNetto)),
        tabellenZeile('Summe netto', '', eur(k.netto), true),
        tabellenZeile(`Mehrwertsteuer ${nf(MWST_PROZENT, 0)} %`,
            `${eur(k.netto)} × ${nf(MWST_PROZENT, 0)} %`, eur(k.mwst)),
        tabellenZeile('Gesamtbetrag brutto', '', eur(k.brutto), true),
        tabellenZeile('Durchschnittspreis',
            `${eur(k.brutto)} ÷ ${nf(k.kwh, 2)} kWh`, `${nf(k.bruttoProKwh * 100, 3)} ct/kWh`),
        tabellenZeile('Kosten je m³', `${eur(k.brutto)} ÷ ${nf(m.m3, 3)} m³`, `${eur(k.bruttoProM3)}/m³`),
        tabellenZeile('Kosten je Tag', `${eur(k.brutto)} ÷ ${k.tage} Tage`, `${eur(k.bruttoProTag)}/Tag`),
        tabellenZeile('Vormonat',
            m.vorM3 > 0 ? `${nf(m.vorM3, 3)} m³${m.deltaProzent === null ? '' : ' · ' + (m.deltaProzent > 0 ? '+' : '') + nf(m.deltaProzent, 1) + ' %'}` : 'keine Daten vorhanden',
            m.vorM3 > 0 ? eur(m.vorKosten) : '–')
    ]);

    let saldoTab = '';
    if (ABSCHLAG_EUR > 0) {
        const positiv = m.saldo >= 0;
        saldoTab = tabelle('Abschlag', [
            tabellenZeile('Gezahlter Abschlag', 'monatlich, brutto', eur(m.abschlag)),
            tabellenZeile('Tatsächliche Kosten', 'brutto', `- ${eur(k.brutto)}`),
            tabellenZeile(positiv ? 'Guthaben' : 'Nachzahlung', '',
                `<span style="color:${positiv ? FARBE.gruen : FARBE.rot};font-weight:bold;">${eur(Math.abs(m.saldo))}</span>`, true)
        ]);
    }

    const tagesZeilen = m.tage.map(e => {
        const anteil = m.m3 > 0 ? Math.min(100, e.v / Math.max(...m.tage.map(x => x.v), 0.001) * 100) : 0;
        return `<tr>
          <td style="padding:5px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${FARBE.text};border-bottom:1px solid ${FARBE.linie};">${datumDe(e.d)}</td>
          <td style="padding:5px 8px;border-bottom:1px solid ${FARBE.linie};width:50%;">
            <div style="background:${FARBE.dunkel};height:8px;border-radius:4px;width:${nf(anteil, 0)}%;"></div>
          </td>
          <td style="padding:5px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;text-align:right;color:${FARBE.text};border-bottom:1px solid ${FARBE.linie};">${nf(e.v, 3)} m³</td>
          <td style="padding:5px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;text-align:right;color:${FARBE.grau};border-bottom:1px solid ${FARBE.linie};">${eur(kosten(e.v, 1, m.kosten.tageBasis).brutto)}</td>
        </tr>`;
    }).join('');

    const tagesTab = `<h2 style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${FARBE.dunkel};
        margin:26px 0 8px 0;padding-bottom:6px;border-bottom:2px solid ${FARBE.dunkel};">Tagesverbrauch</h2>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${tagesZeilen}</table>`;

    return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef1f5;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eef1f5;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="640" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(13,59,102,.10);">

  <tr><td style="background:${FARBE.dunkel};padding:26px 28px;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#9fc0e0;">Gasabrechnung</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:bold;color:#ffffff;padding-top:4px;">${m.name}</div>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#c8dcf0;padding-top:6px;">${datumDe(m.von)} – ${datumDe(m.bis)} · ${m.anzahlTage} Tage</div>
  </td></tr>

  ${kopf ? `<tr><td style="padding:12px 28px;background:${FARBE.hell};border-bottom:1px solid ${FARBE.linie};
      font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${FARBE.grau};">${kopf}</td></tr>` : ''}

  <tr><td style="padding:24px 28px 0 28px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
      ${kachel('Verbrauch', `${nf(m.m3, 2)} m³`, `Ø ${nf(m.schnittProTag, 2)} m³/Tag`)}
      ${kachel('Energie', `${nf(k.kwh, 0)} kWh`, `${nf(k.bruttoProKwh * 100, 2)} ct/kWh`)}
      ${kachel('Kosten', eur(k.brutto), `davon ${eur(k.mwst)} MwSt`)}
    </tr></table>
  </td></tr>

  <tr><td style="padding:0 28px 28px 28px;">
    ${zaehler}${energie}${kostenTab}${saldoTab}${tagesTab}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${FARBE.grau};line-height:1.6;margin-top:24px;">
      Erstellt am ${datumDe(tag(m.erstellt))} durch ioBroker aus den Zählerständen des HmIP-ESI-GAS.
      Der Verbrauch wurde über den Korrekturfaktor ${nf(m.faktor, 4)} auf die abgelesenen Zählerstände abgeglichen.
      Der HmIP-ESI ist kein eichfähiges Messmittel – verbindlich ist der Stand am Zähler selbst.
      Diese Aufstellung dient der eigenen Kontrolle und ersetzt keine Rechnung des Lieferanten.
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// =================================== PDF ====================================
//
//  Benötigt das npm-Modul "pdfkit" (javascript-Instanz -> Zusätzliche NPM-Module).
//  Fehlt es, liefert die Funktion null und der Versand läuft ohne Anhang weiter.

/** aktive Schriftnamen im PDF – werden beim Erstellen gesetzt */
const SCHRIFT = { normal: 'Helvetica', fett: 'Helvetica-Bold' };

/** Schriftdateien laden, sofern vorhanden */
function pdfSchriftLaden(doc, fs) {
    SCHRIFT.normal = 'Helvetica';
    SCHRIFT.fett   = 'Helvetica-Bold';
    try {
        if (PDF_SCHRIFT && fs.existsSync(PDF_SCHRIFT)) {
            doc.registerFont('gasText', PDF_SCHRIFT);
            SCHRIFT.normal = 'gasText';
        }
        if (PDF_SCHRIFT_FETT && fs.existsSync(PDF_SCHRIFT_FETT)) {
            doc.registerFont('gasFett', PDF_SCHRIFT_FETT);
            SCHRIFT.fett = 'gasFett';
        } else {
            SCHRIFT.fett = SCHRIFT.normal;
        }
    } catch (e) {
        log(`[Gas] PDF-Schrift nicht ladbar (${e.message}) – Helvetica wird verwendet`, 'warn');
        SCHRIFT.normal = 'Helvetica';
        SCHRIFT.fett   = 'Helvetica-Bold';
    }
}

const PDF_L = 48;                      // linker Rand
const PDF_W = 499;                     // Inhaltsbreite (A4 - 2 × 48)
const PDF_R = PDF_L + PDF_W;

function pdfAbschnitt(doc, titel) {
    if (doc.y > 690) doc.addPage();
    doc.moveDown(0.7);
    doc.font(SCHRIFT.fett).fontSize(10.5).fillColor(FARBE.dunkel).text(titel, PDF_L, doc.y);
    const y = doc.y + 3;
    doc.moveTo(PDF_L, y).lineTo(PDF_R, y).lineWidth(1.2).strokeColor(FARBE.dunkel).stroke();
    doc.y = y + 8;
}

function pdfZeile(doc, a, b, c, fett) {
    if (doc.y > 745) doc.addPage();
    const y = doc.y;
    doc.font(fett ? SCHRIFT.fett : SCHRIFT.normal).fontSize(9.5)
       .fillColor(fett ? FARBE.dunkel : FARBE.text)
       .text(String(a), PDF_L, y, { width: 165 });
    const yA = doc.y;
    doc.font(SCHRIFT.normal).fontSize(8).fillColor(FARBE.grau)
       .text(String(b || ''), PDF_L + 168, y + 1.5, { width: 200 });
    const yB = doc.y;
    doc.font(fett ? SCHRIFT.fett : SCHRIFT.normal).fontSize(9.5)
       .fillColor(fett ? FARBE.dunkel : FARBE.text)
       .text(String(c), PDF_L + 375, y, { width: PDF_W - 375, align: 'right' });
    const yy = Math.max(yA, yB, doc.y, y + 13);
    doc.moveTo(PDF_L, yy).lineTo(PDF_R, yy).lineWidth(0.4).strokeColor(FARBE.linie).stroke();
    doc.y = yy + 4;
}

function pdfKachel(doc, x, y, w, titel, wert, zusatz) {
    doc.roundedRect(x, y, w, 60, 6).fillAndStroke(FARBE.hell, FARBE.linie);
    doc.font(SCHRIFT.normal).fontSize(7.5).fillColor(FARBE.grau)
       .text(String(titel).toUpperCase(), x + 12, y + 11, { width: w - 24, characterSpacing: 0.5 });
    doc.font(SCHRIFT.fett).fontSize(15).fillColor(FARBE.dunkel)
       .text(wert, x + 12, y + 24, { width: w - 24 });
    doc.font(SCHRIFT.normal).fontSize(7.5).fillColor(FARBE.grau)
       .text(zusatz || '', x + 12, y + 45, { width: w - 24 });
}

/** Monatsabrechnung als PDF. Gibt den Dateipfad zurück oder null. */
function pdfMonatsbericht(m) {
    return new Promise(resolve => {
        if (!PDF_AKTIV) return resolve(null);

        let PDFDocument, fs;
        try {
            PDFDocument = require('pdfkit');
            fs = require('fs');
        } catch (e) {
            log('[Gas] PDF übersprungen – npm-Modul "pdfkit" fehlt. In den Einstellungen der ' +
                'javascript-Instanz unter "Zusätzliche NPM-Module" eintragen: pdfkit', 'warn');
            return resolve(null);
        }

        try {
            fs.mkdirSync(PDF_PFAD, { recursive: true });
        } catch (e) {
            log(`[Gas] PDF-Ordner ${PDF_PFAD} nicht anlegbar: ${e.message}`, 'warn');
            return resolve(null);
        }

        const datei = `${PDF_PFAD}/Gasabrechnung_${m.key}.pdf`;
        const k = m.kosten;

        try {
            const doc = new PDFDocument({
                size: 'A4',
                bufferPages: true,
                margins: { top: 48, bottom: 60, left: PDF_L, right: PDF_L },
                info: {
                    Title: `Gasabrechnung ${m.name}`,
                    Author: 'ioBroker',
                    Subject: `Gasverbrauch ${datumDe(m.von)} bis ${datumDe(m.bis)}`
                }
            });
            pdfSchriftLaden(doc, fs);
            const stream = fs.createWriteStream(datei);
            stream.on('error', e => {
                log(`[Gas] PDF konnte nicht geschrieben werden: ${e.message}`, 'warn');
                resolve(null);
            });
            stream.on('finish', () => resolve(datei));
            doc.pipe(stream);

            // ---- Kopfbereich ------------------------------------------------
            doc.rect(0, 0, 595.28, 112).fill(FARBE.dunkel);
            doc.font(SCHRIFT.normal).fontSize(8.5).fillColor('#9fc0e0')
               .text('GASABRECHNUNG', PDF_L, 30, { characterSpacing: 1.6 });
            doc.font(SCHRIFT.fett).fontSize(22).fillColor('#ffffff')
               .text(m.name, PDF_L, 46);
            doc.font(SCHRIFT.normal).fontSize(10).fillColor('#c8dcf0')
               .text(`${datumDe(m.von)} – ${datumDe(m.bis)} · ${m.anzahlTage} Tage`, PDF_L, 76);
            doc.font(SCHRIFT.normal).fontSize(8).fillColor('#9fc0e0')
               .text(`erstellt ${datumDe(tag(m.erstellt))}`, PDF_L, 76, { width: PDF_W, align: 'right' });

            doc.y = 130;

            // ---- Kundendaten ------------------------------------------------
            const kopf = [KUNDE.name, KUNDE.anschrift, KUNDE.lieferant && `Lieferant: ${KUNDE.lieferant}`,
                          KUNDE.tarif && `Tarif: ${KUNDE.tarif}`,
                          KUNDE.vertragskonto && `Vertragskonto: ${KUNDE.vertragskonto}`,
                          KUNDE.zaehlernummer && `Zählernummer: ${KUNDE.zaehlernummer}`].filter(Boolean);
            if (kopf.length) {
                doc.font(SCHRIFT.normal).fontSize(8.5).fillColor(FARBE.grau)
                   .text(kopf.join('  ·  '), PDF_L, doc.y, { width: PDF_W });
                doc.y += 8;
            }

            // ---- Kacheln ----------------------------------------------------
            const ky = doc.y + 4;
            const kw = (PDF_W - 16) / 3;
            pdfKachel(doc, PDF_L, ky, kw, 'Verbrauch', `${nf(m.m3, 2)} m³`,
                      `Ø ${nf(m.schnittProTag, 2)} m³/Tag`);
            pdfKachel(doc, PDF_L + kw + 8, ky, kw, 'Energie', `${nf(k.kwh, 0)} kWh`,
                      `${nf(k.bruttoProKwh * 100, 2)} ct/kWh`);
            pdfKachel(doc, PDF_L + 2 * (kw + 8), ky, kw, 'Kosten', eur(k.brutto),
                      `davon ${eur(k.mwst)} MwSt`);
            doc.y = ky + 74;

            // ---- Zählerstände -----------------------------------------------
            pdfAbschnitt(doc, 'Zählerstände');
            pdfZeile(doc, `Stand am ${datumDe(m.von)}`, 'Beginn des Abrechnungszeitraums',
                     m.standVon === null ? '–' : `${nf(m.standVon, 3)} m³`);
            pdfZeile(doc, `Stand am ${datumDe(monatPlus(m.key, 1) + '-01')}`, 'Ende des Abrechnungszeitraums',
                     m.standBis === null ? '–' : `${nf(m.standBis, 3)} m³`);
            pdfZeile(doc, 'Verbrauch', m.quelle, `${nf(m.m3, 3)} m³`, true);
            pdfZeile(doc, 'Korrekturfaktor', 'Ausgleich verlorener Impulse, aus Ablesungen ermittelt',
                     nf(m.faktor, 4));

            // ---- Energie ----------------------------------------------------
            pdfAbschnitt(doc, 'Umrechnung in Energie');
            pdfZeile(doc, 'Verbrauch', 'gemessenes Volumen', `${nf(m.m3, 3)} m³`);
            pdfZeile(doc, 'Zustandszahl', 'laut Vertrag', nf(ZUSTANDSZAHL, 4));
            pdfZeile(doc, 'Brennwert', 'kWh je m³ laut Vertrag', nf(BRENNWERT, 4));
            pdfZeile(doc, 'Energiemenge',
                     `${nf(m.m3, 3)} × ${nf(ZUSTANDSZAHL, 4)} × ${nf(BRENNWERT, 4)}`,
                     `${nf(k.kwh, 2)} kWh`, true);

            // ---- Kosten -----------------------------------------------------
            pdfAbschnitt(doc, 'Kosten');
            pdfZeile(doc, 'Arbeitspreis', `${nf(k.kwh, 2)} kWh × ${nf(ARBEITSPREIS_CT_KWH, 2)} ct/kWh`,
                     eur(k.arbeitNetto));
            pdfZeile(doc, 'Grundpreis',
                     `${eur(GRUNDPREIS_EUR_MONAT)}/Monat × ${nf(k.anteil * 100, 1)} % (${k.tage}/${k.tageBasis} Tage)`,
                     eur(k.grundNetto));
            pdfZeile(doc, 'Summe netto', '', eur(k.netto), true);
            pdfZeile(doc, `Mehrwertsteuer ${nf(MWST_PROZENT, 0)} %`,
                     `${eur(k.netto)} × ${nf(MWST_PROZENT, 0)} %`, eur(k.mwst));

            // Summenbalken
            if (doc.y > 700) doc.addPage();
            const sy = doc.y + 4;
            doc.roundedRect(PDF_L, sy, PDF_W, 34, 6).fill(FARBE.dunkel);
            doc.font(SCHRIFT.fett).fontSize(11).fillColor('#ffffff')
               .text('Gesamtbetrag brutto', PDF_L + 14, sy + 11);
            doc.font(SCHRIFT.fett).fontSize(14).fillColor('#ffffff')
               .text(eur(k.brutto), PDF_L, sy + 9, { width: PDF_W - 14, align: 'right' });
            doc.y = sy + 46;

            pdfZeile(doc, 'Durchschnittspreis', `${eur(k.brutto)} ÷ ${nf(k.kwh, 2)} kWh`,
                     `${nf(k.bruttoProKwh * 100, 3)} ct/kWh`);
            pdfZeile(doc, 'Kosten je m³', `${eur(k.brutto)} ÷ ${nf(m.m3, 3)} m³`, `${eur(k.bruttoProM3)}/m³`);
            pdfZeile(doc, 'Kosten je Tag', `${eur(k.brutto)} ÷ ${k.tage} Tage`, `${eur(k.bruttoProTag)}/Tag`);
            pdfZeile(doc, 'Vormonat',
                     m.vorM3 > 0 ? `${nf(m.vorM3, 3)} m³` : 'keine Daten vorhanden',
                     m.vorM3 > 0
                        ? `${eur(m.vorKosten)}${m.deltaProzent === null ? '' : '  (' + (m.deltaProzent > 0 ? '+' : '') + nf(m.deltaProzent, 1) + ' %)'}`
                        : '–');

            // ---- Abschlag ---------------------------------------------------
            if (ABSCHLAG_EUR > 0) {
                if (doc.y + 130 > 780) doc.addPage();
                pdfAbschnitt(doc, 'Abschlag');
                pdfZeile(doc, 'Gezahlter Abschlag', 'monatlich, brutto', eur(m.abschlag));
                pdfZeile(doc, 'Tatsächliche Kosten', 'brutto', `- ${eur(k.brutto)}`);
                const positiv = m.saldo >= 0;
                if (doc.y > 720) doc.addPage();
                const ay = doc.y + 2;
                doc.roundedRect(PDF_L, ay, PDF_W, 28, 6)
                   .fillAndStroke(positiv ? '#e8f5ee' : '#fdecea', positiv ? FARBE.gruen : FARBE.rot);
                doc.font(SCHRIFT.fett).fontSize(10).fillColor(positiv ? FARBE.gruen : FARBE.rot)
                   .text(positiv ? 'Guthaben' : 'Nachzahlung', PDF_L + 14, ay + 9);
                doc.font(SCHRIFT.fett).fontSize(12).fillColor(positiv ? FARBE.gruen : FARBE.rot)
                   .text(eur(Math.abs(m.saldo)), PDF_L, ay + 8, { width: PDF_W - 14, align: 'right' });
                doc.y = ay + 40;
            }

            // ---- Tagesverbrauch ---------------------------------------------
            const zeilenHoehe = 14;
            const benoetigt = Math.ceil(m.tage.length / 2) * zeilenHoehe + 40;
            if (doc.y + benoetigt > 770) doc.addPage();
            pdfAbschnitt(doc, 'Tagesverbrauch');
            const maxTag = Math.max(...m.tage.map(e => e.v), 0.001);
            const spalten = 2;
            const spaltenBreite = (PDF_W - 20) / spalten;
            const proSpalte = Math.ceil(m.tage.length / spalten);
            const startY = doc.y;
            let maxY = startY;
            m.tage.forEach((e, i) => {
                const sp = Math.floor(i / proSpalte);
                const zi = i % proSpalte;
                const x = PDF_L + sp * (spaltenBreite + 20);
                const y = startY + zi * zeilenHoehe;
                doc.font(SCHRIFT.normal).fontSize(8).fillColor(FARBE.text)
                   .text(datumDe(e.d).slice(0, 6), x, y, { width: 38 });
                const bw = Math.max(1, (e.v / maxTag) * (spaltenBreite - 130));
                doc.roundedRect(x + 42, y + 2, bw, 6, 3).fill(FARBE.dunkel);
                doc.font(SCHRIFT.normal).fontSize(8).fillColor(FARBE.text)
                   .text(`${nf(e.v, 2)} m³`, x + spaltenBreite - 84, y, { width: 44, align: 'right' });
                doc.font(SCHRIFT.normal).fontSize(8).fillColor(FARBE.grau)
                   .text(eur(kosten(e.v, 1, k.tageBasis).brutto), x + spaltenBreite - 38, y,
                         { width: 38, align: 'right' });
                maxY = Math.max(maxY, y + zeilenHoehe);
            });
            doc.y = maxY + 10;

            // ---- Fußzeilen auf allen Seiten ---------------------------------
            const seiten = doc.bufferedPageRange();
            for (let i = 0; i < seiten.count; i++) {
                doc.switchToPage(seiten.start + i);
                const unten = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;     // sonst erzeugt der Text neue Seiten
                const fy = doc.page.height - 42;
                doc.moveTo(PDF_L, fy - 8).lineTo(PDF_R, fy - 8)
                   .lineWidth(0.4).strokeColor(FARBE.linie).stroke();
                doc.font(SCHRIFT.normal).fontSize(6.8).fillColor(FARBE.grau)
                   .text(`Gasabrechnung ${m.name} · ioBroker, ${datumDe(tag(m.erstellt))} · ` +
                         'kein eichfähiges Messmittel',
                         PDF_L, fy, { width: PDF_W - 45, lineBreak: false });
                doc.text(`${i + 1} / ${seiten.count}`, PDF_L, fy, { width: PDF_W, align: 'right', lineBreak: false });
                doc.page.margins.bottom = unten;
            }

            doc.end();
        } catch (e) {
            log(`[Gas] PDF-Erstellung fehlgeschlagen: ${e.message}`, 'warn');
            resolve(null);
        }
    });
}

// ================================== Versand =================================

function sendeTelegram(text, zusatz = {}) {
    if (!TELEGRAM_INSTANZ) return false;
    const msg = Object.assign({ text, parse_mode: 'HTML', disable_notification: false }, zusatz);
    if (TELEGRAM_USER) msg.user = TELEGRAM_USER;
    try {
        sendTo(TELEGRAM_INSTANZ, 'send', msg);
        return true;
    } catch (e) {
        log(`[Gas] Telegram-Versand fehlgeschlagen: ${e.message}`, 'warn');
        return false;
    }
}

function sendeTelegramDatei(pfad, caption) {
    if (!TELEGRAM_INSTANZ || !pfad) return false;
    const msg = { text: pfad, type: 'document', caption };
    if (TELEGRAM_USER) msg.user = TELEGRAM_USER;
    try {
        sendTo(TELEGRAM_INSTANZ, 'send', msg);
        return true;
    } catch (e) {
        log(`[Gas] Telegram-Dateiversand fehlgeschlagen: ${e.message}`, 'warn');
        return false;
    }
}

function sendeEmail(betreff, html, anhang) {
    if (!EMAIL_INSTANZ || !EMAIL_AN) return false;
    const msg = { to: EMAIL_AN, subject: betreff, html };
    if (EMAIL_VON) msg.from = EMAIL_VON;
    if (anhang) {
        msg.attachments = [{ path: anhang, filename: anhang.split('/').pop() }];
    }
    try {
        sendTo(EMAIL_INSTANZ, 'send', msg);
        return true;
    } catch (e) {
        log(`[Gas] E-Mail-Versand fehlgeschlagen: ${e.message}`, 'warn');
        return false;
    }
}

// ================================= Berichte =================================

async function sendeTagesbericht(datum) {
    const t = tagesDaten(datum);
    if (!t) {
        log('[Gas] Tagesbericht übersprungen – noch kein abgeschlossener Tag in der Historie. ' +
            'Der erste Bericht ist nach dem nächsten Tagesabschluss möglich.', 'warn');
        return;
    }
    if (sendeTelegram(textTagesbericht(t))) {
        log(`[Gas] Tagesbericht ${t.datum} gesendet: ${nf(t.m3, 3)} m³ / ${eur(t.kosten.brutto)}`);
    }
}

/** Jahressaldo aus dem Archiv neu bilden */
async function saldoAktualisieren(jahr) {
    const archiv = jsonState(ID_ARCHIV, {});
    const summe = Object.keys(archiv)
        .filter(k => k.startsWith(String(jahr)))
        .reduce((s, k) => s + (Number(archiv[k].saldo) || 0), 0);
    await setStateAsync(ID_SALDO_JAHR, r2(summe), true);
    return summe;
}

async function sendeMonatsbericht(key) {
    const schluessel = key || monatPlus(monat(), -1);
    const m = monatsDaten(schluessel);

    if (!m.tage.length && m.m3 <= 0) {
        log(`[Gas] Monatsbericht ${schluessel} übersprungen – keine Daten vorhanden. ` +
            `Zum Testen einen Monat mit Daten in ${ID_MONATSWAHL} eintragen (Format YYYY-MM).`, 'warn');
        return;
    }

    // Archiv fortschreiben (idempotent – erneutes Senden verfälscht den Saldo nicht)
    const archiv = jsonState(ID_ARCHIV, {});
    archiv[schluessel] = {
        m3: r(m.m3), kwh: r2(m.kosten.kwh), netto: r2(m.kosten.netto),
        brutto: r2(m.kosten.brutto), abschlag: r2(m.abschlag), saldo: r2(m.saldo),
        standVon: m.standVon, standBis: m.standBis
    };
    const keys = Object.keys(archiv).sort();
    while (keys.length > 36) delete archiv[keys.shift()];
    await setStateAsync(ID_ARCHIV, JSON.stringify(archiv), true);
    const jahresSaldo = await saldoAktualisieren(schluessel.slice(0, 4));

    const pdf = await pdfMonatsbericht(m);
    if (pdf) await setStateAsync(ID_PDF_PFAD, pdf, true);

    // Telegram
    let text = textMonatsbericht(m);
    if (ABSCHLAG_EUR > 0) {
        const js = jahresSaldo >= 0 ? 'Guthaben' : 'Nachzahlung';
        text += `\n<i>Jahressaldo ${schluessel.slice(0, 4)}: ${js} ${eur(Math.abs(jahresSaldo))}</i>`;
    }
    sendeTelegram(text);
    if (pdf && PDF_PER_TELEGRAM) sendeTelegramDatei(pdf, `Gasabrechnung ${m.name}`);

    // E-Mail
    sendeEmail(`Gasabrechnung ${m.name} – ${nf(m.m3, 2)} m³ / ${eur(m.kosten.brutto)}`,
               htmlMonatsbericht(m), pdf);

    await setStateAsync(ID_LETZTER_BER, schluessel, true);
    log(`[Gas] Monatsbericht ${schluessel} versendet: ${nf(m.m3, 3)} m³, ${eur(m.kosten.brutto)}` +
        (pdf ? `, PDF ${pdf}` : ', ohne PDF'));
}

// --------------------------------- Trigger ----------------------------------

let bereit = false;
let laeuft = false;

/** verhindert überlappende Läufe (Backfill und Berichte können dauern) */
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
on({ id: SRC, change: 'ne' }, async obj => {
    // Durchfluss sofort und unabhängig von der Sperre aktualisieren
    try {
        if (bereit && obj && obj.state) {
            const rohWert = parseFloat(obj.state.val);
            await ankerPruefen(rohWert);
            await durchflussUpdate(korrigiere(rohWert), obj.state.ts || Date.now());
        }
    } catch (e) {
        log(`[Gas] Fehler Durchfluss: ${e.message}`, 'error');
    }
    await sicher(berechne);
});

// jede Minute: Durchfluss auf 0, wenn der Zähler steht
schedule('* * * * *', () => durchflussNullPruefung().catch(e =>
    log(`[Gas] Fehler Durchfluss: ${e.message}`, 'error')));

// Mitternacht: Tag abschließen (auch wenn der Zähler gerade stillsteht)
schedule('1 0 * * *', () => sicher(berechne));

// Sicherheitsnetz: stündlich neu rechnen
schedule('5 * * * *', () => sicher(berechne));

// Tagesübersicht per Telegram
if (TAGESBERICHT_AKTIV) {
    schedule(TAGESBERICHT_CRON, () => sicher(async () => {
        await berechne();               // Tagesabschluss sicherstellen
        await sendeTagesbericht();
    }));
}

// Monatsabrechnung per Telegram und E-Mail
if (MONATSBERICHT_AKTIV) {
    schedule(MONATSBERICHT_CRON, () => sicher(async () => {
        await berechne();
        await sendeMonatsbericht();
    }));
}

// Eingabe eines abgelesenen Zählerstands
on({ id: ID_ABLESUNG, ack: false }, obj => sicher(async () => {
    const wert = parseFloat(obj.state.val);
    await neueAblesung(wert, obj.state.ts || Date.now());
    await setStateAsync(ID_ABLESUNG, wert, true);
    await berechne();
}));

// Button: Historie neu aus dem History-Adapter aufbauen
on({ id: ID_BACKFILL, val: true, ack: false }, () => sicher(async () => {
    await backfill();
    await berechne();
    await setStateAsync(ID_BACKFILL, false, true);
}));

// Button: Tagesbericht von Hand senden
on({ id: ID_SEND_TAG, val: true, ack: false }, () => sicher(async () => {
    await sendeTagesbericht();
    await setStateAsync(ID_SEND_TAG, false, true);
}));

// Button: Monatsbericht von Hand senden.
// Steht in <PFAD>.Bericht.MonatFuerBericht ein Monat 'YYYY-MM', wird dieser
// abgerechnet – sonst der Vormonat. Praktisch zum Testen.
on({ id: ID_SEND_MONAT, val: true, ack: false }, () => sicher(async () => {
    const wahl = String((getState(ID_MONATSWAHL) || {}).val || '').trim();
    const key  = /^\d{4}-\d{2}$/.test(wahl) ? wahl : undefined;
    if (wahl && !key) log(`[Gas] "${wahl}" ist kein gültiger Monat (Format YYYY-MM) – es wird der Vormonat abgerechnet`, 'warn');
    await sendeMonatsbericht(key);
    await setStateAsync(ID_SEND_MONAT, false, true);
}));

// ----------------------------------- Start ----------------------------------

(async () => {
    if (!existsState(SRC)) {
        log(`[Gas] Quell-State "${SRC}" existiert nicht – bitte SRC anpassen!`, 'error');
        return;
    }
    await initStates();

    if (KORREKTUR_AKTIV) {
        anker = ankerLaden();
        if (anker) {
            log(`[Gas] Anker: ${r(anker.ablesung)} m³ vom ${new Date(anker.t).toLocaleString()}, ` +
                `Faktor ${r6(anker.faktor)}`);
        } else {
            log(`[Gas] Noch kein Ankerpunkt – bitte einmal den abgelesenen Zählerstand in ${ID_ABLESUNG} eintragen`);
        }
    }

    if (DURCHFLUSS_AKTIV) {
        if (LUECKE_MIN > NULL_NACH_MIN) {
            log(`[Gas] LUECKE_MIN (${LUECKE_MIN}) sollte nicht größer als NULL_NACH_MIN (${NULL_NACH_MIN}) sein`, 'warn');
        }
        const st = getState(SRC);
        const v = st ? korrigiere(parseFloat(st.val)) : NaN;
        const t = st ? (st.lc || st.ts) : NaN;
        if (isFinite(v) && isFinite(t)) {
            proben = [{ t, v }];
            await setStateAsync(ID_LETZTE, t, true);
        }
        flowAktuell = null;
        // nach Neustart ist der aktuelle Durchfluss unbekannt: 0, bis die nächste Änderung kommt
        await setzeDurchfluss(0);
    }

    bereit = true;

    const leer = ladeHistorie().length === 0;
    if (leer && BACKFILL_BEIM_START && HISTORY_INSTANCE) {
        await sicher(backfill);
    }

    await sicher(berechne);

    log(`[Gas] Verbrauchsstatistik gestartet – Tarif ${nf(ARBEITSPREIS_CT_KWH, 2)} ct/kWh netto, ` +
        `Grundpreis ${eur(GRUNDPREIS_EUR_MONAT)}/Monat netto, MwSt ${nf(MWST_PROZENT, 0)} %` +
        (TAGESBERICHT_AKTIV ? `, Tagesbericht ${TAGESBERICHT_CRON}` : '') +
        (MONATSBERICHT_AKTIV ? `, Monatsbericht ${MONATSBERICHT_CRON}` : ''));
})();