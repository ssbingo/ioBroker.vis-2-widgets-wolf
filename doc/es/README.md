![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" /></a>
</p>

---

## Widgets de calefacción Wolf para ioBroker VIS-2

Widgets VIS-2 que muestran y permiten manejar una instalación de calefacción [WOLF](https://www.wolf.eu/) en ioBroker.

El conjunto de widgets no lee datos directamente de la calefacción. Cada valor se vincula individualmente a un objeto de ioBroker existente — por ejemplo del adaptador `wolf-smartset`, del adaptador `wolf` (ISM8i), de Modbus o de scripts propios.

> **Estado:** desarrollo temprano. Están disponibles los ocho widgets: esquema de la instalación, estado de la caldera, circuito de calefacción, curva de calefacción, agua caliente, históricos, mensajes y contador de gas.

### Widgets

| Widget | Función |
|---|---|
| Esquema de la instalación | Esquema hidráulico con llama del quemador, acumulador, hasta cuatro circuitos y animación del flujo |
| Estado de la caldera | Fase de funcionamiento, quemador, modulación y presión (si están vinculadas), horas de funcionamiento, arranques, impulsión y retorno |
| Circuito de calefacción | Modo de funcionamiento, temperatura de día y económica, corrección, programa horario — con mando |
| Curva de calefacción | Curva aproximada con el punto de trabajo de la regulación; corrección con mando |
| Agua caliente | Acumulador con marca de consigna, temperatura de consigna, programa horario, opcionalmente recirculación y carga única |
| Históricos | Hasta cuatro curvas y un área de fondo desde history, SQL o InfluxDB; de 6 horas a 7 días |
| Mensajes | LED de avería y lista de estados: comprobaciones, avería general, código de avería |
| Contador de gas | Lectura en siete estilos de totalizador, caudal, consumo diario y mensual, costes |

<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_schema.png" height="110" alt="Esquema de la instalación"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_boiler.png" height="110" alt="Estado de la caldera"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_circuit.png" height="110" alt="Circuito de calefacción"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_heatcurve.png" height="110" alt="Curva de calefacción">
<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_dhw.png" height="110" alt="Agua caliente"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_trends.png" height="110" alt="Históricos"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_messages.png" height="110" alt="Mensajes"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_gasmeter.png" height="110" alt="Contador de gas">

Configuración detallada, incluida la asignación de los objetos de wolf-smartset (ISM7): véase la [documentación en inglés](../../README.md).

### Requisitos

- js-controller >= 7.2.2
- vis-2 >= 2.20.0 (primera versión de vis-2 con React 19)
- Node.js >= 22

### Aviso legal

WOLF y el logotipo de WOLF son marcas de WOLF GmbH. Este proyecto no está afiliado a WOLF GmbH ni cuenta con su respaldo. Solo muestra datos que proporcionan otros adaptadores de ioBroker.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### 0.4.0 (2026-09-19)
* (ssbingo) Imagen de vista previa para cada widget en la paleta de VIS-2; mosaicos estrechos hasta unos 260 px (el esquema de la instalación pasa a vertical); históricos manejables con el teclado; documentación con la configuración para wolf-smartset (ISM7).

### 0.3.0 (2026-09-19)
* (ssbingo) Nuevos widgets: esquema de la instalación con animación del flujo, históricos desde history, sql o influxdb y mensajes como lista de estados con LED de avería; ya están disponibles los ocho widgets.

### 0.2.0 (2026-09-18)
* (ssbingo) Primera versión: conjunto de widgets para VIS-2 (React 19) con contador de gas, estado de la caldera, circuito de calefacción, agua caliente y curva de calefacción. Los widgets de control solo muestran un valor tras la confirmación (ack); la curva de calefacción es una aproximación (no es una fórmula Wolf). El contador de gas calcula el consumo diario y mensual a partir del historial.

## Licencia

MIT — ver [LICENSE](../../LICENSE)
