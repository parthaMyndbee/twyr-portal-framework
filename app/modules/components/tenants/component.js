/*
 * Name			: app/modules/components/tenants/component.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Tenant Component - Tenant and Sub-Tenant Administration
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

var tenantsComponent = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'start': function(dependencies, callback) {
		var self = this,
			configSrvc = dependencies['configuration-service'],
			dbSrvc = (dependencies['database-service']).knex,
			loggerSrvc = dependencies['logger-service'];

		tenantsComponent.parent.start.call(self, dependencies, function(err, status) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			configSrvc.getModuleIdAsync(self)
			.then(function(id) {
				return dbSrvc.raw('SELECT id FROM module_permissions WHERE module = ? AND name = ?', [id, 'tenant-administrator']);
			})
			.then(function(tenantAdministratorPermissionId) {
				self['$tenantAdministratorPermissionId'] = tenantAdministratorPermissionId.rows[0].id;
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

		self._checkPermissionAsync(user, self['$tenantAdministratorPermissionId'])
		.then(function(hasPermission) {
			if(hasPermission) {
				tenantsComponent.parent._selectTemplates.call(self, user, mediaType, possibleTemplates, callback);
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

	'_getEmberRoutes': function(user, mediaType, renderer, callback) {
		var self = this;

		if(mediaType != 'desktop') {
			if(callback) callback(null, []);
			return null;
		}

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$tenantAdministratorPermissionId'])
		.then(function(hasPermission) {
			var emberRoutes = [];
			if(hasPermission) {
				emberRoutes.push({
					'name': 'tenant-administrator',
					'path': '/organization',

					'parentRoute': null,
					'subRoutes': []
				});
			}

			if(callback) callback(null, emberRoutes);
			return null;
		})
		.catch(function(err) {
			self.dependencies['logger-service'].error(self.name + '::_getEmberRoutes Error: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberRouteHandlers': function(user, mediaType, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(mediaType != 'desktop') {
			if(callback) callback(null, []);
			return null;
		}

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$tenantAdministratorPermissionId'])
		.then(function(hasPermission) {
			var promiseResolutions = [];
			if(hasPermission) {
				promiseResolutions.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/routeHandlers/tenant-administrator.ejs'), 'utf8'));
			}

			return promises.all(promiseResolutions);
		})
		.then(function(routeHandlers) {
			if(callback) callback(null, routeHandlers);
			return null;
		})
		.catch(function(err) {
			self.dependencies['logger-service'].error(self.name + '::_getEmberRouteHandlers Error: ', err);
			if(callback) callback(err);
		});

		return;
	},

	'_getEmberModels': function(user, mediaType, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(mediaType != 'desktop') {
			if(callback) callback(null, []);
			return null;
		}

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$tenantAdministratorPermissionId'])
		.then(function(hasPermission) {
			var promiseResolutions = [];
			if(hasPermission) {
				promiseResolutions.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/models/tenant.js'), 'utf8'));
			}

			return promises.all(promiseResolutions);
		})
		.then(function(tenantModel) {
			if(callback) callback(null, tenantModel);
			return null;
		})
		.catch(function(err) {
			self.dependencies['logger-service'].error(self.name + '::_getEmberModels Error: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberComponents': function(user, mediaType, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(mediaType != 'desktop') {
			if(callback) callback(null, []);
			return null;
		}

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$tenantAdministratorPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				return '';
			}

			return promises.all([
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/tenant-manager-widget.js'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/tenant-tree-widget.js'), 'utf8')
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

	'_getEmberComponentHTMLs': function(user, mediaType, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(mediaType != 'desktop') {
			if(callback) callback(null, []);
			return null;
		}

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$tenantAdministratorPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				return '';
			}

			return promises.all([
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/tenant-manager-widget.ejs'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/tenant-tree-widget.ejs'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/tenant-editor-widget.ejs'), 'utf8')
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

	'name': 'tenants',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.component = tenantsComponent;
