/*
 * Name			: app/server.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Module - the "Application Class" for the Portal
 *
 */

"use strict";

/**
 * Module dependencies, required for ALL Twy'r modules
 */
var base = require('./module-base').baseModule,
	prime = require('prime'),
	promises = require('bluebird');

/**
 * Module dependencies, required for this module
 */
var path = require('path'),
	_ = require('lodash');

var app = prime({
	'inherits': base,

	'constructor': function (module, clusterId, workedId) {
		base.call(this, module);
		this['$uuid'] = clusterId + '-' + workedId;
		this._loadConfig();
	},

	'start': function(dependencies, callback) {
		var self = this;
		app.parent.start.call(self, dependencies, function(err, status) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			self._setupRoutes();
			if(callback) callback(null, status);
		});
	},

	'_loadConfig': function() {
		var rootPath = path.dirname(require.main.filename),
			env = (process.env.NODE_ENV || 'development').toLowerCase();

		this['$config'] = require(path.join(rootPath, 'config', env, this.name)).config;
	},

	'_subModuleReconfigure': function(subModule) {
		if(subModule != 'express-service') return;
		this._setupRoutes();
	},

	'_subModuleStateChange': function(subModule, state) {
		if(subModule != 'express-service') return;
		if(!state) return;

		this._setupRoutes();
	},

	'_setupRoutes': function() {
		var self = this;

		var expressApp = (self.$services['express-service']).getInterface();
		expressApp.all('*', function(request, response, next) {
			var user = request.user,
				render = promises.promisify(response.render.bind(response)),
				promiseResolutions = [];

			var componentRoutes = '',
				componentMVC = '',
				componentTemplates = '';

			promiseResolutions.push(self.getClientsideAssetsAsync(user, render));
			Object.keys(self.$components).forEach(function(componentName) {
				promiseResolutions.push((self.$components[componentName]).getClientsideAssetsAsync(user, render));
			});

			promises.all(promiseResolutions)
			.then(function(clientsideAssets) {
				componentRoutes += _.map(clientsideAssets, 'routeHandler');
				componentMVC += _.map(clientsideAssets, 'componentModel');
				componentTemplates += _.map(clientsideAssets, 'template');

				return self.assembleClientsideAssetsAsync(componentRoutes, componentMVC, componentTemplates);
			})
			.then(function(indexTemplate) {
				response.status(200).send(indexTemplate);
			})
			.catch(function(err) {
				next(err);
			});
		});

		expressApp.use(function(error, request, response, next) {
			if (response.headersSent) {
				return next(error);
			}

			response.status(500).json({ 'error': error.message });
		});
	},

	'getClientsideAssets': function(user, renderFunc, callback) {
		if(callback) callback(null, { 'route': '', 'mvc': '', 'template': '' });
	},

	'assembleClientsideAssets': function(routes, mvcs, templates, callback) {
		if(callback) callback(null, '');
	},

	'name': 'twyr-portal',
	'basePath': __dirname,
	'dependencies': []
});

exports.twyrPortal = app;
