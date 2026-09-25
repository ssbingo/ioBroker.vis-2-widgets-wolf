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

Em todos os widgets exceto o contador de gás, o primeiro campo do grupo «Objetos» é a **Instalação (instância do adaptador)**: escolha uma instância de `wolf-smartset` (ISM7) ou `wolf` (ISM8i) e os objetos são preenchidos automaticamente. Sem escolha, tudo continua a ser ligado à mão como antes.

### Script de estatísticas de consumo de gás

O adaptador inclui o script ioBroker `gasverbrauch_statistik_v3.0.0.js` (pasta `addOn/`). A partir da leitura do contador calcula hoje, ontem, os últimos 7 e 30 dias, o mês atual e o anterior, e guarda-os como objetos (por omissão em `0_userdata.0.Gas`) — exatamente os valores que a interface web da CCU mostra num HmIP-ESI e que não chegam ao ioBroker através de `hm-rpc`. Em funcionamento normal não é necessário nenhum adaptador de histórico. A partir da versão 3.0 também concilia leituras do contador, calcula custos (com preço base, IVA e adiantamento) e envia relatórios diários e mensais por Telegram e e-mail.

Crie o script no adaptador `javascript`, aponte `SRC` para a leitura do contador e inicie-o. Depois, no widget do contador de gás, escolha a pasta em *Script de estatísticas* — os estados são preenchidos automaticamente. Os valores apresentados são definidos no grupo *Valores visíveis*.

Depois da instalação o script também está disponível no browser: `http://<iobroker>:8082/vis-2/widgets/vis-2-widgets-wolf/addon/gasverbrauch_statistik_v3.0.0.js`. Detalhes na [documentação em inglês](../../README.md).

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

### 0.8.1 (2026-09-25)
* (ssbingo) Script de estatísticas incluído: o relatório diário noturno era descartado em silêncio quando calhava no mesmo minuto do fecho do dia — o bloqueio contra execuções sobrepostas descartava a segunda chamada em vez de a enfileirar. O fecho corre agora às 00:00, o relatório fica às 00:01 e uma fila em série acrescenta tarefas em vez de as descartar, o que também salva uma variação do contador durante o preenchimento inicial
* (ssbingo) Na pasta addOn/ fica apenas a versão atual do script; os manuais curtos apontavam para uma versão que já não existe

### 0.8.0 (2026-09-23)
* (ssbingo) Contador de gás: novo campo *IVA (%)* no cálculo de custos. Até agora o widget somava apenas preço da energia e preço base, pelo que o resultado era bruto ou líquido conforme o que estava indicado; o script incluído trabalha com preços líquidos e acrescenta o imposto, dando uma diferença de 19 por cento. A predefinição 0 mantém as configurações existentes

### 0.7.1 (2026-09-23)
* (ssbingo) Contador de gás: a escolha da pasta passa a preencher também a leitura corrigida e o caudal calculado — antes os dois campos ficavam como estavam se já tivessem o sensor, pelo que o widget continuava a mostrar a leitura não corrigida
* (ssbingo) Contador de gás: o widget avisa quando ainda existe um valor de correção enquanto a leitura vem do script, caso contrário é corrigida duas vezes

### 0.7.0 (2026-09-23)
* (ssbingo) Contador de gás: novo campo de objeto *Custo do mês* — quando ligado, o widget mostra esse valor em vez de calcular pelo tarifário; encaixa no script incluído, cujo valor já inclui preço base, IVA e adiantamento
* (ssbingo) Script de estatísticas incluído na versão 3.0.0: concilia leituras do contador (fator de correção contra impulsos perdidos), calcula custos e envia relatórios diários e mensais por Telegram e e-mail, opcionalmente com PDF
* (ssbingo) A escolha da pasta passa a preencher também o objeto de custos; o manual lista as novas definições e estados

### 0.6.2 (2026-09-23)
* (ssbingo) As fontes dos widgets passam da pasta src-widgets-ts para src-widgets — o nome habitual no mundo ioBroker. O verificador de repositórios ignora essa pasta, pelo que os avisos sobre react e os pacotes de fontes desaparecem sem acrescentar dependências desnecessárias. Nada muda no pacote entregue

### 0.6.1 (2026-09-23)
* (ssbingo) Script de estatísticas incluído na versão 2.1.0: calcula também o caudal a partir das variações do contador (estados Durchfluss, VerbrauchAktiv, ZaehlerLetzteAenderung); o ficheiro foi convertido para UTF-8 e os temporizadores passam por globalThis
* (ssbingo) Contador de gás: a automatização por pasta conhece o caudal calculado e não toca num objeto de caudal já ligado
* (ssbingo) Os ficheiros do script têm a versão no nome; textos e dicas remetem para a pasta addOn/ e um teste impede que os README indiquem ficheiros inexistentes

### 0.6.0 (2026-09-23)
* (ssbingo) Todos os widgets exceto o contador de gás podem preencher os objetos a partir de uma instância: no primeiro campo do grupo «Objetos» escolha uma instalação wolf-smartset (ISM7) ou wolf (ISM8i) e os objetos certos são preenchidos; sem escolha tudo continua manual
* (ssbingo) Contador de gás: o preço da energia pode ser indicado em cent/kWh, tal como aparece na maioria das faturas; o widget avisa quando o preço fica fora de 0,01 a 1,00 €/kWh

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

Alterações mais antigas: [CHANGELOG_OLD.md](../../CHANGELOG_OLD.md)

## Licença

MIT — ver [LICENSE](../../LICENSE)
