const DEBUG_MODE_ON = true
if (!DEBUG_MODE_ON) {
    console = console || {};
    console.log = function () {
    };
}
const DEFAULT_SIGNATURE_TEMPLATE = "Consignes passées au Chef de Garde montant.\n" +
    "Interventions : [X-inters-X]\n" +
    "Infos : [X-infos-X]\n" +
    "Cumul interventions : [X-cumul-inters-X]\n" +
    "Cumul infos : [X-cumul-infos-X]\n" +
    "Personnels : \n" +
    "Moyens : \n" +
    "Divers : ";

//add listener to handle saved text

function handleSavedTextChange(savedText) {
    let buttonWithTooltip = document.getElementById('button-load-text-with-tooltip');
    let buttonClearText = document.getElementById('button-clear-text');
    if (buttonWithTooltip) {
        buttonWithTooltip.title = savedText || 'vide';
        buttonWithTooltip.disabled = !savedText;
    }
    if (buttonClearText) {
        buttonClearText.disabled = !savedText;
    }
}

function manageSavedText() {
    //initial get of saved text
    browser.storage.sync.get('savedText')
        .then((res) => {
            handleSavedTextChange(res.savedText)
            //TODO Ajouter un indicateur avec le texte sauvegardé
        });
    //listen to changes
    browser.storage.onChanged.addListener(changeData => {
        handleSavedTextChange(changeData.savedText.newValue);
    });
}

//Load missing bootstrap css
const styleBootstrap = document.createElement('style');
styleBootstrap.innerHTML = ".dropdown-toggle::after{display:inline-block;margin-left:.255em;vertical-align:.255em;content:\"\";border-top:.3em solid;border-right:.3em solid transparent;border-bottom:0;border-left:.3em solid transparent}" +
    ".dropdown-toggle:empty::after{margin-left:0}" +
    ".btn-secondary.dropdown-toggle{color:#fff;background-color:#545b62;border-color:#4e555b}" +
    ".btn-secondary:not(:disabled):not(.disabled).active:focus,.btn-secondary:not(:disabled):not(.disabled):active:focus,.show>.btn-secondary.dropdown-toggle:focus{box-shadow:0 0 0 .2rem rgba(130,138,145,.5)}" +
    ".btn-success{color:#fff;background-color:#28a745;border-color:#28a745}" +
    ".dropdown-item{display:block;width:100%;padding:.25rem 1.5rem;clear:both;font-weight:400;color:#212529;text-align:inherit;white-space:nowrap;background-color:transparent;border:0}" +
    ".dropdown-item:focus,.dropdown-item:hover{color:#16181b;text-decoration:none;background-color:#f8f9fa}" +
    ".dropdown-item.active,.dropdown-item:active{color:#fff;text-decoration:none;background-color:#007bff}" +
    ".dropdown-item.disabled,.dropdown-item:disabled{color:#6c757d;pointer-events:none;background-color:transparent}" +
    ".dropdown-menu.show{display:block}" +
    ".dropdown-divider{height:0;margin:.5rem 0;overflow:hidden;border-top:1px solid #e9ecef}"

document.getElementsByTagName('head')[0].appendChild(styleBootstrap);


function getCS() {
    const url = window.location.href;

    if (url.includes('cs-chevreuse')) {
        return 'CHE';
    }
    return undefined;
}

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
    const currentCS = getCS();

    if (currentCS && KNOWN_CS.includes(currentCS)) {
        loader();
    } else {
        alert('Malheureusement votre CS n\'est pas encore configuré pour cette extension \n' +
            'Envoyez un mail à francois.deguibert@sdis78.fr pour qu\'on l\'ajoute et que l\'extension fonctionne. \n' +
            'En attendant, l\'extension sera désactivée \n' +
            '(Supprimez la de Firefox pour éviter d\'avoir ce message à chaque fois)');
    }

    function loader() {
        const textArea = document.querySelector('textarea[name="detail"]');
        if (textArea != null && textArea.offsetParent != null) {
            loadEndGuardGenerator(currentCS);
        } else {
            setTimeout(loader, 15);
        }
    }
}

