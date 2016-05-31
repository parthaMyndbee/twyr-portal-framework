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

	'_getConfiguredTemplates': function(callback) {
		if(callback) callback(null, []);
		return null;
	},

	'_getEmberComponents': function(user, renderer, callback) {
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

		if(callback) callback(null, []);
	},

	'_getEmberComponentHTMLs': function(user, renderer, callback) {
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

		if(callback) callback(null, []);
	},

	'name': 'session',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.component = sessionComponent;
