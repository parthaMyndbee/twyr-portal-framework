/*
 * Name			: app/modules/components/component-base.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Base Class for Components - providing common functionality required for all components
 *
 */

"use strict";

var base = require('./../../module-base').baseModule,
	prime = require('prime'),
	promises = require('bluebird');

/**
 * Module dependencies, required for this module
 */
var _ = require('lodash'),
	path = require('path');

var twyrComponentBase = prime({
	'inherits': base,

	'constructor': function(module, loader) {
		// console.log('Constructor of the ' + this.name + ' Component');

		if(this.dependencies.indexOf('logger-service') < 0)
			this.dependencies.push('logger-service');

		if(this.dependencies.indexOf('database-service') < 0)
			this.dependencies.push('database-service');

		if(this.dependencies.indexOf('configuration-service') < 0)
			this.dependencies.push('configuration-service');

		this._getEmberRMCAsync = promises.promisify(this._getEmberRMC.bind(this));

		this._getConfiguredTemplatesAsync = promises.promisify(this._getConfiguredTemplates.bind(this));
		this._selectTemplatesAsync = promises.promisify(this._selectTemplates.bind(this));
		this._renderTemplateWidgetsAsync = promises.promisify(this._renderTemplateWidgets.bind(this));
		this._getTemplateWidgetsAsync = promises.promisify(this._getTemplateWidgets.bind(this));

		this._getEmberRoutesAsync = promises.promisify(this._getEmberRoutes.bind(this));
		this._getEmberRouteHandlersAsync = promises.promisify(this._getEmberRouteHandlers.bind(this));
		this._getEmberModelsAsync = promises.promisify(this._getEmberModels.bind(this));
		this._getEmberComponentsAsync = promises.promisify(this._getEmberComponents.bind(this));
		this._getEmberComponentHTMLsAsync = promises.promisify(this._getEmberComponentHTMLs.bind(this));

		this._checkPermissionAsync = promises.promisify(this._checkPermission.bind(this));
		base.call(this, module, loader);
	},

	'_getEmberRMC': function(user, mediaType, renderer, callback) {
		var self = this,
			loggerSrvc = self.dependencies['logger-service'];

		// Step 1: Which templates do we use?
		self._getConfiguredTemplatesAsync()
		.then(function(possibleTemplates) {
			return self._selectTemplatesAsync(user, mediaType, possibleTemplates);
		})
		// Step 2: For each selected Template, put ember components into the correct positions
		.then(function(selectedTemplates) {
			var promiseResolutions = [];

			selectedTemplates.forEach(function(selectedTemplate) {
				promiseResolutions.push(self._renderTemplateWidgetsAsync(user, selectedTemplate, renderer));
			});

			return promises.all(promiseResolutions);
		})
		// Step 3: Get the routeHandlers, models, components, etc.
		.then(function(renderedTemplates) {
			var promiseResolutions = [];

			promiseResolutions.push(self._getEmberRoutesAsync(user, renderer));
			promiseResolutions.push(self._getEmberRouteHandlersAsync(user, renderer));
			promiseResolutions.push(self._getEmberModelsAsync(user, renderer));
			promiseResolutions.push(self._getEmberComponentsAsync(user, renderer));
			promiseResolutions.push(self._getEmberComponentHTMLsAsync(user, renderer));
			promiseResolutions.push(renderedTemplates);

			return promises.all(promiseResolutions);
		})
		// Step 4: Get the Ember Assets for sub-components...
		.then(function(results) {
			var promiseResolutions = [],
				selfEmberAssets = {
					'route': results[0],
					'routeHandler': results[1],
					'model': results[2],
					'component': results[3],
					'componentHTML': results[4],
					'template': results[5]
				};

			promiseResolutions.push(selfEmberAssets);

			Object.keys(self.$components).forEach(function(componentName) {
				promiseResolutions.push((self.$components[componentName])._getEmberRMCAsync(user, mediaType, renderer));
			});

			return promises.all(promiseResolutions);
		})
		.then(function(results) {
			var selfEmberAssets = results.shift();

			selfEmberAssets.route = selfEmberAssets.route.concat(_.map(results, 'route'));
			selfEmberAssets.routeHandler = selfEmberAssets.routeHandler.concat(_.map(results, 'routeHandler')).join('\n').trim();
			selfEmberAssets.model = selfEmberAssets.model.concat(_.map(results, 'model')).join('\n').trim();
			selfEmberAssets.component = selfEmberAssets.component.concat(_.map(results, 'component')).join('\n').trim();
			selfEmberAssets.componentHTML = selfEmberAssets.componentHTML.concat(_.map(results, 'componentHTML')).join('\n').trim();
			selfEmberAssets.template = selfEmberAssets.template.concat(_.map(results, 'template')).join('\n').trim();

			if(callback) callback(null, selfEmberAssets);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberRMC:\nUser: ', user, '\nMediaType: ', mediaType, '\nError: ', err);
			if(callback) callback(err);
		});
	},

	'_getConfiguredTemplates': function(callback) {
		var self = this,
			configSrvc = (self.dependencies['configuration-service']),
			dbSrvc = (self.dependencies['database-service']).knex,
			loggerSrvc = self.dependencies['logger-service'];

		configSrvc.getModuleIdAsync(self)
		.then(function(id) {
			return dbSrvc.raw('SELECT id, module_id, name, media_type, user_type, configuration FROM module_templates WHERE module_id = ? AND is_default = true;', [id])
		})
		.then(function(moduleTemplates) {
			if(callback) callback(null, moduleTemplates.rows);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getConfiguredTemplates:\nError: ', err);
			if(err) callback(err);
		});
	},

	'_selectTemplates': function(user, mediaType, possibleTemplates, callback) {
		if(callback) callback(null, possibleTemplates);
	},

	'_renderTemplateWidgets': function(user, selectedTemplate, renderer, callback) {
		var self = this,
			loggerSrvc = self.dependencies['logger-service'];

		self._getTemplateWidgetsAsync(user, selectedTemplate)
		.then(function(tmplWithWidgets) {
			return (self.$templates[tmplWithWidgets.name]).renderAsync(renderer, tmplWithWidgets.configuration);
		})
		.then(function(renderedTemplate) {
			if(callback) callback(null, renderedTemplate);
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_renderTemplateWidgets:\nUser: ', user, '\nSelected Template: ', selectedTemplate, '\nError: ', err);
			if(callback) callback(err);
		});
	},

	'_getTemplateWidgets': function(user, template, callback) {
		var self = this,
			widgetsSQL = '',
			dbSrvc = (self.dependencies['database-service']).knex,
			loggerSrvc = self.dependencies['logger-service'];

		if(user) {
			widgetsSQL = 'SELECT Y.position, X.module_id, X.widget FROM (SELECT id AS widget_id, module_id, ember_component AS widget FROM module_widgets WHERE module_id IN (SELECT id FROM fn_get_module_descendants(?)) AND permission_id IN (SELECT permission_id FROM fn_get_user_permissions(?))) X INNER JOIN (SELECT A.template_id AS template_id, A.name AS position, B.module_widget_id AS widget_id, B.display_order AS display_order FROM template_positions A INNER JOIN widget_template_position B ON (B.template_position_id = A.id) WHERE A.template_id = ?) Y ON (Y.widget_id = X.widget_id) ORDER BY Y.position, Y.display_order;';
		}
		else {
			widgetsSQL = 'SELECT Y.position, X.module_id, X.widget FROM (SELECT id AS widget_id, module_id, ember_component AS widget FROM module_widgets WHERE module_id IN (SELECT id FROM fn_get_module_descendants(?)) AND permission_id IN (SELECT id FROM permissions WHERE module_id = ? AND name = \'public\')) X INNER JOIN (SELECT A.template_id AS template_id, A.name AS position, B.module_widget_id AS widget_id, B.display_order AS display_order FROM template_positions A INNER JOIN widget_template_position B ON (B.template_position_id = A.id) WHERE A.template_id = ?) Y ON (Y.widget_id = X.widget_id) ORDER BY Y.position, Y.display_order;';
		}

		dbSrvc.raw(widgetsSQL, [template.module_id, (user ? user.id : template.module_id), template.id])
		.then(function(widgets) {
			var positions = {};

			widgets.rows.forEach(function(widget) {
				if(!positions[widget.position])
					positions[widget.position] = [];

				(positions[widget.position]).push(widget.widget.trim());
			});

			if(!template.configuration) template.configuration = {};
			template.configuration.positions = positions;

			if(callback) callback(null, template);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getTemplateWidgets:\nUser: ', user, '\nTemplate: ', template, '\nError: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberRoutes': function(user, renderer, callback) {
		if(callback) callback(null, []);
	},

	'_getEmberRouteHandlers': function(user, renderer, callback) {
		if(callback) callback(null, []);
	},

	'_getEmberModels': function(user, renderer, callback) {
		if(callback) callback(null, []);
	},

	'_getEmberComponents': function(user, renderer, callback){
		if(callback) callback(null, []);
	},

	'_getEmberComponentHTMLs': function(user, renderer, callback){
		if(callback) callback(null, []);
	},

	'_checkPermission': function(user, permission, tenant, callback) {
		if(tenant && !callback) {
			callback = tenant;
			tenant = null;
		}

		if(!user) {
			if(callback) callback(null, false);
			return;
		}

		if(!permission) {
			if(callback) callback(null, false);
			return;
		}

		if(!user.tenants) {
			if(callback) callback(null, false);
			return;
		}

		var allowed = false;
		if(!tenant) {
			Object.keys(user.tenants).forEach(function(userTenant) {
				allowed = allowed || ((user.tenants[userTenant]['permissions']).indexOf(permission) >= 0);
			});

			if(callback) callback(null, allowed);
			return;
		}

		if(!user.tenants[tenant]) {
			if(callback) callback(null, false);
			return;
		}

		if((user.tenants[tenant]['permissions']).indexOf(permission)) {
			if(callback) callback(null, true);
			return;
		}

		if(user.tenants[tenant]['tenantParents']) {
			allowed = false;
			user.tenants[tenant]['tenantParents'].forEach(function(tenantParent) {
				if(!user.tenants[tenantParent]) return;
				allowed = allowed || ((user.tenants[tenantParent]['permissions']).indexOf(permission) >= 0);
			});

			if(callback) callback(null, allowed);
			return;
		}

		// Should NEVER execute - tenantParents should be set when the User logs in
		var database = this.dependencies['database-service'];
		database.knex.raw('SELECT id FROM fn_get_tenant_ancestors(?);', [tenant])
		.then(function(tenantParents) {
			allowed = false;
			tenantParents.rows.forEach(function(tenantParent) {
				if(!user.tenants[tenantParent.id]) return;
				allowed = allowed || ((user.tenants[tenantParent.id]['permissions']).indexOf(permission) >= 0);
			});

			if(callback) callback(null, allowed);
			return;
		})
		.catch(function(err) {
			self.$dependencies['logger-service'].error(self.name + '::_checkPermission Error: ' + JSON.stringify(err, null, '\t'));
			if(callback) callback(err);
		});
	},

	'name': 'twyr-component-base',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.baseComponent = twyrComponentBase;
