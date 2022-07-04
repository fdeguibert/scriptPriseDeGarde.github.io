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

function main() {
    const startingDate = new Date('2022-06-27T03:24:00')
    console.log('start crawling from date : ' + startingDate.toLocaleDateString('fr'));
    const context = getHtmlDocumentFromLocal(`https://portail.sdis78.fr/jcms/p_1295618/cs-chevreuse?portlet=p_1336294&dateMci=${startingDate.toLocaleDateString('fr').replace('-', '/')}`).getElementsByTagName('body')[0].getAttribute('id');
    console.log(context);

    const dataForDay = getDataForContext(context);

    //Comptage basic des inters du jour (attention, prend pas en compte les inters de la veille au soir, pas de verif des dates etc...
    let dailyInterventions = dataForDay.getElementsByClassName('inter').length;
    let dailyInfos = dataForDay.getElementsByClassName('nonreponse').length;
    console.log(`dailyInterventions : ${dailyInterventions}`);
    console.log(`dailyInfos : ${dailyInfos}`);
}

main();

