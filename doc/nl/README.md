![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## Wolf-verwarmingswidgets voor ioBroker VIS-2

VIS-2-widgets die een [WOLF](https://www.wolf.eu/)-verwarmingsinstallatie in ioBroker weergeven en bedienbaar maken.

De widgetset leest zelf geen gegevens uit de verwarming. Elke waarde wordt afzonderlijk gekoppeld aan een bestaand ioBroker-object — bijvoorbeeld van de adapter `wolf-smartset`, de adapter `wolf` (ISM8i), Modbus of eigen scripts.

> **Status:** vroege ontwikkeling. Alle acht widgets zijn beschikbaar: installatieschema, ketelstatus, verwarmingscircuit, stooklijn, warm water, verloop, meldingen en gasmeter.

### Widgets

| Widget | Doel |
|---|---|
| Installatieschema | Hydraulisch schema met brandervlam, boiler, tot vier verwarmingscircuits en stromingsanimatie |
| Ketelstatus | Bedrijfsfase, brander, modulatie en waterdruk (indien gekoppeld), bedrijfsuren, branderstarts, aanvoer en retour |
| Verwarmingscircuit | Bedrijfsmodus, dag- en spaartemperatuur, correctie, tijdprogramma — bedienbaar |
| Stooklijn | Benaderde stooklijn met het werkpunt van de regeling; correctie bedienbaar |
| Warm water | Boiler met streefwaardemarkering, insteltemperatuur, tijdprogramma, optioneel circulatie en eenmalig laden |
| Verloop | Tot vier curves en een achtergrondvlak uit history, SQL of InfluxDB; 6 uur tot 7 dagen |
| Meldingen | Storings-LED en statuslijst: controles, verzamelstoring, storingscode |
| Gasmeter | Meterstand in zeven telwerkvarianten, doorstroming, dag- en maandverbruik, kosten |

<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_schema.png" height="110" alt="Installatieschema"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_boiler.png" height="110" alt="Ketelstatus"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_circuit.png" height="110" alt="Verwarmingscircuit"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_heatcurve.png" height="110" alt="Stooklijn">
<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_dhw.png" height="110" alt="Warm water"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_trends.png" height="110" alt="Verloop"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_messages.png" height="110" alt="Meldingen"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_gasmeter.png" height="110" alt="Gasmeter">

Uitgebreide instelling, inclusief de koppeling van wolf-smartset-objecten (ISM7): zie de [Engelse documentatie](../../README.md).

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

### 0.4.0 (2026-09-19)
* (ssbingo) Voorbeeldafbeelding voor elke widget in het VIS-2-palet; smalle tegels tot ongeveer 260 px (het installatieschema wordt staand); verloop met het toetsenbord te bedienen; documentatie met de instelling voor wolf-smartset (ISM7).

### 0.3.0 (2026-09-19)
* (ssbingo) Nieuwe widgets: installatieschema met stromingsanimatie, verloop uit history, sql of influxdb en meldingen als statuslijst met storings-LED — alle acht widgets zijn nu beschikbaar.

### 0.2.0 (2026-09-18)
* (ssbingo) Eerste versie: widgetset voor VIS-2 (React 19) met gasmeter, ketelstatus, verwarmingscircuit, warm water en stooklijn. Bedienende widgets tonen een waarde pas na bevestiging (ack); de stooklijn is een benadering (geen Wolf-formule). De gasmeter berekent dag- en maandverbruik uit de historie.

## Licentie

MIT — zie [LICENSE](../../LICENSE)
