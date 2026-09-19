![Logo](admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

[![NPM version](https://img.shields.io/npm/v/iobroker.vis-2-widgets-wolf.svg)](https://www.npmjs.com/package/iobroker.vis-2-widgets-wolf)
[![Downloads](https://img.shields.io/npm/dm/iobroker.vis-2-widgets-wolf.svg)](https://www.npmjs.com/package/iobroker.vis-2-widgets-wolf)
![Number of Installations](https://iobroker.live/badges/vis-2-widgets-wolf-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/vis-2-widgets-wolf-stable.svg)

**Tests:** ![Test and Release](https://github.com/ssbingo/ioBroker.vis-2-widgets-wolf/workflows/Test%20and%20Release/badge.svg)

## Wolf heating widgets for ioBroker VIS-2

VIS-2 widgets that display and operate a [WOLF](https://www.wolf.eu/) heating system in ioBroker.

The widget set does not read any data from the heating system itself. Every value is bound
individually to an existing ioBroker object — for example from the `wolf-smartset` adapter,
the `wolf` adapter (ISM8i), Modbus or your own scripts. No assumptions are made about object
names or structure.

> **Status:** early development. All eight widgets are available: system diagram, boiler status, heating circuit, heating curve, hot water, trends, messages and gas meter.

### Widgets

| Widget | Purpose |
|---|---|
| System diagram | Hydraulic diagram with burner flame, tank, up to four heating circuits and animated flow where water actually flows |
| Boiler status | Operating phase, burner, modulation and water pressure gauges (only when linked), operating hours, burner starts, flow and return |
| Heating circuit | Operating mode, day and economy temperature, setpoint correction, time program — writing |
| Heating curve | Approximated curve with the controller's operating point; setpoint correction writing |
| Hot water | Tank with set mark, set temperature, time program, optional circulation and one-time charge — writing |
| Trends | Up to four curves and a background area from history, SQL or InfluxDB; 6 h to 7 days |
| Messages | Fault LED and status list: configurable checks, collective fault, fault code, message list |
| Gas meter | Meter reading in seven counter styles, flow, daily and monthly consumption, costs, sensor warnings |

<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_schema.png" height="110" alt="System diagram"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_boiler.png" height="110" alt="Boiler status"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_circuit.png" height="110" alt="Heating circuit"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_heatcurve.png" height="110" alt="Heating curve">
<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_dhw.png" height="110" alt="Hot water"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_trends.png" height="110" alt="Trends"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_messages.png" height="110" alt="Messages"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_gasmeter.png" height="110" alt="Gas meter">

### Common settings

- **Colour scheme:** every widget has *Colour scheme* — automatic (follows the VIS-2 theme, default),
  light or dark.
- **Objects:** each value is linked to an object with the object picker. Limits, step size and
  state texts are taken from the object (`common.min`, `max`, `step`, `states`); fields in the
  widget only override them.
- **Narrow tiles:** all widgets work down to about 260 px width. The system diagram switches to
  an upright layout below 480 px so that its labels stay readable.
- **Keyboard:** all controls can be reached with Tab; in the trends chart the arrow keys move the
  crosshair.

#### Writing widgets

Heating circuit, hot water and heating curve write values with `ack: false` and show them as
*applying …* until the source confirms exactly this value with `ack: true`. An older confirmation
with a different value does not end the wait. Without confirmation the widget reports
*no confirmation* after the waiting time and shows the last confirmed value again. Objects with
`common.write: false` lock their controls (*read-only*).

| Field | Default | Meaning |
|---|---|---|
| Delay before writing | 800 ms | Steppers wait until you stop clicking, then write once |
| Wait for confirmation | 10 s | Time until *no confirmation* is shown |
| Confirm before writing | off | Changes are only written after *Apply* |

`wolf-smartset` talks to the Wolf cloud. If a written value is only confirmed with the next
poll, raise *Wait for confirmation* accordingly (up to 300 s). A late confirmation is still
accepted.

### Setting up with wolf-smartset (ISM7)

The object IDs of `wolf-smartset` are numbers; the readable name is in the *Name* column of the
object browser — search for it. The folder names contain numbers that can differ between
installations, so the IDs below are examples from one installation (Wolf gas appliance with
operating module BM, ISM7). Values under `Fachmann` only exist if the expert level is enabled in
the `wolf-smartset` instance. All IDs start with `wolf-smartset.0.`.

**System diagram**

| Field | Object name | Example ID |
|---|---|---|
| Flow | VF Vorlauffühler | `Benutzer.Übersicht.8000500001` |
| Return | RLF Rücklauffühler | `Benutzer.Übersicht.8000700001` |
| Burner | Flamme | `Benutzer.Heizung.210_Wärmeerzeuger_1.8000900001` |
| Boiler pump | KKP Kesselkreispumpe (on/off) — or PWM Pumpe (%) | `Benutzer.Übersicht.8001700001` — or `Benutzer.Heizung.210_Wärmeerzeuger_1.8000400001` |
| Outside temperature | Außentemperatur | `Benutzer.Heizung.058_Direkter_Heizkreis.3000100000` |
| Tank temperature | SF Speicherfühler | `Benutzer.Übersicht.8000100001` |
| Charging active | Ausgang A1 (if A1 is the tank charging pump, parameter HG14 = 6) | `Fachmann.Heizgerät.Heizgerät.422_Einstellungen_und Anzeigen.8001900001` |
| Heating circuit 1, flow | VF Vorlauffühler (direct circuit without mixer) | `Benutzer.Übersicht.8000500001` |

Modulation is not provided by the ISM7 — leave it empty; the flame is then shown fully when the
burner is on. Leave the circuit pump empty: the circuit then follows the boiler pump. Appliances
that charge the tank via a diverter valve instead of a charging pump can use *3WUV
3-Wege-Umschaltventil* (`Benutzer.Übersicht.8001800001`) for *charging active* — any value other
than 0 counts as charging, so check which position your appliance reports for hot water.

**Boiler status**

| Field | Object name | Example ID |
|---|---|---|
| Operating phase | HG Status | `Fachmann.Heizgerät.Heizgerät.422_Einstellungen_und Anzeigen.8002000001` |
| Burner | Flamme | `Benutzer.Heizung.210_Wärmeerzeuger_1.8000900001` |
| Operating hours | Brennerbetriebsstunden | `Benutzer.Heizung.210_Wärmeerzeuger_1.8008400001` |
| Burner starts | Brennerstarts | `Benutzer.Heizung.210_Wärmeerzeuger_1.8008500001` |
| Flow / return | VF Vorlauffühler / RLF Rücklauffühler | `Benutzer.Übersicht.8000500001` / `…8000700001` |

Modulation and water pressure are not available via the ISM7; without an object the gauges are
hidden.

**Heating circuit**

| Field | Object name | Example ID |
|---|---|---|
| Operating mode | Betriebsart | `Benutzer.Heizung.058_Direkter_Heizkreis.3001800000` |
| Day / economy temperature | Tagtemperatur / Spartemperatur | `…058_Direkter_Heizkreis.1000000000` / `…1000100000` |
| Setpoint correction | Sollwertkorrektur | `…058_Direkter_Heizkreis.3001900000` |
| Time program | Zeitprogramm direkter Heizkreis | `…058_Direkter_Heizkreis.1000200000` |
| Room temperature / effective setpoint | Raumtemperatur / Raumsolltemperatur | `…058_Direkter_Heizkreis.1001200000` / `…1001300000` |
| Flow setpoint | Vorlaufsolltemperatur | `Benutzer.Heizung.210_Wärmeerzeuger_1.8000600001` |

**Heating curve**

| Field | Object name | Example ID |
|---|---|---|
| Setpoint correction | Sollwertkorrektur | `Benutzer.Heizung.058_Direkter_Heizkreis.3001900000` |
| Slope | Heizkurve (read-only via `wolf-smartset`) | `Fachmann.Heizgerät.Heizgerät.058_Direkter_Heizkreis.1000300000` |
| Outside temperature | Außentemperatur | `Benutzer.Heizung.058_Direkter_Heizkreis.3000100000` |
| Outside temperature, averaged | Außentemperatur gemittelt | `Fachmann.Bedienmodul_BM0.…422_Einstellungen_und Anzeigen.3000200000` |
| Flow setpoint | Vorlaufsolltemperatur | `Benutzer.Heizung.210_Wärmeerzeuger_1.8000600001` |
| Room setpoint | Tagtemperatur | `Benutzer.Heizung.058_Direkter_Heizkreis.1000000000` |
| Charging active | Ausgang A1 | `Fachmann.Heizgerät.Heizgerät.422_Einstellungen_und Anzeigen.8001900001` |

**Hot water**

| Field | Object name | Example ID |
|---|---|---|
| Tank temperature | SF Speicherfühler | `Benutzer.Übersicht.8000100001` |
| Set temperature | Eingestellte Warmwassersolltemperatur | `Benutzer.Warmwasser.250_Warmwasser.3006600000` |
| Effective setpoint | Speichersolltemperatur | `Benutzer.Warmwasser.250_Warmwasser.8000200001` |
| Time program | Zeitprogramm Warmwasser | `Benutzer.Warmwasser.250_Warmwasser.3006700000` |
| Charging active | Ausgang A1 | `Fachmann.Heizgerät.Heizgerät.422_Einstellungen_und Anzeigen.8001900001` |

Circulation and one-time charge are not available via the ISM7 in this installation; without an
object they are hidden.

**Messages** — three checks: *TW-Vorlauf* (`Fachmann.Heizgerät.Heizgerät.422_Einstellungen_und Anzeigen.8001100001`)
and *TW-Abgas* (`…8001200001`), both with severity *fault* (1 = OK, 0 = tripped), and the
connection `wolf-smartset.0.info.connection` with severity *warning* and the text *disconnected*.

**Trends** — for example flow, return and outside temperature as curves and *PWM Pumpe* (%) as the
background area. Enable recording for these objects in your history adapter first.

### Widget notes

#### System diagram

Arrows only move where water flows: flow and return while the boiler pump runs (without a pump
object: while the burner is on), the tank branch while charging, each heating circuit while its
pump runs (without a pump object: like the boiler). Tank, outside temperature and zero to four
heating circuits can be shown or hidden; the diagram arranges itself accordingly.

#### Heating curve: an approximation

Wolf does not publish the formula of its heating curve. The widget therefore draws the usual
approximation `flow = TR + N + K + S · max(0, TR − TA)^n` (room setpoint `TR`, level `N`, setpoint
correction `K`, slope `S`, averaged outside temperature `TA`, curvature `n`, default 1) and labels
it as such. The operating point, on the other hand, comes from the controller itself (its flow
setpoint), so any difference between the two is visible. With `wolf-smartset` only the setpoint
correction is writable; the slope is shown but not changed, and there is no level. While the tank
is charging the operating point is marked as distorted.

#### Trends

Choose the history instance (empty: the system's default history), the period (6 h to 7 days)
and the aggregation (average, minimum/maximum, raw values). The widget queries the history on
start and then every few minutes (*Refresh every*); in between it adds the current value at the
right edge. Point at the chart — or focus it and use the arrow keys — to see the values at that
time in the legend.

#### Messages

Each check compares an object with the value meaning OK (empty: true or non-zero is OK). If it
deviates, the row gets the chosen severity and the text from the widget or the object's state
text. Rows are sorted fault → warning → notice → OK; the time shown is the last change of the
state. The LED turns red as soon as one row is a fault. For systems with a fault code there are
also *collective fault*, *fault code* with texts (`code=text;…`) and a *message list* (JSON array
with `text`, `ts`, `severity`).

#### Gas meter: consumption from the history

If no objects are linked for today's and this month's consumption, the gas meter calculates both
from the history of the meter reading (`sql`, `history` or `influxdb`, by default the system's
history instance): the reading now minus the reading at the start of the day or month. Sensors
such as the HomematicIP HmIP-ESI count from their installation, not from the meter's reading —
enter the difference as the meter reading correction. With an HmIP-ESI in gas mode, for example:

| Field | Object |
|---|---|
| Meter reading | `hm-rpc.<n>.<serial>.2.GAS_VOLUME` |
| Instantaneous flow | `hm-rpc.<n>.<serial>.1.GAS_FLOW` |
| Counter status / not reachable / low battery | `….2.GAS_VOLUME_STATUS` / `….0.UNREACH` / `….0.LOW_BAT` |

### Requirements

- js-controller >= 7.2.2
- vis-2 >= 2.20.0 (the first vis-2 version with React 19)
- Node.js >= 22

### Development

```bash
npm install
npm --prefix src-widgets-ts install
npm run build                    # builds the widgets into widgets/vis-2-widgets-wolf/
npm run lint
npm test
cd src-widgets-ts && npm start   # sandbox: widgets with simulated values, no ioBroker needed
npm run dev-server setup         # once: local ioBroker instance for testing
npm run dev-server run           # admin on http://localhost:8081, vis-2 on http://localhost:8082/vis-2/
```

vis-2 >= 2.20.0 is not yet published on npm. Until it is, install a build of the
[ioBroker.vis-2](https://github.com/ioBroker/ioBroker.vis-2) master branch into the dev-server
instance (`.dev-server/default`).

### Disclaimer

WOLF and the WOLF logo are trademarks of WOLF GmbH. This project is not affiliated with,
endorsed by or connected to WOLF GmbH. It only visualises data that other ioBroker adapters
provide.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->
### **WORK IN PROGRESS**
* (ssbingo) Preview image for every widget in the VIS-2 palette, icon for the widget group
* (ssbingo) Narrow tiles: the system diagram switches to an upright layout below 480 px; small steppers and LED texts adapt down to about 260 px
* (ssbingo) Keyboard: the trends chart can be operated with the arrow keys; visible focus on all controls
* (ssbingo) Documentation: setup with wolf-smartset (ISM7) for every widget

### 0.3.0 (2026-09-19)
* (ssbingo) Trends: up to four curves and a background area (e.g. modulation) from the history adapter (history, sql, influxdb), 6 h to 7 days, average/min-max/raw values, current value at the right edge, crosshair with values in the legend
* (ssbingo) System diagram: heat generator with flame, distributor, hot water tank, up to four heating circuits and outside temperature; the flow animation follows the pump (or the burner), tank charging and each circuit's pump
* (ssbingo) Messages: fault LED and a status list with up to eight configurable checks (e.g. the safety temperature limiters and the connection to the ISM7), collective fault, fault code with texts and an optional message list (JSON)

### 0.2.0 (2026-09-18)
* (ssbingo) Initial version: widget set built with React 19 and TypeScript, first version of the gas meter widget
* (ssbingo) Gas meter: all seven counter styles (A, B, C, E, F, G, H) and a status LED for consumption
* (ssbingo) Color scheme per widget: automatic (like VIS-2), light or dark
* (ssbingo) Boiler status: burner LED, gauges only when a data point is linked, state texts without a repeated number prefix (as delivered by wolf-smartset)
* (ssbingo) Boiler status: operating phase (texts from the widget, the object's states or built-in defaults), modulation and water pressure gauges with warning zones, operating hours, burner starts, flow and return temperature
* (ssbingo) Heating circuit: operating mode, day and economy temperature, setpoint correction and time program; limits, step size and state texts come from the linked objects
* (ssbingo) Writing widgets: values are written with ack=false and shown as "applying" until the source confirms them with ack=true; after 10 s without confirmation the widget reports it and shows the last confirmed value again. Optional confirm mode with Apply/Discard; read-only objects lock their controls
* (ssbingo) Hot water: tank graphic with temperature and set mark, set temperature, time program, effective setpoint and charging state; circulation and one-time charge only when linked. Switches write 0/1 to number objects and true/false otherwise
* (ssbingo) Heating curve: approximation (labelled as such, not a Wolf formula) with the controller's operating point; setpoint correction writable, slope and level only where the object allows writing; the operating point is marked as distorted while the tank is charging
* (ssbingo) Gas meter: today's and this month's consumption from the history of the meter reading when no objects are linked; meter reading correction for sensors that count from their installation (e.g. HmIP-ESI); warnings for an unreachable sensor, low battery and a questionable counter status

Older changes: [CHANGELOG_OLD.md](CHANGELOG_OLD.md)

## License
MIT License

Copyright (c) 2026 ssbingo <ssbingo@online.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
