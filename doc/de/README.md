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
| Gaszähler | Zählerstand in sieben Zählwerk-Varianten, Durchfluss, Verbrauch von Tag bis Vormonat, Kosten, Sensorhinweise |

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

`wolf-smartset` bestätigt einen geschriebenen Wert, sobald die Wolf-Cloud ihn angenommen hat — im
Test mit einem ISM7 etwa 1,5 s nach dem Klick, die 800 ms Verzögerung eingerechnet —, die Vorgabe
von 10 s reicht also gut. Bei langsamer Verbindung die *Wartezeit auf Bestätigung* erhöhen (bis
300 s); eine späte Bestätigung wird trotzdem noch angenommen.

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
| 3-Wege-Umschaltventil | 3WUV 3-Wege-Umschaltventil | `Benutzer.Übersicht.8001800001` |
| Heizkreis 1, Vorlauf | VF Vorlauffühler (direkter Heizkreis ohne Mischer) | `Benutzer.Übersicht.8000500001` |

Einen Modulationsgrad liefert das ISM7 nicht — leer lassen; die Flamme erscheint dann bei
brennendem Brenner voll. Die Pumpe des Heizkreises leer lassen: Der Kreis folgt dann der
Kesselpumpe.

Das *3-Wege-Umschaltventil* unbedingt verknüpfen, wenn das Gerät eines hat: Es teilt dem Schema
mit, wohin das Kesselwasser gerade läuft. Bei dieser Anlage meldet es `1` für Warmwasser — der
Wert steht im Feld *Wert für Warmwasser* und lässt sich dort anpassen, falls das Gerät es anders
handhabt (im Objektbaum oder in der Wolf-Oberfläche vergleichen).

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

#### Objekte aus der Anlage vorbelegen

Jedes Widget außer dem Gaszähler hat als erstes Feld der Gruppe *Objekte* die
**Anlage (Adapterinstanz)**. Dort eine Instanz von `wolf-smartset` (ISM7) oder `wolf` (ISM8i)
wählen — das Widget trägt die passenden Objekte selbst ein. Ohne Auswahl bleibt alles wie bisher
von Hand verknüpfbar, und eingetragene Objekte lassen sich danach einzeln ändern oder löschen.

Wie die Zuordnung funktioniert:

- **wolf-smartset** bildet die Anlagenstruktur in den Objekt-IDs ab, und die heißt je Anlage
  anders. Stabil ist die Wolf-Parameternummer in `native.ParameterId` — daran erkennt das Widget
  die Objekte, unabhängig von den Kanalnamen der eigenen Anlage.
- **wolf (ISM8i)** hat eine feste Struktur `<instanz>.<gerät>.<nummer>`, zum Beispiel `hg1_t.4`
  für die Kesseltemperatur oder `bm1_t.57` für die Programmwahl des Heizkreises. Diese Nummern
  stammen aus dem Adapter selbst (`js/datapoints.json`).

| Widget | vorbelegt |
|---|---|
| Anlagenschema | Vorlauf, Rücklauf, Brenner, Kesselpumpe, Außentemperatur, Speicher, Ladung, Umschaltventil, Heizkreis 1 |
| Kesselstatus | Betriebsphase, Brenner, Betriebsstunden, Brennerstarts, Vorlauf, Rücklauf (ISM8i zusätzlich Modulation und Anlagendruck) |
| Heizkreis | Betriebsart, Tag- und Spartemperatur, Sollwertkorrektur, Zeitprogramm, Raumtemperatur, Raumsollwert, Vorlauf Soll |
| Heizkurve | Sollwertkorrektur, Steilheit, Außentemperatur (auch gemittelt), Vorlauf Soll, Raumsollwert, Ladung |
| Warmwasser | Speichertemperatur, Solltemperatur, Zeitprogramm, wirksamer Sollwert, Ladung (ISM8i zusätzlich Sofortladung) |
| Meldungen | die beiden Temperaturwächter (ISM8i: die Störungsmeldungen von Heizgerät und Bedienmodul) |
| Verläufe | Vorlauf, Rücklauf, Außentemperatur und Warmwasser als Kurven |

