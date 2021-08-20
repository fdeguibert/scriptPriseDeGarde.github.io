
const VERSION = 0.3


function fetchAndFillDatasPriseDeGarde(textArea){
  console.log(`using v${VERSION}`);
  let template = 'generation en cours...';
  document.querySelector('div.form-group:nth-child(2) > div:nth-child(2) > div:nth-child(1) > textarea:nth-child(1)').textContent = template;

  const urlListeGarde = 'https://portail.sdis78.fr/' + document.querySelector('#cs-header-tabs > ul:nth-child(1) > li:nth-child(7) > a:nth-child(1)').getAttribute('href');


  const xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", urlListeGarde, false );
  xmlHttp.send( null );
  const htmlResult = xmlHttp.responseText;


  const el = document.createElement('html');
  el.innerHTML = htmlResult;
  const tableGardeRows = el.querySelector('#cs-content').getElementsByTagName('div')[0].getElementsByTagName('tr');

  const personnel = [];
  for (i = 0; i < tableGardeRows.length; i++) {
    personnel[i-1] = tableGardeRows[i].getElementsByTagName('td');
  }
  personnel.valueOf();

  const CA2Array = [];
  const CA1Array = [];
  const TLArray = [];
  const eqArray = [];

  const rankCA2 = ['adj', 'adc'];
  const rankCA1 = ['sgt', 'sch'];
  const rankTL = ['cpl', 'cch'];
  const rankEq = ['sap', 'sp1', 'sp2'];

  for (i = 0;i<personnel.length;i++){

    const rank = personnel[i][0].textContent;
    const name = personnel[i][1].textContent.split('\n')[0];
    const duration = personnel[i][7].textContent.charAt(0);
    let displayName = rank + ' ' + name;

    if (duration == 'G'){
       displayName += ' (24)';
    }else if (duration == 'J'){
      displayName += ' (12J)';
    }else if (duration == 'N'){
      displayName += ' (12N)';
    }else{
      console.log ('UNKNOWN DURATION ' + duration);
      alert("Erreur pendant l'execution du script");
    }
    if (rankCA2.indexOf(rank)!=-1){
      CA2Array.push(displayName);
    }else if (rankCA1.indexOf(rank)!=-1){
      CA1Array.push(displayName);
     }else if (rankTL.indexOf(rank)!=-1){
      TLArray.push(displayName);
    }else if (rankEq.indexOf(rank)!=-1){
      eqArray.push(displayName);
    }else{
      console.log('UNKNOWN RANK ' + rank);
      alert("Erreur pendant l'execution du script");
    }
  }

  const lineCA2 = CA2Array.join(' / ');
  const lineCA1 = CA1Array.join(' / ');
  const lineTL = TLArray.join(' / ');
  const lineEq = eqArray.join(' / ');

  template = "Sous-officier de garde : \nSous-officier de jour : \nGarde remise : \nStationnaire : \nEquipiers : " + lineEq + "\nChefs d'équipe : " + lineTL + "\nChefs d'agrès 1 équipe : " + lineCA1 + "\nChefs d'agrès 2 équipes : " + lineCA2;

  textArea.textContent = template;
}

function loadOpenGuardScript(wasAlreadyDisplayed){

  const modalTitle = document.querySelector('#modalLabel');
  const textArea = document.querySelector('div.form-group:nth-child(2) > div:nth-child(2) > div:nth-child(1) > textarea:nth-child(1):nth-child(1)');
  const isDisplayed = textArea != null && textArea.offsetParent != null && modalTitle != null && modalTitle.textContent.includes("Saisie d'une prise de garde");
  if (isDisplayed && !wasAlreadyDisplayed) {
    fetchAndFillDatasPriseDeGarde(textArea);
  }
  setTimeout(function() {
    loadOpenGuardScript(isDisplayed);
  }, 300);

}

//Actual script
const modalLinkToTest = document.querySelector('div.col-md-3:nth-child(2) > a:nth-child(1)');
const isRunningHandPage = modalLinkToTest != null && modalLinkToTest.toString().includes('modal-saisie-prise-de-garde');


if (isRunningHandPage){
  loadOpenGuardScript(false);
}
