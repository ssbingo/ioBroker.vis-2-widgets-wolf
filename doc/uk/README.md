![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" /></a>
</p>

---

## Віджети опалення Wolf для ioBroker VIS-2

Віджети VIS-2 для відображення та керування системою опалення [WOLF](https://www.wolf.eu/) в ioBroker.

Набір віджетів сам не зчитує дані з системи опалення. Кожне значення окремо прив'язується до наявного об'єкта ioBroker — наприклад, з адаптера `wolf-smartset`, адаптера `wolf` (ISM8i), Modbus або власних скриптів.

> **Стан:** рання стадія розробки. Доступні всі вісім віджетів: схема установки, стан котла, контур опалення, опалювальна крива, гаряча вода, графіки, повідомлення і газовий лічильник.

### Віджети

| Віджет | Призначення |
|---|---|
| Схема установки | Гідравлічна схема з полум'ям пальника, бойлером, до чотирьох контурів і анімацією потоку |
| Стан котла | Фаза роботи, пальник, модуляція і тиск (якщо задані), години роботи, запуски, подача і зворотка |
| Контур опалення | Режим роботи, денна та економна температура, корекція, програма часу — з керуванням |
| Опалювальна крива | Наближена крива з робочою точкою регулятора; корекція з керуванням |
| Гаряча вода | Бойлер з позначкою уставки, задана температура, програма часу, опційно циркуляція та одноразове завантаження |
| Графіки | До чотирьох кривих і фонова область з history, SQL або InfluxDB; від 6 годин до 7 днів |
| Повідомлення | Індикатор несправності та список станів: перевірки, загальна несправність, код несправності |
| Газовий лічильник | Показник у семи варіантах лічильного механізму, витрата, добове та місячне споживання, вартість |

<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_schema.png" height="110" alt="Схема установки"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_boiler.png" height="110" alt="Стан котла"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_circuit.png" height="110" alt="Контур опалення"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_heatcurve.png" height="110" alt="Опалювальна крива">
<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_dhw.png" height="110" alt="Гаряча вода"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_trends.png" height="110" alt="Графіки"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_messages.png" height="110" alt="Повідомлення"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_gasmeter.png" height="110" alt="Газовий лічильник">

Детальне налаштування, зокрема призначення об'єктів wolf-smartset (ISM7): див. [англійську документацію](../../README.md).

### Скрипт статистики споживання газу

Разом з адаптером постачається скрипт ioBroker `gasverbrauch_statistik.js` (тека `addOn/`). Зі показань лічильника він обчислює сьогодні, учора, останні 7 і 30 днів, а також поточний і минулий місяць і зберігає їх як об’єкти (типово в `0_userdata.0.Gas`) — саме ті значення, які вебінтерфейс CCU показує для HmIP-ESI, але які через `hm-rpc` не потрапляють до ioBroker. Для звичайної роботи адаптер історії не потрібен.

Створіть скрипт в адаптері `javascript`, вкажіть у `SRC` стан із показаннями лічильника та запустіть його. Потім у віджеті лічильника газу виберіть теку в групі *Скрипт статистики* — стани підставляються автоматично. Які значення показує плитка, визначає група *Видимі значення*.

Після встановлення скрипт доступний і в браузері: `http://<iobroker>:8082/vis-2/widgets/vis-2-widgets-wolf/addon/gasverbrauch_statistik.js`. Подробиці — в [англійській документації](../../README.md).

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

### 0.4.1 (2026-09-19)
* (ssbingo) Кнопка Buy me a coffee вгорі всіх файлів README.

### 0.4.0 (2026-09-19)
* (ssbingo) Зображення попереднього перегляду для кожного віджета в палітрі VIS-2; вузькі плитки до близько 260 px (схема установки переходить у вертикальний вигляд); графіки керуються з клавіатури; документація з налаштуванням для wolf-smartset (ISM7).

### 0.3.0 (2026-09-19)
* (ssbingo) Нові віджети: схема установки з анімацією потоку, графіки з history, sql або influxdb і повідомлення як список станів з індикатором несправності — тепер доступні всі вісім віджетів.

### 0.2.0 (2026-09-18)
* (ssbingo) Перша версія: набір віджетів для VIS-2 (React 19) — газовий лічильник, стан котла, контур опалення, гаряча вода та опалювальна крива. Віджети керування показують значення лише після підтвердження (ack); опалювальна крива — наближення (не формула Wolf). Газовий лічильник обчислює добову та місячну витрату з історії.

## Ліцензія

MIT — див. [LICENSE](../../LICENSE)
