![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## Widżety ogrzewania Wolf dla ioBroker VIS-2

Widżety VIS-2 do wyświetlania i obsługi instalacji grzewczej [WOLF](https://www.wolf.eu/) w ioBroker.

Zestaw widżetów sam nie odczytuje danych z instalacji grzewczej. Każda wartość jest osobno powiązana z istniejącym obiektem ioBroker — na przykład z adaptera `wolf-smartset`, adaptera `wolf` (ISM8i), Modbus lub własnych skryptów.

> **Stan:** wczesna faza rozwoju. Na razie dostępne są licznik gazu, stan kotła, obieg grzewczy, ciepła woda i krzywa grzewcza.

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

### **WORK IN PROGRESS**
* (ssbingo) Pierwsza wersja: zestaw widżetów w React 19 i TypeScript, pierwsza wersja widżetu licznika gazu

## Licencja

MIT — zob. [LICENSE](../../LICENSE)
