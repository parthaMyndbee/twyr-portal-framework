/*
 * Name			: app/modules/components/menus/components/footer/component.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Footer Menus Component - design / render footer menus
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
	path = require('path'),
	uuid = require('node-uuid');

var footerComponent = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'start': function(dependencies, callback) {
		var self = this,
			configSrvc = dependencies['configuration-service'],
			dbSrvc = (dependencies['database-service']).knex,
			loggerSrvc = dependencies['logger-service'];

		footerComponent.parent.start.call(self, dependencies, function(err, status) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			var rootModule = self;
			while(rootModule.$module)
				rootModule = rootModule.$module;

			promises.all([
				configSrvc.getModuleIdAsync(self.$module),
				configSrvc.getModuleIdAsync(rootModule)
			])

			.then(function(ids) {
				return promises.all([
					dbSrvc.raw('SELECT id FROM module_permissions WHERE module = ? AND name = ?', [ids[0], 'menu-author']),
					dbSrvc.raw('SELECT id FROM module_permissions WHERE module = ? AND name = ?', [ids[1], 'public'])
				]);
			})
			.then(function(permissionIds) {
				self['$menuAuthorPermissionId'] = permissionIds[0].rows[0].id;
				self['$publicPermissionId'] = permissionIds[1].rows[0].id;

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
		var dbSrvc = this.dependencies['database-service'].knex,
			loggerSrvc = this.dependencies['logger-service'],
			self = this;

		var menuListPromises = [];
		if(user) {
			menuListPromises.push(dbSrvc.raw('SELECT A.ember_component FROM module_widgets A INNER JOIN menus B ON (A.id = B.module_widget) WHERE B.type = \'footer\' AND A.permission IN (SELECT permission FROM fn_get_user_permissions(?))', [user.id]));
		}
		else {
			menuListPromises.push(dbSrvc.raw('SELECT A.ember_component FROM module_widgets A INNER JOIN menus B ON (A.id = B.module_widget) WHERE B.type = \'footer\' AND A.permission = ?', [ self['$publicPermissionId'] ]));
		}

		promises.all(menuListPromises)
		.then(function(userHorizontalMenus) {
			var promiseResolutions = [];

			userHorizontalMenus[0].rows.forEach(function(userHorizontalMenu) {
				var menuId = userHorizontalMenu.ember_component.replace('menu-', '');
				promiseResolutions.push(renderer(path.join(self.basePath, 'ember-stuff/components/footer-menu-viewer-widget.ejs'), { 'menuId': menuId }));
			});

			promiseResolutions.push(self._checkPermissionAsync(user, self['$menuAuthorPermissionId']));
			return promises.all(promiseResolutions);
		})
		.then(function(userHorizontalMenus) {
			var hasAuthorPermission = userHorizontalMenus.pop();
			if(hasAuthorPermission && (mediaType == 'desktop')) {
				userHorizontalMenus.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/footer-menu-manager-widget.js'), 'utf8'));
			}

			return promises.all(userHorizontalMenus);
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

	'_getEmberComponentHTMLs': function(user, mediaType, renderer, callback) {
		var dbSrvc = this.dependencies['database-service'].knex,
			loggerSrvc = this.dependencies['logger-service'],
			self = this;

		var menuListPromises = [];
		if(user) {
			menuListPromises.push(dbSrvc.raw('SELECT A.ember_component FROM module_widgets A INNER JOIN menus B ON (A.id = B.module_widget) WHERE B.type = \'footer\' AND A.permission IN (SELECT permission FROM fn_get_user_permissions(?))', [user.id]));
		}
		else {
			menuListPromises.push(dbSrvc.raw('SELECT A.ember_component FROM module_widgets A INNER JOIN menus B ON (A.id = B.module_widget) WHERE B.type = \'footer\' AND A.permission = ?', [ self['$publicPermissionId'] ]));
		}

		promises.all(menuListPromises)
		.then(function(userHorizontalMenus) {
			var promiseResolutions = [];

			userHorizontalMenus[0].rows.forEach(function(userHorizontalMenu) {
				var menuId = userHorizontalMenu.ember_component.replace('menu-', '');
				promiseResolutions.push(renderer(path.join(self.basePath, 'ember-stuff/componentHTMLs/footer-menu-viewer-widget.ejs'), { 'menuId': menuId }));
			});

			promiseResolutions.push(self._checkPermissionAsync(user, self['$menuAuthorPermissionId']));
			return promises.all(promiseResolutions);
		})
		.then(function(userHorizontalMenus) {
			var hasAuthorPermission = userHorizontalMenus.pop();
			if(hasAuthorPermission && (mediaType == 'desktop')) {
				userHorizontalMenus.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/footer-menu-manager-widget.ejs'), 'utf8'));
			}

			return promises.all(userHorizontalMenus);
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

	'name': 'footer',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.component = footerComponent;
