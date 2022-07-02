// Actual script
const EndGuardModalLinkToTest = document.querySelector('div.col-md-3:nth-child(3) > a:nth-child(1)');

console.log('lets go for signing guard')
//check if modal is opened
if (EndGuardModalLinkToTest != null && EndGuardModalLinkToTest.toString().includes('modal-saisie-signature')){
    loadEndGuardScript(false);
}

function currentDateFormatted(){
    const date = new Date();

    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

// This arrangement can be altered based on how we want the date's format to appear.
    let currentDate = `${day}/${month}/${year}`;
    return currentDate; // "17-6-2022"
}
function loadEndGuardScript(wasAlreadyDisplayed) {
    var modalTitle = document.querySelector('#modalLabel');
    var textArea = document.querySelector('div.form-group:nth-child(2) > div:nth-child(2) > div:nth-child(1) > textarea:nth-child(1):nth-child(1)');
    var isDisplayed = textArea != null && textArea.offsetParent != null && modalTitle != null && modalTitle.textContent.includes("Saisie d'une signature")
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate()-1)
    if (isDisplayed && !wasAlreadyDisplayed) {
        document.querySelector('div.form-group:nth-child(1) > div:nth-child(2) > div:nth-child(1) > input:nth-child(1)').value = 'Fin de garde du ' + dayBefore.toLocaleDateString('fr');
       fetchAndFillDatasSignEndGuard(textArea);
    }
    setTimeout(function () {
        loadEndGuardScript(isDisplayed);
    }, 300);

}


function fetchAndFillDatasSignEndGuard(textArea) {
    textArea.textContent = 'Generating...'
//récup de la div du jour. pour compter le nombre d'inters
    let todayGuardRunningHandDiv = document.getElementById('divToRefresh');
//Comptage basic des inters du jour (attention, prend pas en compte les inters de la veille au soir, pas de verif des dates etc...
    let dailyInterventions = document.getElementById('divToRefresh').getElementsByClassName('inter').length;
    let dailyInfos = document.getElementById('divToRefresh').getElementsByClassName('nonreponse').length;

    console.log(document.getElementById('divToRefresh').getElementsByClassName('inter').length)
    console.log(dailyInterventions)
//recherche de la signature de la veille
    const latestSignatureText = getLatestSignature();


    const totalInterventions = calculateNewTotal(latestSignatureText, '.*Cumul.*interventions.*: ([0-9]+).*', dailyInterventions);
    const totalInfos = calculateNewTotal(latestSignatureText, '.*Cumul.*infos.*: ([0-9]+).*', dailyInfos);

    let template = "Consignes passées au Chef de Garde montant. \nInterventions : " + dailyInterventions + "\nInfos : " + dailyInfos + "\nCumul interventions : " + totalInterventions + "\nCumul infos : " + totalInfos;

    console.log(template);
    textArea.textContent = template;
}

function getLatestSignature() {
    const urlForCtxtId = document.querySelector('div.col-xs-2:nth-child(2) > a:nth-child(1)').getAttribute('href');

    let xmlHttpCtxtId = new XMLHttpRequest();
    xmlHttpCtxtId.open("GET", urlForCtxtId, false);
    xmlHttpCtxtId.send(null);
    let htmlResult = xmlHttpCtxtId.responseText;
    let el = document.createElement('html');
    el.innerHTML = htmlResult;

    let previousDayCtxtId = el.getElementsByTagName('body')[0].id;


    console.log(previousDayCtxtId);

    const urlGetRunningHand = 'https://portail.sdis78.fr/plugins/MainCourantePlugin/jsp/doMciList.jsp'


    let xmlHttpRunningHand = new XMLHttpRequest();
    xmlHttpRunningHand.open("POST", urlGetRunningHand, false);
    xmlHttpRunningHand.setRequestHeader('X-Jcms-Ajax-Id', previousDayCtxtId)
    xmlHttpRunningHand.send(null);
    let previousDayRunningHandHtml = xmlHttpRunningHand.responseText;

    let elPreviousDayRunningHandContent = document.createElement('html');
    elPreviousDayRunningHandContent.innerHTML = previousDayRunningHandHtml;


    return elPreviousDayRunningHandContent.getElementsByClassName('signature')[0].getElementsByTagName('p')[0].textContent;
}

function calculateNewTotal(latestSignatureText,regexp, dailyEvents) {
    latestSignatureText = 'Consignes passées au Chef de Garde montant.\n' +
        'Interventions: 6\n' +
        'Infos: 1\n' +
        'Cumul annuel interventions : FAILURE\n' +
        'Cumul annuel infos: 72';

    const match = latestSignatureText.match(regexp);
    if (match === null) {
        return 'ECHEC, renseignez les données à la main';
    } else {
        return dailyEvents + parseInt(match[1]);
    }
}
