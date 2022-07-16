// Actual script

const CS = 'CHE'
const KNOWN_CS = ['CHE']

function getTextArea() {
    return document.querySelector('textarea[name="detail"]');
}

function isModalActive() {
    const textArea = document.querySelector('textarea[name="detail"]');
    return textArea != null && textArea.offsetParent != null;
}

const endGuardModalLink = document.querySelector('a[href*="modal-saisie-signature.jsp"]');
endGuardModalLink.onclick = () => {
    //TODO retrieve and store the CS based on the URL

    function loader() {
        const textArea = document.querySelector('textarea[name="detail"]');
        if (textArea != null && textArea.offsetParent != null) {
            loadEndGuardGenerator(CS);
            console.log("WE ARE GO")
        } else {
            setTimeout(loader, 15);
        }
    }

    if (KNOWN_CS.includes(CS)) {
        loader();
    } else {
        alert('Malheureusement votre CS n\'est pas encore configuré pour cette extension \n' +
            'Envoyez un mail à francois.deguibert@sdis78.fr pour qu\'on l\'ajoute et que l\'extension fonctionne. \n' +
            'En attendant, l\'extension sera désactivée \n' +
            '(Supprimez la de Firefox pour éviter d\'avoir ce message à chaque fois)');
    }
}

function loadEndGuardGenerator(csCode) {

    //add a full rebuild button
    addRebuildCumulButton();

    //add check text listener
    const textArea = document.querySelector('textarea[name="detail"]');
    textArea.addEventListener('input', function () {
        checkContentTextArea(textArea);
    }, true);
    //And initialize text
    textArea.textContent = 'Récupération des données en cours... Veuillez patienter. \n'
    textArea.style.height = '170px';
    checkContentTextArea(textArea);

    defaultGeneration(csCode);


}


function defaultGeneration(csCode) {
    const shiftChangeTime = getTimeChangeShift(csCode);

    const currentDate = new Date();
    currentDate.setHours(shiftChangeTime.hourShiftChange, shiftChangeTime.minutesShiftChange)
    const maxRetrievalDate = new Date(currentDate);
    maxRetrievalDate.setDate(maxRetrievalDate.getDate() - 10); //TODO ME ajouter le "aucune signature valide trouvée dans la dernière semaine, faite un recumul

    const allDatas = getEventsFromDateToDate(maxRetrievalDate, currentDate, true);
    getTextArea().textContent = buildNewSignTextFromLatestValidSign(allDatas, csCode)
}

function fullRebuildGeneration(csCode) {
    const textArea = document.querySelector('textarea[name="detail"]');

    const changeTimeShift = getTimeChangeShift(csCode)
    const startingDate = new Date(new Date().getFullYear(), 0, 1, changeTimeShift.hourShiftChange, changeTimeShift.minutesShiftChange, 0)
    const endingDate = new Date();
    endingDate.setHours(changeTimeShift.hourShiftChange, changeTimeShift.minutesShiftChange,0)

    const allDatas = getEventsFromDateToDate(startingDate, endingDate, false);
    console.log(allDatas)
    allDatas.forEach(e => console.log(e))
    textArea.textContent = buildNewSignTextFullRebuild(allDatas)
}

function addRebuildCumulButton() {
    const modalFooter = document.querySelector('.modal-footer');

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
        if (fullRebuild) {
            fullRebuildGeneration('CHE');
        }
        return false;
    }
    modalFooter.insertBefore(button, modalFooter.firstChild);
}

//Utils

//TODO ME ça va s'arreter a la première signature valide. Si il y en a eu une le matin même ça fout le bronx a priori
/**
 * retrieve all events from startingDate to endingDate
 * @param startingDate
 * @param endingDate
 * @param stopAtFirstValidSignature - should stop crawling when valid signature is found if it's not the current day signature
 * @returns {{
 *             type,
 *             title,
 *             content,
 *             validSignature,
 *             dateTime
 *         }[]}
 */