Was ein Adapter nicht liefert, bleibt leer: über `wolf-smartset` gibt es weder Modulation noch
Anlagendruck, über das ISM8i weder Tag- und Spartemperatur noch Betriebsstunden, Zeitprogrammwahl
oder Heizkurve. Beim Anlagenschema wird der *Wert für Warmwasser* des Umschaltventils gleich
mitgesetzt — `1` bei wolf-smartset, `Open` beim ISM8i (dort `true`, wenn der Adapter Schaltzustände
als Wahrheitswerte ablegt).

#### Anlagenschema

Die Pfeile laufen nur, wo Wasser fließt: Vor- und Rücklauf solange die Kesselpumpe läuft (ohne
Pumpen-Objekt: solange der Brenner brennt), der Speicherzweig während der Ladung, jeder Heizkreis
solange seine Pumpe läuft (ohne Pumpen-Objekt: wie das Heizgerät). Speicher, Außentemperatur und
null bis vier Heizkreise lassen sich ein- und ausblenden; das Schema ordnet sich danach an.

Ist das *3-Wege-Umschaltventil* verknüpft, entscheidet es über die Verzweigung: Steht es auf
Warmwasser, lädt nur der Speicher und die Heizkreise stehen still — auch bei laufender Kesselpumpe
und brennendem Brenner, und auch dann, wenn ein Kreis eine eigene Pumpe hat. Genau das passiert im
Sommerbetrieb während der Speicherladung. Ohne Ventil bleibt es beim bisherigen Verhalten. Für den
Speicherzweig zählt ein eigenes Objekt *Ladung aktiv* zuerst; fehlt es, gilt die Ventilstellung.

#### Heizkreis: sichtbare Blöcke

In der Gruppe *Sichtbare Blöcke* lässt sich jeder Block einzeln abschalten: Betriebsart,
Tagtemperatur, Spartemperatur, Sollwertkorrektur, Zeitprogramm und die drei Anzeigewerte (Raum
Ist, Raumsoll, Vorlauf Soll). Die Verknüpfung bleibt dabei erhalten, sodass die Kachel auch auf
eine kleine Fläche passt. Ein Schalter erscheint erst, wenn das zugehörige Objekt verknüpft ist;
ohne Objekt bleibt der Block ohnehin aus.

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

#### Gaszähler: Kosten des Monats

Die Kachel rechnet `m³ × Brennwert × Zustandszahl = kWh`, dann `kWh × Arbeitspreis + Grundpreis`.
Brennwert und Zustandszahl stehen auf der Gasrechnung (Vorgaben: 11,482 kWh/m³ und 0,9612).

Der **Arbeitspreis** steht auf den meisten Rechnungen in Cent je Kilowattstunde — dafür gibt es
das Feld *Einheit des Arbeitspreises*: `ct/kWh` wählen und 8,14 eintragen, oder bei `€/kWh`
entsprechend 0,0814. Wer Cent in ein Euro-Feld einträgt, liegt um den Faktor 100 daneben; deshalb
weist die Kachel auf einen Arbeitspreis hin, der außerhalb von 0,01 bis 1,00 €/kWh liegt.

#### Gaszähler: Werte aus dem Statistik-Skript

