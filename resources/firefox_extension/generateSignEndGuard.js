// Actual script
const EndGuardModalLinkToTest = document.querySelector('div.col-md-3:nth-child(3) > a:nth-child(1)');

let fullRebuild = false;
let globalInfoDateProcessed = '';
//check if modal is opened
if (EndGuardModalLinkToTest != null && EndGuardModalLinkToTest.toString().includes('modal-saisie-signature')) {
    console.log(fullRebuild)
    loadEndGuardScript(false);
}

function loadEndGuardScript(wasAlreadyDisplayed) {
    const modalTitle = document.querySelector('#modalLabel');
    const modalFooter = document.querySelector('.modal-footer');

    if (!wasAlreadyDisplayed && modalFooter) {

        const button = document.createElement("button");
        button.innerHTML = "Reconstruire le cumul";
        button.className = 'btn btn-danger'
        button.style.float = 'left'
        button.onclick = () => {
            fullRebuild = confirm('Souhaitez vous reconstruire le cumul des interventions depuis le 01 Janvier? \n' +
                'Cela prendra quelques minutes. \n\n' +
                'En cas de problème lisez la documentation ou contactez François de Guibert \n' +
                'lien de la documentation : https://google.fr');
            return false;
        }
        modalFooter.insertBefore(button, modalFooter.firstChild);
    }

    const textArea = document.querySelector('div.form-group:nth-child(2) > div:nth-child(2) > div:nth-child(1) > textarea:nth-child(1):nth-child(1)');
    const isDisplayed = textArea != null && textArea.offsetParent != null && modalTitle != null && modalTitle.textContent.includes("Saisie d'une signature");
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 1)
    if (isDisplayed && (!wasAlreadyDisplayed || fullRebuild)) {

        document.querySelector('div.form-group:nth-child(1) > div:nth-child(2) > div:nth-child(1) > input:nth-child(1)').value = 'Fin de garde du ' + dayBefore.toLocaleDateString('fr');
        textArea.textContent = 'récupération des données en cours... Veuillez patienter. \n'
        textArea.style.height = '170px';
        if (fullRebuild) {
            fullRebuild = false;
            const startingDate = new Date();
            startingDate.setDate(31);
            startingDate.setMonth(11);
            startingDate.setFullYear(startingDate.getFullYear() - 1);
            const eventsFromLatestValidSignature = countEventsFromDate(startingDate, textArea)
            console.log(eventsFromLatestValidSignature)
            const textSign = buildNewSignText({
                lastValidSignDate: undefined,
                textSignature: undefined,
                latestCountInters: 0,
                latestCountInfos: 0
            }, eventsFromLatestValidSignature);
            console.log(textSign);
            textArea.textContent = textSign;
        } else {
            const latestValidSignature = getLatestValidSignature();
            console.log(latestValidSignature);
            const fromDate = latestValidSignature.lastValidSignDate;
            fromDate.setDate(latestValidSignature.lastValidSignDate.getDate() - 1)
            console.log('from date ' + fromDate.toLocaleDateString('fr'))
            const eventsFromLatestValidSignature = countEventsFromDate(fromDate, textArea)
            console.log(eventsFromLatestValidSignature)
            const textSign = buildNewSignText(latestValidSignature, eventsFromLatestValidSignature);
            console.log(textSign);
            textArea.textContent = textSign;
        }

    }
    setTimeout(function () {
        loadEndGuardScript(isDisplayed);
    }, 300);

}

function buildNewSignText(latestValidSign, eventsFromLatestValidSign) {
    return "Consignes passées au Chef de Garde montant.\n" +
        "Interventions : " + eventsFromLatestValidSign.dailyInterventions + "\n" +
        "Infos : " + eventsFromLatestValidSign.dailyInfos + "\n" +
        "Cumul interventions : " + (eventsFromLatestValidSign.totalInters + latestValidSign.latestCountInters) + "\n" +
        "Cumul infos : " + (eventsFromLatestValidSign.totalInfos + latestValidSign.latestCountInfos) + "\n" +
        "Personnel : " + "\n" +
        "Moyens : ";
}

