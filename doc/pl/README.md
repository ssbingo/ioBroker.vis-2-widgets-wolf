![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## Widżety ogrzewania Wolf dla ioBroker VIS-2

Widżety VIS-2 do wyświetlania i obsługi instalacji grzewczej [WOLF](https://www.wolf.eu/) w ioBroker.

Zestaw widżetów sam nie odczytuje danych z instalacji grzewczej. Każda wartość jest osobno powiązana z istniejącym obiektem ioBroker — na przykład z adaptera `wolf-smartset`, adaptera `wolf` (ISM8i), Modbus lub własnych skryptów.

> **Stan:** wczesna faza rozwoju. Dostępnych jest wszystkie osiem widżetów: schemat instalacji, stan kotła, obieg grzewczy, krzywa grzewcza, ciepła woda, przebiegi, komunikaty i licznik gazu.

### Widżety

| Widżet | Przeznaczenie |
|---|---|
| Schemat instalacji | Schemat hydrauliczny z płomieniem palnika, zasobnikiem, do czterech obiegów i animacją przepływu |
| Stan kotła | Faza pracy, palnik, modulacja i ciśnienie (jeśli powiązane), godziny pracy, starty, zasilanie i powrót |
| Obieg grzewczy | Tryb pracy, temperatura dzienna i ekonomiczna, korekta, program czasowy — ze sterowaniem |
| Krzywa grzewcza | Przybliżona krzywa z punktem pracy regulatora; korekta ze sterowaniem |
| Ciepła woda | Zasobnik ze znacznikiem wartości zadanej, temperatura zadana, program czasowy, opcjonalnie cyrkulacja i jednorazowe ładowanie |
| Przebiegi | Do czterech krzywych i obszar w tle z history, SQL lub InfluxDB; od 6 godzin do 7 dni |
| Komunikaty | Dioda usterki i lista stanów: kontrole, usterka zbiorcza, kod usterki |
| Licznik gazu | Stan licznika w siedmiu wariantach liczydła, przepływ, zużycie dzienne i miesięczne, koszty |

<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_schema.png" height="110" alt="Schemat instalacji"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_boiler.png" height="110" alt="Stan kotła"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_circuit.png" height="110" alt="Obieg grzewczy"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_heatcurve.png" height="110" alt="Krzywa grzewcza">
<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_dhw.png" height="110" alt="Ciepła woda"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_trends.png" height="110" alt="Przebiegi"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_messages.png" height="110" alt="Komunikaty"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_gasmeter.png" height="110" alt="Licznik gazu">

Szczegółowa konfiguracja, w tym przypisanie obiektów wolf-smartset (ISM7): zob. [dokumentację w języku angielskim](../../README.md).

### Wymagania

- js-controller >= 7.2.2
- vis-2 >= 2.20.0 (pierwsza wersja vis-2 z React 19)
- Node.js >= 22

### Zastrzeżenie

WOLF i logo WOLF są znakami towarowymi WOLF GmbH. Ten projekt nie jest powiązany z WOLF GmbH ani przez nią wspierany. Wyświetla jedynie dane dostarczane przez inne adaptery ioBroker.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### 0.3.0 (2026-09-19)
* (ssbingo) Nowe widżety: schemat instalacji z animacją przepływu, przebiegi z history, sql lub influxdb oraz komunikaty jako lista stanów z diodą usterki — dostępnych jest teraz wszystkie osiem widżetów.

### 0.2.0 (2026-09-18)
* (ssbingo) Pierwsza wersja: zestaw widżetów dla VIS-2 (React 19) z licznikiem gazu, stanem kotła, obiegiem grzewczym, ciepłą wodą i krzywą grzewczą. Widżety sterujące pokazują wartość dopiero po potwierdzeniu (ack); krzywa grzewcza jest przybliżeniem (nie formułą Wolf). Licznik gazu oblicza zużycie dzienne i miesięczne z historii.

## Licencja

MIT — zob. [LICENSE](../../LICENSE)
