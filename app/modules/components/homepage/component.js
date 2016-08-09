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

			homeRouteName = homeRouteName.split(' ');
			if(homeRouteName.length == 1) {
				homeRouteName = '\'' + homeRouteName[0] + '\'';
			}
			else {
				var homeRouteSegments = [];
				homeRouteName.forEach(function(homeRouteSegment) {
					homeRouteSegment = '\'' + homeRouteSegment.trim() + '\'';
					homeRouteSegments.push(homeRouteSegment);
				});

				homeRouteName = homeRouteSegments.join(', ');
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
			homeRouteName = self.$config.defaultHomeRoute,
			dbSrvc = self.dependencies['database-service'].knex,
			loggerSrvc = self.dependencies['logger-service'];

		if(!user) {
			if(callback) callback(null, homeRouteName);
			return null;
		}

		dbSrvc.raw('SELECT ember_route FROM module_menus WHERE id = (SELECT home_module_menu FROM users WHERE id = ?)', [user.id])
		.then(function(userHomeRoute) {
			if(!userHomeRoute.rows.length) {
				if(callback) callback(null, homeRouteName);
				return null;
			}

			if(!userHomeRoute.rows[0].ember_route) {
				if(callback) callback(null, homeRouteName);
				return null;
			}

			if(callback) callback(null, userHomeRoute.rows[0].ember_route);
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
