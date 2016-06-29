/*
 * Name			: app/modules/components/homepage/component.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Home Page Component - set user-chosen page as the home page for the user
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

var homepageComponent = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);

		this._getUserHomeRouteNameAsync = promises.promisify(this._getUserHomeRouteName.bind(this));
	},

	'_getEmberRoutes': function(user, renderer, callback) {
		if(callback) callback(null, [{
			'name': 'homepage-home',
			'path': '/',

			'parentRoute': null,
			'subRoutes': []
		}]);
	},

	'_getEmberRouteHandlers': function(user, renderer, callback) {
		var self = this;

		self._getUserHomeRouteNameAsync(user)
		.then(function(homeRouteName) {
			if(homeRouteName == 'homepage-home') {
				return '';
			}

			if(homeRouteName[0] !== '"') {
				homeRouteName = '"' + homeRouteName + '"';
			}

			return renderer(path.join(self.basePath, 'ember-stuff/routeHandlers/default.ejs'), { 'homeRouteName': homeRouteName })
		})
		.then(function(routeHandler) {
			if(callback) callback(null, [routeHandler]);
			return null;
		})
		.catch(function(err) {
			if(callback) callback(err);
		});
	},

	'_getUserHomeRouteName': function(user, callback) {
		var self = this,
			homeRouteName = 'homepage-home',
			dbSrvc = self.dependencies['database-service'].knex,
			loggerSrvc = self.dependencies['logger-service'];

		if(!user) {
			dbSrvc.raw('SELECT ember_route FROM module_menus WHERE permission = (SELECT id FROM module_permissions WHERE module = (SELECT id FROM modules WHERE name = ?) AND name = \'public\') AND is_default_home = true', [this.$module.$application])
			.then(function(defaultPublicRoute) {
				if(defaultPublicRoute.rows.length) {
					homeRouteName = defaultPublicRoute.rows[0].ember_route;
				}

				if(callback) callback(null, homeRouteName);
				return null;
			})
			.catch(function(err) {
				loggerSrvc.error(self.name + '::_getEmberRoutes:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
				if(callback) callback(err);
			});

			return null;
		}

		dbSrvc.raw('SELECT ember_route FROM module_menus WHERE id = (SELECT home_module_menu FROM users WHERE id = ?)', [user.id])
		.then(function(userHomeRoute) {
			if(!userHomeRoute.rows.length)
				return dbSrvc.raw('SELECT ember_route FROM module_menus WHERE permission IN (SELECT id FROM module_permissions WHERE module = (SELECT id FROM modules WHERE name = ?) AND name IN (\'public\', \'registered\')) AND is_default_home = true', [self.$module.$application]);

			if(!userHomeRoute.rows[0].ember_route)
				return dbSrvc.raw('SELECT ember_route FROM module_menus WHERE permission IN (SELECT id FROM module_permissions WHERE module = (SELECT id FROM modules WHERE name = ?) AND name IN (\'public\', \'registered\')) AND is_default_home = true', [self.$module.name]);

			return userHomeRoute;
		})
		.then(function(userHomeRoute) {
			if(userHomeRoute.rows.length) {
				homeRouteName = userHomeRoute.rows[0].ember_route;
			}

			if(callback) callback(null, homeRouteName);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberRoutes:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
			if(callback) callback(err);
		});
	},

	'name': 'homepage',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.component = homepageComponent;
