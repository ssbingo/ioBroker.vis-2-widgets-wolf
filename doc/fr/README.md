![Logo](../../admin/vis-2-widgets-wolf.png)

# ioBroker.vis-2-widgets-wolf

## Widgets de chauffage Wolf pour ioBroker VIS-2

Widgets VIS-2 qui affichent et permettent de piloter une installation de chauffage [WOLF](https://www.wolf.eu/) dans ioBroker.

Le jeu de widgets ne lit aucune donnée directement depuis le chauffage. Chaque valeur est liée individuellement à un objet ioBroker existant — par exemple issu de l'adaptateur `wolf-smartset`, de l'adaptateur `wolf` (ISM8i), de Modbus ou de vos propres scripts.

> **État :** développement précoce. Le compteur de gaz, l'état de la chaudière, le circuit de chauffage et l'eau chaude sont disponibles pour l'instant.

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

### **WORK IN PROGRESS**
* (ssbingo) Première version : jeu de widgets en React 19 et TypeScript, première version du widget compteur de gaz

## Licence

MIT — voir [LICENSE](../../LICENSE)
