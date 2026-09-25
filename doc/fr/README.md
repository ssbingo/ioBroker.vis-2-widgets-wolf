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

Dans chaque widget sauf le compteur de gaz, le premier champ du groupe « Objets » est l'**Installation (instance d'adaptateur)** : choisissez une instance de `wolf-smartset` (ISM7) ou `wolf` (ISM8i) et les objets sont renseignés automatiquement. Sans choix, tout se relie à la main comme avant.

### Script de statistiques de consommation de gaz

L'adaptateur est livré avec le script ioBroker `gasverbrauch_statistik_v3.0.0.js` (dossier `addOn/`). À partir de l'index du compteur, il calcule aujourd'hui, hier, les 7 et 30 derniers jours ainsi que le mois en cours et le mois dernier, et les enregistre comme objets (par défaut dans `0_userdata.0.Gas`) — exactement les valeurs affichées par l'interface web de la CCU pour un HmIP-ESI, qui n'arrivent pas dans ioBroker via `hm-rpc`. En fonctionnement courant, aucun adaptateur d'historique n'est nécessaire. Depuis la version 3.0, il recale aussi les index relevés, calcule les coûts (abonnement, TVA et acompte) et envoie des rapports quotidiens et mensuels par Telegram et e-mail.

Créez le script dans l'adaptateur `javascript`, réglez `SRC` sur l'index du compteur et démarrez-le. Ensuite, dans le widget compteur de gaz, choisissez le dossier sous *Script de statistiques* — les états sont renseignés automatiquement. Les valeurs affichées se règlent dans le groupe *Valeurs affichées*.

Après l'installation, le script est aussi accessible dans le navigateur : `http://<iobroker>:8082/vis-2/widgets/vis-2-widgets-wolf/addon/gasverbrauch_statistik_v3.0.0.js`. Détails dans la [documentation en anglais](../../README.md).

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

### 0.8.0 (2026-09-23)
* (ssbingo) Compteur de gaz : nouveau champ *TVA (%)* dans le calcul des coûts. Jusqu'ici la vignette additionnait seulement le prix de l'énergie et l'abonnement, le résultat était donc TTC ou HT selon la saisie ; le script fourni travaille avec des prix HT et ajoute la taxe, d'où un écart de 19 pour cent. La valeur par défaut 0 ne change rien aux configurations existantes

### 0.7.1 (2026-09-23)
* (ssbingo) Compteur de gaz : le choix du dossier renseigne désormais aussi l'index corrigé et le débit calculé — auparavant ces deux champs restaient inchangés s'ils contenaient déjà le capteur, et la vignette affichait l'index non corrigé
* (ssbingo) Compteur de gaz : la vignette signale une valeur de correction encore présente alors que l'index vient du script, sinon la correction s'applique deux fois

### 0.7.0 (2026-09-23)
* (ssbingo) Compteur de gaz : nouveau champ d'objet *Coût du mois* — s'il est lié, la vignette affiche cette valeur au lieu de calculer d'après le tarif ; cela convient au script fourni, dont le montant inclut abonnement, TVA et acompte
* (ssbingo) Script de statistiques fourni en version 3.0.0 : il recale les index relevés (facteur de correction contre les impulsions perdues), calcule les coûts et envoie des rapports quotidiens et mensuels par Telegram et e-mail, au besoin avec un PDF
* (ssbingo) Le choix du dossier renseigne désormais aussi l'objet de coûts ; le manuel liste les nouveaux réglages et états

### 0.6.2 (2026-09-23)
* (ssbingo) Les sources des widgets passent de src-widgets-ts à src-widgets, le nom habituel dans l'univers ioBroker. Le vérificateur de dépôts ignore ce dossier : ses remarques sur react et les paquets de polices disparaissent sans ajouter de dépendances inutiles. Rien ne change dans le paquet livré

### 0.6.1 (2026-09-23)
* (ssbingo) Script de statistiques fourni en version 2.1.0 : il calcule aussi le débit à partir des variations du compteur (états Durchfluss, VerbrauchAktiv, ZaehlerLetzteAenderung) ; le fichier a été converti en UTF-8 et ses minuteries passent par globalThis
* (ssbingo) Compteur de gaz : l'automatisme du dossier connaît le débit calculé et laisse tel quel un objet de débit déjà lié
* (ssbingo) Les fichiers du script portent la version dans leur nom ; les textes et info-bulles renvoient au dossier addOn/, et un test empêche les README de citer des fichiers inexistants

### 0.6.0 (2026-09-23)
* (ssbingo) Chaque widget sauf le compteur de gaz peut renseigner ses objets depuis une instance : dans le premier champ du groupe « Objets », choisissez une installation wolf-smartset (ISM7) ou wolf (ISM8i) ; sans choix, tout reste manuel
* (ssbingo) Compteur de gaz : le prix de l'énergie peut être saisi en ct/kWh comme sur la plupart des factures ; la vignette signale un prix hors de 0,01 à 1,00 €/kWh

### 0.5.2 (2026-09-23)
* (ssbingo) Schéma de l'installation : un circuit de chauffage reste à l'arrêt tant que la vanne 3 voies est sur l'eau chaude — il suivait jusqu'ici la chaudière et affichait à tort un débit pendant la charge du ballon en mode été
* (ssbingo) Schéma de l'installation : nouveaux champs pour la vanne et la valeur eau chaude ; sans eux rien ne change, et un objet *charge active* garde la priorité pour la branche du ballon

### 0.5.1 (2026-09-20)
* (ssbingo) Script de statistiques : les minuteries passent par globalThis afin que le vérificateur de dépôts ioBroker ne les signale plus — le comportement est inchangé
* (ssbingo) react et les paquets de polices sont marqués comme dépendances optionnelles pour le vérificateur : les polices sont intégrées à la compilation, React est fourni par vis-2 à l'exécution
* (ssbingo) Dependabot vérifie toujours une fois par mois, mais réparti sur le mois

### 0.5.0 (2026-09-20)
* (ssbingo) Circuit de chauffage : chaque bloc peut être affiché ou masqué
* (ssbingo) Compteur de gaz : valeurs de consommation issues du script de statistiques fourni — hier, 7 et 30 derniers jours, mois dernier
* (ssbingo) Compteur de gaz : chaque valeur du pied de vignette peut être affichée ou masquée
* (ssbingo) Le script de statistiques `gasverbrauch_statistik.js` est fourni avec l'adaptateur et documenté dans tous les README

### 0.4.1 (2026-09-19)
* (ssbingo) Bouton Buy me a coffee en haut de tous les fichiers README.

Modifications plus anciennes : [CHANGELOG_OLD.md](../../CHANGELOG_OLD.md)

## Licence

MIT — voir [LICENSE](../../LICENSE)
