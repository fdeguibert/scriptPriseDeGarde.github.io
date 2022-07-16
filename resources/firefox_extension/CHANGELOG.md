## version 0.11.0
### revu du calcul
le calcul des interventions a été revu:   
Quelque soit l'heure de génération, le texte généré sera celui de la garde précédente.    

Exemples:     
Si le texte est généré le 03/07 à 7h20, les interventions seront comptées entre le 02/07 7:30 et le 03/07 7:30 (donc en réalité jusqu'à 7h20, heure de la génération)    
Si le texte est généré le 03/07 à 7h45, les interventions seront comptées entre le 02/07 7:30 et le 03/07 7:30  
Si le texte est généré le 03/07 à 20h, les interventions seront comptées entre le 02/07 7:30 et le 03/07 7:30
Si le texte est généré le 04/07 à 0h01, les interventions seront comptées entre le 03/07 7:30 et le 04/07 7:30 (donc en réalité jusqu'à 0h01, heure de la génération)

Ceci permet à l'extension de fonctionner correctement quelque soit l'heure de génération (avant ou après 7h30)

Ceci s'applique aussi au recalcul du cumul total annuel.

### préparation à l'intégration d'autres CS
la partie technique permettant de faire fonctionner l'extension sur d'autres CS a été ajoutée

### documentation
la documentation est améliorée pour montrer l'installation de l'extension sous forme de gif

## version 0.10.3
Première version publiée   
* permet la génération de la signature de fin de garde du jour
* permet un calcul du cumul depuis le début de l'année
* uniquement adaptée au CS Chevreuse
