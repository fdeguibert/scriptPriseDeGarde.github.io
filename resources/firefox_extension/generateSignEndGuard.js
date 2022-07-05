//pour la récup de l'histo, de la veille etc... il faut retrouver le AjaxCtxt-0-1656927656526 (ou autre chiffre) qui est l'id du body
//a priori ça suffit pour le doMci.jsp en le passant en header pour récup le contenu du tableau que je peux ensuite parser
//link to get data html from a date: "https://portail.sdis78.fr/jcms/p_1295618/cs-chevreuse?portlet=p_1336294&dateMci=04/07/2022"

// Actual script
const EndGuardModalLinkToTest = document.querySelector('div.col-md-3:nth-child(3) > a:nth-child(1)');

// console.log(document.getElementsByClassName('chevron-left'))
console.log('lets go for signing guard')
//check if modal is opened
if (EndGuardModalLinkToTest != null && EndGuardModalLinkToTest.toString().includes('modal-saisie-signature')) {
    loadEndGuardScript(false);
}

function getCtxIdFrompreviousDay() {

}

function loadEndGuardScript(wasAlreadyDisplayed) {
    var modalTitle = document.querySelector('#modalLabel');
    var textArea = document.querySelector('div.form-group:nth-child(2) > div:nth-child(2) > div:nth-child(1) > textarea:nth-child(1):nth-child(1)');
    var isDisplayed = textArea != null && textArea.offsetParent != null && modalTitle != null && modalTitle.textContent.includes("Saisie d'une signature")
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 1)
    if (isDisplayed && !wasAlreadyDisplayed) {
        document.querySelector('div.form-group:nth-child(1) > div:nth-child(2) > div:nth-child(1) > input:nth-child(1)').value = 'Fin de garde du ' + dayBefore.toLocaleDateString('fr');
        textArea.style.height = '170px';
        // TODO ME reactivate:  fetchAndFillDatasSignEndGuard(textArea);
        const latestValidSignature = getLatestValidSignature();
        console.log(latestValidSignature);
        const fromDate = latestValidSignature.lastValidSignDate;
        fromDate.setDate(latestValidSignature.lastValidSignDate.getDate()-1)
        console.log('from date ' + fromDate.toLocaleDateString('fr'))
        const eventsFromLatestValidSignature = countEventsFromDate(fromDate)
        console.log(eventsFromLatestValidSignature)
        const textSign = buildNewSignText(latestValidSignature, eventsFromLatestValidSignature);
        console.log(textSign);
    }
    setTimeout(function () {
        loadEndGuardScript(isDisplayed);
    }, 300);

}

function buildNewSignText(latestValidSign, eventsFromLatestValidSign) {
    let template = "Consignes passées au Chef de Garde montant.\n" +
        "Interventions : " + eventsFromLatestValidSign.dailyInterventions + "\n" +
        "Infos : " + eventsFromLatestValidSign.dailyInfos + "\n" +
        "Cumul interventions : " + (eventsFromLatestValidSign.totalInters + latestValidSign.latestCountInters) + "\n" +
        "Cumul infos : " + (eventsFromLatestValidSign.totalInfos + latestValidSign.latestCountInfos) + "\n" +
        "Personnel : " + "\n" +
        "Moyens : ";
    return template;
}

function countEventsFromDate(fromDate) {
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
        // console.log(dailyEvents);
        const distinctDailyEvents = dailyEvents.filter((title) => !dayBeforeEvents.includes(title));

        dailyInterventions = distinctDailyEvents.filter(title => title.startsWith('panel inter')).length;
        dailyInfos = distinctDailyEvents.filter(title => title.startsWith('panel nonreponse')).length;


        // Comptage basic des inters du jour (attention, prend pas en compte les inters de la veille au soir, pas de verif des dates etc...
        // let dailyInterventions = dataForDay.getElementsByClassName('inter').length;
        // let dailyInfos = dataForDay.getElementsByClassName('nonreponse').length;
        // console.log(`dailyInterventions : ${dailyInterventions}`);
        // console.log(`dailyInfos : ${dailyInfos}`);
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
    const latestSignatureText = getLatestValidSignature();


    const totalInterventions = calculateNewTotal(latestSignatureText, '.*Cumul.*interventions.*: ([0-9]+).*', dailyInterventions);
    const totalInfos = calculateNewTotal(latestSignatureText, '.*Cumul.*infos.*: ([0-9]+).*', dailyInfos);

    let template = "Consignes passées au Chef de Garde montant.\n" +
        "Interventions : " + dailyInterventions + "\n" +
        "Infos : " + dailyInfos + "\n" +
        "Cumul interventions : " + totalInterventions + "\n" +
        "Cumul infos : " + totalInfos + "\n" +
        "Personnel : " + "\n" +
        "Moyens : ";

    console.log(template);
    textArea.textContent = template;
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

    // const urlForCtxtId = document.querySelector('div.col-xs-2:nth-child(2) > a:nth-child(1)').getAttribute('href');
    //
    // let xmlHttpCtxtId = new XMLHttpRequest();
    // xmlHttpCtxtId.open("GET", urlForCtxtId, false);
    // xmlHttpCtxtId.send(null);
    // let htmlResult = xmlHttpCtxtId.responseText;
    // let el = document.createElement('html');
    // el.innerHTML = htmlResult;
    //
    // let previousDayCtxtId = el.getElementsByTagName('body')[0].id;
    //
    //
    // console.log(previousDayCtxtId);
    //
    // const urlGetRunningHand = 'https://portail.sdis78.fr/plugins/MainCourantePlugin/jsp/doMciList.jsp'
    //
    //
    // let xmlHttpRunningHand = new XMLHttpRequest();
    // xmlHttpRunningHand.open("POST", urlGetRunningHand, false);
    // xmlHttpRunningHand.setRequestHeader('X-Jcms-Ajax-Id', previousDayCtxtId)
    // xmlHttpRunningHand.send(null);
    // let previousDayRunningHandHtml = xmlHttpRunningHand.responseText;
    //
    // let elPreviousDayRunningHandContent = document.createElement('html');
    // elPreviousDayRunningHandContent.innerHTML = previousDayRunningHandHtml;
    //
    //
    // return elPreviousDayRunningHandContent.getElementsByClassName('signature')[0].getElementsByTagName('p')[0].textContent;
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
