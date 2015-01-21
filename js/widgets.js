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

/*
 * $Id: base64.js,v 2.15 2014/04/05 12:58:57 dankogai Exp dankogai $
 *
 *  Licensed under the MIT license.
 *    http://opensource.org/licenses/mit-license
 *
 *  References:
 *    http://en.wikipedia.org/wiki/Base64
 */

(function(global) {
    'use strict';
    // existing version for noConflict()
    var _Base64 = global.Base64;
    var version = "2.1.6";
    // if node.js, we use Buffer
    var buffer;
    if (typeof module !== 'undefined' && module.exports) {
        buffer = require('buffer').Buffer;
    }
    // constants
    var b64chars
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var b64tab = function(bin) {
        var t = {};
        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
        return t;
    }(b64chars);
    var fromCharCode = String.fromCharCode;
    // encoder stuff
    var cb_utob = function(c) {
        if (c.length < 2) {
            var cc = c.charCodeAt(0);
            return cc < 0x80 ? c
                : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
                                + fromCharCode(0x80 | (cc & 0x3f)))
                : (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
                   + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                   + fromCharCode(0x80 | ( cc         & 0x3f)));
        } else {
            var cc = 0x10000
                + (c.charCodeAt(0) - 0xD800) * 0x400
                + (c.charCodeAt(1) - 0xDC00);
            return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
                    + fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
                    + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                    + fromCharCode(0x80 | ( cc         & 0x3f)));
        }
    };
    var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    var utob = function(u) {
        return u.replace(re_utob, cb_utob);
    };
    var cb_encode = function(ccc) {
        var padlen = [0, 2, 1][ccc.length % 3],
        ord = ccc.charCodeAt(0) << 16
            | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
            | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
        chars = [
            b64chars.charAt( ord >>> 18),
            b64chars.charAt((ord >>> 12) & 63),
            padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
            padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
        ];
        return chars.join('');
    };
    var btoa = global.btoa ? function(b) {
        return global.btoa(b);
    } : function(b) {
        return b.replace(/[\s\S]{1,3}/g, cb_encode);
    };
    var _encode = buffer
        ? function (u) { return (new buffer(u)).toString('base64') } 
    : function (u) { return btoa(utob(u)) }
    ;
    var encode = function(u, urisafe) {
        return !urisafe 
            ? _encode(String(u))
            : _encode(String(u)).replace(/[+\/]/g, function(m0) {
                return m0 == '+' ? '-' : '_';
            }).replace(/=/g, '');
    };
    var encodeURI = function(u) { return encode(u, true) };
    // decoder stuff
    var re_btou = new RegExp([
        '[\xC0-\xDF][\x80-\xBF]',
        '[\xE0-\xEF][\x80-\xBF]{2}',
        '[\xF0-\xF7][\x80-\xBF]{3}'
    ].join('|'), 'g');
    var cb_btou = function(cccc) {
        switch(cccc.length) {
        case 4:
            var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                |    ((0x3f & cccc.charCodeAt(1)) << 12)
                |    ((0x3f & cccc.charCodeAt(2)) <<  6)
                |     (0x3f & cccc.charCodeAt(3)),
            offset = cp - 0x10000;
            return (fromCharCode((offset  >>> 10) + 0xD800)
                    + fromCharCode((offset & 0x3FF) + 0xDC00));
        case 3:
            return fromCharCode(
                ((0x0f & cccc.charCodeAt(0)) << 12)
                    | ((0x3f & cccc.charCodeAt(1)) << 6)
                    |  (0x3f & cccc.charCodeAt(2))
            );
        default:
            return  fromCharCode(
                ((0x1f & cccc.charCodeAt(0)) << 6)
                    |  (0x3f & cccc.charCodeAt(1))
            );
        }
    };
    var btou = function(b) {
        return b.replace(re_btou, cb_btou);
    };
    var cb_decode = function(cccc) {
        var len = cccc.length,
        padlen = len % 4,
        n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
            | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
            | (len > 2 ? b64tab[cccc.charAt(2)] <<  6 : 0)
            | (len > 3 ? b64tab[cccc.charAt(3)]       : 0),
        chars = [
            fromCharCode( n >>> 16),
            fromCharCode((n >>>  8) & 0xff),
            fromCharCode( n         & 0xff)
        ];
        chars.length -= [0, 0, 2, 1][padlen];
        return chars.join('');
    };
    var atob = global.atob ? function(a) {
        return global.atob(a);
    } : function(a){
        return a.replace(/[\s\S]{1,4}/g, cb_decode);
    };
    var _decode = buffer
        ? function(a) { return (new buffer(a, 'base64')).toString() }
    : function(a) { return btou(atob(a)) };
    var decode = function(a){
        return _decode(
            String(a).replace(/[-_]/g, function(m0) { return m0 == '-' ? '+' : '/' })
                .replace(/[^A-Za-z0-9\+\/]/g, '')
        );
    };
    var noConflict = function() {
        var Base64 = global.Base64;
        global.Base64 = _Base64;
        return Base64;
    };
    // export Base64
    global.Base64 = {
        VERSION: version,
        atob: atob,
        btoa: btoa,
        fromBase64: decode,
        toBase64: encode,
        utob: utob,
        encode: encode,
        encodeURI: encodeURI,
        btou: btou,
        decode: decode,
        noConflict: noConflict
    };
    // if ES5 is available, make Base64.extendString() available
    if (typeof Object.defineProperty === 'function') {
        var noEnum = function(v){
            return {value:v,enumerable:false,writable:true,configurable:true};
        };
        global.Base64.extendString = function () {
            Object.defineProperty(
                String.prototype, 'fromBase64', noEnum(function () {
                    return decode(this)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64', noEnum(function (urisafe) {
                    return encode(this, urisafe)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64URI', noEnum(function () {
                    return encode(this, true)
                }));
        };
    }
    // that's it!
})(this);

