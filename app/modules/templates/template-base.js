/*
 * Name			: app/modules/templates/template-base.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Base Class for Templates - providing common functionality required for all templates
 *
 */

"use strict";

var base = require('./../../module-base').baseModule,
	prime = require('prime'),
	promises = require('bluebird');

/**
 * Module dependencies, required for this module
 */
var path = require('path');

var twyrTemplateBase = prime({
	'inherits': base,

	'constructor': function(module, loader) {
		// console.log('Constructor of the ' + this.name + ' Template');

		var TmplLoader = require('./template-loader').loader;
		loader = loader || (promises.promisifyAll(new TmplLoader(this), {
			'filter': function(name, func) {
				return true;
			}
		}));

		if(this.dependencies.indexOf('express-service') < 0)
			this.dependencies.push('express-service');

		this['$router'] = require('express').Router();
		base.call(this, module, loader);
	},

	'start': function(dependencies, callback) {
		// console.log(this.name + ' Start');

		var self = this;
		twyrTemplateBase.parent.start.call(self, dependencies, function(err, status) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			self._setupRouter();
			if(callback) callback(null, status);
		});
	},

	'getRouter': function() {
		return this.$router;
	},

	'render': function(renderer, configuration, callback) {
		var self = this,
			tmplPath = path.join(self.basePath, 'index.ejs');

		renderer(tmplPath, configuration)
		.then(function(renderedHTML) {
			if(callback) callback(null, renderedHTML);
			return null;
		})
		.catch(function(err) {
			if(callback) callback(err);
		});
	},

	'stop': function(callback) {
		// console.log(this.name + ' Stop');

		var self = this;
		twyrTemplateBase.parent.stop.call(self, function(err, status) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			self._deleteRoutes();
			if(callback) callback(null, status);
		});
	},

	'_setupRouter': function() {
		var router = this['$router'],
			logger = require('morgan'),
			loggerSrvc = this.dependencies['logger-service'],
			self = this;

		var loggerStream = {
			'write': function(message, encoding) {
				loggerSrvc.silly(message);
			}
		};

		router
		.use(logger('combined', {
			'stream': loggerStream
		}))
		.use(function(request, response, next) {
			if(self['$enabled']) {
				next();
				return;
			}

			response.status(403).json({ 'error': self.name + ' is disabled' });
		});

		self._addRoutes();
	},

	'_addRoutes': function() {
		return;
	},

	'_deleteRoutes': function() {
		// NOTICE: Undocumented ExpressJS API. Be careful upgrading :-)
		if(!this.$router) return;
		this.$router.stack.length = 0;
	},

	'_dependencyStateChange': function(dependency, state) {
		if((process.env.NODE_ENV || 'development') == 'development') console.log(this.name + '::_dependencyStateChange: ' + dependency + ' is now ' + (state ? 'enabled' : 'disabled'));
		if(dependency != 'express-service') return;
		this._changeState(state);
	},

	'name': 'twyr-template-base',
	'basePath': __dirname,
	'dependencies': ['express-service']
});

exports.baseTemplate = twyrTemplateBase;