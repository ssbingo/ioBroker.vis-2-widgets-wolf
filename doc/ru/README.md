![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## Виджеты отопления Wolf для ioBroker VIS-2

Виджеты VIS-2 для отображения и управления системой отопления [WOLF](https://www.wolf.eu/) в ioBroker.

Набор виджетов сам не считывает данные с системы отопления. Каждое значение по отдельности привязывается к существующему объекту ioBroker — например, из адаптера `wolf-smartset`, адаптера `wolf` (ISM8i), Modbus или собственных скриптов.

> **Статус:** ранняя стадия разработки. Доступны все восемь виджетов: схема установки, состояние котла, контур отопления, отопительная кривая, горячая вода, графики, сообщения и газовый счётчик.

### Виджеты

| Виджет | Назначение |
|---|---|
| Схема установки | Гидравлическая схема с пламенем горелки, бойлером, до четырёх контуров и анимацией потока |
| Состояние котла | Фаза работы, горелка, модуляция и давление (если заданы), часы работы, пуски, подача и обратка |
| Контур отопления | Режим работы, дневная и экономичная температура, коррекция, программа времени — с управлением |
| Отопительная кривая | Приближённая кривая с рабочей точкой регулятора; коррекция с управлением |
| Горячая вода | Бойлер с отметкой уставки, заданная температура, программа времени, опционально циркуляция и однократная загрузка |
| Графики | До четырёх кривых и фоновая область из history, SQL или InfluxDB; от 6 часов до 7 дней |
| Сообщения | Индикатор неисправности и список состояний: проверки, общая неисправность, код неисправности |
| Газовый счётчик | Показания в семи вариантах счётного механизма, расход, суточное и месячное потребление, стоимость |

<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_schema.png" height="110" alt="Схема установки"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_boiler.png" height="110" alt="Состояние котла"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_circuit.png" height="110" alt="Контур отопления"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_heatcurve.png" height="110" alt="Отопительная кривая">
<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_dhw.png" height="110" alt="Горячая вода"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_trends.png" height="110" alt="Графики"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_messages.png" height="110" alt="Сообщения"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_gasmeter.png" height="110" alt="Газовый счётчик">

Подробная настройка, в том числе назначение объектов wolf-smartset (ISM7): см. [английскую документацию](../../README.md).

### Требования

- js-controller >= 7.2.2
- vis-2 >= 2.20.0 (первая версия vis-2 с React 19)
- Node.js >= 22

### Отказ от ответственности

WOLF и логотип WOLF являются товарными знаками WOLF GmbH. Этот проект не связан с WOLF GmbH и не поддерживается ею. Он лишь отображает данные, которые предоставляют другие адаптеры ioBroker.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### 0.4.0 (2026-09-19)
* (ssbingo) Изображение предпросмотра для каждого виджета в палитре VIS-2; узкие плитки до 260 px (схема установки переходит в вертикальный вид); управление графиками с клавиатуры; документация с настройкой для wolf-smartset (ISM7).

### 0.3.0 (2026-09-19)
* (ssbingo) Новые виджеты: схема установки с анимацией потока, графики из history, sql или influxdb и сообщения в виде списка состояний с индикатором неисправности — теперь доступны все восемь виджетов.

### 0.2.0 (2026-09-18)
* (ssbingo) Первая версия: набор виджетов для VIS-2 (React 19) — газовый счётчик, состояние котла, контур отопления, горячая вода и отопительная кривая. Управляющие виджеты показывают значение только после подтверждения (ack); отопительная кривая — приближение (не формула Wolf). Газовый счётчик вычисляет суточный и месячный расход из истории.

## Лицензия

MIT — см. [LICENSE](../../LICENSE)