if (this['Meteor']) {
    Base64 = global.Base64; // for normal export in Meteor.js
}

var istexConfigDefault = {
  // l'adresse de l'API de l'Istex
  // pour une ezproxyfication, réglez ici l'adresse ezproxyfiée
  // ex à l'UL: https://api-istex-fr.bases-doc.univ-lorraine.fr 
  istexApi: 'https://api.istex.fr',
  
  // pour lancer une recherche au chargement de la page
  // indiquer les mots à rechercher (argument de ?q= au niveau de l'api istex)
  query: "",

  // il est possible de cacher la zone de pagination avec ce paramètre
  showPagination: true,

  // nombre de résultats souhaités par page
  pageSize: 50,

  // nombre max de pages à montrer dans la zone de pagination
  maxPagesInPagination: 10,

  // le nombre max de caractères du résumé à afficher
  abstractLength: 250,

  // le nombre max de caractères du titre à afficher
  titleLength: 100,

  // le format qu'on souhaite voir s'ouvrir quand on clique sur le titre
  fullTextOnTitle: 'pdf',
  
  // le nom de l'évènement émit au moment de l'authentification réussie
  connectedEventName: "istex-connected",

  // le nom de l'évènement émit au moment d'une recherche    
  resultsEventName: "istex-results",

  // le nom de l'évènement émit au moment d'un changement de page
  gotoPageEventName: "istex-gotopage",

  // le nom de l'évènement émit a chaque fois qu'une recherche est envoyée
  // et qui donnera probablement (sauf erreur) lieux à un event "istex-results"
  waitingForResultsEventName: "istex-waiting-for-results"
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
    var authButtonHtml = $(
      '<button class="istex-ezproxy-auth-btn">Se connecter<div></div></button>'
    ).hide();
    $(self.elt).append(authButtonHtml);
    authButtonHtml.fadeIn();
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
   * - shows a HTML form to ask login and password
   * - when submitted, try to login through AJAX
   * - if auth ok, then close the form and return credentials to cb
   * - if auth ok, then show an error message
   */
  Plugin.prototype.authWithHTTP = function (cb) {
    var self = this;

    // first of all insert the connect button and when
    // it is clicked, then show the login/password form
    self.insertConnectBtnIfNotExists(function (clickEvent) {
      if ($(self.elt).find('.istex-auth-form').length > 0) {
        return;
      }

      // get a pointer to the connect button in order
      // to be able to hide or show it 
      var connectButton = $(clickEvent.target);

      // hide the connect button
      connectButton.hide();

      var authFormHtml = $(
        /*jshint ignore:start*/
        '<form class="istex-auth-form">' +
          '<div class="istex-auth-form-wrapper">' +
            '<input class="istex-auth-form-login" type="text" value="" placeholder="Votre login ..." />' +
            '<input class="istex-auth-form-password" type="password" value="" placeholder="Votre mot de passe ..." />' +
            '<input class="istex-auth-form-submit" type="submit" value="Se connecter" default="default"/>' +
            '<button class="istex-auth-form-cancel">Annuler</button>' +
          '</div>' +
          '<p class="istex-auth-form-info">' +
            '<a href="https://ia.inist.fr/people/newer" target="_blank">S\'inscrire</a> | ' +
            '<a href="https://ia.inist.fr/auth/retrieve" target="_blank">Retrouver son mot de passe</a> | ' +
            '<a href="mailto:istex@inist.fr?subject=Demande d\'un accès à la plateforme ISTEX">Demander une autorisation Istex</a>' +
          '</p>' +
          '<p class="istex-auth-form-error"></p>' +
        '</form>'
        /*jshint ignore:end*/
      ).hide();

      // then show a simple login/password form
      $(self.elt).append(authFormHtml);
      authFormHtml.fadeIn();

      // focus to the first field (username)
      $(self.elt).find('.istex-auth-form-login').focus();

      // handle the cancel click
      $(self.elt).find('.istex-auth-form-cancel').click(function () {
        // if "Annuler" button is clicked, then cleanup
        $(self.elt).find('.istex-auth-form').remove();
        connectButton.fadeIn();
        return false;
      });

      // handle the submit or "Se connecter" click
      $(self.elt).find('.istex-auth-form').submit(function () {

        // disable form during authentification check      
        authFormHtml.find('input').attr('disabled', 'disabled');
        // cleanup error message
        $(self.elt).find('.istex-auth-form-error').hide();

        // if "Se connecter" is clicked, then try to auth through AJAX
        // with the given login/password
        var httpOptions = {
          headers: {
            "Authorization": "Basic " + Base64.encode(
              $(self.elt).find('.istex-auth-form-login').val() + ":" +
              $(self.elt).find('.istex-auth-form-password').val())
          }
        };

        $.ajax({
          url: self.settings.istexApi + '/corpus/',
          headers: httpOptions.headers,
          success: function () {
            // auth ok, then cleanup and respond ok
            $(self.elt).find('.istex-auth-form').fadeOut({
              complete: function () {
                cb(null, httpOptions);
              }
            });
          },
          error: function (opt, err) {
            // enable form when authentification failed
            authFormHtml.find('input').removeAttr('disabled');

            $(self.elt).find('.istex-auth-form-error')
                       .text("Le nom d'utilisateur ou le mot de passe saisi est incorrect.")
                       .fadeIn();
          }
        });

        return false;
      });
    
    });

  };


  /**
   * Create a self.istexApiRequester function
   * used to wrap jsonp or ajax query system
   */
  Plugin.prototype.setupGenericRequester = function (authMode, authOptions) {
    var self = this;

    // create a generic requester
    // based on jsonp or ajax
    if (authMode  == 'jsonp') {
      // jsonp
      self.istexApiRequester = function (options) {
        var reqOpt = $.extend({
          callbackParameter: "callback"
        }, authOptions, options);
        return $.jsonp(reqOpt);
      };
    } else {
      // ajax
      self.istexApiRequester = function (options) {
        var reqOpt = $.extend(authOptions, options);
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

    // listen istex-gotopage event
    $(document).bind(self.settings.gotoPageEventName, function (event, pageIdx) {
      self.execQuery(null, pageIdx);
    });

  };

  /**
   * Load the input query form
   */
  Plugin.prototype.loadInputForm = function () {
    var self = this;

    // insert the form search into the DOM
    $(self.elt).empty();
    var searchFormHtml = $(
      /*jshint ignore:start*/
      '<form class="istex-search-form">' +
        '<div class="istex-search-bar-wrapper">' +
          '<input class="istex-search-submit" type="submit" value="Rechercher" />' +
          '<span>' +
            '<input class="istex-search-input" type="search" value="" placeholder="Votre requête ici ..." />' +
          '</span>' +
        '</div>' +
        '<p class="istex-search-error"></p>' +
        '<div class="istex-search-loading" title="Recherche en cours"></div>' +
      '</form>'
      /*jshint ignore:end*/
    ).hide();

    $(self.elt).append(searchFormHtml);
    searchFormHtml.fadeIn();

    // initialize query parameter
    $(self.elt).find('.istex-search-input').val(self.settings.query);

    // connect the submit action
    $(self.elt).find('.istex-search-form').submit(function () {      
      var query = $(self.elt).find('input.istex-search-input').val().trim();
      query = query ? query : '*';
      
      self.execQuery(query);
      
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

  /**
   * Execute a query
   */
  Plugin.prototype.execQuery = function (query, pageIdx) {
    var self = this;

    // if no page id selected the setup one
    pageIdx = pageIdx || 1;

    // if no query selected try to take the latest one
    if (query) {
      self.query = query;
    } else {
      query = self.query;
    }

    // set the timer to know when the query has been done (ex: to have the query time)
    self.queryStartTime = new Date();

    // send the event telling a new query is sent
    $.event.trigger(self.settings.waitingForResultsEventName, [ self ]);

    // show the loading bar and hide the errors
    $(self.elt).find('.istex-search-loading').show();
    $(self.elt).find('.istex-search-error').hide();

    // send the request to the istex api
    self.istexApiRequester({
      url: self.settings.istexApi + '/document/',
      data: {
        q: query,
        output: '*',
        size: self.settings.pageSize,
        from: ((pageIdx-1) * self.settings.pageSize)
      },
      success: function(items) {
        // hide the error box and the loading box
        $(self.elt).find('.istex-search-error').hide();
        $(self.elt).find('.istex-search-loading').fadeOut();
        // forward the results as a global event
        $.event.trigger(self.settings.resultsEventName, [ items, self ]);
      },
      error: function (opt, err) {
        $(self.elt).find('.istex-search-error').html(
          '<a href="https://api.istex.fr/corpus/">API Istex</a> non joignable.'
        );
        $(self.elt).find('.istex-search-error').fadeIn();
        $(self.elt).find('.istex-search-loading').fadeOut();

        // forward the empty results as a global event
        $.event.trigger(self.settings.resultsEventName, [ null, self ]);
      }
    });
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

    self.tpl.pagination = $(
      '<div class="istex-results-pagination">' +
        '<button class="istex-results-pagination-prec" title="Page précédente">Page précédente</button>' +
        '<ul class="istex-results-pagination-plist">' +
          '<li class="istex-results-pagination-page-selected">1</li>' +
          '<li>2</li>' +
          '<li>3</li>' +
          '<li>4</li>' +
          '<li>5</li>' +
          '<li>6</li>' +
          '<li>7</li>' +
          '<li>8</li>' +
          '<li>9</li>' +
          '<li>10</li>' +
        '</ul>' +
        '<button class="istex-results-pagination-next" title="Page suivante">Page suivante</button>' +
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
    $(document).bind(self.settings.resultsEventName, function (event, results, istexSearch) {
      try {
        self.updateResultsInTheDom(results, istexSearch);
      } catch (err) {
        self.displayErrorInDom(
          'Erreur car le format de l\'API Istex a probablement changé. <br/>' + 
          'Merci de le signaler par mail à istex@inist.fr (copie d\'écran appréciée)',
          err
        );
      }
    });

    // bind waiting for result event
    $(document).bind(self.settings.waitingForResultsEventName, function (event) {
      // fade effect on the old result page
      // to tell the user a query is in process
      $(self.elt).css({ opacity: 0.5 });
    });
  };

  /**
   * Update the DOM with the received results
   */
  Plugin.prototype.updateResultsInTheDom = function (results, istexSearch) {
    var self = this;

    // not not fill anything in the results list
    // if results are empty
    if (!results) {
      $(self.elt).empty();
      return;
    }

    // calculate the query time
    var queryElapsedTime = new Date() - istexSearch.queryStartTime;

    // build the results statistics element
    var stats = self.tpl.stats.clone();
    if (results.total > 0) {
      var queryTotalTime = (queryElapsedTime/1000).toFixed(2);
      var queryElasticSearchTime = 'Réseau : ' 
        + ((queryElapsedTime -
            results.stats.elasticsearch.took -
            results.stats['istex-data'].took -
            results.stats['istex-rp'].took)/1000).toFixed(2) + ' sec'
        + ', Moteur de recherche : ' + (results.stats.elasticsearch.took/1000).toFixed(2) + ' sec'
        + ', Traitements de l\'API : '
        + ((results.stats['istex-data'].took + results.stats['istex-rp'].took)/1000).toFixed(2) + ' sec';
      var querySpeedHtml = '<span title="' + queryElasticSearchTime + '">(' + queryTotalTime + ' secondes)</span>';
      if (self.selectedPage > 1) {
        stats.html('Page ' + self.selectedPage + ' sur environ '
          + niceNumber(results.total)
          + ' résultats ' + querySpeedHtml);
      } else {
        stats.html('Environ '
          + niceNumber(results.total)
          + ' résultats ' + querySpeedHtml);
      }
    } else {
      stats.text('Aucun résultat');      
    }
    
    // build the result list
    var items = self.tpl.items.clone().hide();
    $.each(results.hits, function (idx, item) {
      var itemElt = self.tpl.item.clone();

      itemElt.find('.istex-results-item-title').text(item.title);
      if (item.abstract) {
        itemElt.find('.istex-results-item-abstract').text(item.abstract);  
      } else {
        itemElt.find('.istex-results-item-abstract').text('');
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
    $(self.elt).css({ opacity: 1.0 });

    // insert the results stats into the DOM
    $(self.elt).append(stats);

    // insert the result list into the DOM
    $(self.elt).append(items);
    items.fadeIn();

    // handle the pagination element
    if (results.total > 0) {
      self.updatePaginationInTheDom(
        self.selectedPage || 1,
        Math.ceil(results.total / self.settings.pageSize)
      );
    }
  };

  /**
   * Update the pagination element in the DOM
   */
  Plugin.prototype.updatePaginationInTheDom = function (selectedPage, numberOfPage) {
    var self = this;

    // skip the pagination zone if not wanted
    if (!self.settings.showPagination) {
      return;
    }

    // calculate the pageStart and pageEnd
    var pageStart, pageEnd;
    var maxPagesInPagination = self.settings.maxPagesInPagination;

    // try to put the selectedPage in the middle
    pageStart = selectedPage - Math.round(maxPagesInPagination/2) + 1;
    pageEnd   = selectedPage + Math.round(maxPagesInPagination/2);
    // manage the border case
    if (pageStart < 1) {
      pageStart = 1;
    }
    if (pageEnd > numberOfPage) {
      pageEnd = numberOfPage;
    }
    // if less page to show than maxPagesInPagination
    if (pageEnd - pageStart < maxPagesInPagination - 1) {
      if (pageEnd - selectedPage < selectedPage - pageStart) {
        pageStart = pageEnd - maxPagesInPagination + 1;
      } else {
        pageEnd = pageStart + maxPagesInPagination - 1;
      }
    }

    // build the pagination HTML
    var pagination = self.tpl.pagination.clone().hide();
   
    // do not show "précédent" link if the first page is selected
    if (selectedPage == 1) {
      pagination.find('.istex-results-pagination-prec').hide();
    } else {
      // when the prec page is clicked, goto selectedPage - 1
      pagination.find('.istex-results-pagination-prec').click(function () {
        self.gotoPage(selectedPage - 1);
      });
    }
    // do not show "suivant" link if the last page is selected
    if (selectedPage == numberOfPage) {
      pagination.find('.istex-results-pagination-next').hide();
    } else {
      // when the next page is clicked, goto selectedPage + 1
      pagination.find('.istex-results-pagination-next').click(function () {
        self.gotoPage(selectedPage + 1);
      });
    }

    // fill the pagination zone with pages
    pagination.find('ul.istex-results-pagination-plist').empty();
    for (var pageIdx = pageStart; pageIdx <= pageEnd; pageIdx++) {
      var pageElt = $('<li><a>' + pageIdx + '</a></li>').data('page-idx', pageIdx);
      if (pageIdx == selectedPage) {
        pageElt.addClass('istex-results-pagination-page-selected');
      } else {
        // when the page is clicked, goto pageIdx
        pageElt.click(function () {
          self.gotoPage($(this).data('page-idx'));
        });
      }
      //console.log(pageElt, pagination.find('.istex-results-pagination ul'))
      pagination.find('ul.istex-results-pagination-plist').append(pageElt);
    }

    // insert the pagination zone into the DOM
    $(self.elt).append(pagination);
    pagination.fadeIn();
  };

  /**
   * When a pagination link is clicked
   * goto the specified page
   */
  Plugin.prototype.gotoPage = function (pageIdx) {
    var self = this;
    
    // remember the selected page
    self.selectedPage = pageIdx;

    // send the event telling which page is requested
    $.event.trigger(self.settings.gotoPageEventName, [ pageIdx ]);
  };

  /**
   * Update the DOM with the received results
   */
  Plugin.prototype.displayErrorInDom = function (message, err) {
    var self = this;

    $(self.elt).css({ opacity: 1.0 });
    $(self.elt).fadeOut({
      complete: function () {
        $(self.elt).empty();
        $(self.elt).append(
          '<p class="istex-results-error">' +
            '<span class="istex-results-error-msg">' + message + '</span>' +
            '<br/>' +
            '<span class="istex-results-error-raw">' + err + '</span>' +
          '</p>'
        );
        $(self.elt).fadeIn();
      }
    });

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