function fetchDatasForDate(date) {
    const contextUrl = `https://portail.sdis78.fr/jcms/p_1295618/cs-chevreuse?portlet=p_1336294&dateMci=${date.toLocaleDateString('fr').replace('-', '/')}`
    const htmlForContext = fetch(contextUrl);
    return htmlForContext.then(function (response) {
        // The API call was successful!
        return response.text();
    }).then(function (html) {
        // This is the HTML from our response as a text string
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html').getElementsByTagName('body')[0].getAttribute('id');
    }).then(function (contextId) {
        const headers = new Headers();
        headers.set('X-Jcms-Ajax-Id', contextId)
        return fetch('https://portail.sdis78.fr/plugins/MainCourantePlugin/jsp/doMciList.jsp', {headers});
    }).then(function (responseWithData) {
        return new Promise(function (resolve, reject) {
            if (responseWithData.status !== 200) {
                reject("API limit is reached")
            } else {
                resolve(responseWithData.text())
            }
        });
    }).then(function (responseWithDataAsHtml) {
        const parser = new DOMParser();
        return parser.parseFromString(responseWithDataAsHtml, 'text/html');
    }).then(function (htmlDoc) {
        // console.log(date + ' is fetched')
        return extractEventsFromHtml(htmlDoc)
    }).catch(function (err) {
        // There was an error
        console.warn('Une erreur est survenue:', err);
        return undefined;
    });
}


function loadEndGuardGenerator(csCode) {

    //add a dropdown button
    addDropDownButton();
    manageSavedText();

    //add check text listener
    const textArea = document.querySelector('textarea[name="detail"]');

    //And initialize text
    textArea.textContent = 'Récupération des données en cours... Veuillez patienter. \n'
    textArea.style.height = '170px';
    defaultGeneration(csCode);

}

async function defaultGeneration(csCode) {
    setButtonState(false)

    const shiftChangeTime = getTimeChangeShift(csCode);

    const currentDate = new Date();
    currentDate.setHours(shiftChangeTime.hourShiftChange, shiftChangeTime.minutesShiftChange)
    const maxRetrievalDate = new Date(currentDate);
    maxRetrievalDate.setDate(maxRetrievalDate.getDate() - 5);

    let allDatas = await getEventsFromDateToDateParallelized(maxRetrievalDate, currentDate, 10);
    if (!allDatas) {
        alert('une erreur est survenue durant l\'appel au serveur, le calcul va recommencer, plus lentement pour éviter les erreurs de surcharge serveur')
        allDatas = await getEventsFromDateToDateParallelized(maxRetrievalDate, currentDate, 1);
    }
    console.log(allDatas)
    
    await loadCountsFromFromLatestValidSign(allDatas, csCode)
    buildText().then((result) => {
        getTextArea().textContent = result;
        checkContentTextArea(getTextArea())
        getTextArea().addEventListener('input', function () {
            checkContentTextArea(getTextArea());
        }, true);
    })

}

async function fullRebuildGeneration(csCode) {
    setButtonState(false)

    const changeTimeShift = getTimeChangeShift(csCode)
    const startingDate = new Date(new Date().getFullYear(), 0, 1, changeTimeShift.hourShiftChange, changeTimeShift.minutesShiftChange, 0)
    const endingDate = new Date();
    endingDate.setHours(changeTimeShift.hourShiftChange, changeTimeShift.minutesShiftChange, 0)

    getTextArea().textContent = 'Démarrage de la récupération des données...';
    let allDatas = await getEventsFromDateToDateParallelized(startingDate, endingDate, 10);
    if (!allDatas) {
        alert('une erreur est survenue durant l\'appel au serveur, le calcul va recommencer, plus lentement pour éviter les erreurs de surcharge serveur')
        allDatas = await getEventsFromDateToDateParallelized(startingDate, endingDate, 2);
    }
    console.log(allDatas)
    await loadCountsFromFullRebuild(allDatas)
    buildText().then((result) => {
        getTextArea().textContent = result;
        checkContentTextArea(getTextArea())
        getTextArea().addEventListener('input', function () {
            checkContentTextArea(getTextArea());
        }, true);
    })

}