function getEventsFromDateToDate(startingDate, endingDate, stopAtFirstValidSignature) {
    const allDatas = []
    let validSignatureFound = false;

    let processedDate = endingDate;
    const totalDays = daysBetweenDates(startingDate, endingDate);
    getTextArea().textContent = 'Récupération des données en cours... Veuillez patienter. \n' +
        'Progression de l\'analyse : 0%';
    while (!validSignatureFound && processedDate > startingDate && isModalActive()) { //added isModalActive to avoid sending request if modal window is closed by user
        const pourcentage = (100 - Math.round(daysBetweenDates(startingDate, processedDate) * 100.0 / totalDays)) + '%';
        getTextArea().textContent = 'Récupération des données en cours... Veuillez patienter. \n' +
            'Progression de l\'analyse : ' + pourcentage;

        let eventsForDate = getEventsForDay(processedDate);
        if (stopAtFirstValidSignature && eventsForDate.findIndex(v => v.validSignature === true && new Date(v.dateTime).getDate() !== endingDate.getDate()) !== -1) {
            // a valid signature different from the current day one has been found
            validSignatureFound = true;
        } else {
            processedDate.setDate(processedDate.getDate() - 1);
        }
        addIfNotAlreadyIn(allDatas, eventsForDate);
    }
    return allDatas;
}

/**
 * extract count of type of events and store it in a accumulator object
 *
 * @param events
 * @returns {{inters, infos}}
 */
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

/**
 * get events for a specific date and return a parsed object
 * @param date
 * @returns {{
 *             type,
 *             title,
 *             content,
 *             validSignature,
 *             dateTime
 *         }[]}
 */
