/*
 * Name			: app/modules/components/menus/component.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Menus Component - manage menus
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
	path = require('path'),
	uuid = require('node-uuid');

var menusComponent = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'start': function(dependencies, callback) {
		var self = this,
			configSrvc = dependencies['configuration-service'],
			dbSrvc = (dependencies['database-service']).knex,
			loggerSrvc = dependencies['logger-service'];

		menusComponent.parent.start.call(self, dependencies, function(err, status) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			configSrvc.getModuleIdAsync(self)
			.then(function(id) {
				return dbSrvc.raw('SELECT id FROM module_permissions WHERE module = ? AND name = ?', [id, 'menu-author']);
			})
			.then(function(menuAuthorPermissionId) {
				self['$menuAuthorPermissionId'] = menuAuthorPermissionId.rows[0].id;
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

		self._checkPermissionAsync(user, self['$menuAuthorPermissionId'])
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
		var self = this,
			emberRoutes = [];

		if(user) {
			self._checkPermissionAsync(user, self['$menuAuthorPermissionId'])
			.then(function(hasPermission) {
				if(hasPermission) {
					emberRoutes.push({
						'name': 'menus-default',
						'path': '/menus',

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

			return;
		}

		if(callback) callback(null, emberRoutes);
	},

	'_getEmberRouteHandlers': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		if(user) {
			self._checkPermissionAsync(user, self['$menuAuthorPermissionId'])
			.then(function(hasPermission) {
				var promiseResolutions = [];
				if(hasPermission) {
					promiseResolutions.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/routeHandlers/menus-default.ejs'), 'utf8'));
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
		}
	},

	'_getEmberModels': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		if(user) {
			self._checkPermissionAsync(user, self['$menuAuthorPermissionId'])
			.then(function(hasPermission) {
				var promiseResolutions = [];
				if(hasPermission) {
					promiseResolutions.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/models/menus-default.js'), 'utf8'));
				}

				return promises.all(promiseResolutions);
			})
			.then(function(menuModels) {
				if(callback) callback(null, menuModels);
				return null;
			})
			.catch(function(err) {
				self.dependencies['logger-service'].error(self.name + '::_getEmberModels Error: ', err);
				if(callback) callback(err);
			});

			return;
		}
	},

	'_getEmberComponents': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$menuAuthorPermissionId'])
		.then(function(hasPermission) {
			if(hasPermission) {
				return promises.all([
					filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/menu-edit-widget.js'), 'utf8'),
					filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/menu-manager-widget.js'), 'utf8')
				]);
			}

			return [];
		})
		.then(function(widgets) {
			if(callback) callback(null, widgets);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponents Error: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberComponentHTMLs': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$menuAuthorPermissionId'])
		.then(function(hasPermission) {
			if(hasPermission) {
				return promises.all([
					filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/menu-edit-widget.ejs'), 'utf8'),
					filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/menu-item-edit-widget.ejs'), 'utf8'),
					filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/menu-manager-widget.ejs'), 'utf8')
				]);
			}

			return [];
		})
		.then(function(widgetHTMLs) {
			if(callback) callback(null, widgetHTMLs);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponentHTMLs Error: ', err);
			if(callback) callback(err);
		});
	},

	'name': 'menus',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.component = menusComponent;
