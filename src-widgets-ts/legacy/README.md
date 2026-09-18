# Legacy — Vanilla-Stand aus der Entwurfsphase

Dieser Ordner enthält den Code des freigegebenen Design-Pakets in seiner ursprünglichen
Form (VIS-1-Architektur mit `vis.binds`). Er ist **Vorlage für die Portierung**, kein
ausführbarer Teil des Adapters: Er wird weder gebaut noch gelintet noch veröffentlicht.

| Datei | Inhalt | Portiert nach |
|---|---|---|
| `vis-2-widgets-wolf.js` | Bausteine (LED, Zählwerk A–H, Zeigerwerk, Sieben-Segment, Bogen, Schreiblogik) und das Gaszähler-Widget | `src/components/`, `src/lib/`, `src/widgets/` — Meilensteine M1 bis M3 |
| `sandbox-index.html`, `vis-stub.js` | frühere Sandbox mit Nachbildung von `vis` | ersetzt durch die Vite-Sandbox (`npm start`) |

Das CSS liegt bereits portiert unter `src/styles/wolf.css`.

## Beim Portieren zu beheben

- **`ack`-Rückmeldung fehlt:** `setVal` setzt „wird übernommen", wertet aber nie `ack` aus.
  Die Markierung endet erst nach 10 s, danach steht fälschlich „Keine Bestätigung".
- **Gleitkommafehler im Zählwerk:** `splitDigits` zeigt `18427,482` als `18427,481`
  (auch Variante H). In `src/lib/digits.ts` bereits behoben.
- **Optimistischer Schalter:** Der Zirkulationsschalter der alten Sandbox schaltet sofort um
  statt erst nach `ack: true`.
- **Heizkurve:** Die Formel im Entwurf (`20 + Niveau + Steilheit · (20 − Ta) · 1,15`) ist
  geschätzt; `curve_formula: wolf` braucht eine Quelle.

Ist ein Baustein vollständig portiert, wird er hier gelöscht. Ist alles portiert, entfällt
der Ordner.
