# Design-Grundlage — vis-2-widgets-wolf

Dieses Paket entpackst du in das Wurzelverzeichnis des Repositories. Es enthält die Optik
in der Form, in der sie in VS Code und später in VIS-2 tatsächlich zum Tragen kommt.

## Inhalt

```
widgets/vis-2-widgets-wolf/css/vis-2-widgets-wolf.css   Farbtokens und alle Komponenten
widgets/vis-2-widgets-wolf/js/vis-2-widgets-wolf.js     vis.binds mit Bausteinen + Gaszähler-Widget
sandbox/index.html                                       Vorschau, lädt genau diese zwei Dateien
sandbox/vis-stub.js                                      Minimal-vis für den Betrieb ohne ioBroker
doc/design/*.html                                        die drei freigegebenen Entwürfe
doc/design/README.md                                     verbindliche Gestaltungsregeln
```

## Sofort loslegen

1. Ordner in VS Code öffnen
2. Erweiterung *Live Server* installieren
3. Rechtsklick auf `sandbox/index.html` → **Open with Live Server**

Die Seite zeigt zwei Instanzen des Gaszähler-Widgets an simulierten Objekten, alle sieben
Zählwerk-Varianten, die Status-LED, die Bogenanzeige und die Bedienelemente. Über die
Auswahlliste oben wechselst du die Zählwerk-Variante zur Laufzeit, über „Dunkel / Hell"
das Theme. Jede Änderung an CSS oder JS wird nach dem Speichern sofort neu geladen.

## Was schon läuft

- Farbtokens für hell und dunkel, vollständig
- Status-LED mit Glanz und Pulsieren
- Zählwerk in allen sieben freigegebenen Varianten, Umschaltung zur Laufzeit
- Bogenanzeige, Segment-Control, Schalter, Stepper, Fortschrittsbalken
- `tplWolfGasMeter` vollständig, inklusive Kostenrechnung
- Schreiben mit `ack:false` und sichtbarem Zustand „wird übernommen" — in der Sandbox
  über den Zirkulationsschalter nachvollziehbar

## Was noch fehlt

- `io-package.json`, `package.json`, ESLint, GitHub Actions — Meilenstein M0
- Die EJS-Widget-Definitionen in `widgets/vis-2-widgets-wolf.html`, damit die Widgets im
  VIS-2-Menü erscheinen — M0
- Kessel, Heizkreis, Heizkurve, Warmwasser, Schema, Verläufe, Meldungen — M1 bis M3.
  Die Einstiegspunkte sind in der JS-Datei angelegt und mit dem jeweiligen Meilenstein
  gekennzeichnet.
- Die elf i18n-Dateien — M4

## Regel

Die Entwürfe unter `doc/design/` sind Referenz, nicht Quelltext. Geändert wird immer zuerst
in `widgets/`, geprüft in der Sandbox, und erst danach die Referenz nachgezogen.
