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
- Farben ausschließlich über `--wolf-*`-Tokens. Keine festen Farbwerte außer bei physisch
  nachgebildeten Anzeigen (Rollenzählwerk, LED, VFD).
- **Jedes Widget hat das Attribut `theme`** (Gruppe „Darstellung", erstes Feld): `auto` (Vorgabe,
  folgt `context.themeType` von VIS-2), `light`, `dark` — aufgelöst über `resolveTheme()` in
  `src/lib/theme.ts`. Das VIS-2-Theme ist das der Bedienoberfläche, nicht das der Visualisierung.
- Zahlen in der Sprache von VIS-2 formatieren (`fmt(…, locale)` mit `getLanguage()`)
- Schmale Kacheln über Container-Abfragen (`.wolf-w` hat `container-type: inline-size`), nicht
  über Media-Queries — maßgeblich ist die Kachelbreite. Alle Widgets bis etwa 260 px prüfen
- Jedes Widget hat ein eigenes Vorschaubild `public/img/prev_<name>.png` (aus der Sandbox,
  höchstens 360 × 220) und `visSetIcon`; VIS-2 übernimmt neue Bilder erst nach einem Neustart
- Übersetzungen prüft `src/i18n/i18n.test.ts`: gleiche Schlüssel in allen Sprachen, jeder im Code
  verwendete Schlüssel vorhanden, „Wolf" nie übersetzt
- `widgets/` ist Build-Ausgabe — nie von Hand bearbeiten, `tasks.js` löscht den Ordner

## Testen im dev-server

- `@iobroker/dev-server` ist Dev-Abhängigkeit: `npm run dev-server setup` (einmalig),
  `npm run dev-server run` (startet js-controller, admin, web und vis-2)
- Admin: Port 8081 — der dev-server-Proxy lauscht auf **allen** Schnittstellen, ohne Login.
  vis-2 über web.0: Port 8082, nur `127.0.0.1` (von außen per Portweiterleitung in VS Code)
- **vis-2 >= 2.20 ist noch nicht auf npm.** Das Setup holt aus dem Beta-Repository vis-2 2.13.8
  (React 18). Deshalb im Profil einen eigenen Build einspielen:
  1. `~/ioBroker.vis-2` (Klon von `master`): `npm run install-monorepo && npm run build`,
     dann `npm pack --pack-destination ..` in `packages/iobroker.vis-2`
  2. in `.dev-server/default`: `npm install <pfad>/iobroker.vis-2-<version>.tgz iobroker.web@latest`,
     dann `node node_modules/iobroker.js-controller/iobroker.js upload vis-2` (ebenso `web`)
  3. falls nötig `… add vis-2 0`
  Ein erneutes `setup` oder `update` ersetzt vis-2 wieder durch die Repository-Version.
- Nach Änderungen an den Widgets: `npm run build`, dann `npm run dev-server upload`,
  Browser neu laden
- Testdaten: `0_userdata.0.wolftest.*`; Testprojekt `main`
  - Runtime: `http://127.0.0.1:8082/vis-2/index.html?main#main`
  - Editor: `http://127.0.0.1:8082/vis-2/edit.html?main#main`

## Schreibende Widgets

- Schreiben mit `ack: false`, Anzeige folgt erst nach `ack: true`
- Entprellung vor dem Schreiben, Vorgabe 800 ms
- Zustand „wird übernommen" sichtbar machen, Zeitüberschreitung nach 10 s melden
- Immer über `WolfWidgetBase` schreiben (`numberControl`, `selectControl`, `switchControl`),
  nie direkt `context.setValue` — sonst fehlt die Nachverfolgung
- Das Warten endet nur mit `ack: true` **und** dem geschriebenen Wert. Nach einer
  Zeitüberschreitung den zuletzt bestätigten Wert zeigen: ioBroker hält den unbestätigten Befehl
  als Objektwert
- Schaltwerte im Typ des Objekts schreiben (`switchValue`: Zahl-Objekt 0/1, sonst true/false)
- Bedien-Kacheln scrollen statt abzuschneiden (`overflow-y: auto`); die Vorgabehöhe schließt die
  Leiste „Übernehmen" ein
- Heizkurve: Wolf veröffentlicht keine Formel — das Modell in `lib/heatCurve.ts` ist eine
  Näherung und bleibt im Widget als solche gekennzeichnet

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
- Release-ZIP mit `npm run zip` (git archive des letzten Commits)
- Adapter-Check auf <https://adapter-check.iobroker.in/> ohne Fehler
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
