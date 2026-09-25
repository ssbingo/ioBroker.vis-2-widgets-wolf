# Older changes
## 0.4.1 (2026-09-19)
* (ssbingo) Buy me a coffee button at the top of all README files

## 0.4.0 (2026-09-19)
* (ssbingo) Preview image for every widget in the VIS-2 palette, icon for the widget group
* (ssbingo) Narrow tiles: the system diagram switches to an upright layout below 480 px; small steppers and LED texts adapt down to about 260 px
* (ssbingo) Keyboard: the trends chart can be operated with the arrow keys; visible focus on all controls
* (ssbingo) Documentation: setup with wolf-smartset (ISM7) for every widget

## 0.3.0 (2026-09-19)
* (ssbingo) Trends: up to four curves and a background area (e.g. modulation) from the history adapter (history, sql, influxdb), 6 h to 7 days, average/min-max/raw values, current value at the right edge, crosshair with values in the legend
* (ssbingo) System diagram: heat generator with flame, distributor, hot water tank, up to four heating circuits and outside temperature; the flow animation follows the pump (or the burner), tank charging and each circuit's pump
* (ssbingo) Messages: fault LED and a status list with up to eight configurable checks (e.g. the safety temperature limiters and the connection to the ISM7), collective fault, fault code with texts and an optional message list (JSON)

## 0.2.0 (2026-09-18)
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
