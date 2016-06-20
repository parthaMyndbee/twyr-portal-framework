/*
 * Name			: app/modules/components/profiles/component.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Profile Component - provides functionality to allow users to manage their own profile
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

var profilesComponent = prime({
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
			'name': 'profiles-default',
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

		renderer(path.join(this.basePath, 'ember-stuff/routeHandlers/default.ejs'), { 'userId': user.id })
		.then(function(profileComponentJS) {
			if(callback) callback(null, [profileComponentJS]);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponents:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
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

		filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/models/default.js'), 'utf8')
		.then(function(profileModel) {
			if(callback) callback(null, [profileModel]);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberModels:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
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

		promises.all([
			filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/components/profile-widget.js'), 'utf8'),
			filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/components/change-password-widget.js'), 'utf8'),
			filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/components/profile-basics-widget.js'), 'utf8'),
			filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/components/profile-contacts-widget.js'), 'utf8'),
			filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/components/profile-emergency-contacts-widget.js'), 'utf8')
		])
		.then(function(profileWidgetsJS) {
			if(callback) callback(null, profileWidgetsJS);
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

		promises.all([
			renderer(path.join(this.basePath, 'ember-stuff/componentHTMLs/profile-widget.ejs'), { 'fullname': user.first_name + ' ' + user.last_name }),
			filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/componentHTMLs/change-password-widget.ejs'), 'utf8'),
			filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/componentHTMLs/profile-basics-widget.ejs'), 'utf8'),
			filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/componentHTMLs/profile-contacts-widget.ejs'), 'utf8'),
			filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/componentHTMLs/profile-emergency-contacts-widget.ejs'), 'utf8')
		])
		.then(function(profileWidgetHTMLs) {
			if(callback) callback(null, profileWidgetHTMLs);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponentHTMLs:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
			if(callback) callback(err);
		});
	},

	'name': 'profiles',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.component = profilesComponent;