function countEventsFromDate(fromDate, textToUpdate) {
    const stopDate = new Date();
    stopDate.setDate(stopDate.getDate() + 1);
    const dateProcessed = fromDate;
    let dayYearBefore = true;
    let totalInters = 0;
    let totalInfos = 0;
    let dayBeforeEvents = [];
    let dailyInterventions = 0;
    let dailyInfos = 0;
    while (!(dateProcessed.getDate() === stopDate.getDate() && dateProcessed.getMonth() === stopDate.getMonth())) {
        console.log('crawling for date : ' + dateProcessed.toLocaleDateString('fr'));
        textToUpdate.textContent = 'récupération des données en cours... Veuillez patienter. \n' +
            'analyze des inters du ' + dateProcessed.toLocaleDateString('fr');
        //TODO ME replace URL with generic one (from current URL)
        const context = getHtmlDocumentFrom(`https://portail.sdis78.fr/jcms/p_1295618/cs-chevreuse?portlet=p_1336294&dateMci=${dateProcessed.toLocaleDateString('fr').replace('-', '/')}`).getElementsByTagName('body')[0].getAttribute('id');
        // console.log(context);

        const dataForDay = getDataForContext(context);
        const divs = dataForDay.getElementsByClassName('sdis78box');
        const dailyEvents = [];
        for (let i = 0; i < divs.length; i++) {
            let divClasses = divs[i].querySelector('div:nth-child(1)').className;
            if (divClasses === 'panel inter' || divClasses === 'panel nonreponse') {
                dailyEvents.push(divClasses + ' ' + divs[i].querySelector('div:nth-child(1) > div:nth-child(2)> div:nth-child(1) > div:nth-child(1)> div:nth-child(1)> p:nth-child(1)').textContent)
            }
        }
        const distinctDailyEvents = dailyEvents.filter((title) => !dayBeforeEvents.includes(title));

        dailyInterventions = distinctDailyEvents.filter(title => title.startsWith('panel inter')).length;
        dailyInfos = distinctDailyEvents.filter(title => title.startsWith('panel nonreponse')).length;


        if (!dayYearBefore) {
            console.log(`inters comptabilisées : ${dailyInterventions}`)
            console.log(`infos comptabilisées : ${dailyInfos}`)
            totalInters += dailyInterventions;
            totalInfos += dailyInfos;
        } else {
            dayYearBefore = false;
        }
        dayBeforeEvents = dailyEvents;
        dateProcessed.setDate(dateProcessed.getDate() + 1);
    }
    console.log(`aujourd'hui, inters: ${dailyInterventions}`)
    console.log(`aujourd'hui, infos: ${dailyInfos}`)
    console.log(`* total inters comptabilisées: ${totalInters}`)
    console.log(`* total infos comptabilisées: ${totalInfos}`)
    return {
        dailyInterventions,
        dailyInfos,
        totalInters,
        totalInfos
    }

}

function getHtmlDocumentFrom(url) {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false);
    xmlHttp.send(null);
    const htmlResult = xmlHttp.responseText;
    const el = document.createElement('html');
    el.innerHTML = htmlResult;

    return el;
}

function getDataForContext(context) {

    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", 'https://portail.sdis78.fr/plugins/MainCourantePlugin/jsp/doMciList.jsp', false);
    xmlHttp.setRequestHeader('X-Jcms-Ajax-Id', context)
    xmlHttp.send(null);
    const htmlResult = xmlHttp.responseText;
    const el = document.createElement('html');
    el.innerHTML = htmlResult;
    return el;
}

function getLatestValidSignature() {
    let signatureFound = false;
    let dateProcessed = new Date()
    let textSignature = ''
    while (!signatureFound) {
        console.log(`search for ${dateProcessed.toLocaleDateString('fr')}`)
        const context = getHtmlDocumentFrom(`https://portail.sdis78.fr/jcms/p_1295618/cs-chevreuse?portlet=p_1336294&dateMci=${dateProcessed.toLocaleDateString('fr').replace('-', '/')}`).getElementsByTagName('body')[0].getAttribute('id');
        const dataForDay = getDataForContext(context);

        const divs = dataForDay.getElementsByClassName('sdis78box');
        for (let i = 0; i < divs.length; i++) {
            let divClasses = divs[i].querySelector('div:nth-child(1)').className;
            if (divClasses === 'panel signature') {
                textSignature = divs[i].querySelector('div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > p:nth-child(1)').textContent
                console.log(textSignature)
                if (textSignature.match('.*Cumul.*interventions.*: ([0-9]+).*') && textSignature.match('.*Cumul.*infos.*: ([0-9]+).*')) {
                    signatureFound = true;
                }
            }
        }
        if (!signatureFound) {
            dateProcessed.setDate(dateProcessed.getDate() - 1);
        }
    }
    return {
        lastValidSignDate: dateProcessed,
        textSignature: textSignature,
        latestCountInters: extractValue(textSignature, '.*Cumul.*interventions.*: ([0-9]+).*'),
        latestCountInfos: extractValue(textSignature, '.*Cumul.*infos.*: ([0-9]+).*')
    }

}

function extractValue(latestSignatureText, regexp) {
    const match = latestSignatureText.match(regexp);
    if (match !== null) {
        return parseInt(match[1]);
    } else {
        return null;
    }
}

function calculateNewTotal(latestSignatureText, regexp, dailyEvents) {
    const match = latestSignatureText.match(regexp);
    if (match === null) {
        return 'ECHEC, renseignez les données à la main';
    } else {
        return dailyEvents + parseInt(match[1]);
    }
}
