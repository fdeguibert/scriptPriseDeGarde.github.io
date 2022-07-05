function getHtmlDocumentFromLocal(url) {
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

function generateMessageFromDate(fromDate) {
    const stopDate = new Date();
    stopDate.setDate(stopDate.getDate()+1);
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
        const context = getHtmlDocumentFromLocal(`https://portail.sdis78.fr/jcms/p_1295618/cs-chevreuse?portlet=p_1336294&dateMci=${dateProcessed.toLocaleDateString('fr').replace('-', '/')}`).getElementsByTagName('body')[0].getAttribute('id');
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
        }else{
            dayYearBefore = false;
        }
        dayBeforeEvents = dailyEvents;
        dateProcessed.setDate(dateProcessed.getDate() + 1);
    }
    console.log(`aujourd'hui, inters: ${dailyInterventions}`)
    console.log(`aujourd'hui, infos: ${dailyInfos}`)
    console.log(`* total inters comptabilisées: ${totalInters}`)
    console.log(`* total infos comptabilisées: ${totalInfos}`)

}

generateMessageFromDate(new Date('2021-12-31T03:03:03Z'));

