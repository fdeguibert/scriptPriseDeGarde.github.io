javascript:(function () {


var template = 'generation en cours...';

var waitForModalTextArea = function(callback) {
  if (jQuery('div.form-group:nth-child(2) > div:nth-child(2) > div:nth-child(1) > textarea:nth-child(1):nth-child(1)')[0] !=null && jQuery('div.form-group:nth-child(2) > div:nth-child(2) > div:nth-child(1) > textarea:nth-child(1):nth-child(1)')[0].offsetParent != null) {
    callback();
  } else {
    setTimeout(function() {
      waitForModalTextArea(callback);
    }, 300);
  }
};

waitForModalTextArea(function() {
  document.getElementsBySelector('div.form-group:nth-child(2) > div:nth-child(2)')[0].getElementsByTagName('div')[0].getElementsByTagName('textarea')[0].textContent = template;
  fetchAndFillDatas();
});


document.getElementsBySelector('div.col-md-3:nth-child(2) > a:nth-child(1)')[0].click();


var fetchAndFillDatas = function(){


  document.getElementsBySelector('div.col-md-3:nth-child(2) > a:nth-child(1)')[0].click();

  var urlListeGarde = 'https://portail.sdis78.fr/' + document.getElementsBySelector('#cs-header-tabs > ul:nth-child(1) > li:nth-child(7) > a:nth-child(1)')[0].getAttribute('href');


  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", urlListeGarde, false );
  xmlHttp.send( null );
  var htmlResult = xmlHttp.responseText;


  var el = document.createElement( 'html' );
  el.innerHTML = htmlResult;
  var tableGardeRows =  el.getElementsBySelector('#cs-content')[0].getElementsByTagName('div')[0].getElementsByTagName('tr');

  var personnel = [];
  for (i = 0; i < tableGardeRows.length; i++) {
  	personnel[i-1] = tableGardeRows[i].getElementsByTagName('td');
  }
  personnel.valueOf();

  var CA2Array = [];
  var CA1Array = [];
  var TLArray = [];
  var eqArray = [];

  var rankCA2 = ['adj', 'adc'];
  var rankCA1 = ['sgt','sch'];
  var rankTL = ['cpl', 'cch'];
  var rankEq = ['sap', 'sp1', 'sp2'];

  for (i = 0;i<personnel.length;i++){

    var rank = personnel[i][0].textContent;
    var name = personnel[i][1].textContent.split('\n')[0];
    var duration = personnel[i][7].textContent.charAt(0);
    var displayName = rank + ' ' + name;

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

  var lineCA2 = CA2Array.join(' / ');
  var lineCA1 = CA1Array.join(' / ');
  var lineTL = TLArray.join(' / ');
  var lineEq = eqArray.join(' / ');

  template = "Sous-officier de garde : \nSous-officier de jour : \nGarde remise : \nStationnaire : \nEquipiers : " + lineEq + "\nChefs d'équipe : " + lineTL + "\nChefs d'agrès 1 équipe : " + lineCA1 + "\nChefs d'agrès 2 équipes : " + lineCA2;
  if (jQuery('div.form-group:nth-child(2) > div:nth-child(2) > div:nth-child(1) > textarea:nth-child(1):nth-child(1)')[0] !=null && jQuery('div.form-group:nth-child(2) > div:nth-child(2) > div:nth-child(1) > textarea:nth-child(1):nth-child(1)')[0].offsetParent != null) {
    document.getElementsBySelector('div.form-group:nth-child(2) > div:nth-child(2)')[0].getElementsByTagName('div')[0].getElementsByTagName('textarea')[0].textContent = template;
  }

}


})();
