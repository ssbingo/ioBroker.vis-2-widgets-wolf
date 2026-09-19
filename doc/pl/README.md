![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## Widżety ogrzewania Wolf dla ioBroker VIS-2

Widżety VIS-2 do wyświetlania i obsługi instalacji grzewczej [WOLF](https://www.wolf.eu/) w ioBroker.

Zestaw widżetów sam nie odczytuje danych z instalacji grzewczej. Każda wartość jest osobno powiązana z istniejącym obiektem ioBroker — na przykład z adaptera `wolf-smartset`, adaptera `wolf` (ISM8i), Modbus lub własnych skryptów.

> **Stan:** wczesna faza rozwoju. Dostępnych jest wszystkie osiem widżetów: schemat instalacji, stan kotła, obieg grzewczy, krzywa grzewcza, ciepła woda, przebiegi, komunikaty i licznik gazu.

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
