/*
 * Name			: app/modules/components/pages/component.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Pages Component - author / display pages
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

var pagesComponent = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'start': function(dependencies, callback) {
		var self = this,
			configSrvc = dependencies['configuration-service'],
			dbSrvc = (dependencies['database-service']).knex,
			loggerSrvc = dependencies['logger-service'];

		pagesComponent.parent.start.call(self, dependencies, function(err, status) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			configSrvc.getModuleIdAsync(self)
			.then(function(id) {
				return dbSrvc.raw('SELECT id FROM module_permissions WHERE module = ? AND name = ?', [id, 'page-author']);
			})
			.then(function(pageAuthorPermissionId) {
				self['$pageAuthorPermissionId'] = pageAuthorPermissionId.rows[0].id;

				if(callback) callback(null, status);
				return null;
			})
			.catch(function(startErr) {
				loggerSrvc.error(self.name + '::start Error: ', startErr);
				if(callback) callback(startErr);
			});
		});
	},

	'_selectTemplates': function(user, mediaType, possibleTemplates, callback) {
		var self = this,
			selectedTemplates = possibleTemplates.filter(function(possibleTemplate) {
				return (possibleTemplate.name == 'page-view');
			});

		if(!user) {
			if(callback) callback(null, selectedTemplates);
			return;
		}

		self._checkPermissionAsync(user, self['$pageAuthorPermissionId'])
		.then(function(hasPermission) {
			if(hasPermission) {
				if(callback) callback(null, possibleTemplates);
				return null;
			}

			if(callback) callback(null, selectedTemplates);
			return null;
		})
		.catch(function(err) {
			self.dependencies['logger-service'].error(self.name + '::_selectTemplates Error: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberRoutes': function(user, renderer, callback) {
		var self = this,
			emberRoutes = [{
				'name': 'page-view',
				'path': '/page/:page_id',

				'parentRoute': null,
				'subRoutes': []
			}];

		if(user) {
			self._checkPermissionAsync(user, self['$pageAuthorPermissionId'])
			.then(function(hasPermission) {
				if(hasPermission) {
					emberRoutes.push({
						'name': 'pages-default',
						'path': '/pages',

						'parentRoute': null,
						'subRoutes': []
					});
				}

				if(callback) callback(null, emberRoutes);
				return null;
			})
			.catch(function(err) {
				self.dependencies['logger-service'].error(self.name + '::_getEmberRoutes Error: ', err);
				if(callback) callback(err);
			});

			return;
		}

		if(callback) callback(null, emberRoutes);
	},

	'_getEmberRouteHandlers': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/routeHandlers/page-view.ejs'), 'utf8')
			.then(function(pgeViewRouteHandler) {
				if(callback) callback(null, [pgeViewRouteHandler]);
				return null;
			})
			.catch(function(err) {
				loggerSrvc.error(self.name + '::_getEmberRouteHandlers:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
				if(callback) callback(err);
			});

			return null;
		}

		if(user) {
			self._checkPermissionAsync(user, self['$pageAuthorPermissionId'])
			.then(function(hasPermission) {
				var promiseResolutions = [];
				promiseResolutions.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/routeHandlers/page-view.ejs'), 'utf8'));

				if(hasPermission) {
					promiseResolutions.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/routeHandlers/pages-default.ejs'), 'utf8'));
				}

				return promises.all(promiseResolutions);
			})
			.then(function(routeHandlers) {
				if(callback) callback(null, routeHandlers);
				return null;
			})
			.catch(function(err) {
				self.dependencies['logger-service'].error(self.name + '::_getEmberRouteHandlers Error: ', err);
				if(callback) callback(err);
			});

			return;
		}
	},

	'_getEmberModels': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/models/page-view.js'), 'utf8')
			.then(function(pageViewModel) {
				if(callback) callback(null, [pageViewModel]);
				return null;
			})
			.catch(function(err) {
				loggerSrvc.error(self.name + '::_getEmberModels:\nArguments: ' + JSON.stringify(arguments, null, '\t') + '\nError: ', err);
				if(callback) callback(err);
			});

			return null;
		}

		if(user) {
			self._checkPermissionAsync(user, self['$pageAuthorPermissionId'])
			.then(function(hasPermission) {
				var promiseResolutions = [];
				promiseResolutions.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/models/page-view.js'), 'utf8'));

				if(hasPermission) {
					promiseResolutions.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/models/pages-default.js'), 'utf8'));
				}

				return promises.all(promiseResolutions);
			})
			.then(function(pageModels) {
				if(callback) callback(null, pageModels);
				return null;
			})
			.catch(function(err) {
				self.dependencies['logger-service'].error(self.name + '::_getEmberModels Error: ', err);
				if(callback) callback(err);
			});

			return;
		}
	},

	'_getEmberComponents': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$pageAuthorPermissionId'])
		.then(function(hasPermission) {
			if(hasPermission) {
				return promises.all([
					filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/page-manager-widget.js'), 'utf8')
				]);
			}

			return [];
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

	'_getEmberComponentHTMLs': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$pageAuthorPermissionId'])
		.then(function(hasPermission) {
			if(hasPermission) {
				return promises.all([
					filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/page-manager-widget.ejs'), 'utf8')
				]);
			}

			return [];
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

	'name': 'pages',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.component = pagesComponent;
