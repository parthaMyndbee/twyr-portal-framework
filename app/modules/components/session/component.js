/*
 * Name			: app/modules/components/session/component.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Session Component - provides functionality to allow login / logout
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

var sessionComponent = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'_getEmberComponents': function(user, mediaType, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/components/login-widget.js'), 'utf8')
			.then(function(loginComponentJS) {
				if(callback) callback(null, [loginComponentJS]);
				return null;
			})
			.catch(function(err) {
				loggerSrvc.error(self.name + '::_getEmberComponents:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
				if(callback) callback(err);
			});

			return;
		}

		filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/components/logout-widget.js'), 'utf8')
		.then(function(logoutComponentJS) {
			if(callback) callback(null, [logoutComponentJS]);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponents:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberComponentHTMLs': function(user, mediaType, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/componentHTMLs/login-widget.ejs'), 'utf8')
			.then(function(loginComponentHTML) {
				if(callback) callback(null, [loginComponentHTML]);
				return null;
			})
			.catch(function(err) {
				loggerSrvc.error(self.name + '::_getEmberComponentHTMLs:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
				if(callback) callback(err);
			});

			return;
		}

		filesystem.readFileAsync(path.join(this.basePath, 'ember-stuff/componentHTMLs/logout-widget.ejs'), 'utf8')
		.then(function(loginComponentHTML) {
			if(callback) callback(null, [loginComponentHTML]);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponentHTMLs:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
			if(callback) callback(err);
		});
	},

	'name': 'session',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.component = sessionComponent;
