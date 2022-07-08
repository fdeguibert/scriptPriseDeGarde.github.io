// Actual script
const EndGuardModalLinkToTest = document.querySelector('div.col-md-3:nth-child(3) > a:nth-child(1)');

const HOUR_SHIFT_CHANGE = 7;
const MINUTES_SHIFT_CHANGE = 30;
const LATEST_SHIFT_CHANGE = defineLatestShiftChange(new Date());

function defineLatestShiftChange(fromDate) {
    if (fromDate.getHours() < HOUR_SHIFT_CHANGE || (fromDate.getHours() === HOUR_SHIFT_CHANGE && fromDate.getMinutes() < MINUTES_SHIFT_CHANGE)) {
        // if current time is between midnight and shift change
        fromDate.setDate(fromDate.getDate() - 1);
    }
    fromDate.setHours(HOUR_SHIFT_CHANGE, MINUTES_SHIFT_CHANGE, 0);
    return fromDate
}

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
            checkContentTextArea(textArea);
        }, true);
    }
    const isDisplayed = textArea != null && textArea.offsetParent != null && modalTitle != null && modalTitle.textContent.includes("Saisie d'une signature");

    if (isDisplayed && (!wasAlreadyDisplayed || fullRebuild)) {
        const dayBefore = new Date();
        dayBefore.setDate(dayBefore.getDate() - 1)
        document.querySelector('div.form-group:nth-child(1) > div:nth-child(2) > div:nth-child(1) > input:nth-child(1)').value = 'Fin de garde du ' + dayBefore.toLocaleDateString('fr');
        textArea.textContent = 'récupération des données en cours... Veuillez patienter. \n'
        textArea.style.height = '170px';
        checkContentTextArea(textArea);
        if (fullRebuild) {
            fullRebuild = false;
            const currentDate = new Date();
            const today = new Date();
            const allDatas = []
            const totalDays = daysBetweenDates(new Date(new Date().getFullYear(), 0, 1), today);


            while (currentDate.getFullYear() === today.getFullYear()) {
                const pourcentage = (100 - Math.round(daysBetweenDates(new Date(new Date().getFullYear(), 0, 1), currentDate) * 100.0 / totalDays)) + '%';

                textArea.textContent = 'récupération des données en cours... Veuillez patienter. \n' +
                    'Progression de l\'analyse : ' + pourcentage;
                let eventsForDate = getEventsForDate(currentDate);
                addIfNotAlreadyIn(allDatas, eventsForDate);
                currentDate.setDate(currentDate.getDate() - 1);
            }
            console.log(allDatas)
            textArea.textContent = buildNewSignTextFullRebuild(allDatas)
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

        checkContentTextArea(textArea);
    }
    setTimeout(function () {
        loadEndGuardScript(isDisplayed);
    }, 300);

}

function buildNewSignTextFullRebuild(events) {
    let firstEventBeforeShiftChange = events.findIndex((e) => e.dateTime < LATEST_SHIFT_CHANGE);
    let eventsSinceLatestShiftChange = events.slice(0, firstEventBeforeShiftChange)
    const latestShiftEvents = extractEventsCount(eventsSinceLatestShiftChange);
    const totalCumul = extractEventsCount(events.slice(0, events.findIndex(e => e.dateTime < new Date(new Date().getFullYear(), 0, 1, HOUR_SHIFT_CHANGE, MINUTES_SHIFT_CHANGE, 0))));
    return buildText(latestShiftEvents.inters, latestShiftEvents.infos, totalCumul.inters, totalCumul.infos);

}

function buildNewSignTextFromLatestValidSign(events) {
    let eventLatestValidSign = events.findIndex((e) => e.validSignature === true);
    if (eventLatestValidSign === -1) {
        return 'Aucune signature valide trouvée récemment, relancez un calcul complet';
    }
    let latestCountInters = extractValue(events[eventLatestValidSign].content, '.*Cumul.*interventions.*: ([0-9]+).*');
    let latestCountInfos = extractValue(events[eventLatestValidSign].content, '.*Cumul.*infos.*: ([0-9]+).*');
    let eventSinceLatestValidSign = events.slice(0, events.findIndex(e => e.validSignature === true))
    const cumulSinceLatestValidSign = extractEventsCount(eventSinceLatestValidSign);

    let firstEventBeforeShiftChange = events.findIndex((e) => e.dateTime < LATEST_SHIFT_CHANGE);
    let eventsSinceLatestShiftChange = events.slice(0, firstEventBeforeShiftChange)
    const latestShiftEvents = extractEventsCount(eventsSinceLatestShiftChange);

    return buildText(latestShiftEvents.inters, latestShiftEvents.infos, cumulSinceLatestValidSign.inters + latestCountInters, cumulSinceLatestValidSign.infos + latestCountInfos)
}

function extractEventsCount(events) {
    return events.reduce((countAcc, ev) => {
        if (ev.type === 'inter') {
            countAcc.inters++
        } else if (ev.type === 'nonreponse') {
            countAcc.infos++
        }
        return countAcc;
    }, {inters: 0, infos: 0})
}

function buildText(currentInters, currentInfos, totalInters, totalInfos) {
    return "Consignes passées au Chef de Garde montant.\n" +
        "Interventions : " + currentInters + "\n" +
        "Infos : " + currentInfos + "\n" +
        "Cumul interventions : " + totalInters + "\n" +
        "Cumul infos : " + totalInfos + "\n" +
        "Personnels : \n" +
        "Moyens : \n" +
        "Divers : ";
}

function addIfNotAlreadyIn(data, newDatas) {
    for (let i = 0; i < newDatas.length; i++) {
        if (data.findIndex((v) => v.title === newDatas[i].title) === -1) {
            data.push(newDatas[i]);
        }
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
        let dateTime = undefined;
        const eventDateFr = title.split(' - ')[0];
        for (const key in mapTranslateMonths) {
            if (eventDateFr.includes(key)) {
                let englishDate = eventDateFr.replace(key, mapTranslateMonths[key])
                dateTime = Date.parse(englishDate);
            }
        }
        dataParsed.push({
            type,
            title,
            content,
            validSignature,
            dateTime
        })
    }
    return dataParsed;
}

function extractValue(latestSignatureText, regexp) {
    const match = latestSignatureText.match(regexp);
    if (match !== null) {
        return parseInt(match[1]);
    } else {
        return null;
    }
}

function daysBetweenDates(date1, date2) {
    let difference = date1.getTime() - date2.getTime();
    return Math.ceil(difference / (1000 * 3600 * 24));
}

function checkContentTextArea(textAreaToCheck) {
    if (!!textAreaToCheck.value.match("Consignes passées au Chef de Garde montant.\n" +
        "Interventions : [0-9]+.*\n" +
        "Infos : [0-9]+.*\n" +
        "Cumul interventions : [0-9]+.*\n" +
        "Cumul infos : [0-9]+.*\n" +
        "Personnels :.*[^ ]+.*\n" +
        "Moyens :.*[^ ]+.*\n" +
        "Divers :.*[^ ]+.*")) {
        sendButton.disabled = false;
        sendButton.value = 'Envoyer'
    } else {
        sendButton.disabled = true;
        sendButton.value = 'Message Incomplet'
    }
}