function getEventsForDay(date) {
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

/**
 * check if the textToCheck is parsable as a valid signature
 * @param textToCheck
 * @returns {boolean}
 */
function checkValidSignature(textToCheck) {
    return !!(textToCheck.match('.*Cumul.*interventions.*: ([0-9]+).*') && textToCheck.match('.*Cumul.*infos.*: ([0-9]+).*'));
}

/**
 * add newEvents to array events if not already present (based on the title of the events)
 * @param events
 * @param newEvents
 */
function addIfNotAlreadyIn(events, newEvents) {
    for (let i = 0; i < newEvents.length; i++) {
        if (events.findIndex((event) => event.title === newEvents[i].title) === -1) {
            events.push(newEvents[i]);
        }
    }
}

/**
 * disable sendButton if testArea content is not properly formatted
 * @param textAreaToCheck
 */
function checkContentTextArea(textAreaToCheck) {
    const modalFooter = document.querySelector('.modal-footer');
    const sendButton = modalFooter.querySelector('.btn-primary')
    console.log(sendButton)
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

/**
 * format the signature text
 * @param currentInters
 * @param currentInfos
 * @param totalInters
 * @param totalInfos
 * @returns {string}
 */
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

/**
 * extract the numeric value from the group matching regexp
 * @param latestSignatureText
 * @param regexp
 * @returns {null|number}
 */
function extractValue(latestSignatureText, regexp) {
    const match = latestSignatureText.match(regexp);
    if (match !== null) {
        return parseInt(match[1]);
    } else {
        return null;
    }
}

/**
 * count plain days between 2 dates
 * @param date1
 * @param date2
 * @returns {number}
 */
function daysBetweenDates(date1, date2) {
    let difference = date1.getTime() - date2.getTime();
    return Math.ceil(difference / (1000 * 3600 * 24));
}

/**
 * retrieve the hours of shift change depending on the CS
 * @param csCode
 * @returns {{hourShiftChange: number, minutesShiftChange: number}}
 */
function getTimeChangeShift(csCode) {
    let hourShiftChange = 7;
    let minutesShiftChange = 30;
    if (csCode === 'CHE') {
        hourShiftChange = 7;
        minutesShiftChange = 30;
    }
    return {hourShiftChange, minutesShiftChange}
}

/**
 * get the end shift dateTime depending on the CS
 * @param csCode
 * @returns {Date}
 */
function getEndShiftDateTime(csCode) {
    const timeChangeShift = getTimeChangeShift(csCode)
    const date = new Date();
    date.setHours(timeChangeShift.hourShiftChange, timeChangeShift.minutesShiftChange)
    return date;
}

/**
 * get the start shift dateTime depending on the CS
 * @param csCode
 * @returns {Date}
 */
function getStartShiftDateTime(csCode) {
    const timeChangeShift = getTimeChangeShift(csCode)
    const date = new Date();
    date.setDate(date.getDate() - 1)
    date.setHours(timeChangeShift.hourShiftChange, timeChangeShift.minutesShiftChange)
    return date;
}

//HTML Utils
/**
 * get HTML from url
 * @param url
 * @returns {HTMLHtmlElement}
 */
function getHtmlDocumentFrom(url) {
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false);
    xmlHttp.send(null);
    const htmlResult = xmlHttp.responseText;
    const el = document.createElement('html');
    el.innerHTML = htmlResult;

    return el;
}

/**
 * get events as HTML from url with context param to select date
 * @param context - the context id to select date for events
 * @returns {HTMLHtmlElement}
 */
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


//Utils not checked
function buildNewSignTextFullRebuild(events, csCode) {
    let eventsSinceLatestShiftChange = events.slice(events.findIndex(e => e.dateTime <= getEndShiftDateTime(csCode)), events.findIndex(e => e.dateTime < getStartShiftDateTime(csCode)))
    const latestShiftEvents = extractEventsCount(eventsSinceLatestShiftChange);
    const shiftChangeTime = getTimeChangeShift(csCode)
    const endingDate = new Date()
    endingDate.setHours(shiftChangeTime.hourShiftChange, shiftChangeTime.minutesShiftChange)
    const totalCumul = extractEventsCount(events.slice(events.findIndex(e => e.dateTime < endingDate), events.findIndex(e => e.dateTime < new Date(new Date().getFullYear(), 0, 1, shiftChangeTime.hourShiftChange, shiftChangeTime.minutesShiftChange, 0))));
    return buildText(latestShiftEvents.inters, latestShiftEvents.infos, totalCumul.inters, totalCumul.infos);
}

function buildNewSignTextFromLatestValidSign(events, csCode) {
    let eventLatestValidSign = events.findIndex((e) => e.validSignature === true);
    if (eventLatestValidSign === -1) {
        return 'Aucune signature valide trouvée récemment, relancez un calcul complet';
    }
    let latestCountInters = extractValue(events[eventLatestValidSign].content, '.*Cumul.*interventions.*: ([0-9]+).*');
    let latestCountInfos = extractValue(events[eventLatestValidSign].content, '.*Cumul.*infos.*: ([0-9]+).*');
    let eventSinceLatestValidSignToEndDate = events.slice(events.findIndex(e => e.dateTime <= getEndShiftDateTime(csCode)), events.findIndex(e => e.validSignature === true))
    const cumulSinceLatestValidSign = extractEventsCount(eventSinceLatestValidSignToEndDate);

    let eventsSinceLatestShiftChange = events.slice(events.findIndex(e => e.dateTime <= getEndShiftDateTime(csCode)), events.findIndex(e => e.dateTime < getStartShiftDateTime(csCode)))
    const latestShiftEvents = extractEventsCount(eventsSinceLatestShiftChange);

    return buildText(latestShiftEvents.inters, latestShiftEvents.infos, cumulSinceLatestValidSign.inters + latestCountInters, cumulSinceLatestValidSign.infos + latestCountInfos)
}

// const HOUR_SHIFT_CHANGE = 7;
// const MINUTES_SHIFT_CHANGE = 30;
// const LATEST_SHIFT_CHANGE = defineLatestShiftChange(new Date());
//
// function defineLatestShiftChange(fromDate) {
//     if (fromDate.getHours() < HOUR_SHIFT_CHANGE || (fromDate.getHours() === HOUR_SHIFT_CHANGE && fromDate.getMinutes() < MINUTES_SHIFT_CHANGE)) {
//         // if current time is between midnight and shift change
//         fromDate.setDate(fromDate.getDate() - 1);
//     }
//     fromDate.setHours(HOUR_SHIFT_CHANGE, MINUTES_SHIFT_CHANGE, 0);
//     return fromDate
// }


const mapTranslateMonths = [];
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
