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

En todos los widgets salvo el contador de gas, el primer campo del grupo «Objetos» es la **Instalación (instancia del adaptador)**: elige una instancia de `wolf-smartset` (ISM7) o `wolf` (ISM8i) y los objetos se rellenan automáticamente. Sin elección todo se enlaza a mano como antes.

### Script de estadísticas de consumo de gas

El adaptador incluye el script de ioBroker `gasverbrauch_statistik_v2.1.0.js` (carpeta `addOn/`). A partir de la lectura del contador calcula hoy, ayer, los últimos 7 y 30 días y el mes actual y el anterior, y los guarda como objetos (por defecto en `0_userdata.0.Gas`): exactamente los valores que la interfaz web de la CCU muestra en un HmIP-ESI y que no llegan a ioBroker a través de `hm-rpc`. En el funcionamiento normal no hace falta ningún adaptador de histórico. Desde la versión 3.0 también concilia lecturas del contador, calcula costes (con cuota fija, IVA y anticipo) y envía informes diarios y mensuales por Telegram y correo electrónico.

Crea el script en el adaptador `javascript`, apunta `SRC` a la lectura del contador e inícialo. Después, en el widget del contador de gas, elige la carpeta en *Script de estadísticas*: los estados se rellenan automáticamente. Qué valores muestra la tarjeta lo decide el grupo *Valores visibles*.

Tras la instalación el script también está disponible en el navegador: `http://<iobroker>:8082/vis-2/widgets/vis-2-widgets-wolf/addon/gasverbrauch_statistik_v2.1.0.js`. Detalles en la [documentación en inglés](../../README.md).

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

### 0.7.1 (2026-09-23)
* (ssbingo) Contador de gas: la elección de la carpeta rellena ahora también la lectura corregida y el caudal calculado; antes ambos campos se dejaban intactos si ya tenían el sensor y la tarjeta seguía mostrando la lectura sin corregir
* (ssbingo) Contador de gas: la tarjeta avisa de un valor de corrección que sigue puesto mientras la lectura viene del script, porque si no se corrige dos veces

### 0.7.0 (2026-09-23)
* (ssbingo) Contador de gas: nuevo campo de objeto *Coste del mes* — si está enlazado, la tarjeta muestra ese valor en lugar de calcularlo desde la tarifa; encaja con el script incluido, cuyo importe incluye cuota fija, IVA y anticipo
* (ssbingo) Script de estadísticas incluido en la versión 3.0.0: concilia lecturas del contador (factor de corrección frente a impulsos perdidos), calcula costes y envía informes diarios y mensuales por Telegram y correo, si se desea con PDF
* (ssbingo) La elección de la carpeta rellena ahora también el objeto de costes; el manual enumera los nuevos ajustes y estados

### 0.6.2 (2026-09-23)
* (ssbingo) Las fuentes de los widgets pasan de src-widgets-ts a src-widgets, el nombre habitual en el entorno de ioBroker. El verificador de repositorios omite esa carpeta, así que sus avisos sobre react y los paquetes de fuentes desaparecen sin añadir dependencias innecesarias. En el paquete entregado no cambia nada

### 0.6.1 (2026-09-23)
* (ssbingo) Script de estadísticas incluido en la versión 2.1.0: también calcula el caudal a partir de las variaciones del contador (estados Durchfluss, VerbrauchAktiv, ZaehlerLetzteAenderung); el archivo se pasó a UTF-8 y sus temporizadores usan globalThis
* (ssbingo) Contador de gas: la automatización por carpeta conoce el caudal calculado y deja en paz un objeto de caudal ya enlazado
* (ssbingo) Los archivos del script llevan la versión en el nombre; los textos y ayudas remiten a la carpeta addOn/, y un test evita que los README nombren archivos inexistentes

### 0.6.0 (2026-09-23)
* (ssbingo) Todos los widgets salvo el contador de gas pueden rellenar sus objetos desde una instancia: en el primer campo del grupo «Objetos» elige una instalación de wolf-smartset (ISM7) o wolf (ISM8i); sin elección todo sigue siendo manual
* (ssbingo) Contador de gas: el precio de la energía se puede indicar en cent/kWh como figura en la mayoría de las facturas; la tarjeta avisa de un precio fuera de 0,01 a 1,00 €/kWh

### 0.5.2 (2026-09-23)
* (ssbingo) Esquema de la instalación: un circuito de calefacción permanece parado mientras la válvula de 3 vías está en agua caliente; hasta ahora seguía a la caldera y mostraba flujo indebido durante la carga del acumulador en modo verano
* (ssbingo) Esquema de la instalación: nuevos campos para la válvula y para el valor de agua caliente; sin ellos todo sigue igual y un objeto propio *carga activa* mantiene la prioridad para la rama del acumulador

### 0.5.1 (2026-09-20)
* (ssbingo) Script de estadísticas: los temporizadores pasan por globalThis para que el verificador de repositorios de ioBroker ya no los señale; el comportamiento no cambia
* (ssbingo) react y los paquetes de fuentes están marcados como dependencias opcionales para el verificador: las fuentes se incrustan al compilar y vis-2 proporciona React en tiempo de ejecución
* (ssbingo) Dependabot sigue comprobando mensualmente, pero repartido a lo largo del mes

### 0.5.0 (2026-09-20)
* (ssbingo) Circuito de calefacción: cada bloque se puede mostrar u ocultar
* (ssbingo) Contador de gas: valores de consumo del script de estadísticas incluido — ayer, últimos 7 y 30 días, mes pasado
* (ssbingo) Contador de gas: cada valor del pie se puede mostrar u ocultar
* (ssbingo) El script de estadísticas `gasverbrauch_statistik.js` se entrega con el adaptador y está descrito en todos los README

### 0.4.1 (2026-09-19)
* (ssbingo) Botón Buy me a coffee al principio de todos los archivos README.

### 0.4.0 (2026-09-19)
* (ssbingo) Imagen de vista previa para cada widget en la paleta de VIS-2; mosaicos estrechos hasta unos 260 px (el esquema de la instalación pasa a vertical); históricos manejables con el teclado; documentación con la configuración para wolf-smartset (ISM7).

Cambios anteriores: [CHANGELOG_OLD.md](../../CHANGELOG_OLD.md)

## Licencia

MIT — ver [LICENSE](../../LICENSE)
