![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## Widgets de chauffage Wolf pour ioBroker VIS-2

Widgets VIS-2 qui affichent et permettent de piloter une installation de chauffage [WOLF](https://www.wolf.eu/) dans ioBroker.

Le jeu de widgets ne lit aucune donnée directement depuis le chauffage. Chaque valeur est liée individuellement à un objet ioBroker existant — par exemple issu de l'adaptateur `wolf-smartset`, de l'adaptateur `wolf` (ISM8i), de Modbus ou de vos propres scripts.

> **État :** développement précoce. Le compteur de gaz, l'état de la chaudière, le circuit de chauffage, l'eau chaude, la courbe de chauffe et les messages sont disponibles pour l'instant.

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

### 0.2.0 (2026-09-18)
* (ssbingo) Première version : ensemble de widgets pour VIS-2 (React 19) avec compteur de gaz, état de la chaudière, circuit de chauffage, eau chaude et courbe de chauffe. Les widgets de commande n'affichent une valeur qu'après confirmation (ack) ; la courbe de chauffe est une approximation (pas une formule Wolf). Le compteur de gaz calcule la consommation journalière et mensuelle à partir de l'historique.

## Licence

MIT — voir [LICENSE](../../LICENSE)
