/*
 * Name			: app/modules/components/tenants/components/subtenants/component.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Sub-Tenant Component - Sub-Tenant Listings
 *
 */

"use strict";

/**
 * Module dependencies, required for ALL Twy'r modules
 */
var base = require('./../../../component-base').baseComponent,
	prime = require('prime'),
	promises = require('bluebird');

/**
 * Module dependencies, required for this module
 */
var filesystem = promises.promisifyAll(require('fs-extra')),
	path = require('path');

var subtenantsComponent = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'start': function(dependencies, callback) {
		var self = this,
			configSrvc = dependencies['configuration-service'],
			dbSrvc = (dependencies['database-service']).knex,
			loggerSrvc = dependencies['logger-service'];

		subtenantsComponent.parent.start.call(self, dependencies, function(err, status) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			configSrvc.getModuleIdAsync(self.$module)
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
				return [];
			}

			return promises.all([
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/subtenant-editor-widget.js'), 'utf8')
			]);
		})
		.then(function(widgets) {
			if(callback) callback(null, widgets);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponents Error: ', err);
			if(callback) callback(err);
		});

		return null;
	},

	'_getEmberComponentHTMLs': function(user, mediaType, renderer, callback) {
		var configSrvc = this.dependencies['configuration-service'],
			loggerSrvc = this.dependencies['logger-service'],
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
				return [];
			}

			return promises.all([
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/subtenant-editor-widget.ejs'), 'utf8')
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

	'name': 'subtenant-editor-widget',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.component = subtenantsComponent;