function rebuildAction() {
    let fullRebuild = confirm('Souhaitez vous reconstruire le cumul des interventions depuis le 01 Janvier? \n' +
        'Cela prendra quelques minutes. \n\n' +
        'En cas de problème lisez la documentation ou contactez François de Guibert \n' +
        'lien de la documentation :\n' +
        'https://fdeguibert.github.io/scriptPriseDeGarde.github.io/');
    if (fullRebuild) {
        fullRebuildGeneration('CHE');
    }
    return false;
}

function saveText() {
    browser.storage.sync.get('savedText')
        .then((res) => {
            if (!res.savedText || confirm('un texte est déjà sauvegardé: \n\n' + res.savedText + '\n\n'
                + 'Souhaitez vous l\'écraser?')) {
                let textToSave = getTextArea().value;
                textToSave = textToSave.replace(/Interventions : ([0-9]+)/i, 'Interventions : [X-inters-X]');
                textToSave = textToSave.replace(/Infos : ([0-9]+)/i, 'Infos : [X-infos-X]');
                textToSave = textToSave.replace(/Cumul.*interventions : ([0-9]+)/i, 'Cumul interventions : [X-cumul-inters-X]');
                textToSave = textToSave.replace(/Cumul.*infos.*: ([0-9]+)/i, 'Cumul infos : [X-cumul-infos-X]');
                browser.storage.sync.set({
                    savedText: textToSave
                });
            }
        });
    return false;
}

function clearSavedText() {
    browser.storage.sync.get('savedText')
        .then((res) => {
            if (res.savedText) {
                // document.getElementById('tooltip-text-saved').title = res.savedText;
                let conf = confirm('Supprimer le texte sauvegardé: \n\n' + res.savedText + '\n\n'
                    + 'Êtes vous sûr?');
                if (conf) {
                    browser.storage.sync.remove('savedText');
                }
            }
        });
    return false;
}

function loadSavedText() {
    browser.storage.sync.get('savedText')
        .then((res) => {
            if (res.savedText) {
                buildText(res.savedText).then((res) => {
                    getTextArea().value = res;
                    getTextArea().textContent = res;
                })
            }
        });
    return false;
}

function addDropDownButton() {
    const buttonOptions = document.createElement('button');
    buttonOptions.className = "btn btn-secondary dropdown-toggle";
    buttonOptions.type = "button";
    buttonOptions.id = "dropdownMenuButton";
    buttonOptions.setAttribute('data-toggle', "dropdown");
    buttonOptions.setAttribute('aria-hasPopup', "true");
    buttonOptions.setAttribute('aria-expanded', "false");
    buttonOptions.textContent = "Options";
    buttonOptions.style.float = 'left'

    const dropdownDiv = document.createElement('div');
    dropdownDiv.className = "dropdown-menu";
    dropdownDiv.setAttribute("aria-labelledby", "dropdownMenuButton");

    const buttonSaveText = document.createElement("button");
    buttonSaveText.className = "dropdown-item";
    buttonSaveText.type = "button";
    buttonSaveText.textContent = "Sauvegarder le texte";
    buttonSaveText.onclick = () => {
        return saveText();
    }
    dropdownDiv.appendChild(buttonSaveText);


    const buttonLoadText = document.createElement("button");
    buttonLoadText.id = 'button-load-text-with-tooltip';
    buttonLoadText.className = "dropdown-item";

    buttonLoadText.setAttribute("data-toggle", "tooltip");
    buttonLoadText.setAttribute("data-html", "true");
    buttonLoadText.setAttribute("data-delay", "0");
    buttonLoadText.type = "button";
    buttonLoadText.textContent = "Charger le texte sauvegardé";

    buttonLoadText.onclick = () => {
        return loadSavedText();
    }

    dropdownDiv.appendChild(buttonLoadText);

    const buttonClearText = document.createElement("button");
    buttonClearText.id = 'button-clear-text'
    buttonClearText.className = "dropdown-item";
    buttonClearText.type = "button";
    buttonClearText.textContent = "Supprimer le texte sauvegardé";

    buttonClearText.onclick = () => {
        return clearSavedText();
    }
    dropdownDiv.appendChild(buttonClearText);


    const separatorDiv = document.createElement('div');
    separatorDiv.className = "dropdown-divider";
    dropdownDiv.appendChild(separatorDiv);
    const buttonRebuildCumul = document.createElement("button");
    buttonRebuildCumul.className = "dropdown-item";
    buttonRebuildCumul.type = "button";
    buttonRebuildCumul.textContent = "Reconstruire le cumul";
    buttonRebuildCumul.onclick = () => {
        return rebuildAction()
    }
    dropdownDiv.appendChild(buttonRebuildCumul);

    const modalFooter = document.querySelector('.modal-footer');

    const divWrapper = document.createElement("div");
    divWrapper.className = "dropdown";
    divWrapper.style.float = 'left'
    divWrapper.appendChild(buttonOptions);
    divWrapper.appendChild(dropdownDiv);


    modalFooter.insertBefore(divWrapper, modalFooter.firstChild)

}

