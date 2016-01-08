var warning = ''+
'<div class="blog-header alert alert-warning" style="padding: 5px; margin-left: 20%; width: 50%;">'+
	'<h4 class="blog-title" style="display:inline-block;margin-bottom:10px;">'+
		'Information'+
	'</h4>'+
	'<div id="widget-istex-info-arrow" class="icon arrow" style="cursor: pointer; display: inline-block; background: transparent url(&quot;https://istex.github.io/img/arrow-d.png&quot;) no-repeat scroll 0% 0% / 20px 20px; width: 20px; height: 20px; margin-left: 10px; vertical-align: bottom; margin-bottom: 10px;"></div>'+
	'<p id="widget-istex-info" class="widget-istex-info blog-description" style="height: 100%; margin-left: 10px; margin-right: 10px; font-size:  110%;">'+
		'Cette interface a été créée dans le cadre du <a href="http://www.istex.fr/" target="_blank">projet ISTEX</a>, dont le but est de mettre à disposition de la communauté de l’enseignement supérieur et de la recherche un ensemble de documents scientifiques dans toutes les disciplines.'+
		'Un projet complémentaire a été confié à l\'Université de Lorraine : <a href="http://www.istex.fr/istex%E2%88%92snu/" target="_blank">ISTEX-SNU (ISTEX intégré aux Services Numériques des Usagers)</a>.<br/><br/>' +
		'Ce projet et son intégration dans l\'ENT sont en phase <b>de test et de validation</b> pour l\'Université de Lorraine.<br>'+
		'Si vous rencontrez un problème, ou si vous avez des remarques sur les résultats de vos recherches dans ISTEX-SNU n\'hésitez pas, contactez <a href="mailto:istex-contact@univ-lorraine.fr" target="_blank">l\'équipe ISTEX-SNU (istexsnu-contact@univ-lorraine.fr)</a>.<br>'+
	'</p>'+
'</div>';
var d = document.createElement("div");
d.style.clear = "both"; 
d.style.padding = "10px 0 0 0";
d.innerHTML = warning;
var t = document.getElementById("istex-info");
t.insertBefore(d, t.firstChild);
var infoArrow = document.getElementById("widget-istex-info-arrow");
infoArrow.addEventListener("click",function(){
	var p = document.getElementById("widget-istex-info");
	if (p.style.height == "100%"){
		p.style.height=0;
		p.style.overflow="hidden";
		infoArrow.style.transform="rotate(-90deg)";
	}else{
		p.style.height="100%";
		p.style.overflow="visible";
		infoArrow.style.transform="";
	}
});
var submitButton = document.getElementsByClassName("istex-search-submit")[0];
var trigClickInfo = function(){
  var event;
  if (document.createEvent) {
    event = document.createEvent("HTMLEvents");
    event.initEvent("click", true, true);
	event.eventName = "click";
  } else {
    event = new MouseEvent('click', {
	  'view': window,
	  'bubbles': true,
	  'cancelable': true
	});
  }
  
  var p = document.getElementById("widget-istex-info");
  if (p.style.height == "100%") {
    var arrow = document.getElementById("widget-istex-info-arrow"); 
    arrow.dispatchEvent(event);
  }
};
submitButton.onclick = trigClickInfo;