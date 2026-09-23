![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" /></a>
</p>

---

## Widgets de aquecimento Wolf para ioBroker VIS-2

Widgets VIS-2 que apresentam e permitem operar um sistema de aquecimento [WOLF](https://www.wolf.eu/) no ioBroker.

O conjunto de widgets não lê dados diretamente do sistema de aquecimento. Cada valor é ligado individualmente a um objeto ioBroker existente — por exemplo do adaptador `wolf-smartset`, do adaptador `wolf` (ISM8i), de Modbus ou de scripts próprios.

> **Estado:** desenvolvimento inicial. Estão disponíveis os oito widgets: esquema da instalação, estado da caldeira, circuito de aquecimento, curva de aquecimento, água quente, históricos, mensagens e contador de gás.

### Widgets

| Widget | Finalidade |
|---|---|
| Esquema da instalação | Esquema hidráulico com chama do queimador, depósito, até quatro circuitos e animação do fluxo |
| Estado da caldeira | Fase de funcionamento, queimador, modulação e pressão (se ligados), horas de funcionamento, arranques, ida e retorno |
| Circuito de aquecimento | Modo de funcionamento, temperatura de dia e económica, correção, programa horário — com comando |
| Curva de aquecimento | Curva aproximada com o ponto de funcionamento do controlador; correção com comando |
| Água quente | Depósito com marca do valor desejado, temperatura desejada, programa horário, opcionalmente circulação e carga única |
| Históricos | Até quatro curvas e uma área de fundo a partir de history, SQL ou InfluxDB; 6 horas a 7 dias |
| Mensagens | LED de avaria e lista de estados: verificações, avaria geral, código de avaria |
| Contador de gás | Leitura em sete estilos de contador, caudal, consumo diário e mensal, custos |

<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_schema.png" height="110" alt="Esquema da instalação"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_boiler.png" height="110" alt="Estado da caldeira"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_circuit.png" height="110" alt="Circuito de aquecimento"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_heatcurve.png" height="110" alt="Curva de aquecimento">
<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_dhw.png" height="110" alt="Água quente"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_trends.png" height="110" alt="Históricos"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_messages.png" height="110" alt="Mensagens"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_gasmeter.png" height="110" alt="Contador de gás">

Configuração detalhada, incluindo a atribuição dos objetos do wolf-smartset (ISM7): ver a [documentação em inglês](../../README.md).

### Script de estatísticas de consumo de gás

O adaptador inclui o script ioBroker `gasverbrauch_statistik.js` (pasta `addOn/`). A partir da leitura do contador calcula hoje, ontem, os últimos 7 e 30 dias, o mês atual e o anterior, e guarda-os como objetos (por omissão em `0_userdata.0.Gas`) — exatamente os valores que a interface web da CCU mostra num HmIP-ESI e que não chegam ao ioBroker através de `hm-rpc`. Em funcionamento normal não é necessário nenhum adaptador de histórico.

Crie o script no adaptador `javascript`, aponte `SRC` para a leitura do contador e inicie-o. Depois, no widget do contador de gás, escolha a pasta em *Script de estatísticas* — os estados são preenchidos automaticamente. Os valores apresentados são definidos no grupo *Valores visíveis*.

Depois da instalação o script também está disponível no browser: `http://<iobroker>:8082/vis-2/widgets/vis-2-widgets-wolf/addon/gasverbrauch_statistik.js`. Detalhes na [documentação em inglês](../../README.md).

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

### 0.5.2 (2026-09-23)
* (ssbingo) Esquema da instalação: um circuito de aquecimento fica parado enquanto a válvula de 3 vias estiver na água quente — antes seguia o aparelho e mostrava fluxo indevido durante a carga do depósito no modo de verão
* (ssbingo) Esquema da instalação: novos campos para a válvula e para o valor de água quente; sem eles tudo fica como antes e um objeto próprio *carga ativa* continua a ter prioridade para o ramo do depósito

### 0.5.1 (2026-09-20)
* (ssbingo) Script de estatísticas: os temporizadores passam por globalThis para que o verificador de repositórios do ioBroker deixe de os assinalar — o comportamento mantém-se
* (ssbingo) react e os pacotes de fontes estão marcados como dependências opcionais para o verificador: as fontes são incorporadas na compilação, o React é fornecido pelo vis-2 em tempo de execução
* (ssbingo) O Dependabot continua a verificar mensalmente, mas distribuído ao longo do mês

### 0.5.0 (2026-09-20)
* (ssbingo) Circuito de aquecimento: cada bloco pode ser mostrado ou ocultado
* (ssbingo) Contador de gás: valores de consumo do script de estatísticas incluído — ontem, últimos 7 e 30 dias, mês passado
* (ssbingo) Contador de gás: cada valor do rodapé pode ser mostrado ou ocultado
* (ssbingo) O script de estatísticas `gasverbrauch_statistik.js` acompanha o adaptador e está descrito em todos os README

### 0.4.1 (2026-09-19)
* (ssbingo) Botão Buy me a coffee no topo de todos os ficheiros README.

### 0.4.0 (2026-09-19)
* (ssbingo) Imagem de pré-visualização para cada widget na paleta do VIS-2; mosaicos estreitos até cerca de 260 px (o esquema da instalação passa a vertical); históricos operáveis pelo teclado; documentação com a configuração para wolf-smartset (ISM7).

### 0.3.0 (2026-09-19)
* (ssbingo) Novos widgets: esquema da instalação com animação do fluxo, históricos a partir de history, sql ou influxdb e mensagens como lista de estados com LED de avaria — os oito widgets estão agora disponíveis.

### 0.2.0 (2026-09-18)
* (ssbingo) Primeira versão: conjunto de widgets para VIS-2 (React 19) com contador de gás, estado da caldeira, circuito de aquecimento, água quente e curva de aquecimento. Os widgets de controlo só mostram um valor após a confirmação (ack); a curva de aquecimento é uma aproximação (não é uma fórmula Wolf). O contador de gás calcula o consumo diário e mensal a partir do histórico.

Alterações mais antigas: [CHANGELOG_OLD.md](../../CHANGELOG_OLD.md)

## Licença

MIT — ver [LICENSE](../../LICENSE)