Dem Adapter liegt das ioBroker-Skript `gasverbrauch_statistik.js` bei. Es berechnet aus dem
Zählerstand *Heute*, *Gestern*, *letzte 7 Tage*, *letzte 30 Tage*, *diesen* und *letzten Monat*
und legt sie als Objekte ab — Einrichtung siehe [Beiliegendes Skript](#beiliegendes-skript-gasverbrauch-statistik).

Im Widget genügt es dann, unter *Statistik-Skript* den Ordner zu wählen: Die vorhandenen States
werden oben als Objekte eingetragen — der Zählerstand nur, wenn dort noch nichts steht, denn er
zeigt meist auf den Sensor selbst.

Welche Werte die Kachel zeigt, entscheidet die Gruppe *Sichtbare Werte*: je ein Schalter für
Heute, Gestern, 7 Tage, 30 Tage, Monat, letzten Monat und die Kosten. Heute, Monat und Kosten
stehen immer zur Wahl, die übrigen Schalter erscheinen, sobald ihr Objekt verknüpft ist. Die
Fußzeile bricht ab vier Werten um; für alle sieben sollte die Kachel etwa 460 px hoch sein.

Ohne das Skript bleibt alles wie bisher: eigene Objekte für Heute und Monat verknüpfen — oder
beide leer lassen und aus dem Verlauf rechnen lassen.

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

### Beiliegendes Skript: Gasverbrauch-Statistik

Ein HmIP-ESI zeigt in der CCU-WebUI *Heute*, *Gestern*, *vergangene 7 Tage* und *vergangene
30 Tage*. Diese Werte sind keine Gerätedatenpunkte — die CCU rechnet sie intern aus gespeicherten
Zählerständen, über `hm-rpc` kommen sie deshalb nicht in ioBroker an. Das beiliegende Skript
`gasverbrauch_statistik.js` erzeugt sie aus dem Zählerstand selbst und ergänzt den laufenden und
den vorigen Monat. Es eignet sich für jeden monoton steigenden Zählerstand, nicht nur für den
HmIP-ESI.

Im laufenden Betrieb braucht es **keinen** History-Adapter: Die Tageswerte liegen als JSON-Ringpuffer
in einem eigenen State und überstehen einen Neustart. Ein History-Adapter ist nur für die einmalige
Vorbefüllung nützlich.

**Woher nehmen**

| Quelle | Pfad |
|---|---|
| Repository | [`addOn/`](https://github.com/ssbingo/ioBroker.vis-2-widgets-wolf/tree/main/addOn) |
| installierter Adapter | `node_modules/iobroker.vis-2-widgets-wolf/widgets/vis-2-widgets-wolf/addon/` |
| im Browser | `http://<iobroker>:8082/vis-2/widgets/vis-2-widgets-wolf/addon/gasverbrauch_statistik.js` |

Daneben liegen `gasverbrauch_statistik.md` und dieselbe Anleitung als PDF (auf Deutsch).

**Einrichten**

1. Im Adapter `javascript` ein neues Skript vom Typ *Javascript/ECMAScript* anlegen.
2. Inhalt von `gasverbrauch_statistik.js` einfügen.
3. Im Kopf mindestens `SRC` auf den Zählerstand setzen — z. B. `hm-rpc.0.<Seriennummer>.2.GAS_VOLUME`
   oder die Rega-Variable `svEnergyCounter…` (dafür in `hm-rega` das Synchronisieren nicht sichtbarer
   Variablen einschalten).
4. Skript starten und das Log prüfen: Die States legt es selbst an.
5. Im Gaszähler-Widget unter *Statistik-Skript* den Ordner wählen.

**Einstellungen im Kopf des Skripts**

| Konstante | Vorgabe | Bedeutung |
|---|---|---|
| `SRC` | `'hm-rega.0.12345'` | Pflicht: State mit dem Zählerstand in m³ |
| `PFAD` | `'0_userdata.0.Gas'` | Ordner für die erzeugten States |
| `INKL_HEUTE` | `false` | `false` zählt in 7/30 Tage nur abgeschlossene Tage (wie die CCU), `true` auch den laufenden |
| `TAGE_HISTORIE` | `70` | vorgehaltene Tageswerte; für *Letzter Monat* mindestens 62 |
| `NK` | `3` | Nachkommastellen der Verbrauchswerte |
| `HISTORY_INSTANCE` | `'influxdb.0'` | Instanz für die Vorbefüllung, auch `history.0` oder `sql.0`; leer schaltet sie ab |
| `BACKFILL_BEIM_START` | `true` | beim allerersten Start automatisch vorbefüllen |
| `DEBUG` | `false` | zusätzliche Log-Ausgaben |

**Erzeugte States** (unterhalb von `PFAD`)

| State | Inhalt | im Widget |
|---|---|---|
| `Zaehlerstand` | gespiegelter Zählerstand in m³ | Zählerstand (nur, wenn dort noch nichts steht) |
| `Heute` | Verbrauch seit Mitternacht | Heute |
| `Gestern` | Verbrauch des Vortags | Gestern |
| `Letzte7Tage` | Summe der letzten 7 Tage | 7 Tage |
| `Letzte30Tage` | Summe der letzten 30 Tage | 30 Tage |
| `DieserMonat` | Summe seit Monatsbeginn inkl. heute | Monat |
| `LetzterMonat` | Summe des Vormonats | Letzter Monat |
| `Basis`, `BasisDatum`, `Historie` | Zählerstand um Mitternacht, dessen Datum, Tageswerte als JSON | intern |
| `Backfill` | Schalter: Historie neu aus dem History-Adapter aufbauen | — |

**Vorbefüllung**

Mit gesetzter `HISTORY_INSTANCE` holt sich das Skript beim ersten Start für jeden Tagesbeginn den
Zählerstand und bildet daraus die Tageswerte — danach stimmen die 7- und 30-Tage-Summen sofort.
Später lässt sich das jederzeit über den State `Backfill` wiederholen. Fehlt der Verlauf, bleibt
nur, die Tageswerte ab jetzt aufzubauen.

**Betrieb**

Das Skript rechnet bei jeder Änderung des Zählerstands, um 0:01 Uhr und stündlich als
Sicherheitsnetz. Ein verpasster Mitternachtslauf wird beim nächsten Lauf nachgeholt, Tage ohne
Daten werden mit 0 aufgefüllt. Sinkt der Zählerstand (Zählerwechsel oder Reset), setzt es die Basis
neu und wertet den Tag mit 0.

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

### 0.5.2 (2026-09-23)
* (ssbingo) Anlagenschema: Ein Heizkreis steht still, solange das 3-Wege-Umschaltventil auf Warmwasser steht — bisher folgte er dem Heizgerät und zeigte im Sommerbetrieb während der Speicherladung fälschlich Fluss
* (ssbingo) Anlagenschema: neue Felder für das Umschaltventil und den Wert für Warmwasser; ohne sie bleibt alles wie bisher, und ein eigenes Objekt *Ladung aktiv* hat für den Speicherzweig weiter Vorrang

### 0.5.1 (2026-09-20)
* (ssbingo) Statistik-Skript: Die Zeitgeber laufen über globalThis, damit der ioBroker-Repository-Checker sie nicht mehr meldet — das Verhalten bleibt gleich
* (ssbingo) react und die Schriftpakete sind für den Repository-Checker als optionale Abhängigkeiten gekennzeichnet: Die Schriften werden beim Bauen eingebettet, React liefert vis-2 zur Laufzeit
* (ssbingo) Dependabot prüft weiterhin monatlich, aber über den Monat verteilt

### 0.5.0 (2026-09-20)
* (ssbingo) Heizkreis: jeder Block einzeln ein- und ausblendbar
* (ssbingo) Gaszähler: Verbrauchswerte aus dem beiliegenden Statistik-Skript — Gestern, letzte 7 und 30 Tage, Vormonat
* (ssbingo) Gaszähler: jeder Wert der Fußzeile einzeln ein- und ausblendbar
* (ssbingo) Das Statistik-Skript `gasverbrauch_statistik.js` liegt dem Adapter bei und ist in allen READMEs beschrieben

### 0.4.1 (2026-09-19)
* (ssbingo) Buy-Me-a-Coffee-Button oben in allen README-Dateien.

### 0.4.0 (2026-09-19)
* (ssbingo) Vorschaubild für jedes Widget in der VIS-2-Palette; schmale Kacheln bis etwa 260 px (das Anlagenschema stellt sich hochkant); Verläufe mit der Tastatur bedienbar; Anleitung mit der Einrichtung für wolf-smartset (ISM7).

### 0.3.0 (2026-09-19)
* (ssbingo) Neue Widgets: Anlagenschema mit Flussanimation, Verläufe aus history, sql oder influxdb und Meldungen als Zustandsliste mit Störungs-LED — damit sind alle acht Widgets verfügbar.

### 0.2.0 (2026-09-18)
* (ssbingo) Erste Version: Widget-Set für VIS-2 (React 19) mit Gaszähler, Kesselstatus, Heizkreis, Warmwasser und Heizkurve. Bedienende Widgets zeigen einen Wert erst nach der Bestätigung (ack); die Heizkurve ist eine Näherung (keine Wolf-Formel). Der Gaszähler rechnet Tages- und Monatsverbrauch aus dem Verlauf.

Ältere Änderungen: [CHANGELOG_OLD.md](../../CHANGELOG_OLD.md)

## Lizenz

MIT — siehe [LICENSE](../../LICENSE)
