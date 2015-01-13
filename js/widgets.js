/*
 * jQuery JSONP Core Plugin 2.4.0 (2012-08-21)
 *
 * https://github.com/jaubourg/jquery-jsonp
 *
 * Copyright (c) 2012 Julian Aubourg
 *
 * This document is licensed as free software under the terms of the
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 */
( function( $ ) {

	// ###################### UTILITIES ##

	// Noop
	function noop() {
	}

	// Generic callback
	function genericCallback( data ) {
		lastValue = [ data ];
	}

	// Call if defined
	function callIfDefined( method , object , parameters ) {
		return method && method.apply( object.context || object , parameters );
	}

	// Give joining character given url
	function qMarkOrAmp( url ) {
		return /\?/ .test( url ) ? "&" : "?";
	}

	var // String constants (for better minification)
		STR_ASYNC = "async",
		STR_CHARSET = "charset",
		STR_EMPTY = "",
		STR_ERROR = "error",
		STR_INSERT_BEFORE = "insertBefore",
		STR_JQUERY_JSONP = "_jqjsp",
		STR_ON = "on",
		STR_ON_CLICK = STR_ON + "click",
		STR_ON_ERROR = STR_ON + STR_ERROR,
		STR_ON_LOAD = STR_ON + "load",
		STR_ON_READY_STATE_CHANGE = STR_ON + "readystatechange",
		STR_READY_STATE = "readyState",
		STR_REMOVE_CHILD = "removeChild",
		STR_SCRIPT_TAG = "<script>",
		STR_SUCCESS = "success",
		STR_TIMEOUT = "timeout",

		// Window
		win = window,
		// Deferred
		Deferred = $.Deferred,
		// Head element
		head = $( "head" )[ 0 ] || document.documentElement,
		// Page cache
		pageCache = {},
		// Counter
		count = 0,
		// Last returned value
		lastValue,

		// ###################### DEFAULT OPTIONS ##
		xOptionsDefaults = {
			//beforeSend: undefined,
			//cache: false,
			callback: STR_JQUERY_JSONP,
			//callbackParameter: undefined,
			//charset: undefined,
			//complete: undefined,
			//context: undefined,
			//data: "",
			//dataFilter: undefined,
			//error: undefined,
			//pageCache: false,
			//success: undefined,
			//timeout: 0,
			//traditional: false,
			url: location.href
		},

		// opera demands sniffing :/
		opera = win.opera,

		// IE < 10
		oldIE = !!$( "<div>" ).html( "<!--[if IE]><i><![endif]-->" ).find("i").length;

	// ###################### MAIN FUNCTION ##
	function jsonp( xOptions ) {

		// Build data with default
		xOptions = $.extend( {} , xOptionsDefaults , xOptions );

		// References to xOptions members (for better minification)
		var successCallback = xOptions.success,
			errorCallback = xOptions.error,
			completeCallback = xOptions.complete,
			dataFilter = xOptions.dataFilter,
			callbackParameter = xOptions.callbackParameter,
			successCallbackName = xOptions.callback,
			cacheFlag = xOptions.cache,
			pageCacheFlag = xOptions.pageCache,
			charset = xOptions.charset,
			url = xOptions.url,
			data = xOptions.data,
			timeout = xOptions.timeout,
			pageCached,

			// Abort/done flag
			done = 0,

			// Life-cycle functions
			cleanUp = noop,

			// Support vars
			supportOnload,
			supportOnreadystatechange,

			// Request execution vars
			firstChild,
			script,
			scriptAfter,
			timeoutTimer;

		// If we have Deferreds:
		// - substitute callbacks
		// - promote xOptions to a promise
		Deferred && Deferred(function( defer ) {
			defer.done( successCallback ).fail( errorCallback );
			successCallback = defer.resolve;
			errorCallback = defer.reject;
		}).promise( xOptions );

		// Create the abort method
		xOptions.abort = function() {
			!( done++ ) && cleanUp();
		};

		// Call beforeSend if provided (early abort if false returned)
		if ( callIfDefined( xOptions.beforeSend , xOptions , [ xOptions ] ) === !1 || done ) {
			return xOptions;
		}

		// Control entries
		url = url || STR_EMPTY;
		data = data ? ( (typeof data) == "string" ? data : $.param( data , xOptions.traditional ) ) : STR_EMPTY;

		// Build final url
		url += data ? ( qMarkOrAmp( url ) + data ) : STR_EMPTY;

		// Add callback parameter if provided as option
		callbackParameter && ( url += qMarkOrAmp( url ) + encodeURIComponent( callbackParameter ) + "=?" );

		// Add anticache parameter if needed
		!cacheFlag && !pageCacheFlag && ( url += qMarkOrAmp( url ) + "_" + ( new Date() ).getTime() + "=" );

		// Replace last ? by callback parameter
		url = url.replace( /=\?(&|$)/ , "=" + successCallbackName + "$1" );

		// Success notifier
		function notifySuccess( json ) {

			if ( !( done++ ) ) {

				cleanUp();
				// Pagecache if needed
				pageCacheFlag && ( pageCache [ url ] = { s: [ json ] } );
				// Apply the data filter if provided
				dataFilter && ( json = dataFilter.apply( xOptions , [ json ] ) );
				// Call success then complete
				callIfDefined( successCallback , xOptions , [ json , STR_SUCCESS, xOptions ] );
				callIfDefined( completeCallback , xOptions , [ xOptions , STR_SUCCESS ] );

			}
		}

		// Error notifier
		function notifyError( type ) {

			if ( !( done++ ) ) {

				// Clean up
				cleanUp();
				// If pure error (not timeout), cache if needed
				pageCacheFlag && type != STR_TIMEOUT && ( pageCache[ url ] = type );
				// Call error then complete
				callIfDefined( errorCallback , xOptions , [ xOptions , type ] );
				callIfDefined( completeCallback , xOptions , [ xOptions , type ] );

			}
		}

		// Check page cache
		if ( pageCacheFlag && ( pageCached = pageCache[ url ] ) ) {

			pageCached.s ? notifySuccess( pageCached.s[ 0 ] ) : notifyError( pageCached );

		} else {

			// Install the generic callback
			// (BEWARE: global namespace pollution ahoy)
			win[ successCallbackName ] = genericCallback;

			// Create the script tag
			script = $( STR_SCRIPT_TAG )[ 0 ];
			script.id = STR_JQUERY_JSONP + count++;

			// Set charset if provided
			if ( charset ) {
				script[ STR_CHARSET ] = charset;
			}

			opera && opera.version() < 11.60 ?
				// onerror is not supported: do not set as async and assume in-order execution.
				// Add a trailing script to emulate the event
				( ( scriptAfter = $( STR_SCRIPT_TAG )[ 0 ] ).text = "document.getElementById('" + script.id + "')." + STR_ON_ERROR + "()" )
			:
				// onerror is supported: set the script as async to avoid requests blocking each others
				( script[ STR_ASYNC ] = STR_ASYNC )

			;

			// Internet Explorer: event/htmlFor trick
			if ( oldIE ) {
				script.htmlFor = script.id;
				script.event = STR_ON_CLICK;
			}

			// Attached event handlers
			script[ STR_ON_LOAD ] = script[ STR_ON_ERROR ] = script[ STR_ON_READY_STATE_CHANGE ] = function ( result ) {

				// Test readyState if it exists
				if ( !script[ STR_READY_STATE ] || !/i/.test( script[ STR_READY_STATE ] ) ) {

					try {

						script[ STR_ON_CLICK ] && script[ STR_ON_CLICK ]();

					} catch( _ ) {}

					result = lastValue;
					lastValue = 0;
					result ? notifySuccess( result[ 0 ] ) : notifyError( STR_ERROR );

				}
			};

			// Set source
			script.src = url;

			// Re-declare cleanUp function
			cleanUp = function( i ) {
				timeoutTimer && clearTimeout( timeoutTimer );
				script[ STR_ON_READY_STATE_CHANGE ] = script[ STR_ON_LOAD ] = script[ STR_ON_ERROR ] = null;
				head[ STR_REMOVE_CHILD ]( script );
				scriptAfter && head[ STR_REMOVE_CHILD ]( scriptAfter );
			};

			// Append main script
			head[ STR_INSERT_BEFORE ]( script , ( firstChild = head.firstChild ) );

			// Append trailing script if needed
			scriptAfter && head[ STR_INSERT_BEFORE ]( scriptAfter , firstChild );

			// If a timeout is needed, install it
			timeoutTimer = timeout > 0 && setTimeout( function() {
				notifyError( STR_TIMEOUT );
			} , timeout );

		}

		return xOptions;
	}

	// ###################### SETUP FUNCTION ##
	jsonp.setup = function( xOptions ) {
		$.extend( xOptionsDefaults , xOptions );
	};

	// ###################### INSTALL in jQuery ##
	$.jsonp = jsonp;

} )( jQuery );

