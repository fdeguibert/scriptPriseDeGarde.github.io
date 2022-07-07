// Actual script
const EndGuardModalLinkToTest = document.querySelector('div.col-md-3:nth-child(3) > a:nth-child(1)');

let mapTranslateMonths = [];
mapTranslateMonths['janv.'] = 'Jan'
mapTranslateMonths['févr.'] = 'Feb'
mapTranslateMonths['mars'] = 'Mar'
mapTranslateMonths['avr.'] = 'Apr'
mapTranslateMonths['mai.'] = 'May'
mapTranslateMonths['juin'] = 'Jun'
mapTranslateMonths['juil.'] = 'Jul'
mapTranslateMonths['août'] = 'Aug'
mapTranslateMonths['sept.'] = 'Sep'
mapTranslateMonths['oct.'] = 'Oct'
mapTranslateMonths['nov.'] = 'Nov'
mapTranslateMonths['déc.'] = 'Dec'

let fullRebuild = false;
let sendButton
//check if modal is opened
if (EndGuardModalLinkToTest != null && EndGuardModalLinkToTest.toString().includes('modal-saisie-signature')) {
    loadEndGuardScript(false);
}

function checkContentTextArea(textToCheck) {
    return !!textToCheck.match("Consignes passées au Chef de Garde montant.\n" +
        "Interventions : [0-9]+.*\n" +
        "Infos : [0-9]+.*\n" +
        "Cumul interventions : [0-9]+.*\n" +
        "Cumul infos : [0-9]+.*\n" +
        "Personnel :.*[^ ]+.*\n" +
        "Moyens :.*[^ ]+.*");
}

function checkValidSignature(textToCheck) {
    return !!(textToCheck.match('.*Cumul.*interventions.*: ([0-9]+).*') && textToCheck.match('.*Cumul.*infos.*: ([0-9]+).*'));

}

