![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

---

<p align="center">
  <a href="https://www.buymeacoffee.com/ssbingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=ssbingo&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" alt="Buy me a coffee" /></a>
</p>

---

## Widgets de chauffage Wolf pour ioBroker VIS-2

Widgets VIS-2 qui affichent et permettent de piloter une installation de chauffage [WOLF](https://www.wolf.eu/) dans ioBroker.

Le jeu de widgets ne lit aucune donnée directement depuis le chauffage. Chaque valeur est liée individuellement à un objet ioBroker existant — par exemple issu de l'adaptateur `wolf-smartset`, de l'adaptateur `wolf` (ISM8i), de Modbus ou de vos propres scripts.

> **État :** développement précoce. Les huit widgets sont disponibles : schéma de l'installation, état de la chaudière, circuit de chauffage, courbe de chauffe, eau chaude, historiques, messages et compteur de gaz.

### Widgets

| Widget | Fonction |
|---|---|
| Schéma de l'installation | Schéma hydraulique avec flamme du brûleur, ballon, jusqu'à quatre circuits et animation du débit |
| État de la chaudière | Phase de fonctionnement, brûleur, modulation et pression (si liées), heures de fonctionnement, démarrages, départ et retour |
| Circuit de chauffage | Mode de fonctionnement, température jour et réduite, correction, programme horaire — pilotable |
| Courbe de chauffe | Courbe approchée avec le point de fonctionnement de la régulation ; correction pilotable |
| Eau chaude | Ballon avec repère de consigne, consigne, programme horaire, en option bouclage et charge unique |
| Historiques | Jusqu'à quatre courbes et une surface d'arrière-plan depuis history, SQL ou InfluxDB ; 6 heures à 7 jours |
| Messages | LED de défaut et liste d'états : contrôles, défaut général, code de défaut |
| Compteur de gaz | Index en sept styles de totalisateur, débit, consommation journalière et mensuelle, coûts |

<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_schema.png" height="110" alt="Schéma de l'installation"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_boiler.png" height="110" alt="État de la chaudière"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_circuit.png" height="110" alt="Circuit de chauffage"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_heatcurve.png" height="110" alt="Courbe de chauffe">
<img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_dhw.png" height="110" alt="Eau chaude"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_trends.png" height="110" alt="Historiques"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_messages.png" height="110" alt="Messages"> <img src="https://raw.githubusercontent.com/ssbingo/ioBroker.vis-2-widgets-wolf/main/widgets/vis-2-widgets-wolf/img/prev_gasmeter.png" height="110" alt="Compteur de gaz">

Configuration détaillée, y compris l'affectation des objets wolf-smartset (ISM7) : voir la [documentation en anglais](../../README.md).

### Script de statistiques de consommation de gaz

L'adaptateur est livré avec le script ioBroker `gasverbrauch_statistik.js` (dossier `addOn/`). À partir de l'index du compteur, il calcule aujourd'hui, hier, les 7 et 30 derniers jours ainsi que le mois en cours et le mois dernier, et les enregistre comme objets (par défaut dans `0_userdata.0.Gas`) — exactement les valeurs affichées par l'interface web de la CCU pour un HmIP-ESI, qui n'arrivent pas dans ioBroker via `hm-rpc`. En fonctionnement courant, aucun adaptateur d'historique n'est nécessaire.

Créez le script dans l'adaptateur `javascript`, réglez `SRC` sur l'index du compteur et démarrez-le. Ensuite, dans le widget compteur de gaz, choisissez le dossier sous *Script de statistiques* — les états sont renseignés automatiquement. Les valeurs affichées se règlent dans le groupe *Valeurs affichées*.

Après l'installation, le script est aussi accessible dans le navigateur : `http://<iobroker>:8082/vis-2/widgets/vis-2-widgets-wolf/addon/gasverbrauch_statistik.js`. Détails dans la [documentation en anglais](../../README.md).

### Prérequis

- js-controller >= 7.2.2
- vis-2 >= 2.20.0 (première version de vis-2 avec React 19)
- Node.js >= 22

### Avertissement

WOLF et le logo WOLF sont des marques de WOLF GmbH. Ce projet n'est ni affilié à WOLF GmbH ni soutenu par elle. Il affiche uniquement des données fournies par d'autres adaptateurs ioBroker.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### 0.4.1 (2026-09-19)
* (ssbingo) Bouton Buy me a coffee en haut de tous les fichiers README.

### 0.4.0 (2026-09-19)
* (ssbingo) Image d'aperçu pour chaque widget dans la palette VIS-2 ; tuiles étroites jusqu'à environ 260 px (le schéma de l'installation passe à la verticale) ; historiques utilisables au clavier ; documentation avec la configuration pour wolf-smartset (ISM7).

### 0.3.0 (2026-09-19)
* (ssbingo) Nouveaux widgets : schéma de l'installation avec animation du débit, historiques depuis history, sql ou influxdb et messages sous forme de liste d'états avec LED de défaut — les huit widgets sont désormais disponibles.

### 0.2.0 (2026-09-18)
* (ssbingo) Première version : ensemble de widgets pour VIS-2 (React 19) avec compteur de gaz, état de la chaudière, circuit de chauffage, eau chaude et courbe de chauffe. Les widgets de commande n'affichent une valeur qu'après confirmation (ack) ; la courbe de chauffe est une approximation (pas une formule Wolf). Le compteur de gaz calcule la consommation journalière et mensuelle à partir de l'historique.

## Licence

MIT — voir [LICENSE](../../LICENSE)
