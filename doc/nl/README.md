![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" /></a>
</p>

---

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

### Script voor de gasverbruiksstatistiek

Bij de adapter hoort het ioBroker-script `gasverbrauch_statistik.js` (map `addOn/`). Uit de meterstand berekent het vandaag, gisteren, de laatste 7 en 30 dagen en de huidige en vorige maand en legt ze vast als objecten (standaard in `0_userdata.0.Gas`) — precies de waarden die de CCU-webinterface van een HmIP-ESI toont, maar die via `hm-rpc` niet in ioBroker aankomen. Voor het dagelijks gebruik is geen history-adapter nodig.

Maak het script aan in de adapter `javascript`, zet `SRC` op de meterstand en start het. Kies daarna in het gasmeter-widget de map onder *Statistiekscript* — de states worden automatisch ingevuld. Welke waarden de tegel toont, bepaalt de groep *Zichtbare waarden*.

Na de installatie staat het script ook in de browser klaar: `http://<iobroker>:8082/vis-2/widgets/vis-2-widgets-wolf/addon/gasverbrauch_statistik.js`. Details in de [Engelse documentatie](../../README.md).

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

### 0.5.0 (2026-09-20)
* (ssbingo) Verwarmingscircuit: elk blok afzonderlijk te tonen of te verbergen
* (ssbingo) Gasmeter: verbruikswaarden uit het meegeleverde statistiekscript — gisteren, laatste 7 en 30 dagen, vorige maand
* (ssbingo) Gasmeter: elke waarde in de voettekst afzonderlijk te tonen of te verbergen
* (ssbingo) Het statistiekscript `gasverbrauch_statistik.js` wordt meegeleverd en is in alle README's beschreven

### 0.4.1 (2026-09-19)
* (ssbingo) Buy me a coffee-knop bovenaan alle README-bestanden.

### 0.4.0 (2026-09-19)
* (ssbingo) Voorbeeldafbeelding voor elke widget in het VIS-2-palet; smalle tegels tot ongeveer 260 px (het installatieschema wordt staand); verloop met het toetsenbord te bedienen; documentatie met de instelling voor wolf-smartset (ISM7).

### 0.3.0 (2026-09-19)
* (ssbingo) Nieuwe widgets: installatieschema met stromingsanimatie, verloop uit history, sql of influxdb en meldingen als statuslijst met storings-LED — alle acht widgets zijn nu beschikbaar.

### 0.2.0 (2026-09-18)
* (ssbingo) Eerste versie: widgetset voor VIS-2 (React 19) met gasmeter, ketelstatus, verwarmingscircuit, warm water en stooklijn. Bedienende widgets tonen een waarde pas na bevestiging (ack); de stooklijn is een benadering (geen Wolf-formule). De gasmeter berekent dag- en maandverbruik uit de historie.

Oudere wijzigingen: [CHANGELOG_OLD.md](../../CHANGELOG_OLD.md)

## Licentie

MIT — zie [LICENSE](../../LICENSE)