var istexConfigDefault = {
  // l'adresse de l'API de l'Istex
  istexApi: 'https://api.istex.fr',
  
  // pour lancer une recherche au chargement de la page
  // positionner les mots à rechercher
  query: "",
  
  // le nom de l'évènement émit au moment de l'authentification réussie
  connectedEventName: "istex-connected",

  // le nom de l'évènement émit au moment d'une recherche    
  resultsEventName: "istex-results",

  // la taille max en nombre de caractères du résumé
  abstractLength: 250,

  // la taille max en nombre de caractères du titre
  titleLength: 100,

  // quel est le format clickable au niveau du titre
  fullTextOnTitle: 'pdf'
};

// create a empty istexConfig variable
if (!istexConfig) {
  var istexConfig = {};
}
/* jshint -W117 */
'use strict';

/**
 * Widget istexAuth
 */
;(function ($, window, document, undefined) {

  var pluginName  = "istexAuth";
  var defaults    = istexConfigDefault;

  // The actual plugin constructor
  function Plugin(element, options) {
    this.elt = element;
    this.settings = $.extend({}, defaults, istexConfig, options);
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  /**
   * Try to authenticate with a cookie if needed
   * then load the input query form
   */
  Plugin.prototype.init = function () {
    var self = this;

    // first of all, check which auth system is available
    self.getAuthMode(function (err, needAuth, authMode) {
      if (needAuth == 'none') {
        self.setupGenericRequester(authMode);
        self.removeConnectBtn();
        // auth is ok, then load the user interface
        $.event.trigger(self.settings.connectedEventName, [ self ]);
      } else if (needAuth == 'redirect') {
        // auth with the redirect method
        self.authWithRedirect(function (err) {
          if (!err) {
            self.setupGenericRequester(authMode);
            self.removeConnectBtn();
            // auth is ok, then load the user interface
            $.event.trigger(self.settings.connectedEventName, [ self ]);
          }
        });
      } else if (needAuth == 'http') {
        // auth with the standard http method
        self.authWithHTTP(function (err, options) {
          if (!err) {
            self.setupGenericRequester(authMode, options);
            self.removeConnectBtn();
            // auth is ok, then load the user interface
            $.event.trigger(self.settings.connectedEventName, [ self ]);
          }
        });
      }
    });
  };

  /**
   * Return which auth method is used.
   * 2nd cb parameter value could be
   * - none: if authorized (then 3rd parameter is given)
   * - http: if http basic auth is requested
   * - redirect: if a redirected (ex: ezproxy) auth is requested
   * 3d cb parameter value could be
   * - ajax
   * - jsonp
   */
  Plugin.prototype.getAuthMode = function (cb) {
    var self = this;

   // try to auth on the API with AJAX
    $.ajax({
      url: self.settings.istexApi + '/corpus/',
      success: function () {
        // if success it means auth is ok
        return cb(null, 'none', 'ajax');
      },
      error: function (opt, err) {
        
        // 0 means cross domain security error caused by ezproxy
        // 302 means redirection caused by ezproxy
        if (opt.status === 0 || opt.status === 302) {
          // try to auth on the API with JSONP
          $.jsonp({
            url: self.settings.istexApi + '/corpus/',
            callbackParameter: "callback",
            success: function () {
              cb(null, 'none', 'jsonp');
            },
            error: function () {
              cb(null, 'redirect', 'jsonp');   
            }
          });
        } else {
          // other code are interpreted as 401
          return cb(null, 'http', 'ajax');
        }
      }
    });
  };

  /**
   * Open a new window to authenticate the user
   * through a cookie system (example: ezproxy)
   */
  Plugin.prototype.authWithRedirect = function (cb) {
    var self = this;

    // prepare a connect button and open a the
    // cookie auth window if clicked
    self.insertConnectBtnIfNotExists(function () {
      // open the window on the corpus route to request authentication
      window.open(self.settings.istexApi + '/ezproxy-auth-and-close.html');

      // check again auth when the user come back on the origin page
      $(window).focus(function () {
        self.getAuthMode(function (err, needAuth, authMode) {
          if (needAuth == 'none') {
            cb(null);
          } else {
            cb(new Error("Unable to authenticate"));
          }
        });
      });

    });
  };

  /**
   * Insert a connect button in the page if it not exists yet
   * - cb is called when the button is clicked
   */
  Plugin.prototype.insertConnectBtnIfNotExists = function (cb) {
    var self = this;
    if ($(self.elt).find('.istex-ezproxy-auth-btn').length > 0) {
      return;
    }
    $(self.elt).append(
      '<button class="istex-ezproxy-auth-btn">Se connecter<div></div></button>'
    );
    $(self.elt).find('.istex-ezproxy-auth-btn').click(cb);
  };

  /**
   * Cleanup the connect button
   */
  Plugin.prototype.removeConnectBtn = function (cb) {
    var self = this;
    $(self.elt).find('.istex-ezproxy-auth-btn').remove();
  };

  /**
   * Authenticate with the standard HTTP basic auth
   * - shows a HTML popup to ask login and password
   * - when submitted, try to login through AJAX
   * - if auth ok, then close the popup and return credentials to cb
   * - if auth ok, then show an error message
   */
  Plugin.prototype.authWithHTTP = function (cb) {
    var self = this;

    // first of all insert the connect button and when
    // it is clicked, then show the login/password popup
    self.insertConnectBtnIfNotExists(function () {
      if ($(self.elt).find('.istex-auth-popup').length > 0) {
        return;
      }

      // append a simple login/password popup
      $(self.elt).append(
      /*jshint ignore:start*/
      '<form class="istex-auth-popup">' +
        '<div class="istex-auth-popup-wrapper">' +
          '<input class="istex-auth-popup-login" type="text" value="" placeholder="Votre login ..." />' +
          '<input class="istex-auth-popup-password" type="password" value="" placeholder="Votre mot de passe ..." />' +
          '<input class="istex-auth-popup-cancel" type="submit" value="Annuler" />' +
          '<input class="istex-auth-popup-submit" type="submit" value="Se connecter" />' +
        '</div>' +
        '<p class="istex-auth-popup-error"></p>' +
      '</form>'
      /*jshint ignore:end*/
      );

      $(self.elt).find('.istex-auth-popup').submit(function () {
        var clicked = $(self.elt).find(".istex-auth-popup input[type=submit]:focus")
                                 .attr('class');
        if (clicked == 'istex-auth-popup-submit') {
          // if "Se connecter" is clicked, then try to auth through AJAX
          // with the given login/password
          var httpOptions = {
            username: $(self.elt).find('istex-auth-popup-login').val(),
            password: $(self.elt).find('istex-auth-popup-password').val(),
          };
          $.ajax({
            url: self.settings.istexApi + '/corpus/',
            username: httpOptions.username,
            password: httpOptions.password,
            success: function () {
              // auth ok, then cleanup and respond ok
              $(self.elt).find('.istex-auth-popup').remove();
              return cb(null, httpOptions);
            },
            error: function (opt, err) {
              $(self.elt).find('.istex-auth-popup-error')
                         .text("Le nom d'utilisateur ou le mot de passe saisi est incorrect.");
            }
          });
        } else if (clicked == 'istex-auth-popup-cancel') {
          // if "Annuler" button is clicked, then cleanup
          $(self.elt).find('.istex-auth-popup').remove();
          cb(new Error('HTTP auth canceled'));
        }
        return false;
      });
    
    });

  };


  /**
   * Create a self.istexApiRequester function
   * used to wrap jsonp or ajax query system
   */
  Plugin.prototype.setupGenericRequester = function (authMode, options) {
    var self = this;

    // create a generic requester
    // based on jsonp or ajax
    if (authMode  == 'jsonp') {
      // jsonp
      self.istexApiRequester = function (options) {
        var reqOpt = $.extend({
          callbackParameter: "callback"
        }, options);
        return $.jsonp(reqOpt);
      };
    } else {
      // ajax
      self.istexApiRequester = function (options) {
        var reqOpt = $.extend({
          headers: {
            // todo : basic auth <= options
          }
        }, options);
        return $.ajax(reqOpt);
      };
    }
  };

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[ pluginName ] = function (options) {
    this.each(function () {
      if (!$.data(this, "plugin_" + pluginName)) {
        $.data(this, "plugin_" + pluginName, new Plugin(this, options));
      }
    });
    return this;
  };

})(jQuery, window, document);
/* jshint -W117 */
'use strict';

/**
 * Widget istexSearch
 */
;(function ($, window, document, undefined) {

  var pluginName  = "istexSearch";
  var defaults    = istexConfigDefault;

  // The actual plugin constructor
  function Plugin(element, options) {
    this.elt = element;
    this.settings = $.extend({}, defaults, istexConfig, options);
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  /**
   * Try to authenticate with a cookie if needed
   * then load the input query form
   */
  Plugin.prototype.init = function () {
    var self = this;

    // listen connected event (auth widget tells auth is ok)
    $(document).bind(self.settings.connectedEventName, function (event, istexAuth) {
      // get and map the api requester
      self.istexApiRequester = istexAuth.istexApiRequester;

      // auth is ok, then load the user interface
      self.loadInputForm();
    });
  };

  /**
   * Load the input query form
   */
  Plugin.prototype.loadInputForm = function () {
    var self = this;

    /*jshint ignore:start*/
    // insert the form search into the DOM
    $(self.elt).empty();
    $(self.elt).append(
      '<form class="istex-search-form">' +
        '<div class="istex-search-bar-wrapper">' +
          '<input class="istex-search-submit" type="submit" value="Rechercher" />' +
          '<span>' +
            '<input class="istex-search-input" type="text" value="" placeholder="Votre requête ici ..." />' +
          '</span>' +
        '</div>' +
        '<p class="istex-search-error"></p>' +
      '</form>'
    );
    /*jshint ignore:end*/

    // initialize query parameter
    $(self.elt).find('.istex-search-input').val(self.settings.query);

    // connect the submit action
    $(self.elt).find('.istex-search-form').submit(function () {

      var query = $(self.elt).find('input.istex-search-input').val().trim();
      query = query ? query : '*';

      // send the request to the istex api
      self.istexApiRequester({
        url: self.settings.istexApi + '/document/',
        data: { q: query, output: '*' },
        //callbackParameter: "callback",
        success: function(items) {
          // hide the error box
          $(self.elt).find('.istex-search-error').hide();
          // forward the results as a global event
          $.event.trigger(self.settings.resultsEventName, [ items, self ]);
        },
        error: function (opt, err) {
          $(self.elt).find('.istex-search-error').html(
            '<a href="https://api.istex.fr/corpus/">API Istex</a> non joignable.'
          );
          $(self.elt).find('.istex-search-error').show();
        }
      });

      return false;
    }); // end of ('.istex-search-form').submit(

    // adjust styles comming for example from ENT
    // to avoid a small search button:
    // https://trello-attachments.s3.amazonaws.com/547753d55c854b80778562d6/725x667/51dcbf7933acc93c8cb85a642c321a4d/upload_2015-01-12_at_6.10.52_pm.png
    $(self.elt).find('.istex-search-submit').css(
      'font-size',
      $(self.elt).find('.istex-search-input').css('font-size')
    );
    $(self.elt).find('.istex-search-submit').css(
      'padding',
      $(self.elt).find('.istex-search-input').css('padding')
    );

    // execute a search if query parameter is not blank
    if (self.settings.query) {
      $(self.elt).find('.istex-search-form').trigger('submit');
    }

  };

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[ pluginName ] = function (options) {
    this.each(function () {
      if (!$.data(this, "plugin_" + pluginName)) {
        $.data(this, "plugin_" + pluginName, new Plugin(this, options));
      }
    });
    return this;
  };

})(jQuery, window, document);
/* jshint -W117 */
'use strict';

/**
 * Widget ISTEX
 */
;(function ($, window, document, undefined) {

  var pluginName = "istexResults";
  var defaults = istexConfigDefault;

  // The actual plugin constructor
  function Plugin(element, options) {
    this.elt = element;
    this.settings = $.extend({}, defaults, istexConfig, options);
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  Plugin.prototype.init = function () {
    var self = this;

    self.tpl = {};
    self.tpl.stats = $(
      '<div class="istex-results-items-stats">' +
        'Environ 783 594 résultats' + 
      '</div>'
    );

    self.tpl.items = $('<ol class="istex-results-items"></ol>');

    /*jshint ignore:start*/
    self.tpl.item = $(
      '<li class="istex-results-item">' +
        '<a class="istex-results-item-title" target="_blank">Biomechanical Simulation of Electrode Migration for Deep Brain Stimulation</a>' +
        '<p class="istex-results-item-abstract">Developing a whole brain simulator, a computer simulation in modeling brain structure and functionality of human, is the ultimate goal of Brain Informatics. Brain simulator helps researchers cross the bridge between the cognitive behavior/decease, and the neurophysiology. Brain simulators development is still in infant stage. Current simulators mostly consider the neuron as the basic functional component. This paper starts with introducing the background and current status of brain simulator. Then, an extensible brain simulator development framework is proposed. From information technology perspective, we adopt overlay and peer-to-peer network to deal with the complexity of brain network. Moreover, layered design with object-oriented brain class hierarchy forms the flexible development framework of the proposed simulator. The proposed brain simulator is evolved in case-based incremental delivery style. The power of the simulator will grow along with more research cases from cognitive and clinical neuroscience.</p>' +
        '<div class="istex-results-item-corpus">springer</div>' +
        '<ul class="istex-results-item-download">' +
          '<li class="istex-results-item-dl">' +
            '<a href="#" class="istex-results-item-dl-pdf" title="Télécharger le PDF"></a>' +
          '</li>' +
          '<li class="istex-results-item-dl">' +
            '<a href="#" class="istex-results-item-dl-mods" title="Télécharger les métadonnées MODS"></a>' +
          '</li>' +
        '</ul>' +
        '<div class="istex-results-item-bottom"></div>' +
      '</li>'
    );
    
    self.tpl.dlItem = {};
    self.tpl.dlItem['default'] = $(
      '<li class="istex-results-item-dl">' +
        '<a href="#" title="Télécharger le fichier (format inconnu)" target="_blank"></a>' +
      '</li>'
    );
    self.tpl.dlItem['mods'] = $(
      '<li class="istex-results-item-dl">' +
        '<a href="#" class="istex-results-item-dl-mods" title="Télécharger les métadonnées MODS" target="_blank"></a>' +
      '</li>'
    );
    self.tpl.dlItem['xml'] = $(
      '<li class="istex-results-item-dl">' +
        '<a href="#" class="istex-results-item-dl-xml" title="Télécharger les métadonnées éditeur (XML)" target="_blank"></a>' +
      '</li>'
    );
    self.tpl.dlItem['zip'] = $(
      '<li class="istex-results-item-dl">' +
        '<a href="#" class="istex-results-item-dl-zip" title="Télécharger le tout au format ZIP" target="_blank"></a>' +
      '</li>'
    );
    self.tpl.dlItem['tiff'] = $(
      '<li class="istex-results-item-dl">' +
        '<a href="#" class="istex-results-item-dl-tiff" title="Télécharger le ou les fichiers TIFF" target="_blank"></a>' +
      '</li>'
    );
    self.tpl.dlItem['tei'] = $(
      '<li class="istex-results-item-dl">' +
        '<a href="#" class="istex-results-item-dl-tei" title="Télécharger le plein-texte TEI" target="_blank"></a>' +
      '</li>'
    );
    self.tpl.dlItem['txt'] = $(
      '<li class="istex-results-item-dl">' +
        '<a href="#" class="istex-results-item-dl-txt" title="Télécharger le plein-texte TXT" target="_blank"></a>' +
      '</li>'
    );
    self.tpl.dlItem['pdf'] = $(
      '<li class="istex-results-item-dl">' +
        '<a href="#" class="istex-results-item-dl-pdf" title="Télécharger le plein-texte PDF" target="_blank"></a>' +
      '</li>'
    );
    /*jshint ignore:end*/

    // bind received results
    $(document).bind(self.settings.resultsEventName, function (event, results) {
      self.updateResultsInTheDom(results);
    });

  };

  /**
   * Update the DOM with the received results
   */
  Plugin.prototype.updateResultsInTheDom = function (results) {
    var self = this;

    // build the result stats element
    var stats = self.tpl.stats.clone();
    stats.text('Environ ' + niceNumber(results.total) + ' résultats');
    
    // build the result list
    var items = self.tpl.items.clone();
    $.each(results.hits, function (idx, item) {
      var itemElt = self.tpl.item.clone();

      void 0;
      itemElt.find('.istex-results-item-title').text(item.title);
      if (item.abstract) {
        itemElt.find('.istex-results-item-abstract').text(item.abstract);  
      } else {
        itemElt.find('.istex-results-item-abstract').text('…');
        itemElt.find('.istex-results-item-abstract').attr('title', 'Pas de résumé');
      }
      itemElt.find('.istex-results-item-corpus').text(item.corpusName);

      itemElt.find('.istex-results-item-download').empty();
      // fulltext links
      $.each(item.fulltext, function (idx, ftItem) {
        var dlItem;
        if (self.tpl.dlItem[ftItem.type]) {
          dlItem = self.tpl.dlItem[ftItem.type].clone();
        } else {
          dlItem = self.tpl.dlItem['default'].clone();
        }
        dlItem.find('a').attr('href', self.fixIstexAPILink(ftItem.uri));
        // sepcial case for PDF (link to the title element)
        if (ftItem.type == self.settings.fullTextOnTitle) {
          itemElt.find('.istex-results-item-title').attr('href', self.fixIstexAPILink(ftItem.uri));
        }
        itemElt.find('.istex-results-item-download').append(dlItem);
      });
      // metadata links
      $.each(item.metadata, function (idx, ftItem) {
        var dlItem;
        if (self.tpl.dlItem[ftItem.type]) {
          dlItem = self.tpl.dlItem[ftItem.type].clone();
        } else {
          dlItem = self.tpl.dlItem['default'].clone();
        }
        dlItem.find('a').attr('href', self.fixIstexAPILink(ftItem.uri));
        itemElt.find('.istex-results-item-download').append(dlItem);
      });

      // truncate abstract text
      var abs = itemElt.find('.istex-results-item-abstract').text();
      if (abs.length > self.settings.abstractLength) {
        abs = abs.substring(0, self.settings.abstractLength);
        abs += "…";
        itemElt.find('.istex-results-item-abstract').text(abs);
      }

      // truncate title text
      var title = itemElt.find('.istex-results-item-title').text();
      if (title.length > self.settings.titleLength) {
        title = title.substring(0, self.settings.titleLength);
        title += "…";
        itemElt.find('.istex-results-item-title')
               .attr('title',itemElt.find('.istex-results-item-title').text());
        itemElt.find('.istex-results-item-title').text(title);
      }

      items.append(itemElt);
    });

    // cleanup the result list in the DOM
    $(self.elt).empty();

    // insert the results stats into the DOM
    $(self.elt).append(stats);

    // insert the result list into the DOM
    $(self.elt).append(items);
  };


  /**
   * When ezproxy is used, the api link is not api.istex.fr
   * but could be something like https://api-istex-fr.bases-doc.univ-lorraine.fr
   * This function helps to fixe the absolute links returned by the API.
   */
  Plugin.prototype.fixIstexAPILink = function (link) {
    var self = this;
    return link.replace('https://api.istex.fr', self.settings.istexApi);
  };

  /**
   * Helper to convert 2435667 to "2 435 667"
   */
  function niceNumber(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ' ' + '$2');
    }
    return x1 + x2;
  }

  // A really lightweight plugin wrapper around the constructor,
  // preventing against multiple instantiations
  $.fn[ pluginName ] = function (options) {
    this.each(function() {
      if (!$.data(this, "plugin_" + pluginName)) {
        $.data(this, "plugin_" + pluginName, new Plugin(this, options));
      }
    });
    return this;
  };

})(jQuery, window, document);