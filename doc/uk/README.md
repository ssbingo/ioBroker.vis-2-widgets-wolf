![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## Віджети опалення Wolf для ioBroker VIS-2

Віджети VIS-2 для відображення та керування системою опалення [WOLF](https://www.wolf.eu/) в ioBroker.

Набір віджетів сам не зчитує дані з системи опалення. Кожне значення окремо прив'язується до наявного об'єкта ioBroker — наприклад, з адаптера `wolf-smartset`, адаптера `wolf` (ISM8i), Modbus або власних скриптів.

> **Стан:** рання стадія розробки. Поки що доступні газовий лічильник, стан котла, контур опалення, гаряча вода і опалювальна крива.

### Вимоги

- js-controller >= 7.2.2
- vis-2 >= 2.20.0 (перша версія vis-2 з React 19)
- Node.js >= 22

### Застереження

WOLF і логотип WOLF є торговими марками WOLF GmbH. Цей проєкт не пов'язаний з WOLF GmbH і не підтримується нею. Він лише відображає дані, які надають інші адаптери ioBroker.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### **WORK IN PROGRESS**
* (ssbingo) Перша версія: набір віджетів на React 19 і TypeScript, перша версія віджета газового лічильника

## Ліцензія

MIT — див. [LICENSE](../../LICENSE)
