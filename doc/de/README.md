![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" /></a>
</p>

---

## Wolf-Heizungs-Widgets für ioBroker VIS-2

VIS-2-Widgets, die eine [WOLF](https://www.wolf.eu/)-Heizungsanlage in ioBroker darstellen und bedienbar machen.

Das Widget-Set liest selbst keine Daten aus der Heizung. Jeder Wert wird einzeln an ein vorhandenes ioBroker-Objekt gebunden — zum Beispiel aus dem Adapter `wolf-smartset`, dem Adapter `wolf` (ISM8i), Modbus oder eigenen Skripten.

> **Stand:** frühe Entwicklung. Verfügbar sind alle acht Widgets: Anlagenschema, Kesselstatus, Heizkreis, Heizkurve, Warmwasser, Verläufe, Meldungen und Gaszähler.

### Widgets

| Widget | Zweck |
|---|---|
| Anlagenschema | Hydraulisches Schema mit Brennerflamme, Speicher, bis zu vier Heizkreisen und Flussanimation dort, wo Wasser fließt |
| Kesselstatus | Betriebsphase, Brenner, Bögen für Modulation und Wasserdruck (nur wenn verknüpft), Betriebsstunden, Brennerstarts, Vor- und Rücklauf |
| Heizkreis | Betriebsart, Tag- und Spartemperatur, Sollwertkorrektur, Zeitprogramm — schreibend |
| Heizkurve | Näherungskurve mit dem Betriebspunkt der Regelung; Sollwertkorrektur schreibend |
| Warmwasser | Speicher mit Sollmarke, Solltemperatur, Zeitprogramm, optional Zirkulation und Sofortladung — schreibend |
| Verläufe | Bis zu vier Kurven und eine Fläche im Hintergrund aus history, SQL oder InfluxDB; 6 Stunden bis 7 Tage |
| Meldungen | Störungs-LED und Zustandsliste: frei einstellbare Prüfungen, Sammelstörung, Störcode, Meldungsliste |
| Gaszähler | Zählerstand in sieben Zählwerk-Varianten, Durchfluss, Tages- und Monatsverbrauch, Kosten, Sensorhinweise |

<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_schema.png" height="110" alt="Anlagenschema"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_boiler.png" height="110" alt="Kesselstatus"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_circuit.png" height="110" alt="Heizkreis"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_heatcurve.png" height="110" alt="Heizkurve">
<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_dhw.png" height="110" alt="Warmwasser"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_trends.png" height="110" alt="Verläufe"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_messages.png" height="110" alt="Meldungen"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_gasmeter.png" height="110" alt="Gaszähler">

### Gemeinsame Einstellungen

- **Farbschema:** jedes Widget hat *Farbschema* — automatisch (wie VIS-2, Vorgabe), hell oder dunkel.
- **Objekte:** Jeder Wert wird mit der Objektauswahl verknüpft. Grenzen, Schrittweite und Klartexte
  kommen aus dem Objekt (`common.min`, `max`, `step`, `states`); Felder im Widget überschreiben sie nur.
- **Schmale Kacheln:** Alle Widgets funktionieren bis etwa 260 px Breite. Das Anlagenschema stellt
  sich unter 480 px hochkant, damit die Beschriftung lesbar bleibt.
- **Tastatur:** Alle Bedienelemente sind mit Tab erreichbar; in den Verläufen verschieben die
  Pfeiltasten das Fadenkreuz.

#### Schreibende Widgets

Heizkreis, Warmwasser und Heizkurve schreiben mit `ack: false` und zeigen den Wert als
*wird übernommen …*, bis die Quelle genau diesen Wert mit `ack: true` bestätigt. Eine ältere
Bestätigung mit anderem Wert beendet das Warten nicht. Ohne Bestätigung meldet das Widget nach der
Wartezeit *keine Bestätigung* und zeigt wieder den zuletzt bestätigten Wert. Objekte mit
`common.write: false` sperren ihre Bedienelemente (*schreibgeschützt*).

| Feld | Vorgabe | Bedeutung |
|---|---|---|
| Verzögerung vor dem Schreiben | 800 ms | Stepper warten, bis nicht mehr geklickt wird, und schreiben dann einmal |
| Wartezeit auf Bestätigung | 10 s | Zeit bis *keine Bestätigung* erscheint |
| Vor dem Schreiben bestätigen | aus | Änderungen werden erst nach *Übernehmen* geschrieben |

`wolf-smartset` spricht mit der Wolf-Cloud. Kommt die Bestätigung erst mit der nächsten Abfrage,
die *Wartezeit auf Bestätigung* entsprechend erhöhen (bis 300 s). Eine späte Bestätigung wird
trotzdem noch angenommen.

### Einrichtung mit wolf-smartset (ISM7)

Die Objekt-IDs von `wolf-smartset` sind Nummern; der lesbare Name steht im Objektbrowser in der
Spalte *Name* — danach suchen. Die Ordnernamen enthalten Nummern, die je Anlage abweichen können;
die IDs unten sind deshalb Beispiele aus einer Anlage (Wolf-Gasgerät mit Bedienmodul BM, ISM7).
Werte unter `Fachmann` gibt es nur, wenn in der `wolf-smartset`-Instanz die Fachmannebene
aktiviert ist. Alle IDs beginnen mit `wolf-smartset.0.`.

**Anlagenschema**

| Feld | Objektname | Beispiel-ID |
|---|---|---|
| Vorlauf | VF Vorlauffühler | `Benutzer.Übersicht.8000500001` |
| Rücklauf | RLF Rücklauffühler | `Benutzer.Übersicht.8000700001` |
| Brenner | Flamme | `Benutzer.Heizung.210_Wärmeerzeuger_1.8000900001` |
| Kesselpumpe | KKP Kesselkreispumpe (Ein/Aus) — oder PWM Pumpe (%) | `Benutzer.Übersicht.8001700001` — oder `Benutzer.Heizung.210_Wärmeerzeuger_1.8000400001` |
| Außentemperatur | Außentemperatur | `Benutzer.Heizung.058_Direkter_Heizkreis.3000100000` |
| Speichertemperatur | SF Speicherfühler | `Benutzer.Übersicht.8000100001` |
| Ladung aktiv | Ausgang A1 (wenn A1 die Speicherladepumpe ist, Parameter HG14 = 6) | `Fachmann.Heizgerät.Heizgerät.422_Einstellungen_und Anzeigen.8001900001` |
| Heizkreis 1, Vorlauf | VF Vorlauffühler (direkter Heizkreis ohne Mischer) | `Benutzer.Übersicht.8000500001` |

Einen Modulationsgrad liefert das ISM7 nicht — leer lassen; die Flamme erscheint dann bei
brennendem Brenner voll. Die Pumpe des Heizkreises leer lassen: Der Kreis folgt dann der
Kesselpumpe. Geräte, die den Speicher über ein Umschaltventil statt über eine Ladepumpe laden,
können für *Ladung aktiv* das *3WUV 3-Wege-Umschaltventil* (`Benutzer.Übersicht.8001800001`)
nehmen — jeder Wert ungleich 0 gilt als Ladung; prüfen, welche Stellung das Gerät für Warmwasser
meldet.

**Kesselstatus**

| Feld | Objektname | Beispiel-ID |
|---|---|---|
| Betriebsphase | HG Status | `Fachmann.Heizgerät.Heizgerät.422_Einstellungen_und Anzeigen.8002000001` |
| Brenner | Flamme | `Benutzer.Heizung.210_Wärmeerzeuger_1.8000900001` |
| Betriebsstunden | Brennerbetriebsstunden | `Benutzer.Heizung.210_Wärmeerzeuger_1.8008400001` |
| Brennerstarts | Brennerstarts | `Benutzer.Heizung.210_Wärmeerzeuger_1.8008500001` |
| Vorlauf / Rücklauf | VF Vorlauffühler / RLF Rücklauffühler | `Benutzer.Übersicht.8000500001` / `…8000700001` |

Modulation und Wasserdruck liefert das ISM7 nicht; ohne Objekt bleiben die Bögen ausgeblendet.

**Heizkreis**

| Feld | Objektname | Beispiel-ID |
|---|---|---|
| Betriebsart | Betriebsart | `Benutzer.Heizung.058_Direkter_Heizkreis.3001800000` |
| Tag- / Spartemperatur | Tagtemperatur / Spartemperatur | `…058_Direkter_Heizkreis.1000000000` / `…1000100000` |
| Sollwertkorrektur | Sollwertkorrektur | `…058_Direkter_Heizkreis.3001900000` |
| Zeitprogramm | Zeitprogramm direkter Heizkreis | `…058_Direkter_Heizkreis.1000200000` |
| Raumtemperatur / wirksamer Raumsollwert | Raumtemperatur / Raumsolltemperatur | `…058_Direkter_Heizkreis.1001200000` / `…1001300000` |
| Vorlauf Soll | Vorlaufsolltemperatur | `Benutzer.Heizung.210_Wärmeerzeuger_1.8000600001` |

**Heizkurve**

| Feld | Objektname | Beispiel-ID |
|---|---|---|
| Sollwertkorrektur | Sollwertkorrektur | `Benutzer.Heizung.058_Direkter_Heizkreis.3001900000` |
| Steilheit | Heizkurve (über `wolf-smartset` nur lesend) | `Fachmann.Heizgerät.Heizgerät.058_Direkter_Heizkreis.1000300000` |
| Außentemperatur | Außentemperatur | `Benutzer.Heizung.058_Direkter_Heizkreis.3000100000` |
| Außentemperatur gemittelt | Außentemperatur gemittelt | `Fachmann.Bedienmodul_BM0.…422_Einstellungen_und Anzeigen.3000200000` |
| Vorlauf Soll | Vorlaufsolltemperatur | `Benutzer.Heizung.210_Wärmeerzeuger_1.8000600001` |
| Raumsollwert | Tagtemperatur | `Benutzer.Heizung.058_Direkter_Heizkreis.1000000000` |
| Ladung aktiv | Ausgang A1 | `Fachmann.Heizgerät.Heizgerät.422_Einstellungen_und Anzeigen.8001900001` |

**Warmwasser**

| Feld | Objektname | Beispiel-ID |
|---|---|---|
| Speichertemperatur | SF Speicherfühler | `Benutzer.Übersicht.8000100001` |
| Solltemperatur | Eingestellte Warmwassersolltemperatur | `Benutzer.Warmwasser.250_Warmwasser.3006600000` |
| wirksamer Speichersollwert | Speichersolltemperatur | `Benutzer.Warmwasser.250_Warmwasser.8000200001` |
| Zeitprogramm | Zeitprogramm Warmwasser | `Benutzer.Warmwasser.250_Warmwasser.3006700000` |
| Ladung aktiv | Ausgang A1 | `Fachmann.Heizgerät.Heizgerät.422_Einstellungen_und Anzeigen.8001900001` |

Zirkulation und Sofortladung gibt es über das ISM7 in dieser Anlage nicht; ohne Objekt bleiben sie
ausgeblendet.

**Meldungen** — drei Prüfungen: *TW-Vorlauf* (`Fachmann.Heizgerät.Heizgerät.422_Einstellungen_und Anzeigen.8001100001`)
und *TW-Abgas* (`…8001200001`), beide mit Schweregrad *Störung* (1 = i. O., 0 = ausgelöst), dazu die
Verbindung `wolf-smartset.0.info.connection` mit Schweregrad *Warnung* und dem Text *getrennt*.

**Verläufe** — zum Beispiel Vorlauf, Rücklauf und Außentemperatur als Kurven und *PWM Pumpe* (%)
als Fläche. Vorher im Verlaufsadapter die Aufzeichnung dieser Objekte einschalten.

### Hinweise zu den Widgets

#### Anlagenschema

Die Pfeile laufen nur, wo Wasser fließt: Vor- und Rücklauf solange die Kesselpumpe läuft (ohne
Pumpen-Objekt: solange der Brenner brennt), der Speicherzweig während der Ladung, jeder Heizkreis
solange seine Pumpe läuft (ohne Pumpen-Objekt: wie das Heizgerät). Speicher, Außentemperatur und
null bis vier Heizkreise lassen sich ein- und ausblenden; das Schema ordnet sich danach an.

#### Heizkurve: eine Näherung

Wolf veröffentlicht keine Formel für die Heizkurve. Das Widget zeichnet deshalb die übliche
Näherung `Vorlauf = TR + N + K + S · max(0, TR − TA)^n` (Raumsollwert `TR`, Niveau `N`,
Sollwertkorrektur `K`, Steilheit `S`, gemittelte Außentemperatur `TA`, Krümmung `n`, Vorgabe 1) und
kennzeichnet sie so. Der Betriebspunkt dagegen kommt aus der Regelung selbst (ihr Vorlauf-Soll) —
eine Abweichung zwischen beiden ist also sichtbar. Über `wolf-smartset` ist nur die
Sollwertkorrektur schreibbar; die Steilheit wird angezeigt, aber nicht verstellt, ein Niveau gibt
es nicht. Während der Speicherladung ist der Betriebspunkt als verfälscht markiert.

#### Verläufe

Verlaufsinstanz wählen (leer: Standard des Systems), dazu Zeitraum (6 Stunden bis 7 Tage) und
Verdichtung (Mittelwert, Minimum/Maximum, Rohwerte). Das Widget fragt den Verlauf beim Start und
danach alle paar Minuten ab (*Aktualisieren alle*); dazwischen hängt es den aktuellen Wert am
rechten Rand an. Mit der Maus auf das Diagramm zeigen — oder es fokussieren und die Pfeiltasten
nutzen —, dann zeigt die Legende die Werte zu diesem Zeitpunkt.

#### Meldungen

Jede Prüfung vergleicht ein Objekt mit dem Wert für „in Ordnung" (leer: wahr bzw. ungleich 0 ist in
Ordnung). Weicht es ab, bekommt die Zeile den gewählten Schweregrad und den Text aus dem Widget oder
den Klartext des Objekts. Sortiert wird Störung → Warnung → Hinweis → in Ordnung; die Zeit ist die
letzte Zustandsänderung. Die LED wird rot, sobald eine Zeile eine Störung ist. Für Anlagen mit
Störcode gibt es zusätzlich *Sammelstörung*, *Störcode* mit Klartexten (`Code=Text;…`) und eine
*Meldungsliste* (JSON-Array mit `text`, `ts`, `severity`).

#### Gaszähler: Verbrauch aus dem Verlauf

Sind für Heute und Monat keine Objekte verknüpft, rechnet der Gaszähler beide aus dem Verlauf des
Zählerstands (`sql`, `history` oder `influxdb`, Vorgabe: die Verlaufsinstanz des Systems): Stand
jetzt minus Stand zu Tages- bzw. Monatsbeginn. Sensoren wie der HomematicIP HmIP-ESI zählen ab
ihrem Einbau, nicht ab dem Zählerstand — die Differenz als Korrekturwert eintragen. Mit einem
HmIP-ESI im Gasmodus zum Beispiel:

| Feld | Objekt |
|---|---|
| Zählerstand | `hm-rpc.<n>.<Seriennummer>.2.GAS_VOLUME` |
| Momentandurchfluss | `hm-rpc.<n>.<Seriennummer>.1.GAS_FLOW` |
| Zählerstatus / nicht erreichbar / Batterie schwach | `….2.GAS_VOLUME_STATUS` / `….0.UNREACH` / `….0.LOW_BAT` |

### Voraussetzungen

- js-controller >= 7.2.2
- vis-2 >= 2.20.0 (erste vis-2-Version mit React 19)
- Node.js >= 22

### Haftungsausschluss

WOLF und das WOLF-Logo sind Marken der WOLF GmbH. Dieses Projekt steht in keiner Verbindung zur WOLF GmbH und wird von ihr weder unterstützt noch empfohlen. Es stellt nur Daten dar, die andere ioBroker-Adapter liefern.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### 0.4.1 (2026-09-19)
* (ssbingo) Buy-Me-a-Coffee-Button oben in allen README-Dateien.

### 0.4.0 (2026-09-19)
* (ssbingo) Vorschaubild für jedes Widget in der VIS-2-Palette; schmale Kacheln bis etwa 260 px (das Anlagenschema stellt sich hochkant); Verläufe mit der Tastatur bedienbar; Anleitung mit der Einrichtung für wolf-smartset (ISM7).

### 0.3.0 (2026-09-19)
* (ssbingo) Neue Widgets: Anlagenschema mit Flussanimation, Verläufe aus history, sql oder influxdb und Meldungen als Zustandsliste mit Störungs-LED — damit sind alle acht Widgets verfügbar.

### 0.2.0 (2026-09-18)
* (ssbingo) Erste Version: Widget-Set für VIS-2 (React 19) mit Gaszähler, Kesselstatus, Heizkreis, Warmwasser und Heizkurve. Bedienende Widgets zeigen einen Wert erst nach der Bestätigung (ack); die Heizkurve ist eine Näherung (keine Wolf-Formel). Der Gaszähler rechnet Tages- und Monatsverbrauch aus dem Verlauf.

## Lizenz

MIT — siehe [LICENSE](../../LICENSE)
