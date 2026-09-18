![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## Widgets de calefacción Wolf para ioBroker VIS-2

Widgets VIS-2 que muestran y permiten manejar una instalación de calefacción [WOLF](https://www.wolf.eu/) en ioBroker.

El conjunto de widgets no lee datos directamente de la calefacción. Cada valor se vincula individualmente a un objeto de ioBroker existente — por ejemplo del adaptador `wolf-smartset`, del adaptador `wolf` (ISM8i), de Modbus o de scripts propios.

> **Estado:** desarrollo temprano. De momento solo está disponible el widget del contador de gas.

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

### **WORK IN PROGRESS**
* (ssbingo) Primera versión: conjunto de widgets con React 19 y TypeScript, primera versión del widget del contador de gas

## Licencia

MIT — ver [LICENSE](../../LICENSE)