//Utils

/**
 * retrieve all events from startingDate to endingDate
 * @param startingDate
 * @param endingDate
 * @param chunkSize - batch size to avoid api limit
 * @returns {{
 *             type,
 *             title,
 *             content,
 *             validSignature,
 *             dateTime
 *         }[]}
 */
async function getEventsFromDateToDateParallelized(startingDate, endingDate, chunkSize = 1) {
    const allDatesToProcess = [];
    const toProcessedDate = new Date(endingDate);
    while (toProcessedDate > startingDate) {
        allDatesToProcess.push(new Date(toProcessedDate));
        toProcessedDate.setDate(toProcessedDate.getDate() - 1);
    }
    const total = allDatesToProcess.length;
    let fetchedCount = 0;
    const chunkedDates = allDatesToProcess.reduce((resultArray, item, index) => {
        const chunkIndex = Math.floor(index / chunkSize)
        if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] // start a new chunk
        }
        resultArray[chunkIndex].push(item)
        return resultArray
    }, [])

    const allSummed = [];
    let errorOccured = false;
    for (let i = 0; i < chunkedDates.length; i++) {
        if (!isModalActive()) {
            break;
        }
        const chunkedEvents = await Promise.all(chunkedDates[i].map(date => fetchDatasForDate(date).then((data) => {
            fetchedCount++
            getTextArea().textContent = 'Récupération des données en cours... Veuillez patienter. \n' +
                'Progression de l\'analyse : ' + Math.round((fetchedCount * 100.0) / total) + '%';
            return data;
        }))).then((result) => {
            const eventsForChunk = [];
            result.forEach(events => {
                addIfNotAlreadyIn(eventsForChunk, events)
            });
            return eventsForChunk;
        }).catch(() => {
            console.warn('error occurred during api fetching')
            return undefined;
        });
        if (!chunkedEvents) {
            errorOccured = true;
            break;
        }
        addIfNotAlreadyIn(allSummed, chunkedEvents);

    }
    return errorOccured ? undefined : allSummed;
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


