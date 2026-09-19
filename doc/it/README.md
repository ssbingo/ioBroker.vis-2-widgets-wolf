![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" /></a>
</p>

---

## Widget di riscaldamento Wolf per ioBroker VIS-2

Widget VIS-2 che visualizzano e permettono di comandare un impianto di riscaldamento [WOLF](https://www.wolf.eu/) in ioBroker.

Il set di widget non legge direttamente alcun dato dall'impianto. Ogni valore viene collegato singolarmente a un oggetto ioBroker esistente — ad esempio dall'adattatore `wolf-smartset`, dall'adattatore `wolf` (ISM8i), da Modbus o da script propri.

> **Stato:** sviluppo iniziale. Sono disponibili tutti gli otto widget: schema dell'impianto, stato caldaia, circuito di riscaldamento, curva di riscaldamento, acqua calda, andamenti, messaggi e contatore del gas.

### Widget

| Widget | Funzione |
|---|---|
| Schema dell'impianto | Schema idraulico con fiamma del bruciatore, bollitore, fino a quattro circuiti e animazione del flusso |
| Stato caldaia | Fase di funzionamento, bruciatore, modulazione e pressione (se collegate), ore di funzionamento, avvii, mandata e ritorno |
| Circuito di riscaldamento | Modalità, temperatura giorno e ridotta, correzione, programma orario — comandabile |
| Curva di riscaldamento | Curva approssimata con il punto di lavoro della regolazione; correzione comandabile |
| Acqua calda | Bollitore con indicatore del valore nominale, temperatura nominale, programma orario, opzionalmente ricircolo e carica singola |
| Andamenti | Fino a quattro curve e un'area di sfondo da history, SQL o InfluxDB; da 6 ore a 7 giorni |
| Messaggi | LED di guasto ed elenco di stati: controlli, guasto cumulativo, codice di guasto |
| Contatore del gas | Lettura in sette varianti di totalizzatore, portata, consumo giornaliero e mensile, costi |

<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_schema.png" height="110" alt="Schema dell'impianto"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_boiler.png" height="110" alt="Stato caldaia"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_circuit.png" height="110" alt="Circuito di riscaldamento"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_heatcurve.png" height="110" alt="Curva di riscaldamento">
<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_dhw.png" height="110" alt="Acqua calda"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_trends.png" height="110" alt="Andamenti"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_messages.png" height="110" alt="Messaggi"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_gasmeter.png" height="110" alt="Contatore del gas">

Configurazione dettagliata, compresa l'assegnazione degli oggetti wolf-smartset (ISM7): vedere la [documentazione in inglese](../../README.md).

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

### 0.4.0 (2026-09-19)
* (ssbingo) Immagine di anteprima per ogni widget nella tavolozza di VIS-2; riquadri stretti fino a circa 260 px (lo schema dell'impianto passa in verticale); andamenti utilizzabili da tastiera; documentazione con la configurazione per wolf-smartset (ISM7).

### 0.3.0 (2026-09-19)
* (ssbingo) Nuovi widget: schema dell'impianto con animazione del flusso, andamenti da history, sql o influxdb e messaggi come elenco di stati con LED di guasto — ora sono disponibili tutti gli otto widget.

### 0.2.0 (2026-09-18)
* (ssbingo) Prima versione: set di widget per VIS-2 (React 19) con contatore del gas, stato caldaia, circuito di riscaldamento, acqua calda e curva di riscaldamento. I widget di comando mostrano un valore solo dopo la conferma (ack); la curva di riscaldamento è un'approssimazione (non una formula Wolf). Il contatore del gas calcola il consumo giornaliero e mensile dallo storico.

## Licenza

MIT — vedi [LICENSE](../../LICENSE)
