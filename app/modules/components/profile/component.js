/*
 * Name			: app/modules/components/profile/component.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Profile Component - provides functionality to allow manage your own profile
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

var profileComponent = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'_selectTemplates': function(user, mediaType, possibleTemplates, callback) {
		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		if(callback) callback(null, possibleTemplates);
	},

	'_getEmberRoutes': function(user, renderer, callback) {
		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		if(callback) callback(null, [{
			'name': 'profile',
			'path': '/profile',

			'parentRoute': null,
			'subRoutes': []
		}]);
	},

	'_getEmberRouteHandlers': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/routeHandlers/default.js'), 'utf8')
		.then(function(profileComponentJS) {
			if(callback) callback(null, [profileComponentJS]);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponents:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberComponents': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/components/profile-widget.js'), 'utf8')
		.then(function(profileComponentJS) {
			if(callback) callback(null, [profileComponentJS]);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponents:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
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

		renderer(path.join(this.basePath, 'ember-stuff/componentHTMLs/profile-widget.ejs'), { 'fullname': user.firstName + ' ' + user.lastName })
		.then(function(profileComponentHTML) {
			if(callback) callback(null, [profileComponentHTML]);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponentHTMLs:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
			if(callback) callback(err);
		});
	},

	'name': 'profile',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.component = profileComponent;