function loadEndGuardScript(wasAlreadyDisplayed) {
    const modalTitle = document.querySelector('#modalLabel');
    const modalFooter = document.querySelector('.modal-footer');

    if (!wasAlreadyDisplayed && modalFooter && !document.querySelector('#added-button-by-ext')) {
        //add safety on "envoyer" button
        sendButton = modalFooter.querySelector('.btn-primary')
        // sendButton.disabled = !allowSendMsg;
        //add full rebuild button
        const button = document.createElement("button");
        button.textContent = "Reconstruire le cumul";
        button.className = 'btn btn-danger'
        button.id = 'added-button-by-ext'
        button.style.float = 'left'
        button.onclick = () => {
            fullRebuild = confirm('Souhaitez vous reconstruire le cumul des interventions depuis le 01 Janvier? \n' +
                'Cela prendra quelques minutes. \n\n' +
                'En cas de problème lisez la documentation ou contactez François de Guibert \n' +
                'lien de la documentation :\n' +
                'https://fdeguibert.github.io/scriptPriseDeGarde.github.io/');
            return false;
        }
        modalFooter.insertBefore(button, modalFooter.firstChild);
    }

    const textArea = document.querySelector('div.form-group:nth-child(2) > div:nth-child(2) > div:nth-child(1) > textarea:nth-child(1):nth-child(1)');
    if (textArea) {
        textArea.addEventListener('input', function () {
            if (checkContentTextArea(textArea.value)) {
                sendButton.disabled = false;
                sendButton.value = 'Envoyer'
            } else {
                sendButton.disabled = true;
                sendButton.value = 'Message Incomplet'
            }
        }, true);
    }
    const isDisplayed = textArea != null && textArea.offsetParent != null && modalTitle != null && modalTitle.textContent.includes("Saisie d'une signature");
    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 1)
    if (isDisplayed && (!wasAlreadyDisplayed || fullRebuild)) {
        document.querySelector('div.form-group:nth-child(1) > div:nth-child(2) > div:nth-child(1) > input:nth-child(1)').value = 'Fin de garde du ' + dayBefore.toLocaleDateString('fr');
        textArea.textContent = 'récupération des données en cours... Veuillez patienter. \n'
        textArea.style.height = '170px';
        if (checkContentTextArea(textArea.value)) {
            sendButton.disabled = false;
            sendButton.value = 'Envoyer'
        } else {
            sendButton.disabled = true;
            sendButton.value = 'Message Incomplet'
        }

        if (fullRebuild) {
            const currentDate = new Date();
            const today = new Date();
            const allDatas = []
            while (currentDate.getFullYear() === today.getFullYear()) {
                let eventsForDate = getEventsForDate(currentDate);
                addIfNotAlreadyIn(allDatas, eventsForDate);
                currentDate.setDate(currentDate.getDate() - 1);
            }
        } else {
            const currentDate = new Date();
            const endingDate = new Date();
            endingDate.setDate(endingDate.getDate() - 10); //TODO ME ajouter le "aucune signature valide trouvée dans la dernière semaine, faite un recumul
            const allDatas = []
            let validSignatureNotFound = true;
            while (validSignatureNotFound && currentDate > endingDate) {
                let eventsForDate = getEventsForDate(currentDate);
                if (eventsForDate.findIndex(v => v.validSignature === true) !== -1) {
                    validSignatureNotFound = false;
                } else {
                    currentDate.setDate(currentDate.getDate() - 1);
                }
                addIfNotAlreadyIn(allDatas, eventsForDate);
            }
            console.log(allDatas)
            textArea.textContent = buildNewSignTextFromLatestValidSign(allDatas)
        }


        // if (fullRebuild) {
        //     fullRebuild = false;
        //     const startingDate = new Date();
        //     startingDate.setDate(31);
        //     startingDate.setMonth(11);
        //     startingDate.setFullYear(startingDate.getFullYear() - 1);
        //     const eventsFromLatestValidSignature = countEventsFromDate(startingDate, textArea)
        //     const textSign = buildNewSignText({
        //         lastValidSignDate: undefined,
        //         textSignature: undefined,
        //         latestCountInters: 0,
        //         latestCountInfos: 0
        //     }, eventsFromLatestValidSignature);
        //     textArea.textContent = textSign;
        // } else {
        //     const latestValidSignature = getLatestValidSignature();
        //     const fromDate = latestValidSignature.lastValidSignDate;
        //     fromDate.setDate(latestValidSignature.lastValidSignDate.getDate() - 1)
        //     console.log('from date ' + fromDate.toLocaleDateString('fr'))
        //     const eventsFromLatestValidSignature = countEventsFromDate(fromDate, textArea)
        //     const textSign = buildNewSignText(latestValidSignature, eventsFromLatestValidSignature);
        //     textArea.textContent = textSign;
        // }
        if (checkContentTextArea(textArea.value)) {
            sendButton.disabled = false;
            sendButton.value = 'Envoyer'
        } else {
            sendButton.disabled = true;
            sendButton.value = 'Message Incomplet'
        }
    }
    setTimeout(function () {
        loadEndGuardScript(isDisplayed);
    }, 300);

}

