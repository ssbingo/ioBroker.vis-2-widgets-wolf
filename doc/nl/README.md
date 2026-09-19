![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## Wolf-verwarmingswidgets voor ioBroker VIS-2

VIS-2-widgets die een [WOLF](https://www.wolf.eu/)-verwarmingsinstallatie in ioBroker weergeven en bedienbaar maken.

De widgetset leest zelf geen gegevens uit de verwarming. Elke waarde wordt afzonderlijk gekoppeld aan een bestaand ioBroker-object — bijvoorbeeld van de adapter `wolf-smartset`, de adapter `wolf` (ISM8i), Modbus of eigen scripts.

> **Status:** vroege ontwikkeling. Alle acht widgets zijn beschikbaar: installatieschema, ketelstatus, verwarmingscircuit, stooklijn, warm water, verloop, meldingen en gasmeter.

### Vereisten

- js-controller >= 7.2.2
- vis-2 >= 2.20.0 (eerste vis-2-versie met React 19)
- Node.js >= 22

### Disclaimer

WOLF en het WOLF-logo zijn merken van WOLF GmbH. Dit project is niet verbonden met WOLF GmbH en wordt niet door haar ondersteund. Het geeft alleen gegevens weer die andere ioBroker-adapters leveren.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### 0.2.0 (2026-09-18)
* (ssbingo) Eerste versie: widgetset voor VIS-2 (React 19) met gasmeter, ketelstatus, verwarmingscircuit, warm water en stooklijn. Bedienende widgets tonen een waarde pas na bevestiging (ack); de stooklijn is een benadering (geen Wolf-formule). De gasmeter berekent dag- en maandverbruik uit de historie.

## Licentie

MIT — zie [LICENSE](../../LICENSE)
