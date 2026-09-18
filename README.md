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

> **Status:** early development. The gas meter, boiler status, heating circuit and hot water widgets are available so far.

### Widgets

| Widget | Purpose | Status |
|---|---|---|
| Gas meter | Meter reading, instantaneous flow, daily/monthly consumption, costs | first version |
| Boiler | Operating phase, modulation, water pressure, operating hours, burner starts | first version |
| Heating circuit | Operating mode, day and economy temperature, setpoint correction, time program (writing) | first version |
| Heating curve | Slope and level (writing) | planned |
| Hot water | Tank with set mark, set temperature, time program, optional circulation and one-time charge (writing) | first version |
| System diagram | Hydraulic diagram with animated flow | planned |
| Trends | Charts from history, SQL or InfluxDB | planned |
| Messages | Fault indicator and recent messages | planned |

Each widget can be set to light or dark, or follow the VIS-2 theme automatically (default).

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
* (ssbingo) Initial version: widget set built with React 19 and TypeScript, first version of the gas meter widget
* (ssbingo) Gas meter: all seven counter styles (A, B, C, E, F, G, H) and a status LED for consumption
* (ssbingo) Color scheme per widget: automatic (like VIS-2), light or dark
* (ssbingo) Boiler status: burner LED, gauges only when a data point is linked, state texts without a repeated number prefix (as delivered by wolf-smartset)
* (ssbingo) Boiler status: operating phase (texts from the widget, the object's states or built-in defaults), modulation and water pressure gauges with warning zones, operating hours, burner starts, flow and return temperature
* (ssbingo) Heating circuit: operating mode, day and economy temperature, setpoint correction and time program; limits, step size and state texts come from the linked objects
* (ssbingo) Writing widgets: values are written with ack=false and shown as "applying" until the source confirms them with ack=true; after 10 s without confirmation the widget reports it and shows the last confirmed value again. Optional confirm mode with Apply/Discard; read-only objects lock their controls
* (ssbingo) Hot water: tank graphic with temperature and set mark, set temperature, time program, effective setpoint and charging state; circulation and one-time charge only when linked. Switches write 0/1 to number objects and true/false otherwise

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