function buildNewSignTextFromLatestValidSign(events) {
    let eventLatestValidSign = events.findIndex((e) => e.validSignature === true);
    if (eventLatestValidSign === -1) {
        return 'Aucune signature valide trouvée récemment, relancez un calcul complet';
    }
    console.log(events[eventLatestValidSign])

    let latestCountInters = extractValue(events[eventLatestValidSign].content, '.*Cumul.*interventions.*: ([0-9]+).*');
    let latestCountInfos = extractValue(events[eventLatestValidSign].content, '.*Cumul.*infos.*: ([0-9]+).*');

    let eventsSinceLatestValid = events.slice(0, eventLatestValidSign)
    const count = eventsSinceLatestValid.reduce((countAcc, ev) => {
        if (ev.type === 'inter') {
            countAcc.inters++
        } else if (ev.type === 'nonreponse') {
            countAcc.infos++
        }
        return countAcc;
    }, {inters: 0, infos: 0})
    const dateFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 1);
    dateLimit.setHours(7, 30);

    const latestShiftEvents = eventsSinceLatestValid.reduce((countAcc, ev) => {
        let eventDate;
        const eventDateFr = ev.title.split(' - ')[0];
        for (const key in mapTranslateMonths) {
            if (eventDateFr.includes(key)) {
                let englishDate = eventDateFr.replace(key, mapTranslateMonths[key])
                eventDate = Date.parse(englishDate);
            }
        }
        if (ev.type === 'inter' && eventDate > dateLimit) {
            countAcc.inters++
        } else if (ev.type === 'nonreponse' && eventDate > dateLimit) {
            countAcc.infos++
        }

        return countAcc;
    }, {inters: 0, infos: 0})
    console.log(latestShiftEvents)
    return "Consignes passées au Chef de Garde montant.\n" +
        "Interventions : " + latestShiftEvents.inters + "\n" +
        "Infos : " + latestShiftEvents.infos + "\n" +
        "Cumul interventions : " + (latestCountInters + count.inters) + "\n" +
        "Cumul infos : " + (latestCountInfos + count.infos) + "\n" +
        "Personnel : " + "\n" +
        "Moyens : ";
}

function addIfNotAlreadyIn(data, newDatas) {
    for (let i = 0; i < newDatas.length; i++) {
        if (data.findIndex((v) => v.title === newDatas[i].title) === -1) {
            data.push(newDatas[i]);
        }
    }
}

function deduplicateEvents(events) {
    const deduplicated = [];
    for (let i = 0; i < events.length; i++) {
        if (deduplicated.findIndex((v) => v.title === events[i].title) === -1) {
            deduplicated.push(events[i]);
        }
    }
    return deduplicated;
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
            'Analyse des évènements du ' + dateProcessed.toLocaleDateString('fr') + '...';
        //TODO ME replace URL with generic one (from current URL)
        const context = getHtmlDocumentFrom(`https://portail.sdis78.fr/jcms/p_1295618/cs-chevreuse?portlet=p_1336294&dateMci=${dateProcessed.toLocaleDateString('fr').replace('-', '/')}`).getElementsByTagName('body')[0].getAttribute('id');

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
    console.log(`* nouvelles inters depuis la date: ${totalInters}`)
    console.log(`*  nouvelles infos depuis la date: ${totalInfos}`)
    return {
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

function getEventsForDate(date) {
    const context = getHtmlDocumentFrom(`https://portail.sdis78.fr/jcms/p_1295618/cs-chevreuse?portlet=p_1336294&dateMci=${date.toLocaleDateString('fr').replace('-', '/')}`).getElementsByTagName('body')[0].getAttribute('id');
    const dataForDay = getDataForContext(context);

    const eventsDiv = dataForDay.getElementsByClassName('sdis78box');
    const dataParsed = [];
    for (let i = 0; i < eventsDiv.length; i++) {
        const eventDiv = eventsDiv[i].querySelector('div:nth-child(1)')

        let type = eventDiv.className.replace('panel ', '');
        let title = 'UNKNOWN'
        if (type === 'prisegarde' || type === 'signature') {
            title = eventDiv.querySelector('div:nth-child(1) > div:nth-child(1)> div:nth-child(1) > span:nth-child(2)').textContent
        } else {
            title = eventDiv.querySelector('div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1)').textContent
        }
        let content = eventDiv.querySelector('div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > p:nth-child(1)').textContent
        let validSignature = false;
        if (type === 'signature') {
            validSignature = checkValidSignature(content);
        }
        dataParsed.push({
            type,
            title,
            content,
            validSignature
        })
    }
    return dataParsed;
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
