### version 0.17.0
résolution d'un bug sur le mois de Mai

### version 0.16.0
ajout du bouton saisie de signature de garde remise

### version 0.15.0
évolutions techniques

### version 0.14.0
Certaines infos sont en fait des interventions car le CS s'est engagé dessus.  
Dans ce cas, il faut reconvertir l'info en intervention dans le comptage.  
C'est ce qu'apporte cette nouvelle version. Une reconstruction du cumul est nécessaire lors de la première utilisation.

### version 0.13.0
La vérification du format du texte était trop stricte et posait plus de problème qu'elle n'aidait.  
Cette vérification a été réduite à un simple contrôle de la présence de 2 lignes de texte (techniquement nécessaire pour que l'extension fonctionne)  
Le texte est considéré valide lorsqu'il contient ces 2 lignes:
```
    Cumul interventions : [un nombre]
    Cumul infos : [un nombre]
```


### version 0.12.0
Pas de modification fonctionnelle. La récupération des données a par contre été fortement accélérée.  
Notamment lors du recalcul complet.
Si le réseau d'inspyre est déjà fortement solicité, cela peut entraîner des erreurs (normalement l'extension ne pousse pas inspyre dans ses limites donc cela ne devrait pas arriver)  
Si toutefois c'était le cas, le calcul est relancé après un message d'alert, en mode lent.

### version 0.11.0
#### revu du calcul
le calcul des interventions a été revu:   
Quelque soit l'heure de génération, le texte généré sera celui de la garde précédente.

Exemples:     
Si le texte est généré le 03/07 à 7h20, les interventions seront comptées entre le 02/07 7:30 et le 03/07 7:30 (donc en réalité jusqu'à 7h20, heure de la génération)    
Si le texte est généré le 03/07 à 7h45, les interventions seront comptées entre le 02/07 7:30 et le 03/07 7:30  
Si le texte est généré le 03/07 à 20h, les interventions seront comptées entre le 02/07 7:30 et le 03/07 7:30
Si le texte est généré le 04/07 à 0h01, les interventions seront comptées entre le 03/07 7:30 et le 04/07 7:30 (donc en réalité jusqu'à 0h01, heure de la génération)

Ceci permet à l'extension de fonctionner correctement quelque soit l'heure de génération (avant ou après 7h30)

Ceci s'applique aussi au recalcul du cumul total annuel.

#### préparation à l'intégration d'autres CS
la partie technique permettant de faire fonctionner l'extension sur d'autres CS a été ajoutée

#### documentation
la documentation est améliorée pour montrer l'installation de l'extension sous forme de gif

### version 0.10.3
Première version publiée
* permet la génération de la signature de fin de garde du jour
* permet un calcul du cumul depuis le début de l'année
* uniquement adaptée au CS Chevreuse
