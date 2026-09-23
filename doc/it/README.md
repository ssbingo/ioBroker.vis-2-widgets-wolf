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

In ogni widget tranne il contatore del gas, il primo campo del gruppo «Oggetti» è l'**Impianto (istanza dell'adattatore)**: scegli un'istanza di `wolf-smartset` (ISM7) o `wolf` (ISM8i) e gli oggetti vengono inseriti automaticamente. Senza scelta si collega tutto a mano come prima.

### Script per la statistica dei consumi di gas

Con l'adattatore viene fornito lo script ioBroker `gasverbrauch_statistik_v2.1.0.js` (cartella `addOn/`). Dalla lettura del contatore calcola oggi, ieri, gli ultimi 7 e 30 giorni, il mese corrente e quello precedente e li salva come oggetti (per impostazione predefinita in `0_userdata.0.Gas`) — proprio i valori che l'interfaccia web della CCU mostra per un HmIP-ESI e che tramite `hm-rpc` non arrivano in ioBroker. Per il funzionamento normale non serve alcun adattatore di storico.

Crea lo script nell'adattatore `javascript`, imposta `SRC` sulla lettura del contatore e avvialo. Poi, nel widget del contatore del gas, scegli la cartella in *Script di statistica*: gli stati vengono inseriti automaticamente. Quali valori mostra la piastrella lo decide il gruppo *Valori visibili*.

Dopo l'installazione lo script è disponibile anche nel browser: `http://<iobroker>:8082/vis-2/widgets/vis-2-widgets-wolf/addon/gasverbrauch_statistik_v2.1.0.js`. Dettagli nella [documentazione in inglese](../../README.md).

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

### 0.6.2 (2026-09-23)
* (ssbingo) I sorgenti dei widget passano da src-widgets-ts a src-widgets, il nome consueto nel mondo ioBroker. Il verificatore dei repository salta questa cartella, quindi le sue osservazioni su react e sui pacchetti dei caratteri spariscono senza aggiungere dipendenze inutili. Nel pacchetto consegnato non cambia nulla

### 0.6.1 (2026-09-23)
* (ssbingo) Script di statistica incluso nella versione 2.1.0: calcola anche la portata dalle variazioni del contatore (stati Durchfluss, VerbrauchAktiv, ZaehlerLetzteAenderung); il file è stato convertito in UTF-8 e i timer passano per globalThis
* (ssbingo) Contatore del gas: l'automatismo della cartella conosce la portata calcolata e lascia stare un oggetto di portata già collegato
* (ssbingo) I file dello script portano la versione nel nome; testi e suggerimenti rimandano alla cartella addOn/ e un test impedisce che i README citino file inesistenti

### 0.6.0 (2026-09-23)
* (ssbingo) Ogni widget tranne il contatore del gas può compilare i suoi oggetti da un'istanza: nel primo campo del gruppo «Oggetti» scegli un impianto wolf-smartset (ISM7) o wolf (ISM8i); senza scelta resta tutto manuale
* (ssbingo) Contatore del gas: il prezzo dell'energia si può indicare in cent/kWh come nella maggior parte delle bollette; la piastrella segnala un prezzo fuori dall'intervallo 0,01–1,00 €/kWh

### 0.5.2 (2026-09-23)
* (ssbingo) Schema dell'impianto: un circuito di riscaldamento resta fermo finché la valvola a 3 vie è sull'acqua calda — prima seguiva la caldaia e in modalità estiva mostrava erroneamente flusso durante la carica del bollitore
* (ssbingo) Schema dell'impianto: nuovi campi per la valvola e per il valore acqua calda; senza di essi non cambia nulla e un oggetto *carica attiva* mantiene la priorità per il ramo del bollitore

### 0.5.1 (2026-09-20)
* (ssbingo) Script di statistica: i timer passano per globalThis, così il verificatore dei repository ioBroker non li segnala più — il comportamento resta invariato
* (ssbingo) react e i pacchetti dei caratteri sono contrassegnati come dipendenze opzionali per il verificatore: i caratteri vengono inclusi in fase di build, React è fornito da vis-2 a runtime
* (ssbingo) Dependabot controlla sempre una volta al mese, ma distribuito nel corso del mese

### 0.5.0 (2026-09-20)
* (ssbingo) Circuito di riscaldamento: ogni blocco si può mostrare o nascondere
* (ssbingo) Contatore del gas: valori di consumo dallo script di statistica incluso — ieri, ultimi 7 e 30 giorni, mese scorso
* (ssbingo) Contatore del gas: ogni valore del piè di pagina si può mostrare o nascondere
* (ssbingo) Lo script di statistica `gasverbrauch_statistik.js` è incluso nell'adattatore ed è descritto in tutti i README

### 0.4.1 (2026-09-19)
* (ssbingo) Pulsante Buy me a coffee in cima a tutti i file README.

### 0.4.0 (2026-09-19)
* (ssbingo) Immagine di anteprima per ogni widget nella tavolozza di VIS-2; riquadri stretti fino a circa 260 px (lo schema dell'impianto passa in verticale); andamenti utilizzabili da tastiera; documentazione con la configurazione per wolf-smartset (ISM7).

### 0.3.0 (2026-09-19)
* (ssbingo) Nuovi widget: schema dell'impianto con animazione del flusso, andamenti da history, sql o influxdb e messaggi come elenco di stati con LED di guasto — ora sono disponibili tutti gli otto widget.

### 0.2.0 (2026-09-18)
* (ssbingo) Prima versione: set di widget per VIS-2 (React 19) con contatore del gas, stato caldaia, circuito di riscaldamento, acqua calda e curva di riscaldamento. I widget di comando mostrano un valore solo dopo la conferma (ack); la curva di riscaldamento è un'approssimazione (non una formula Wolf). Il contatore del gas calcola il consumo giornaliero e mensile dallo storico.

Modifiche precedenti: [CHANGELOG_OLD.md](../../CHANGELOG_OLD.md)

## Licenza

MIT — vedi [LICENSE](../../LICENSE)
