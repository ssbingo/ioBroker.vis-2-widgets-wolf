![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" /></a>
</p>

---

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

W każdym widżecie poza licznikiem gazu pierwszym polem grupy „Obiekty" jest **Instalacja (instancja adaptera)**: wybierz instancję `wolf-smartset` (ISM7) lub `wolf` (ISM8i), a obiekty zostaną wpisane automatycznie. Bez wyboru wszystko łączysz ręcznie jak dotąd.

### Skrypt statystyk zużycia gazu

Do adaptera dołączony jest skrypt ioBroker `gasverbrauch_statistik_v2.1.0.js` (folder `addOn/`). Ze stanu licznika wylicza dziś, wczoraj, ostatnie 7 i 30 dni oraz bieżący i poprzedni miesiąc i zapisuje je jako obiekty (domyślnie w `0_userdata.0.Gas`) — dokładnie te wartości, które interfejs webowy CCU pokazuje dla HmIP-ESI, a które przez `hm-rpc` nie trafiają do ioBrokera. W codziennej pracy adapter historii nie jest potrzebny. Od wersji 3.0 uzgadnia też odczyty licznika, wylicza koszty (z opłatą stałą, VAT i zaliczką) oraz wysyła raporty dzienne i miesięczne przez Telegram i e-mail.

Utwórz skrypt w adapterze `javascript`, ustaw `SRC` na stan licznika i uruchom go. Następnie w widżecie licznika gazu wybierz folder w grupie *Skrypt statystyk* — stany zostaną wpisane automatycznie. O tym, które wartości pokazuje kafelek, decyduje grupa *Widoczne wartości*.

Po instalacji skrypt jest dostępny także w przeglądarce: `http://<iobroker>:8082/vis-2/widgets/vis-2-widgets-wolf/addon/gasverbrauch_statistik_v2.1.0.js`. Szczegóły w [dokumentacji angielskiej](../../README.md).

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

### 0.7.1 (2026-09-23)
* (ssbingo) Licznik gazu: wybór folderu wpisuje teraz także skorygowany stan licznika i wyliczony przepływ — dotychczas oba pola pozostawały nietknięte, jeśli był w nich czujnik, więc kafelek nadal pokazywał stan bez korekty
* (ssbingo) Licznik gazu: kafelek ostrzega o korekcie, która wciąż jest ustawiona, choć stan pochodzi ze skryptu — inaczej korekta zadziała dwa razy

### 0.7.0 (2026-09-23)
* (ssbingo) Licznik gazu: nowe pole obiektu *Koszt miesiąca* — po powiązaniu kafelek pokazuje tę wartość zamiast liczyć z taryfy; pasuje to do dołączonego skryptu, którego kwota zawiera opłatę stałą, VAT i zaliczkę
* (ssbingo) Dołączony skrypt statystyk w wersji 3.0.0: uzgadnia odczyty licznika (współczynnik korekcji wobec utraconych impulsów), wylicza koszty i wysyła raporty dzienne oraz miesięczne przez Telegram i e-mail, w razie potrzeby z PDF
* (ssbingo) Wybór folderu wpisuje teraz także obiekt kosztów; instrukcja wymienia nowe ustawienia i stany

### 0.6.2 (2026-09-23)
* (ssbingo) Źródła widżetów przeniesiono z src-widgets-ts do src-widgets — tak ten folder nazywa się zwykle w ioBrokerze. Kontroler repozytorium pomija ten folder, więc jego uwagi o react i pakietach czcionek znikają bez dodawania zbędnych zależności. W dostarczanym pakiecie nic się nie zmienia

### 0.6.1 (2026-09-23)
* (ssbingo) Dołączony skrypt statystyk w wersji 2.1.0: wylicza także przepływ ze zmian licznika (stany Durchfluss, VerbrauchAktiv, ZaehlerLetzteAenderung); plik przekonwertowano na UTF-8, a timery działają przez globalThis
* (ssbingo) Licznik gazu: automatyka folderu zna wyliczony przepływ i nie rusza już powiązanego obiektu przepływu
* (ssbingo) Pliki skryptu mają wersję w nazwie; teksty i podpowiedzi odsyłają do folderu addOn/, a test pilnuje, by pliki README nie wskazywały nieistniejących plików

### 0.6.0 (2026-09-23)
* (ssbingo) Każdy widżet poza licznikiem gazu może wypełnić obiekty z instancji adaptera: w pierwszym polu grupy „Obiekty” wybierz instalację wolf-smartset (ISM7) lub wolf (ISM8i); bez wyboru wszystko pozostaje ręczne
* (ssbingo) Licznik gazu: cenę energii można podać w ct/kWh, tak jak na większości rachunków; kafelek ostrzega o cenie spoza zakresu 0,01–1,00 €/kWh

### 0.5.2 (2026-09-23)
* (ssbingo) Schemat instalacji: obieg grzewczy stoi, dopóki zawór 3-drogowy jest ustawiony na c.w.u. — dotychczas podążał za kotłem i w trybie letnim podczas ładowania zasobnika błędnie pokazywał przepływ
* (ssbingo) Schemat instalacji: nowe pola dla zaworu i wartości c.w.u.; bez nich wszystko pozostaje bez zmian, a własny obiekt *ładowanie aktywne* nadal ma pierwszeństwo dla gałęzi zasobnika

### 0.5.1 (2026-09-20)
* (ssbingo) Skrypt statystyk: timery działają przez globalThis, aby kontroler repozytoriów ioBroker ich nie zgłaszał — działanie pozostaje bez zmian
* (ssbingo) react i pakiety czcionek są oznaczone dla kontrolera jako zależności opcjonalne: czcionki są osadzane podczas budowania, React dostarcza vis-2 w czasie działania
* (ssbingo) Dependabot nadal sprawdza co miesiąc, ale w rozłożeniu na cały miesiąc

### 0.5.0 (2026-09-20)
* (ssbingo) Obieg grzewczy: każdy blok można pokazać lub ukryć
* (ssbingo) Licznik gazu: wartości zużycia z dołączonego skryptu statystyk — wczoraj, ostatnie 7 i 30 dni, poprzedni miesiąc
* (ssbingo) Licznik gazu: każdą wartość w stopce można pokazać lub ukryć
* (ssbingo) Skrypt statystyk `gasverbrauch_statistik.js` jest dołączony do adaptera i opisany we wszystkich plikach README

### 0.4.1 (2026-09-19)
* (ssbingo) Przycisk Buy me a coffee na początku wszystkich plików README.

### 0.4.0 (2026-09-19)
* (ssbingo) Obraz podglądu dla każdego widżetu w palecie VIS-2; wąskie kafelki do ok. 260 px (schemat instalacji przechodzi w układ pionowy); przebiegi obsługiwane z klawiatury; dokumentacja z konfiguracją dla wolf-smartset (ISM7).

Starsze zmiany: [CHANGELOG_OLD.md](../../CHANGELOG_OLD.md)

## Licencja

MIT — zob. [LICENSE](../../LICENSE)
