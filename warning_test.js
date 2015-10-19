var warning = ''+
'<div class="blog-header alert alert-warning" style="padding: 5px;">'+
	'<h4 class="blog-title" style="display:inline-block;margin-bottom:0px;">'+
		'Information'+
	'</h4>'+
	'<div id="widget-istex-info-arrow" class="icon arrow" style="cursor: pointer;display: inline-block;background: transparent url(&quot;https://istex.github.io/img/arrow-d.png&quot;) no-repeat scroll 0% 0% / 20px 20px; width: 20px; height: 20px; margin-left: 10px; vertical-align: bottom;"></div>'+
	'<p id="widget-istex-info" class="widget-istex-info blog-description" style="height:100%;">'+
		'Cette interface a été créée dans le cadre du projet ISTEX, dont le but est de mettre à disposition de la communauté de l’enseignement supérieur et de la recherche un ensemble de documents scientifiques dans toutes les disciplines.<br>'+
		'Un projet annexe a été confié à la Direction du Numérique de l\'Université de Lorraine : ISTEX-SNU (ISTEX intégré aux Services Numériques des Usagers). Ce projet apporte une interface facile d\'utilisation pour la platforme ISTEX et s\'intègre sans difficulté dans les environnements de travail comme les ENT (Espace Numérique de Travail) ou les DT (Discovery Tools).<br>'+
		'Ce projet est en phase de <b>test</b> sur l\'ENT de l\'Université de Lorraine. Si vous rencontrez un problème, contactez nous à <a href="mailto:thom.frantz@gmail.com">l\'équipe ISTEX-SNU</a>.<br>'+
		'Vous pouvez visionner le code source et signaler des bugs à cette adresse : <a href="https://github.com/istex/istex-widgets-angular">https://github.com/istex/istex-widgets-angular</a>.'+
	'</p>'+
'</div>';
var d = document.createElement("div");
d.innerHTML = warning;
var t = document.getElementById("istex-widget-search");
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