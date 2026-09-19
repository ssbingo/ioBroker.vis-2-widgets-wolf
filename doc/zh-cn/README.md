![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## 适用于 ioBroker VIS-2 的 Wolf 供暖小部件

用于在 ioBroker 中显示和操作 [WOLF](https://www.wolf.eu/) 供暖系统的 VIS-2 小部件。

该小部件集本身不从供暖系统读取数据。每个数值都单独绑定到已有的 ioBroker 对象——例如来自 `wolf-smartset` 适配器、`wolf` 适配器（ISM8i）、Modbus 或自有脚本。

> **状态：** 早期开发阶段。目前提供燃气表、锅炉状态、供暖回路、生活热水、供暖曲线和消息小部件。

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

### 0.2.0 (2026-09-18)
* (ssbingo) 首个版本：适用于 VIS-2（React 19）的小部件集，包含燃气表、锅炉状态、供暖回路、生活热水和供暖曲线。控制类小部件仅在确认（ack）后显示数值；供暖曲线为近似值（非 Wolf 公式）。燃气表根据历史记录计算日用量和月用量。

## 许可证

MIT — 参见 [LICENSE](../../LICENSE)
