# ioBroker.vis-2-widgets-wolf

VIS-2 Widget-Adapter für Wolf-Heizungsanlagen. Reiner Widget-Adapter — er liest keine Daten
aus der Heizung, sondern bindet vorhandene ioBroker-Objekte.

Für jede Änderung an Adapterdateien gilt das Skill `iobroker-adapter-dev`. Wo das Skill älter
ist als diese Datei (Node 18/20, `NPM_TOKEN`, 9 READMEs), gilt diese Datei.

## Mindestanforderungen (gültig bis auf Widerruf, gesetzt am 2026-09-18)

| Komponente | Minimum | Ort |
| --- | --- | --- |
| Node.js | `>= 22`, CI mit 22.x / 24.x / 26.x | `package.json` → `engines.node`, CI-Matrix |
| js-controller | `>=7.2.2` | `io-package.json` → `common.dependencies` |
| vis-2 | `>=2.20.0` (erste Version mit React 19) | `io-package.json` → `common.dependencies` |
| `@iobroker/types-vis-2` | `^2.20.1` | `package.json`, `src-widgets-ts/package.json` |
| React / MUI | 19.x / 9.x | `src-widgets-ts/package.json`, zur Laufzeit von VIS-2 |

- Immer die neuesten Versionen verwenden. Ausnahmen nur, wo die Werkzeugkette es verhindert —
  derzeit: **ESLint 9.x** (`eslint-plugin-react` unterstützt ESLint 10 noch nicht) und
  **TypeScript 6.0.x** (`typescript-eslint` unterstützt TypeScript 7 noch nicht).
- Ältere Widget-Adapter (sigenergy, automatic-feeder) sind keine Referenz für Versionen.
- Keine Rückwärtskompatibilitäts-Workarounds für ältere Versionen einbauen.
- Keine admin-Abhängigkeit: `globalDependencies` bleibt leer, `adminUI.config: "none"`
  (Repochecker S1091). `restartAdapters` enthält nur `vis-2`.
- Autor überall `ssbingo <ssbingo@online.de>`, Lizenz MIT über `common.licenseInformation`
  (so erzeugt vom Adapter-Creator; `common.license` ist abgekündigt).
- Veröffentlichung auf npm ausschließlich über Trusted Publishing — kein `NPM_TOKEN`.
- Das Gerüst stammt vom Adapter-Creator (`.create-adapter.json`, Version 3.1.5).
  Diese Datei nicht löschen.

## Sprache

Code-Kommentare und Commit-Nachrichten auf Deutsch. README.md im Wurzelverzeichnis auf
Englisch, die übrigen unter `doc/<sprache>/` in der jeweiligen Sprache.

## Architektur — unverhandelbar

- Natives VIS-2-Widget-Set: React 19 und TypeScript in `src-widgets-ts/`, Build mit Vite und
  Module Federation, Anmeldung über `common.visWidgets`
- React, React-DOM und MUI kommen zur Laufzeit von VIS-2 — **nie mitbündeln**
- **`mf-manifest.json` wird neben `customWidgets.js` ausgeliefert** (`tasks.js`). Fehlt
  `react/jsx-runtime` in den geteilten Modulen, überspringt VIS-2 das Set.
- React-19-Regeln: kein `defaultProps` an Funktionskomponenten, `ref` als normale Prop statt
  `forwardRef`, `createRoot` statt `ReactDOM.render`, `sx`/`styled()` statt
  `makeStyles`/`withStyles`, MUI-`Grid` mit `size`-Prop
- Drei Schichten: Darstellung in `src/components/` ohne Zugriff auf ioBroker, Anbindung in
  `src/widgets/` (Klassen auf Basis von `window.visRxWidget`), Logik ohne React in `src/lib/`
- Alle Objekt-ID-Attribute heißen `oid_…` und haben den Feldtyp `id`. VIS-2 abonniert
  Attribute, deren Name mit `oid` beginnt, automatisch — Werte stehen in
  `this.state.values['<id>.val']`, dazu `.ack`, `.ts`, `.from`.
- Keine externen Laufzeitbibliotheken für Diagramme, Bogenanzeigen und Zählwerke — eigenes
  SVG und CSS
- CSS in `src/styles/wolf.css`, alle Selektoren mit `.wolf-` präfixiert; Schriften lokal
  als woff2 über `src/styles/fonts.ts`
- Farben ausschließlich über `--wolf-*`-Tokens, hell/dunkel folgt `context.themeType` von VIS-2.
  Keine festen Farbwerte außer bei physisch nachgebildeten Anzeigen (Rollenzählwerk, LED, VFD).
- Zahlen in der Sprache von VIS-2 formatieren (`fmt(…, locale)` mit `getLanguage()`)
- `widgets/` ist Build-Ausgabe — nie von Hand bearbeiten, `tasks.js` löscht den Ordner

## Schreibende Widgets

- Schreiben mit `ack: false`, Anzeige folgt erst nach `ack: true`
- Entprellung vor dem Schreiben, Vorgabe 800 ms
- Zustand „wird übernommen" sichtbar machen, Zeitüberschreitung nach 10 s melden

## Vor jedem Commit

- `npm run lint` ohne Fehler und ohne Warnungen, `npm run build` und `npm test` grün
- Änderungen an Widgets in der Sandbox (`npm start` in `src-widgets-ts/`) sichtgeprüft,
  hell und dunkel (`?theme=dark`)
- Keine Versionsnummer anfassen — das geschieht ausschließlich beim Release

## Bei jedem Release — atomar

- Über `npm run release` (Release-Script): `package.json` → `version`,
  `io-package.json` → `common.version` und `common.news` (nur aktuelle Version, 11 Sprachen)
- Changelog in **allen elf** README-Dateien vorangestellt, im Format des Release-Scripts:
  `### x.y.z (JJJJ-MM-TT)` und darunter `* (ssbingo) …`. Das Release-Script pflegt nur
  `README.md` — die zehn Dateien unter `doc/` von Hand nachziehen.
- Adapter-Check auf https://adapter-check.iobroker.in/ ohne Fehler
- GitHub Actions grün, dann Tag `vX.Y.Z` pushen — niemals lokal veröffentlichen

## Sprachen

`en, de, ru, pt, nl, fr, it, es, pl, uk, zh-cn` — vollständig in `titleLang`, `desc`, `news`
und den i18n-Dateien unter `src-widgets-ts/src/i18n/`. „Wolf" ist ein Markenname und wird
nie übersetzt (automatische Übersetzer machen daraus das Tier).

## Widget-Klassen

`tplWolfSchema` · `tplWolfBoiler` · `tplWolfCircuit` · `tplWolfHeatCurve` ·
`tplWolfDhw` · `tplWolfTrends` · `tplWolfMessages` · `tplWolfGasMeter`

## Zählwerk-Varianten im Gaszähler-Widget

A Rollenzählwerk (Vorgabe) · B Walzen animiert · C Zählerplakette · E VFD ·
F typografisch · G Kachelziffern · H Walzen mit Zeigerwerk. Variante D entfällt.
