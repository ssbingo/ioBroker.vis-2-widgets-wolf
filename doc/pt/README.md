![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## Widgets de aquecimento Wolf para ioBroker VIS-2

Widgets VIS-2 que apresentam e permitem operar um sistema de aquecimento [WOLF](https://www.wolf.eu/) no ioBroker.

O conjunto de widgets não lê dados diretamente do sistema de aquecimento. Cada valor é ligado individualmente a um objeto ioBroker existente — por exemplo do adaptador `wolf-smartset`, do adaptador `wolf` (ISM8i), de Modbus ou de scripts próprios.

> **Estado:** desenvolvimento inicial. Por agora estão disponíveis o contador de gás, o estado da caldeira, o circuito de aquecimento, a água quente, a curva de aquecimento, as mensagens e o esquema da instalação.

### Requisitos

- js-controller >= 7.2.2
- vis-2 >= 2.20.0 (primeira versão do vis-2 com React 19)
- Node.js >= 22

### Aviso legal

WOLF e o logótipo WOLF são marcas da WOLF GmbH. Este projeto não tem qualquer ligação à WOLF GmbH nem é apoiado por ela. Apenas apresenta dados fornecidos por outros adaptadores ioBroker.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### 0.2.0 (2026-09-18)
* (ssbingo) Primeira versão: conjunto de widgets para VIS-2 (React 19) com contador de gás, estado da caldeira, circuito de aquecimento, água quente e curva de aquecimento. Os widgets de controlo só mostram um valor após a confirmação (ack); a curva de aquecimento é uma aproximação (não é uma fórmula Wolf). O contador de gás calcula o consumo diário e mensal a partir do histórico.

## Licença

MIT — ver [LICENSE](../../LICENSE)
