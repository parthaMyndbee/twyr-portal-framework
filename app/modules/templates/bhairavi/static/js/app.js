define(
	"twyrPortal/application",
	["exports"],
	function(exports) {
		if(window.developmentMode) console.log('DEFINE: twyrPortal/application');
		var twyrApplication = window.Ember.Application.extend({
			'modulePrefix': 'twyrPortal',
		});

		if(window.developmentMode) console.log('DEFINE: twyrPortal/application/create');
		var App = twyrApplication.create({
			LOG_RESOLVER: window.developmentMode,
			LOG_ACTIVE_GENERATION: window.developmentMode,
			LOG_TRANSITIONS: window.developmentMode,
			LOG_TRANSITIONS_INTERNAL: window.developmentMode,
			LOG_VIEW_LOOKUPS: window.developmentMode
		});

		if(window.developmentMode) console.log('DEFINE: twyrPortal/application/router');
		App.Router.reopen({
			'location': 'history'
		});

		if(window.developmentMode) console.log('DEFINE: twyrPortal/application/adapter');
		App.ApplicationAdapter = window.DS.RESTAdapter.extend({
			'namespace': '',
			'host': window.apiServer.substring(0, window.apiServer.length - 1),

			'ajaxError': function(jqXHR) {
				if (jqXHR && jqXHR.status == 422) {
					var jsonErrors = window.Ember.$.parseJSON(jqXHR.responseText)["errors"];
					return new window.DS.InvalidError(jsonErrors);
				}
				else {
					var error = this._super(jqXHR);
					return error;
				}
			}
		});

		if(window.developmentMode) console.log('EXPORT: twyrPortal/application');
		exports['default'] = App;
	}
);

// Start off the Application...
if(window.developmentMode) console.log('Starting the twyrPortal Ember App');
window.twyrPortal = require('twyrPortal/application')['default'];
