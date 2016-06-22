/*
 * Name			: app/server.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Module - the "Application Class" for the Portal
 *
 */

"use strict";

/**
 * Module dependencies, required for ALL Twy'r modules
 */
var base = require('./module-base').baseModule,
	prime = require('prime'),
	promises = require('bluebird');

/**
 * Module dependencies, required for this module
 */
var filesystem = promises.promisifyAll(require('fs')),
	path = require('path'),
	_ = require('lodash');

var app = prime({
	'inherits': base,

	'constructor': function (module, clusterId, workedId) {
		base.call(this, module);
		this['$uuid'] = clusterId + '-' + workedId;

		this._loadConfig();

		this._getConfiguredTemplatesAsync = promises.promisify(this._getConfiguredTemplates.bind(this));
		this._selectTemplateAsync = promises.promisify(this._selectTemplate.bind(this));
		this._getTemplateWidgetsAsync = promises.promisify(this._getTemplateWidgets.bind(this));
		this._getEmberRMCAsync = promises.promisify(this._getEmberRMC.bind(this));

		this._getEmberRoutesAsync = promises.promisify(this._getEmberRoutes.bind(this));
		this._getEmberRouteHandlersAsync = promises.promisify(this._getEmberRouteHandlers.bind(this));
		this._getEmberModelsAsync = promises.promisify(this._getEmberModels.bind(this));
		this._getEmberComponentsAsync = promises.promisify(this._getEmberComponents.bind(this));
		this._getEmberComponentHTMLsAsync = promises.promisify(this._getEmberComponentHTMLs.bind(this));
	},

	'start': function(dependencies, callback) {
		var self = this;
		app.parent.start.call(self, dependencies, function(err, status) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			self._setupRoutes();
			if(callback) callback(null, status);
		});
	},

	'_loadConfig': function() {
		var rootPath = path.dirname(require.main.filename),
			env = (process.env.NODE_ENV || 'development').toLowerCase();

		this['$config'] = require(path.join(rootPath, 'config', env, this.name)).config;
	},

	'_subModuleReconfigure': function(subModule) {
		if(subModule != 'express-service') return;
		this._setupRoutes();
	},

	'_subModuleStateChange': function(subModule, state) {
		if(subModule != 'express-service') return;
		if(!state) return;

		this._setupRoutes();
	},

	'_setupRoutes': function() {
		var self = this;

		var expressApp = (self.$services['express-service']).getInterface();

		Object.keys(self.$templates).forEach(function(tmplName) {
			var subRouter = (self.$templates[tmplName]).getRouter(),
				mountPath = '/';

			expressApp.use(path.join(mountPath, tmplName), subRouter);
		});

		expressApp.all('*', function(request, response, next) {
			var user = request.user,
				mediaType = (response.locals.is_phone ? 'mobile' : (response.locals.is_tablet ? 'tablet': (response.locals.is_desktop ? 'desktop' : 'other'))),
				renderAsync = promises.promisify(response.render.bind(response));

			self.getClientsideAssetsAsync(user, mediaType, renderAsync)
			.then(function(indexTemplate) {
				response.status(200).send(indexTemplate);
				return null;
			})
			.catch(function(err) {
				next(err);
			});
		});

		expressApp.use(function(error, request, response, next) {
			response.status(500).json({ 'error': error.message });
		});
	},

	'getClientsideAssets': function(user, mediaType, renderer, callback) {
		var self = this;

		// Step 1: Which template do we use?
		self._getConfiguredTemplatesAsync()
		.then(function(possibleTemplates) {
			return self._selectTemplateAsync(user, mediaType, possibleTemplates);
		})
		// Step 2: Get the component routes and widgets for this user
		.then(function(selectedTemplate) {
			return self._getTemplateWidgetsAsync(user, selectedTemplate);
		})
		// Step 3: Now get the routes, route handlers, models, etc. required for the Ember.js App from all components
		.then(function(selectedTemplate) {
			var promiseResolutions = [];
			promiseResolutions.push(selectedTemplate);

			promiseResolutions.push(self._getEmberRMCAsync(user, mediaType, renderer));
			Object.keys(self.$components).forEach(function(componentName) {
				promiseResolutions.push((self.$components[componentName])._getEmberRMCAsync(user, mediaType, renderer));
			});

			return promises.all(promiseResolutions);
		})
		// Step 4: Add the Ember.js stuff into the rendered template
		.then(function(emberStuff) {
			var selectedTemplate = emberStuff.shift();
			var returnedRoutes = [];

			_.map(emberStuff, 'route').forEach(function(componentRoutes, index) {
				returnedRoutes = returnedRoutes.concat(componentRoutes);
			});

			selectedTemplate.configuration.apiServer = self.$config.apiServer;
			selectedTemplate.configuration.twyrUserId = user.id || null;

			selectedTemplate.configuration.routes = 'var Router = require(\'twyr-portal/router\')[\'default\'];\nRouter.map(function() {\n' + self._generateEmberRouteMap(returnedRoutes) + '\n});';
			selectedTemplate.configuration.routeHandlers = _.map(emberStuff, 'routeHandler').join('\n').trim();
			selectedTemplate.configuration.models = _.map(emberStuff, 'model').join('\n').trim();
			selectedTemplate.configuration.components = _.map(emberStuff, 'component').join('\n').trim();
			selectedTemplate.configuration.componentHTMLs = _.map(emberStuff, 'componentHTML').join('\n').trim();
			selectedTemplate.configuration.templates = _.map(emberStuff, 'template').join('\n').trim();

			console.log('returnedRoutes: ' + JSON.stringify(returnedRoutes, null, '\t'));
			return selectedTemplate;
		})
		// Step 6: Render the template HTML with the widgets in their positions
		.then(function(selectedTemplate) {
			return (self.$templates[selectedTemplate.name]).renderAsync(renderer, selectedTemplate.configuration);
		})
		// Finally, send it out...
		.then(function(selectedTemplate) {
			if(callback) callback(null, selectedTemplate);
		})
		.catch(function(err) {
			console.log(self.name + '::getClientsideAssets::error: ', err);
			if(callback) callback(err);
		});
	},

	'_getConfiguredTemplates': function(callback) {
		var self = this,
			configSrvc = (self.$services['configuration-service']).getInterface(),
			dbSrvc = (self.$services['database-service']).getInterface().knex;

		configSrvc.getModuleIdAsync(self)
		.then(function(id) {
			return dbSrvc.raw('SELECT id, module, name, media_type, user_type, configuration FROM module_templates WHERE module = ? AND is_default = true;', [id])
		})
		.then(function(moduleTemplates) {
			if(!moduleTemplates.rows.length) {
				throw new Error('No client side assets for: ' + self.name);
				return null;
			}

			return moduleTemplates.rows;
		})
		.then(function(possibleTemplates) {
			if(callback) callback(null, possibleTemplates);
			return null;
		})
		.catch(function(err) {
			if(err) callback(err);
		});
	},

	'_selectTemplate': function(user, mediaType, possibleTemplates, callback) {
		var selectedTemplate = null;

		// Step 1: Check for exact match
		selectedTemplate = possibleTemplates.filter(function(modTmpl) {
			return ((modTmpl.media_type == mediaType) && (modTmpl.user_type == (user ? 'registered': 'public')));
		});

		if(selectedTemplate.length) {
			if(callback) callback(null, selectedTemplate[0]);
			return;
		}

		// Step 2: Check for user_type match
		selectedTemplate = possibleTemplates.filter(function(modTmpl) {
			return ((modTmpl.media_type == 'all') && (modTmpl.user_type == (user ? 'registered': 'public')));
		});

		if(selectedTemplate.length) {
			if(callback) callback(null, selectedTemplate[0]);
			return;
		}

		// Step 3: Check for media_type match
		selectedTemplate = possibleTemplates.filter(function(modTmpl) {
			return ((modTmpl.media_type == mediaType) && (modTmpl.user_type == 'all'));
		});

		if(selectedTemplate.length) {
			if(callback) callback(null, selectedTemplate[0]);
			return;
		}

		// Step 4: Check for generic match
		selectedTemplate = possibleTemplates.filter(function(modTmpl) {
			return ((modTmpl.media_type == 'all') && (modTmpl.user_type == 'all'));
		});

		if(selectedTemplate.length) {
			if(callback) callback(null, selectedTemplate[0]);
			return;
		}

		// Step 5: If we're still here.... throw an error
		if(callback) callback(new Error('No template match'));
	},

	'_getTemplateWidgets': function(user, template, callback) {
		var self = this,
			widgetsSQL = '',
			dbSrvc = (self.$services['database-service']).getInterface().knex;

		if(user) {
			widgetsSQL = 'SELECT Y.position, X.module, X.widget FROM (SELECT id AS widget_id, module, ember_component AS widget FROM module_widgets WHERE module IN (SELECT id FROM fn_get_module_descendants(?)) AND permission IN (SELECT permission FROM fn_get_user_permissions(?))) X INNER JOIN (SELECT A.template AS template, A.name AS position, B.module_widget AS widget, B.display_order AS display_order FROM module_template_positions A INNER JOIN module_widget_module_template_positions B ON (B.template_position = A.id) WHERE A.template = ?) Y ON (Y.widget = X.widget_id) ORDER BY Y.position, Y.display_order;';
		}
		else {
			widgetsSQL = 'SELECT Y.position, X.module, X.widget FROM (SELECT id AS widget_id, module, ember_component AS widget FROM module_widgets WHERE module IN (SELECT id FROM fn_get_module_descendants(?)) AND permission IN (SELECT id FROM module_permissions WHERE module = ? AND name = \'public\')) X INNER JOIN (SELECT A.template AS template, A.name AS position, B.module_widget AS widget, B.display_order AS display_order FROM module_template_positions A INNER JOIN module_widget_module_template_positions B ON (B.template_position = A.id) WHERE A.template = ?) Y ON (Y.widget = X.widget_id) ORDER BY Y.position, Y.display_order;';
		}

		dbSrvc.raw(widgetsSQL, [template.module, (user ? user.id : template.module), template.id])
		.then(function(widgets) {
			var positions = {};

			widgets.rows.forEach(function(widget) {
				if(!positions[widget.position])
					positions[widget.position] = [];

				(positions[widget.position]).push(widget.widget.trim());
			});

			template.configuration.positions = positions;
			if(callback) callback(null, template);
			return null;
		})
		.catch(function(err) {
			if(callback) callback(err);
		});
	},

	'_getEmberRMC': function(user, mediaType, renderer, callback) {
		var promiseResolutions = [],
			self = this;

		promiseResolutions.push(self._getEmberRoutesAsync(user, renderer));
		promiseResolutions.push(self._getEmberRouteHandlersAsync(user, renderer));
		promiseResolutions.push(self._getEmberModelsAsync(user, renderer));
		promiseResolutions.push(self._getEmberComponentsAsync(user, renderer));
		promiseResolutions.push(self._getEmberComponentHTMLsAsync(user, renderer));

		promises.all(promiseResolutions)
		.then(function(results) {
			var selfEmberAssets = {
					'route': results[0],
					'routeHandler': results[1],
					'model': results[2],
					'component': results[3],
					'componentHTML': results[4]
				};

			if(callback) callback(null, selfEmberAssets);
			return null;
		})
		.catch(function(err) {
			if(callback) callback(err);
		});
	},

	'_getEmberRoutes': function(user, renderer, callback) {
		if(callback) callback(null, []);
	},

	'_getEmberRouteHandlers': function(user, renderer, callback) {
		var self = this,
			emberStuff = self.$config['ember-stuff'].path;

		filesystem.readFileAsync(path.join(this.basePath, emberStuff, 'routeHandlers/baseRoute.js'), 'utf8')
		.then(function(baseRoute) {
			if(callback) callback(null, [baseRoute]);
			return null;
		})
		.catch(function(err) {
			console.error(self.name + '::_getEmberRouteHandlers:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberModels': function(user, renderer, callback) {
		var self = this,
			emberStuff = self.$config['ember-stuff'].path;

		filesystem.readFileAsync(path.join(this.basePath, emberStuff, 'models/baseModel.js'), 'utf8')
		.then(function(baseModel) {
			if(callback) callback(null, [baseModel]);
			return null;
		})
		.catch(function(err) {
			console.error(self.name + '::_getEmberModels:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberComponents': function(user, renderer, callback){
		if(callback) callback(null, []);
	},

	'_getEmberComponentHTMLs': function(user, renderer, callback){
		var self = this,
			emberStuff = self.$config['ember-stuff'].path;

		filesystem.readFileAsync(path.join(this.basePath, emberStuff, 'componentHTMLs/baseTemplates.ejs'), 'utf8')
		.then(function(baseTemplates) {
			if(callback) callback(null, [baseTemplates]);
			return null;
		})
		.catch(function(err) {
			console.error(self.name + '::_getEmberComponentHTMLs:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
			if(callback) callback(err);
		});
	},

	'_generateEmberRouteMap': function(routes) {
		var routeMap = '',
			self = this;

		routes.forEach(function(route) {
			if(!route)
				return;

			if((route == '') || (!route.name) || (!route.path) || (route.name.trim() == '') || (route.path.trim() == ''))
				return;

			if(!route.subRoutes) {
				routeMap += 'this.route(\'' + route.name + '\', { \'path\': \'' + route.path + '\' }' + ');\n';
				return;
			}

			if(!route.subRoutes.length) {
				routeMap += 'this.route(\'' + route.name + '\', { \'path\': \'' + route.path + '\' }' + ');\n';
				return;
			}

			routeMap += 'this.route(\'' + route.name + '\', { \'path\': \'' + route.path + '\' }'  + ', function() {\n' + self._generateEmberRouteMap(route.subRoutes) + '\n}' + ');\n';
		});

		return routeMap;
	},

	'name': 'twyr-portal',
	'basePath': __dirname,
	'dependencies': []
});

exports.twyrPortal = app;
