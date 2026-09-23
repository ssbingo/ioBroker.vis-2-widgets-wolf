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

除燃气表外，每个小部件在“对象”分组中的第一个字段都是**设备（适配器实例）**：选择 `wolf-smartset`（ISM7）或 `wolf`（ISM8i）的实例，对象便会自动填入。不选择时仍像以前一样手动关联。

### 燃气用量统计脚本

适配器附带 ioBroker 脚本 `gasverbrauch_statistik_v2.1.0.js`（目录 `addOn/`）。它根据表读数计算今天、昨天、最近 7 天和 30 天以及本月和上月的用量，并保存为对象（默认在 `0_userdata.0.Gas`）——正是 CCU 网页界面为 HmIP-ESI 显示、却无法通过 `hm-rpc` 进入 ioBroker 的那些数值。日常运行不需要历史适配器。 自 3.0 版起，它还能校准抄表读数、计算费用（含基本费、增值税与预付款），并通过 Telegram 和电子邮件发送日报与月度账单。

在 `javascript` 适配器中新建脚本，把 `SRC` 指向表读数并启动。随后在燃气表小部件的 *统计脚本* 中选择该目录——状态会自动填入。磁贴显示哪些数值，由 *显示的数值* 分组决定。

安装后脚本也可在浏览器中获取：`http://<iobroker>:8082/vis-2/widgets/vis-2-widgets-wolf/addon/gasverbrauch_statistik_v2.1.0.js`。详情见[英文文档](../../README.md)。

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

### 0.6.2 (2026-09-23)
* (ssbingo) 小部件源码从 src-widgets-ts 移到 src-widgets——这是 ioBroker 生态中的惯用名称。仓库检查器会跳过该目录，因此关于 react 和字体包的提示完全消失，也无需添加运行时并不需要的依赖。交付的安装包没有变化

### 0.6.1 (2026-09-23)
* (ssbingo) 附带统计脚本升级到 2.1.0：还能根据表读数变化计算流量（状态 Durchfluss、VerbrauchAktiv、ZaehlerLetzteAenderung）；文件已转换为 UTF-8，定时器改为通过 globalThis 调用
* (ssbingo) 燃气表：目录自动填充已识别计算得到的流量，并且不会覆盖已关联的流量对象
* (ssbingo) 脚本文件名包含版本号；文字与提示改为指向 addOn/ 目录，并新增测试防止 README 引用不存在的文件

### 0.6.0 (2026-09-23)
* (ssbingo) 除燃气表外，每个小部件都能从适配器实例自动填入对象：在“对象”分组的第一个字段选择 wolf-smartset（ISM7）或 wolf（ISM8i）设备即可；不选择时仍手动关联
* (ssbingo) 燃气表：单价可按多数账单的写法以 ct/kWh 输入；若单价不在 0,01 至 1,00 €/kWh 之间，磁贴会给出提示

### 0.5.2 (2026-09-23)
* (ssbingo) 系统示意图：只要三通换向阀切到热水，采暖回路就保持静止——此前它跟随锅炉，夏季模式下加热水箱时会错误显示水流
* (ssbingo) 系统示意图：新增换向阀及热水数值字段；未填写时行为不变，水箱支路仍以单独的“正在加热”对象为准

### 0.5.1 (2026-09-20)
* (ssbingo) 统计脚本：定时器改为通过 globalThis 调用，ioBroker 仓库检查器不再提示——行为保持不变
* (ssbingo) react 与字体包已为仓库检查器标记为可选依赖：字体在构建时内嵌，React 由 vis-2 在运行时提供
* (ssbingo) Dependabot 仍每月检查一次，但在月内分散执行

### 0.5.0 (2026-09-20)
* (ssbingo) 采暖回路：每个模块都可单独显示或隐藏
* (ssbingo) 燃气表：使用附带统计脚本的用量数值——昨天、最近 7 天和 30 天、上月
* (ssbingo) 燃气表：底部每个数值都可单独显示或隐藏
* (ssbingo) 统计脚本 `gasverbrauch_statistik.js` 随适配器一同提供，并已写入所有 README

### 0.4.1 (2026-09-19)
* (ssbingo) 所有 README 文件顶部加入 Buy me a coffee 按钮。

### 0.4.0 (2026-09-19)
* (ssbingo) VIS-2 调色板中每个小部件都有预览图；支持约 260 px 宽的窄磁贴（系统图改为竖向布局）；趋势图可用键盘操作；文档包含 wolf-smartset (ISM7) 的设置说明。

### 0.3.0 (2026-09-19)
* (ssbingo) 新增小部件：带流动动画的系统图、来自 history、sql 或 influxdb 的趋势图，以及带故障指示灯的状态列表形式的消息——现在全部八个小部件均已可用。

### 0.2.0 (2026-09-18)
* (ssbingo) 首个版本：适用于 VIS-2（React 19）的小部件集，包含燃气表、锅炉状态、供暖回路、生活热水和供暖曲线。控制类小部件仅在确认（ack）后显示数值；供暖曲线为近似值（非 Wolf 公式）。燃气表根据历史记录计算日用量和月用量。

更早的更改：[CHANGELOG_OLD.md](../../CHANGELOG_OLD.md)

## 许可证

MIT — 参见 [LICENSE](../../LICENSE)
