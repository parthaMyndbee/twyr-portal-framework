define(
	'twyr-portal/resolver',
	['exports', 'ember-resolver'],
	function (exports, _emberResolver) {
		exports['default'] = _emberResolver['default'];
	}
);

define(
	'twyr-portal/router',
	['exports', 'ember'],
	function (exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/application/router');
		var Router = _ember['default'].Router.extend({
			location: 'history'
		});

		exports['default'] = Router;
	}
);

define(
	'twyr-portal/initializers/container-debug-adapter',
	['exports', 'ember-resolver/container-debug-adapter'],
	function (exports, _emberResolverContainerDebugAdapter) {
		exports['default'] = {
			'name': 'container-debug-adapter',

			'initialize': function initialize() {
				var app = arguments[1] || arguments[0];
				app.register('container-debug-adapter:main', _emberResolverContainerDebugAdapter['default']);
				app.inject('container-debug-adapter:main', 'namespace', 'application:main');
			}
		};
	}
);

define(
	'twyr-portal/adapters/application',
	['exports', 'ember-data/adapters/json-api'],
	function (exports, _jsonAPIAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/adapters/application');
		var Adapter = _jsonAPIAdapter['default'].extend({
			'host': window.apiServer.substring(0, window.apiServer.length - 1)
		});

		exports['default'] = Adapter;
	}
);

define(
	'twyr-portal/serializers/application',
	['exports', 'ember', 'ember-data/serializers/json-api'],
	function (exports, _ember, _jsonAPISerializer) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/serializers/application');
		var Serializer = _jsonAPISerializer['default'].extend({
			'keyForAttribute': function(attr) {
				return _ember['default'].String.underscore(attr);
			}
		});

		exports['default'] = Serializer;
	}
);

define(
	'twyr-portal/application',
	['exports', 'ember', 'twyr-portal/resolver', 'ember-load-initializers', 'ember-data/adapters/json-api'],
	function(exports, _ember, _twyrPortalResolver, _emberLoadInitializers, _jsonAPIAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/application');
		var twyrApplication = _ember['default'].Application.extend({
			'modulePrefix': 'twyr-portal',
		    'Resolver': _twyrPortalResolver['default']
		});

		(0, _emberLoadInitializers['default'])(twyrApplication, 'twyr-portal');

		if(window.developmentMode) console.log('DEFINE: twyr-portal/application/create');
		var App = twyrApplication.create({
			'name': 'twyr-portal',
			'version': '0.7.1',
			'LOG_RESOLVER': window.developmentMode,
			'LOG_ACTIVE_GENERATION': window.developmentMode,
			'LOG_TRANSITIONS': window.developmentMode,
			'LOG_TRANSITIONS_INTERNAL': window.developmentMode,
			'LOG_VIEW_LOOKUPS': window.developmentMode
		});

		if(window.developmentMode) console.log('EXPORT: twyr-portal/application');
		exports['default'] = App;
	}
);

