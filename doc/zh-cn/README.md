![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" /></a>
</p>

---

## 适用于 ioBroker VIS-2 的 Wolf 供暖小部件

用于在 ioBroker 中显示和操作 [WOLF](https://www.wolf.eu/) 供暖系统的 VIS-2 小部件。

该小部件集本身不从供暖系统读取数据。每个数值都单独绑定到已有的 ioBroker 对象——例如来自 `wolf-smartset` 适配器、`wolf` 适配器（ISM8i）、Modbus 或自有脚本。

> **状态：** 早期开发阶段。全部八个小部件均已可用：系统图、锅炉状态、供暖回路、供暖曲线、生活热水、趋势、消息和燃气表。

### 小部件

| 小部件 | 用途 |
|---|---|
| 系统图 | 液压系统图，含燃烧器火焰、水箱、最多四个供暖回路和流动动画 |
| 锅炉状态 | 运行阶段、燃烧器、调制度和水压（已关联时）、运行小时、启动次数、供水和回水 |
| 供暖回路 | 运行模式、白天和节能温度、修正值、时间程序 —— 可操作 |
| 供暖曲线 | 近似曲线及控制器工作点；修正值可操作 |
| 生活热水 | 带设定值标记的水箱、设定温度、时间程序，可选循环和单次加热 |
| 趋势 | 来自 history、SQL 或 InfluxDB 的最多四条曲线和一个背景区域；6 小时到 7 天 |
| 消息 | 故障指示灯和状态列表：检查项、综合故障、故障代码 |
| 燃气表 | 七种计数器样式的读数、流量、日用量和月用量、费用 |

<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_schema.png" height="110" alt="系统图"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_boiler.png" height="110" alt="锅炉状态"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_circuit.png" height="110" alt="供暖回路"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_heatcurve.png" height="110" alt="供暖曲线">
<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_dhw.png" height="110" alt="生活热水"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_trends.png" height="110" alt="趋势"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_messages.png" height="110" alt="消息"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_gasmeter.png" height="110" alt="燃气表">

详细设置（包括 wolf-smartset (ISM7) 对象的分配）：参见[英文文档](../../README.md)。

### 要求

- js-controller >= 7.2.2
- vis-2 >= 2.20.0（首个使用 React 19 的 vis-2 版本）
- Node.js >= 22

### 免责声明

WOLF 及 WOLF 标志是 WOLF GmbH 的商标。本项目与 WOLF GmbH 无任何关联，也未获其认可。它仅显示其他 ioBroker 适配器提供的数据。

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### 0.4.0 (2026-09-19)
* (ssbingo) VIS-2 调色板中每个小部件都有预览图；支持约 260 px 宽的窄磁贴（系统图改为竖向布局）；趋势图可用键盘操作；文档包含 wolf-smartset (ISM7) 的设置说明。

### 0.3.0 (2026-09-19)
* (ssbingo) 新增小部件：带流动动画的系统图、来自 history、sql 或 influxdb 的趋势图，以及带故障指示灯的状态列表形式的消息——现在全部八个小部件均已可用。

### 0.2.0 (2026-09-18)
* (ssbingo) 首个版本：适用于 VIS-2（React 19）的小部件集，包含燃气表、锅炉状态、供暖回路、生活热水和供暖曲线。控制类小部件仅在确认（ack）后显示数值；供暖曲线为近似值（非 Wolf 公式）。燃气表根据历史记录计算日用量和月用量。

## 许可证

MIT — 参见 [LICENSE](../../LICENSE)
