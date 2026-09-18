# Designreferenz

Die drei Dateien in diesem Ordner sind die **freigegebenen Entwürfe**. Sie sind die
verbindliche Vorlage für die Umsetzung — was hier festgelegt ist, wird im Widget-Code
nicht neu erfunden.

| Datei | Inhalt | Status |
|---|---|---|
| `gaszaehler.html` | Gaszähler-Kacheln mit Zählwerk, Durchfluss, LED, Chart, Kosten | freigegeben |
| `zaehlwerk-varianten.html` | acht Zählwerk-Varianten im Vergleich | A, B, C, E, F, G, H übernommen — D verworfen |
| `wolf-heizung.html` | Anlagenschema, Kesselstatus, Heizkreis, Heizkurve, Warmwasser, Verläufe, Meldungen | freigegeben |

Die Seiten laufen eigenständig im Browser, ohne ioBroker.

## Verhältnis zum Widget-Code

Die Entwürfe sind **Referenz, nicht Quelltext.** Der ausführbare Stand liegt in:

```
src-widgets-ts/src/styles/wolf.css     ← Farbtokens und Komponenten
src-widgets-ts/src/styles/fonts.ts     ← Schriften, lokal als woff2
src-widgets-ts/src/components/         ← Darstellung (React), ohne ioBroker-Zugriff
src-widgets-ts/src/widgets/            ← Anbindung an VIS-2
src-widgets-ts/sandbox.html            ← Sandbox: dieselben Komponenten mit simulierten Werten
```

Der Unterschied zwischen Entwurf und Widget-Code ist beabsichtigt:

| Entwurf | Widget-Code |
|---|---|
| Farben als feste Werte in `:root` | Farben als `--wolf-*`-Tokens, vom VIS-2-Theme abgeleitet |
| Selektoren global (`.card`, `.led`) | alles mit `.wolf-` präfixiert, damit nichts in VIS ausblutet |
| Werte aus einer Simulationsschleife | Werte aus gebundenen ioBroker-Objekten |
| eine Seite | acht einzeln platzierbare Widget-Klassen |
| Vanilla-JS | React 19 und TypeScript |

## Arbeitsweise bei Designänderungen

1. Änderung zuerst in `src-widgets-ts/src/` umsetzen
2. In der Sandbox prüfen (`npm start` in `src-widgets-ts/`) — hell **und** dunkel
3. Erst dann die Referenzdatei hier nachziehen, damit Entwurf und Code nicht auseinanderlaufen

Wird die Optik grundlegend geändert, gilt die neue Fassung erst nach ausdrücklicher Freigabe
als Referenz. Bis dahin bleibt die alte Datei stehen.

## Festgelegte Gestaltungsregeln

- **Farben** ausschließlich über `--wolf-*`-Tokens. Feste Farbwerte nur bei physisch
  nachgebildeten Anzeigen: Rollenzählwerk, Zählerplakette, VFD, LED. Diese sehen im Hellen
  wie im Dunklen gleich aus, weil sie reale Bauteile darstellen.
- **Schriften**: Archivo für Fließtext und Überschriften, Barlow Semi Condensed für
  Versalien-Beschriftungen, JetBrains Mono für alle Zahlen mit `tabular-nums`.
  Fehlen die Schriften, greifen die Systemschriften — die Widgets bleiben lesbar.
- **Semantische Farben** sind vom Akzent getrennt: Grün für Ruhe, Rot für Verbrauch und
  Störung, Gelb für Warnung. Der Akzent ist ein warmes Orangerot und wird nicht für
  Zustände verwendet.
- **Bewegung** nur, wo sie etwas aussagt: Flussrichtung im Schema, Pulsieren der LED bei
  Verbrauch, Rollen der Walzen beim Weiterschalten. Alles respektiert
  `prefers-reduced-motion`.
- **Radius** 14 px für Widget-Rahmen, 6–11 px für innenliegende Elemente.
- Kein Rahmen, keine Fläche und kein Schatten ohne Grund — nicht jede Gruppe ist eine Karte.
