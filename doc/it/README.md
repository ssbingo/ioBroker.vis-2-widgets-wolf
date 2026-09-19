![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## Widget di riscaldamento Wolf per ioBroker VIS-2

Widget VIS-2 che visualizzano e permettono di comandare un impianto di riscaldamento [WOLF](https://www.wolf.eu/) in ioBroker.

Il set di widget non legge direttamente alcun dato dall'impianto. Ogni valore viene collegato singolarmente a un oggetto ioBroker esistente — ad esempio dall'adattatore `wolf-smartset`, dall'adattatore `wolf` (ISM8i), da Modbus o da script propri.

> **Stato:** sviluppo iniziale. Per ora sono disponibili il contatore del gas, lo stato caldaia, il circuito di riscaldamento, l'acqua calda, la curva di riscaldamento e i messaggi.

### Requisiti

- js-controller >= 7.2.2
- vis-2 >= 2.20.0 (prima versione di vis-2 con React 19)
- Node.js >= 22

### Esclusione di responsabilità

WOLF e il logo WOLF sono marchi di WOLF GmbH. Questo progetto non è affiliato a WOLF GmbH né da essa sostenuto. Visualizza soltanto dati forniti da altri adattatori ioBroker.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### 0.2.0 (2026-09-18)
* (ssbingo) Prima versione: set di widget per VIS-2 (React 19) con contatore del gas, stato caldaia, circuito di riscaldamento, acqua calda e curva di riscaldamento. I widget di comando mostrano un valore solo dopo la conferma (ack); la curva di riscaldamento è un'approssimazione (non una formula Wolf). Il contatore del gas calcola il consumo giornaliero e mensile dallo storico.

## Licenza

MIT — vedi [LICENSE](../../LICENSE)