function extractEventsFromHtml(htmlDoc) {

    const currentCS = getCS();
    const eventsDiv = htmlDoc.getElementsByClassName('sdis78box');
    const dataParsed = [];
    for (let i = 0; i < eventsDiv.length; i++) {
        let deb = false;

        const eventDiv = eventsDiv[i].querySelector('div:nth-child(1)')

        let type = eventDiv.className.replace('panel ', '');
        let title = 'UNKNOWN'
        if (type === 'prisegarde' || type === 'signature') {
            title = eventDiv.querySelector('div:nth-child(1) > div:nth-child(1)> div:nth-child(1) > span:nth-child(2)').textContent
        } else {
            title = eventDiv.querySelector('div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > span:nth-child(1)').textContent
            //if it's a nonresponse, check if it's not a inter in disguise
            if (type === 'nonreponse') {
                const cardEquipage = eventDiv.querySelector('div:nth-child(1) > div:nth-child(2) > div:nth-child(1)').querySelectorAll('.card-equipage');
                cardEquipage.forEach(card => {
                    if (card.textContent.includes(currentCS)) {
                        console.log(`équipage ${currentCS} trouvé sur la nonreponse. requalification de la nonreponse en inter`)
                        type = 'inter'
                        deb = true;
                    }
                })
            }
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
    return !!(textToCheck.match('.*Interventions.*: ([0-9]+).*')
        && textToCheck.match('.*Infos.*: ([0-9]+).*')
        && textToCheck.match('.*Cumul.*interventions.*: ([0-9]+).*')
        && textToCheck.match('.*Cumul.*infos.*: ([0-9]+).*'));
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
    if (checkValidSignature(textAreaToCheck.value)) {
        setButtonState(true);
    } else {
        sendButton.disabled = true;
        sendButton.value = 'Message Invalide'
        alert('Le texte doit contenir les 4 lignes suivantes: \n\n' +
            'Interventions : [un nombre]\n' +
            'Infos : [un nombre]\n' +
            'Cumul interventions : [un nombre]\n' +
            'Cumul infos : [un nombre]')
    }
}

function setButtonState(enabled) {
    const modalFooter = document.querySelector('.modal-footer');
    const sendButton = modalFooter.querySelector('.btn-primary')
    const dropDownButton = document.getElementById('dropdownMenuButton');
    sendButton.disabled = !enabled;
    sendButton.value = enabled ? 'Envoyer' : 'Calcul en cours';
    if (dropDownButton) {
        dropDownButton.disabled = !enabled;
    }

}

/**
 * format the signature text
 * @param template
 * @returns {string}
 */
function buildText(template = DEFAULT_SIGNATURE_TEMPLATE) {
    return browser.storage.sync.get('aggregatedCount').then((res) => {
        if (res.aggregatedCount) {
            let text = template;
            text = text.replace('[X-inters-X]', res.aggregatedCount.currentInters);
            text = text.replace('[X-infos-X]', res.aggregatedCount.currentInfos);
            text = text.replace('[X-cumul-inters-X]', res.aggregatedCount.totalInters);
            text = text.replace('[X-cumul-infos-X]', res.aggregatedCount.totalInfos);
            return text;
        }else{
            alert('le calcul n\'était pas terminé');
        }
    });

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
async function loadCountsFromFullRebuild(events, csCode) {
    let eventsSinceLatestShiftChange = events.slice(events.findIndex(e => e.dateTime <= getEndShiftDateTime(csCode)), events.findIndex(e => e.dateTime < getStartShiftDateTime(csCode)))
    const latestShiftEvents = extractEventsCount(eventsSinceLatestShiftChange);
    const shiftChangeTime = getTimeChangeShift(csCode)
    const endingDate = new Date()
    endingDate.setHours(shiftChangeTime.hourShiftChange, shiftChangeTime.minutesShiftChange)
    const totalCumul = extractEventsCount(events.slice(events.findIndex(e => e.dateTime < endingDate), events.findIndex(e => e.dateTime < new Date(new Date().getFullYear(), 0, 1, shiftChangeTime.hourShiftChange, shiftChangeTime.minutesShiftChange, 0))));

    const aggregatedCount = {
        currentInters: latestShiftEvents.inters,
        currentInfos: latestShiftEvents.infos,
        totalInters: totalCumul.inters,
        totalInfos: totalCumul.infos
    };
    await browser.storage.sync.set({aggregatedCount})
}

async function loadCountsFromFromLatestValidSign(events, csCode) {
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

    const aggregatedCount = {
        currentInters: latestShiftEvents.inters,
        currentInfos: latestShiftEvents.infos,
        totalInters: cumulSinceLatestValidSign.inters + latestCountInters,
        totalInfos: cumulSinceLatestValidSign.infos + latestCountInfos
    };
    await browser.storage.sync.set({aggregatedCount})
}


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
