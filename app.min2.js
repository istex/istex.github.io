if(window.myNav=navigator.userAgent.toLowerCase(),window.myNav=-1!=window.myNav.indexOf("msie")?parseInt(window.myNav.split("msie")[1]):!1,window.myNav&&window.myNav<=8){var scr=document.getElementsByTagName("script"),lastSrcipt=scr[scr.length-1];lastSrcipt.insertAdjacentHTML("afterend",'<div id="old">Votre navigateur ne peut pas afficher les widgets ISTEX, veuillez en utiliser un plus récent : Internet Explorer 9 ou plus, Google Chrome, Firefox,...</div>')}if(window.istexConfig.slider!==!1)var app=angular.module("app",["rzModule"]);else var app=angular.module("app",[]);var extend=function(objects){var extended={},merge=function(obj){for(var prop in obj)Object.prototype.hasOwnProperty.call(obj,prop)&&(extended[prop]=obj[prop])};merge(arguments[0]);for(var i=1;i<arguments.length;i++){var obj=arguments[i];merge(obj)}return extended};app.filter("proxify",function(){return function(input,istexApi){return null!=input&&"https://api.istex.fr"!==istexApi&&(input=input.replace("https://api.istex.fr",istexApi)),input}}),app.filter("capitalize",function(){return function(input,scope){return null!=input&&(input=input.toLowerCase()),input.substring(0,1).toUpperCase()+input.substring(1)}}),app.filter("numberize",function(){return function(input,scope){return null!=input&&(input=input.toString().replace(/(\d)(?=(\d{3})+$)/g,"$1 ")),input}}),app.filter("ellipse",function(){return function(input,wordwise,max,tail){if(!input)return"";if(max=parseInt(max,10),!max)return input;if(input.length<=max)return input;if(input=input.substr(0,max),wordwise){var lastspace=input.lastIndexOf(" ");-1!=lastspace&&(input=input.substr(0,lastspace))}return input+(tail||" …")}}),app.filter("languagize",function(){return function(input,traduction){if(!input)return"";if("en"===traduction)switch(input){case"fre":return"French";case"eng":return"English";case"lat":return"Latin";case"deu":return"German";case"ger":return"German";case"spa":return"Spanish";case"dut":return"Dutch";case"ita":return"Italian";case"por":return"Portuguese";case"rus":return"Russian";case"wel":return"Welsh";case"glg":return"Galician";case"grc":return"Greek";case"gre":return"Greek";case"ara":return"Arabian";case"heb":return"Hebrew";case"pol":return"Polish";case"dan":return"Danish";case"swe":return"Swedish";case"moh":return"Mohawk";case"syr":return"Syriac";case"per":return"Persian";case"frm":return"French, Middle";case"mul":return"Multiple languages";case"unknown":return"Unknown";default:return input}else switch(input){case"fre":return"Français";case"eng":return"Anglais";case"lat":return"Latin";case"deu":return"Allemand";case"ger":return"Allemand";case"spa":return"Espagnol";case"dut":return"Néerlandais";case"ita":return"Italien";case"por":return"Portugais";case"rus":return"Russe";case"wel":return"Gallois";case"glg":return"Galicien";case"grc":return"Grec";case"gre":return"Grec";case"ara":return"Arabe";case"heb":return"Hébreu";case"pol":return"Polonais";case"dan":return"Danois";case"swe":return"Suédois";case"moh":return"Mohawk";case"syr":return"Syriaque";case"per":return"Persan";case"frm":return"Français moyen";case"mul":return"Multilingue";case"unknown":return"Non spécifié";default:return input}}}),app.directive("ngToggle",function(){function link($scope,element,attributes){element=element[0];var expression=attributes.ngToggle;$scope.$watch(expression,function(newValue,oldValue){newValue?element.style.opacity="1":element.style.opacity="0"})}return{link:link,restrict:"A"}}),app.directive("ngFocus",function(){function link($scope,element,attributes){element=element[0];var expression=attributes.ngFocus;$scope.$eval(expression)&&element.focus(),$scope.$watch(expression,function(newValue,oldValue){newValue!==oldValue&&(newValue?element.focus():element.blur())})}return{link:link,restrict:"A"}}),app.directive("istexFacets",function(){return{template:'<div id="istex-widget-facets" style="opacity: 1;" ng-controller="IstexfacetsCtrl" ng-toggle="showFacets && aggregations"><div class="istex-facets"><h3 class="istex-facets-title">{{ istexConfigDefault.labels.facets["title"] || "Affiner votre recherche" }}</h3><form class="istex-facets" ><div class="istex-facet" ng-repeat="(facetName, facet) in aggregations"><h4 class="istex-facet-name" ng-click="shownFacet = !shownFacet;">{{ (istexConfigDefault.labels.facets[facetName] || facetName) | capitalize }}<div ng-class="shownFacet ? \'icon arrow\' : \'icon arrow flipped\'" ng-style="shownFacet && { width: \'silver\', display: \'inline-block\'} || { color: \'gold\', display: \'inline-block\' }"></div></h4><div class="animate-switch-container" ng-switch on="facetName"><div class="istex-facet-corpus" ng-switch-when="corpusName" ng-if="shownFacet"><li ng-repeat="badge in facet.buckets"><label><input type="checkbox" ng-model="badge.isChecked" ng-click="submitFacetSearch(aggregations)">{{ badge.key }}<span class="istex-facet-corpus-badge" >{{ badge.docCount | numberize }}</span></label></li></div><div class="istex-facet-language" ng-switch-when="language" ng-if="shownFacet"><li ng-repeat="badge in facet.buckets"><label><input type="checkbox" ng-model="badge.isChecked" ng-click="submitFacetSearch(aggregations)">{{ badge.key | languagize:istexConfigDefault.labels.facets["traduction"] }}<span class="istex-facet-language-badge" >{{ badge.docCount | numberize }}</span></label></li></div><div class="istex-facet-wos" ng-switch-when="wos" ng-if="shownFacet"><li ng-repeat="badge in facet.buckets" title="{{badge.key | capitalize}}"><label><input type="checkbox" ng-model="badge.isChecked" ng-click="submitFacetSearch(aggregations)" >{{ badge.key  | capitalize | ellipse:false:27:"..."   }}<span class="istex-facet-wos-badge" >{{ badge.docCount | numberize }}</span></label></li></div><div class="istex-facet-copyrightdate" ng-switch-when="copyrightDate" ng-if="shownFacet"><div ng-if="!istexConfigDefault.slider">Entre <input type="number" min="{{ facet.buckets[0].fromAsString }}" max="{{ facet.buckets[0].toAsString }}" ng-model="facet.buckets[0].bot" ng-change="submitFacetSearch(aggregations)" > et <input type="number" min="{{ facet.buckets[0].fromAsString }}" max="{{ facet.buckets[0].toAsString }}" ng-model="facet.buckets[0].top" ng-change="submitFacetSearch(aggregations)" ></div><div ng-if="istexConfigDefault.slider"><rzslider class="rzslider" rz-slider-floor="facet.buckets[0].fromAsString" rz-slider-ceil="facet.buckets[0].toAsString" rz-slider-model="facet.buckets[0].bot" rz-slider-high="facet.buckets[0].top" rz-slider-step="1" ></rzslider></div></div><div class="istex-facet-pubdate" ng-switch-when="publicationDate" ng-if="shownFacet"><div ng-if="!istexConfigDefault.slider">Entre <input type="number" min="{{ facet.buckets[0].fromAsString }}" max="{{ facet.buckets[0].toAsString }}" ng-model="facet.buckets[0].bot" ng-change="submitFacetSearch(aggregations)" > et <input type="number" min="{{ facet.buckets[0].fromAsString }}" max="{{ facet.buckets[0].toAsString }}" ng-model="facet.buckets[0].top" ng-change="submitFacetSearch(aggregations)" ></div><div ng-if="istexConfigDefault.slider"><rzslider class="rzslider" rz-slider-floor="facet.buckets[0].fromAsString" rz-slider-ceil="facet.buckets[0].toAsString" rz-slider-model="facet.buckets[0].bot" rz-slider-high="facet.buckets[0].top" rz-slider-step="1" ></rzslider></div></div><div class="istex-facet-quality" ng-switch-when="score" ng-if="shownFacet"><div ng-if="!istexConfigDefault.slider">Entre <input type="number" min="0" max="10" ng-model="facet.buckets[0].bot" ng-change="submitFacetSearch(aggregations)" > et <input type="number" min="0" max="10" ng-model="facet.buckets[0].top" ng-change="submitFacetSearch(aggregations)" ></div><div ng-if="istexConfigDefault.slider"><rzslider class="rzslider" rz-slider-floor="0" rz-slider-ceil="10" rz-slider-model="facet.buckets[0].bot" rz-slider-high="facet.buckets[0].top" rz-slider-step="1" ></rzslider></div></div><div class="istex-facet-{{ facetName }}" ng-switch-default>Default behavior</div></div></div></form></div></div>'}}),app.controller("IstexfacetsCtrl",["$scope","$rootScope","$timeout","istexFacetsService",function($scope,$rootScope,$timeout,istexFacetsService){$rootScope.showFacets=!1,$rootScope.shownFacet=$rootScope.istexConfigDefault.shownFacet,$rootScope.istexConfigDefault.slider&&$scope.$on("slideEnded",function(){$scope.submitFacetSearch($scope.aggregations)}),$scope.submitFacetSearch=function(list){$rootScope.showResults=!1,istexFacetsService.facetSearch($scope,list).success(function(result){if($rootScope.searchTimeB=(new Date).getTime(),$rootScope.totalSearchTime=(($rootScope.searchTimeB-$rootScope.searchTimeA)/1e3).toFixed(2),$rootScope.noresult=0===result.total,!$rootScope.noresult){$rootScope.elasticSearchTime=(result.stats.elasticsearch.took/1e3).toFixed(2),$rootScope.istexSearchTime=(result.stats["istex-api"].took/1e3).toFixed(2),$rootScope.reseauSearchTime=($rootScope.totalSearchTime-$rootScope.elasticSearchTime-$rootScope.istexSearchTime).toFixed(2),$rootScope.documents=result.hits,$rootScope.total=result.total,$rootScope.nextPageURI=result.nextPageURI,$rootScope.maxPagesInPagination=$rootScope.istexConfigDefault.maxPagesInPagination,$rootScope.nbrPages=Math.ceil($rootScope.total/$rootScope.istexConfigDefault.pageSize),$rootScope.firstPageURI={id:1},$rootScope.lastPageURI={id:$rootScope.nbrPages},$rootScope.nbrPages<$rootScope.maxPagesInPagination&&($rootScope.maxPagesInPagination=$rootScope.nbrPages),$rootScope.pageCourante=1;var tab=[];for(i=1;i<=$rootScope.maxPagesInPagination;i++)tab.push({id:i});$rootScope.pages=tab,$rootScope.showResults=!0}}).error(function(e){console.log("ERROR : Corpus Search")})}}]),app.factory("istexFacetsService",["$http","$rootScope",function($http,$rootScope){return{facetSearch:function(scope,list){function corpusMaker(element,index,array){element.isChecked&&(corpus+=element.key+",")}function wosMaker(element,index,array){element.isChecked&&(wos+='"'+element.key.replace("&","%26")+'",')}function languageMaker(element,index,array){element.isChecked&&(language+=element.key+",","fr"===element.key&&(language+="fre,"),"en"===element.key&&(language+="eng,"))}var tmp,url=$rootScope.currentPageURI,corpus=" AND corpusName:";list.corpusName&&list.corpusName.buckets.forEach(corpusMaker),corpus=" AND corpusName:"!=corpus?corpus.substring(0,corpus.length-1):corpus="",tmp=url.split("&"),tmp[0]+=corpus,url=" AND corpusName:"!==corpus?tmp.join("&"):url;var language=" AND language:";list.language&&list.language.buckets.forEach(languageMaker),language=" AND language:"!=language?language.substring(0,language.length-1):language="",tmp=url.split("&"),tmp[0]+=language,url=" AND language:"!==language?tmp.join("&"):url;var wos=" AND wos:(";list.wos&&list.wos.buckets.forEach(wosMaker),wos=" AND wos:("!=wos?wos.substring(0,wos.length-1)+")":wos="",tmp=url.split("&"),tmp[0]+=wos,url=" AND wos:"!==wos?tmp.join("&"):url;var facetURL="",rangeSlider=function(facetName,facet,topValue,botValue){var bot,top,facetURL=" AND "+facetName+":[";if(topValue||(topValue=parseInt(facet.buckets[0].toAsString)),botValue||(botValue=parseInt(facet.buckets[0].fromAsString)),facet){if(bot=parseInt(facet.buckets[0].bot),bot=!isNaN(bot)&&bot>botValue?Math.floor(bot):botValue,top=parseInt(facet.buckets[0].top),top=!isNaN(top)&&topValue>top?Math.ceil(top):topValue,bot>top){var tmp=bot;bot=top,top=tmp}return(bot!=botValue||top!=topValue)&&(facetURL+=bot+" TO "+top+"]"),facetURL}};return list.publicationDate&&(tmp=url.split("&"),facetURL=rangeSlider("publicationDate",list.publicationDate),tmp[0]+=facetURL,url=facetURL&&" AND publicationDate:["!==facetURL?tmp.join("&"):url),list.copyrightDate&&(tmp=url.split("&"),facetURL=rangeSlider("copyrightDate",list.copyrightDate),tmp[0]+=facetURL,url=facetURL&&" AND copyrightDate:["!==facetURL?tmp.join("&"):url),list.score&&(tmp=url.split("&"),facetURL=rangeSlider("score",list.score),tmp[0]+=facetURL,url=facetURL&&" AND score:["!==facetURL?tmp.join("&"):url),$rootScope.currentFacetsURI=url,$rootScope.searchTimeA=(new Date).getTime(),$http.jsonp(url+"&callback=JSON_CALLBACK")}}}]),app.directive("istexSearch",function(){return{template:'<div id="istex-widget-search" ng-controller="IstexsearchCtrl" ><form class="istex-search-form" ><div class="istex-search-bar-wrapper"><span><input class="istex-search-input" type="search" value="" placeholder="{{istexConfigDefault.labels.search[\'placeholder\'] || \'Votre requête ici ...\'}}" ng-model="query" ng-focus="istexConfigDefault.focusInputQueryOnLoad"></span><input class="istex-search-submit" type="submit" value="Rechercher" ng-click="search()"></div><div class="istex-advanced-wrapper" ng-if="istexConfigDefault.advancedToLoad"><div class="istex-advanced-button" ng-click="toggleAdvanced()"><a href="" >{{ (istexConfigDefault.labels.search["advancedTitle"] || "Recherche avancée") | capitalize }}</a></div><div class="istex-advanced-inputs"><div class="istex-advanced" ng-repeat="(advancedName, advanced) in advancedQuery" ng-show="showAdvanced"><h4 class="istex-advanced-name">{{ (istexConfigDefault.labels.search[advancedName] || advancedName) | capitalize }}</h4><div class="istex-advanced-{{advancedName}}" ><input type="search" ng-model="advancedQuery[advancedName]"></div></div></div></div><p class="istex-search-error"></p><div class="istex-search-loading" title="Recherche en cours"></div></form></div>'}}),app.controller("IstexsearchCtrl",["$scope","$rootScope","istexSearchService",function($scope,$rootScope,istexSearchService){if($rootScope.showAdvanced=!1,$rootScope.showResults=!1,$rootScope.istexConfigDefault.advancedToLoad&&($scope.advancedQuery=$rootScope.istexConfigDefault.advancedToLoad),$rootScope.istexConfigDefault.query!==!1){var q=$rootScope.istexConfigDefault.query;$rootScope.query=q?q.toString():""}$scope.search=function(){$rootScope.showResults=!1,$rootScope.showFacets=!1,istexSearchService.search($scope).success(function(result){if($rootScope.searchTimeB=(new Date).getTime(),$rootScope.totalSearchTime=(($rootScope.searchTimeB-$rootScope.searchTimeA)/1e3).toFixed(2),$rootScope.noresult=0===result.total,!$rootScope.noresult){$rootScope.elasticSearchTime=(result.stats.elasticsearch.took/1e3).toFixed(2),$rootScope.istexSearchTime=(result.stats["istex-api"].took/1e3).toFixed(2),$rootScope.reseauSearchTime=($rootScope.totalSearchTime-$rootScope.elasticSearchTime-$rootScope.istexSearchTime).toFixed(2),$rootScope.documents=result.hits,$rootScope.total=result.total,$rootScope.nextPageURI=result.nextPageURI,$rootScope.aggregations=result.aggregations,$rootScope.aggregations&&$rootScope.aggregations.publicationDate&&($rootScope.aggregations.publicationDate.buckets[0].top=parseInt($rootScope.aggregations.publicationDate.buckets[0].toAsString),$rootScope.aggregations.publicationDate.buckets[0].bot=parseInt($rootScope.aggregations.publicationDate.buckets[0].fromAsString||0)),$rootScope.aggregations&&$rootScope.aggregations.copyrightDate&&($rootScope.aggregations.copyrightDate.buckets[0].top=parseInt($rootScope.aggregations.copyrightDate.buckets[0].toAsString),$rootScope.aggregations.copyrightDate.buckets[0].bot=parseInt($rootScope.aggregations.copyrightDate.buckets[0].fromAsString||0)),$rootScope.aggregations&&$rootScope.aggregations.score&&($rootScope.aggregations.score.buckets[0].top=10,$rootScope.aggregations.score.buckets[0].bot=0),$rootScope.maxPagesInPagination=$rootScope.istexConfigDefault.maxPagesInPagination,$rootScope.nbrPages=Math.ceil($rootScope.total/$rootScope.istexConfigDefault.pageSize),$rootScope.firstPageURI={id:1},$rootScope.lastPageURI={id:$rootScope.nbrPages},$rootScope.nbrPages<$rootScope.maxPagesInPagination&&($rootScope.maxPagesInPagination=$rootScope.nbrPages),$rootScope.pageCourante=1;var tab=[];for(i=1;i<=$rootScope.maxPagesInPagination;i++)tab.push({id:i});$rootScope.pages=tab,$rootScope.showResults=!0,$rootScope.showFacets=!0}}).error(function(e){console.error("ERROR : Search"),console.error(e)})},$scope.toggleAdvanced=function(){if($rootScope.showAdvanced=!$rootScope.showAdvanced,!$rootScope.showAdvanced)for(var prop in $scope.advancedQuery)Object.prototype.hasOwnProperty.call($scope.advancedQuery,prop)&&($scope.advancedQuery[prop]="")}}]),app.factory("istexSearchService",["$http","$rootScope",function($http,$rootScope){return{search:function(scope){var url=$rootScope.istexConfigDefault.istexApi;url+="/document/?q=";var query=scope.query?scope.query.toString():"",advanced=this.advancedSearch(scope.advancedQuery);url+=""!=query?query:"*",url+=""!=advanced?advanced:"",url+="&output=*",url+="&stats=1";var facets="&facet="+$rootScope.istexConfigDefault.facetsToLoad.join(),size="&size="+$rootScope.istexConfigDefault.pageSize;return url+=facets+size,$rootScope.currentPageURI=url,$rootScope.searchTimeA=(new Date).getTime(),$http.jsonp(url+"&callback=JSON_CALLBACK")},advancedSearch:function(advancedQuery){var advanced="";for(var prop in advancedQuery)Object.prototype.hasOwnProperty.call(advancedQuery,prop)&&""!=advancedQuery[prop]&&(advanced+=" AND "+prop+":"+advancedQuery[prop]);return advanced}}}]),app.directive("istexResults",function(){return{template:'<div class="istex-results-noresult" ng-show="noresult">{{istexConfigDefault.labels.results.noresult || "Il n\'y a pas de résultat à afficher chaaaa !"}}</div><div class="istex-hidebutton" ng-click="istexConfigDefault.hideButton = false;" ng-show="!noresult && istexConfigDefault.hideButton" title="{{istexConfigDefault.labels.results.showResult || \'Cliquez pour afficher les résultats\'}}">{{ total || ". . . . . . . . ." | numberize }} documents</div><div id="istex-widget-results" style="opacity: 1;" ng-controller="IstexresultsCtrl" ng-toggle="showResults" ng-show="!noresult && !istexConfigDefault.hideButton"><div class="istex-results-items-stats" ng-toggle="!hideStats">Environ {{ total | numberize }} résultats <span title="Réseau : {{reseauSearchTime}} sec, Moteur de recherche : {{elasticSearchTime}} sec, Traitements de l\'API : {{istexSearchTime}} sec" ng-if="istexConfigDefault.showQuerySpeed">({{totalSearchTime}} secondes)</span></div><div class="istex-results-pagination" ng-if="istexConfigDefault.showPaginationTop"><a href="#" class="istex-results-pagination-prec" title="Page précédente" ng-click="selectPage(pageCourante-1)" ng-if="pageCourante !== firstPageURI.id"> < </a><ul class="istex-results-pagination-plist"><li ng-repeat="page in pages" ><a href="#" ng-click="selectPage(page.id)" ng-if="pageCourante !== page.id ">{{page.id}}</a><span class="istex-results-pagination-page-selected" ng-if="pageCourante === page.id">{{page.id}}</span></li></ul><a href="#" class="istex-results-pagination-next" title="Page suivante" ng-click="selectPage(pageCourante+1)" ng-if="pageCourante !== lastPageURI.id"> > </a></div><ol class="istex-results-items" ng-toggle="!hideResults"><li class="istex-results-item" ng-repeat="document in documents"><a class="istex-results-item-title" target="_blank" ng-href="{{document.fulltext[0].uri | proxify:istexConfigDefault.proxyApi }}" >{{ document.title | ellipse:true:istexConfigDefault.titleLength:"..." }}</a><p class="istex-results-item-abstract" ng-if="document.abstract" title="{{ document.abstract }}"><b>Résumé</b> : {{ document.abstract | ellipse:false:istexConfigDefault.abstractLength:"..."  }}</p><p class="istex-results-item-abstract" title="Pas de résumé" ng-if="!document.abstract">{{ istexConfigDefault.labels.results[\'abstract\'] || "Pas de résumé disponible pour cet article" }}</p><div class="istex-results-item-corpus">{{ document.corpusName }}</div><div><b>Score</b> : <div class="star-rating" title="{{document.qualityIndicators.score}}"><div class="full-star" ng-style="{width: \'{{document.qualityIndicators.score*10 || 0}}%\'}"></div><div class="empty-star">{{document.qualityIndicators.score || 0}}</div></div></div><div style="display: block"><div class="download fulltext"><h4>{{ istexConfigDefault.labels.results["fulltext"] || "Fulltext" }}</h4><ul class="istex-results-item-download"><li class="istex-results-item-dl fulltext" ng-repeat="fulltext in document.fulltext"><a ng-href="{{ fulltext.uri | proxify:istexConfigDefault.proxyApi }}" class="istex-results-item-dl-{{ fulltext.extension }}" title="Télécharger le ou les fichiers {{ fulltext.extension | uppercase }}" target="_blank">{{ fulltext.extension | uppercase }}</a></li></ul></div><div class="download metadata"><h4>{{ (istexConfigDefault.labels.results["metadata"] || "Metadata") }}</h4><ul class="istex-results-item-download metadata"><li class="istex-results-item-dl" ng-repeat="metadata in document.metadata"><a ng-href="{{ metadata.uri | proxify:istexConfigDefault.proxyApi }}" class="istex-results-item-dl-{{ metadata.extension }}" title="Télécharger le ou les fichiers {{ metadata.extension | uppercase }}" target="_blank">{{ metadata.extension | uppercase }}</a></li></ul></div></div><div class="istex-results-item-bottom"></div><hr style="border-top-color: black;"/></li></ol><div class="istex-results-pagination" ng-if="istexConfigDefault.showPaginationBot"><a href="#" class="istex-results-pagination-prec" title="Page précédente" ng-click="selectPage(pageCourante-1)" ng-if="pageCourante !== firstPageURI.id"> < </a><ul class="istex-results-pagination-plist"><li ng-repeat="page in pages" ><a href="#" ng-click="selectPage(page.id)" ng-if="pageCourante !== page.id ">{{page.id}}</a><span class="istex-results-pagination-page-selected" ng-if="pageCourante === page.id">{{page.id}}</span></li></ul><a href="#" class="istex-results-pagination-next" title="Page suivante" ng-click="selectPage(pageCourante+1)" ng-if="pageCourante !== lastPageURI.id"> > </a></div></div>'}}),app.controller("IstexresultsCtrl",["$scope","$rootScope","istexResultsService",function($scope,$rootScope,istexResultsService){$rootScope.showResults=!1,$rootScope.istexConfigDefault.query!==!1&&istexResultsService.defaultSearch($rootScope.istexConfigDefault.query).success(function(result){if($rootScope.searchTimeB=(new Date).getTime(),$rootScope.totalSearchTime=(($rootScope.searchTimeB-$rootScope.searchTimeA)/1e3).toFixed(2),$rootScope.noresult=0===result.total,!$rootScope.noresult){$rootScope.elasticSearchTime=(result.stats.elasticsearch.took/1e3).toFixed(2),$rootScope.istexSearchTime=(result.stats["istex-api"].took/1e3).toFixed(2),$rootScope.reseauSearchTime=($rootScope.totalSearchTime-$rootScope.elasticSearchTime-$rootScope.istexSearchTime).toFixed(2),$rootScope.documents=result.hits,$rootScope.total=result.total,$rootScope.nextPageURI=result.nextPageURI,$rootScope.aggregations=result.aggregations,$rootScope.aggregations.publicationDate&&($rootScope.aggregations.publicationDate.buckets[0].top=parseInt($rootScope.aggregations.publicationDate.buckets[0].toAsString),$rootScope.aggregations.publicationDate.buckets[0].bot=parseInt($rootScope.aggregations.publicationDate.buckets[0].fromAsString||0)),$rootScope.aggregations.copyrightDate&&($rootScope.aggregations.copyrightDate.buckets[0].top=parseInt($rootScope.aggregations.copyrightDate.buckets[0].toAsString),$rootScope.aggregations.copyrightDate.buckets[0].bot=parseInt($rootScope.aggregations.copyrightDate.buckets[0].fromAsString||0)),$rootScope.aggregations.score&&($rootScope.aggregations.score.buckets[0].top=10,$rootScope.aggregations.score.buckets[0].bot=0),$rootScope.maxPagesInPagination=$rootScope.istexConfigDefault.maxPagesInPagination,$rootScope.nbrPages=Math.ceil($rootScope.total/$rootScope.istexConfigDefault.pageSize),$rootScope.firstPageURI={id:1},$rootScope.lastPageURI={id:$rootScope.nbrPages},$rootScope.nbrPages<$rootScope.maxPagesInPagination&&($rootScope.maxPagesInPagination=$rootScope.nbrPages),$rootScope.pageCourante=1;var tab=[];for(i=1;i<=$rootScope.maxPagesInPagination;i++)tab.push({id:i});$rootScope.pages=tab,$rootScope.showResults=!0,$rootScope.showFacets=!0}}).error(function(e){console.error("ERROR : Default Search")}),$scope.selectPage=function(numPage){var page=(numPage-1)*$rootScope.istexConfigDefault.pageSize;$rootScope.pageCourante=numPage,$rootScope.pageCourante>=1+Math.ceil($rootScope.maxPagesInPagination/2)&&$rootScope.pageCourante<=$rootScope.nbrPages-Math.ceil($rootScope.maxPagesInPagination/2)?($rootScope.pageStart=$rootScope.pageCourante-Math.floor($rootScope.maxPagesInPagination/2-.5),$rootScope.pageEnd=$rootScope.pageCourante+Math.ceil($rootScope.maxPagesInPagination/2-.5)):$rootScope.pageCourante<1+Math.ceil($rootScope.maxPagesInPagination/2)?($rootScope.pageStart=1,$rootScope.pageEnd=$rootScope.maxPagesInPagination):$rootScope.pageCourante>$rootScope.nbrPages-Math.ceil($rootScope.maxPagesInPagination/2)&&($rootScope.pageStart=$rootScope.nbrPages-$rootScope.maxPagesInPagination+1,$rootScope.pageEnd=$rootScope.nbrPages);var tab=[];for(i=$rootScope.pageStart;i<=$rootScope.pageEnd;i++)tab.push({id:i});$rootScope.pages=tab,$rootScope.hideResults=!0,$rootScope.hideStats=!0,istexResultsService.search(page).success(function(result){$rootScope.searchTimeB=(new Date).getTime(),$rootScope.totalSearchTime=(($rootScope.searchTimeB-$rootScope.searchTimeA)/1e3).toFixed(2),$rootScope.elasticSearchTime=(result.stats.elasticsearch.took/1e3).toFixed(2),$rootScope.istexSearchTime=(result.stats["istex-api"].took/1e3).toFixed(2),$rootScope.reseauSearchTime=($rootScope.totalSearchTime-$rootScope.elasticSearchTime-$rootScope.istexSearchTime).toFixed(2),$rootScope.documents=result.hits,$rootScope.nextPageURI=result.nextPageURI,$rootScope.hideResults=!1,$rootScope.hideStats=!1}).error(function(e){console.error("ERROR : Pagination")})}}]),app.factory("istexResultsService",["$http","$rootScope",function($http,$rootScope){return{search:function(page){var url=$rootScope.currentPageURI;$rootScope.currentFacetsURI&&(url=$rootScope.currentFacetsURI);var from="&from=";return from+=page,url+=from,$rootScope.searchTimeA=(new Date).getTime(),$http.jsonp(url+"&callback=JSON_CALLBACK")},defaultSearch:function(q){var url=$rootScope.istexConfigDefault.istexApi;url+="/document/?q=";var query=q?q.toString():"";url+=""!=query?query:"*",url+="&output=*",url+="&stats=1";var facets="&facet="+$rootScope.istexConfigDefault.facetsToLoad.join(),size="&size="+$rootScope.istexConfigDefault.pageSize;return url+=facets+size,$rootScope.currentPageURI=url,$rootScope.searchTimeA=(new Date).getTime(),$http.jsonp(url+"&callback=JSON_CALLBACK")}}}]),app.run(["$rootScope",function($rootScope){$rootScope.istexConfigDefault={istexApi:"https://api.istex.fr",proxyApi:"https://api-istex-fr.bases-doc.univ-lorraine.fr",query:!1,focusInputQueryOnLoad:!1,facetsToLoad:["corpusName","publicationDate","copyrightDate","language","wos","score"],hideButton:!1,advancedToLoad:{"author.name":"","host.editor.name":"",genre:"","host.genre":"","subject.value":"","host.subject.value":"",language:""},slider:!0,showPaginationTop:!0,showPaginationBot:!0,pageSize:10,maxPagesInPagination:10,abstractLength:250,titleLength:150,fullTextOnTitle:"pdf",showQuerySpeed:!0,shownFacet:!0,labels:{search:{advancedTitle:"Recherche avancée",placeholder:"Votre requête ici ...","author.name":"Auteur","host.editor.name":"Editeur",genre:"Genre de document","host.genre":"Genre de série","subject.value":"Sujet du document","host.subject.value":"Sujet de la série",language:"Langue"},results:{noresult:"Pas de résultat (Faîtes attention quand vous utilisez plusieurs facettes)",showResult:"Affichez les résultats","abstract":"Pas de résumé",fulltext:"Texte complet",metadata:"Métadonnées"},facets:{title:"Affiner votre recherche",corpusName:"Corpus",publicationDate:"Date de publication",copyrightDate:"Début du copyright",wos:"Catégorie",language:"Langue",traduction:"fr"}}},window.istexConfig&&Object.getOwnPropertyNames(window.istexConfig).length>0&&($rootScope.istexConfigDefault=extend($rootScope.istexConfigDefault,window.istexConfig))}]),angular.element(document).ready(function(){angular.bootstrap(document,["app"])});