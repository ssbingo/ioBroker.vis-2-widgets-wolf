![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## Wolf-Heizungs-Widgets für ioBroker VIS-2

VIS-2-Widgets, die eine [WOLF](https://www.wolf.eu/)-Heizungsanlage in ioBroker darstellen und bedienbar machen.

Das Widget-Set liest selbst keine Daten aus der Heizung. Jeder Wert wird einzeln an ein vorhandenes ioBroker-Objekt gebunden — zum Beispiel aus dem Adapter `wolf-smartset`, dem Adapter `wolf` (ISM8i), Modbus oder eigenen Skripten.

> **Stand:** frühe Entwicklung. Verfügbar sind bisher der Gaszähler, der Kesselstatus, der Heizkreis, das Warmwasser, die Heizkurve und die Meldungen.

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

### 0.2.0 (2026-09-18)
* (ssbingo) Erste Version: Widget-Set für VIS-2 (React 19) mit Gaszähler, Kesselstatus, Heizkreis, Warmwasser und Heizkurve. Bedienende Widgets zeigen einen Wert erst nach der Bestätigung (ack); die Heizkurve ist eine Näherung (keine Wolf-Formel). Der Gaszähler rechnet Tages- und Monatsverbrauch aus dem Verlauf.

## Lizenz

MIT — siehe [LICENSE](../../LICENSE)
