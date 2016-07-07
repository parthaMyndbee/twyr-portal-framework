/*
 * Name			: app/modules/components/modules/component.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Modules Component - edit module configuration / templates
 *
 */

"use strict";

/**
 * Module dependencies, required for ALL Twy'r modules
 */
var base = require('./../component-base').baseComponent,
	prime = require('prime'),
	promises = require('bluebird');

/**
 * Module dependencies, required for this module
 */
var filesystem = promises.promisifyAll(require('fs-extra')),
	path = require('path');

var modulesComponent = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'start': function(dependencies, callback) {
		var self = this,
			configSrvc = dependencies['configuration-service'],
			dbSrvc = (dependencies['database-service']).knex,
			loggerSrvc = dependencies['logger-service'];

		modulesComponent.parent.start.call(self, dependencies, function(err, status) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			configSrvc.getModuleIdAsync(self)
			.then(function(id) {
				return dbSrvc.raw('SELECT id FROM module_permissions WHERE module = ? AND name = ?', [id, 'module-manager']);
			})
			.then(function(moduleManagerPermissionId) {
				self['$moduleManagerPermissionId'] = moduleManagerPermissionId.rows[0].id;

				if(callback) callback(null, status);
				return null;
			})
			.catch(function(startErr) {
				loggerSrvc.error(self.name + '::start Error: ', startErr);
				if(callback) callback(startErr);
			});
		});
	},

	'_selectTemplates': function(user, mediaType, possibleTemplates, callback) {
		var self = this;

		if(!user) {
			if(callback) callback(null, []);
			return;
		}

		self._checkPermissionAsync(user, self['$moduleManagerPermissionId'])
		.then(function(hasPermission) {
			if(hasPermission) {
				if(callback) callback(null, possibleTemplates);
				return null;
			}

			if(callback) callback(null, []);
			return null;
		})
		.catch(function(err) {
			self.dependencies['logger-service'].error(self.name + '::_selectTemplates Error: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberRoutes': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$moduleManagerPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				if(callback) callback(null, []);
				return null;
			}

			if(callback) callback(null, [{
				'name': 'modules-default',
				'path': '/modules',

				'parentRoute': null,
				'subRoutes': []
			}]);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_selectTemplates Error: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberRouteHandlers': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$moduleManagerPermissionId'])
		.then(function(hasPermission) {
			if(hasPermission) {
				return filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/routeHandlers/modules-default.ejs'), 'utf8');
			}

			return '';
		})
		.then(function(routeHandlers) {
			if(callback) callback(null, [routeHandlers]);
			return null;
		})
		.catch(function(err) {
			self.dependencies['logger-service'].error(self.name + '::_getEmberRouteHandlers Error: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberModels': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$moduleManagerPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				return '';
			}

			return filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/models/modules-default.js'), 'utf8');
		})
		.then(function(models) {
			if(callback) callback(null, [models]);
			return null;
		})
		.catch(function(err) {
			self.dependencies['logger-service'].error(self.name + '::_getEmberModels Error: ', err);
			if(callback) callback(err);
		});

		return null;
	},

	'_getEmberComponents': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$moduleManagerPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				return '';
			}

			return promises.all([
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/modules-default-widget.js'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/module-details-widget.js'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/module-details-template-editor-widget.js'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/module-tree-widget.js'), 'utf8')
			]);
		})
		.then(function(widgetHTMLs) {
			if(callback) callback(null, widgetHTMLs);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponents Error: ', err);
			if(callback) callback(err);
		});

		return null;
	},

	'_getEmberComponentHTMLs': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$moduleManagerPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				return '';
			}

			return promises.all([
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/modules-default-widget.ejs'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/module-details-widget.ejs'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/module-details-template-editor-widget.ejs'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/module-tree-widget.ejs'), 'utf8')
			]);
		})
		.then(function(widgetHTMLs) {
			if(callback) callback(null, widgetHTMLs);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponentHTMLs Error: ', err);
			if(callback) callback(err);
		});

		return null;
	},

	'name': 'modules',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.component = modulesComponent;
