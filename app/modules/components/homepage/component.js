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

var homepageComponent = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'_getEmberRoutes': function(user, renderer, callback) {
		var self = this,
			dbSrvc = self.dependencies['database-service'].knex,
			loggerSrvc = self.dependencies['logger-service'],
			homeRoute = {
				'name': 'home',
				'path': '/',

				'parentRoute': null,
				'subRoutes': []
			};

		if(!user) {
			dbSrvc.raw('SELECT ember_route FROM module_menus WHERE permission = (SELECT id FROM module_permissions WHERE module = (SELECT id FROM modules WHERE name = ?) AND name = \'public\') AND is_default_home = true', [this.$module.name])
			.then(function(defaultPublicRoute) {
				if(defaultPublicRoute.rows.length) {
					homeRoute.name = defaultPublicRoute.rows[0].ember_route;
				}

				if(callback) callback(null, [homeRoute]);
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
				return dbSrvc.raw('SELECT ember_route FROM module_menus WHERE permission IN (SELECT id FROM module_permissions WHERE module = (SELECT id FROM modules WHERE name = ?) AND name IN (\'all\', \'public\', \'registered\')) AND is_default_home = true', [self.$module.name]);

			if(!userHomeRoute.rows[0].ember_route)
				return dbSrvc.raw('SELECT ember_route FROM module_menus WHERE permission IN (SELECT id FROM module_permissions WHERE module = (SELECT id FROM modules WHERE name = ?) AND name IN (\'all\', \'public\', \'registered\')) AND is_default_home = true', [self.$module.name]);

			return userHomeRoute;
		})
		.then(function(userHomeRoute) {
			if(userHomeRoute.rows.length) {
				homeRoute.name = userHomeRoute.rows[0].ember_route;
			}

			if(callback) callback(null, [homeRoute]);
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
