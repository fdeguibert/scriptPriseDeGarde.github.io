function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

// async function main() {
 function main() {
    const dateProcessed = new Date('2022-06-27T03:24:00');
    let totalInters = 0;
    let totalInfos = 0;

    console.log(dateProcessed)
    while(dateProcessed.getFullYear()===2022){
        console.log('start crawling from date : ' + dateProcessed.toLocaleDateString('fr'));
        const context = getHtmlDocumentFromLocal(`https://portail.sdis78.fr/jcms/p_1295618/cs-chevreuse?portlet=p_1336294&dateMci=${dateProcessed.toLocaleDateString('fr').replace('-', '/')}`).getElementsByTagName('body')[0].getAttribute('id');
        console.log(context);

        const dataForDay = getDataForContext(context);

        //Comptage basic des inters du jour (attention, prend pas en compte les inters de la veille au soir, pas de verif des dates etc...
        let dailyInterventions = dataForDay.getElementsByClassName('inter').length;
        let dailyInfos = dataForDay.getElementsByClassName('nonreponse').length;
        console.log(`dailyInterventions : ${dailyInterventions}`);
        console.log(`dailyInfos : ${dailyInfos}`);
        totalInters += dailyInterventions;
        totalInfos += dailyInfos;
        // await sleep(1000); // avoid bruteforce detection
        dateProcessed.setDate(dateProcessed.getDate() - 1);
    }
    console.log(`* total inters: ${totalInters}`)
    console.log(`* total infos: ${totalInfos}`)

}

main();

