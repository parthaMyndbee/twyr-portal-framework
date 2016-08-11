/*
 * Name			: app/modules/components/media/component.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Media Manager Component - manage all media upload / download
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

var mediaComponent = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'start': function(dependencies, callback) {
		var self = this,
			configSrvc = dependencies['configuration-service'],
			dbSrvc = (dependencies['database-service']).knex,
			loggerSrvc = dependencies['logger-service'];

		mediaComponent.parent.start.call(self, dependencies, function(err, status) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			configSrvc.getModuleIdAsync(self)
			.then(function(id) {
				return dbSrvc.raw('SELECT id FROM module_permissions WHERE module = ? AND name = ?', [id, 'media-manager']);
			})
			.then(function(mediaManagerPermissionId) {
				self['$mediaManagerPermissionId'] = mediaManagerPermissionId.rows[0].id;

				self['$mediaStoragePath'] = (path.isAbsolute(self.$config.mediaStoragePath) ? self.$config.mediaStoragePath : path.join(self.basePath, self.$config.mediaStoragePath));
				return filesystem.ensureDirAsync(self['$mediaStoragePath']);
			})
			.then(function() {
				if(callback) callback(null, status);
				return null;
			})
			.catch(function(startErr) {
				loggerSrvc.error(self.name + '::start Error: ', startErr);
				if(callback) callback(startErr);
			});
		});
	},

	'_addRoutes': function() {
		this.$router.get('/tree', this._getMediaTree.bind(this));
		this.$router.get('/media-defaults/:id', this._getMediaInFolder.bind(this));
	},

	'_getMediaTree': function(request, response, next) {
		var self = this,
			loggerSrvc = self.dependencies['logger-service'];

		loggerSrvc.debug('Servicing request ' + request.method + ' "' + request.originalUrl + '":\nQuery: ', request.query, '\nParams: ', request.params, '\nBody: ', request.body);
		response.type('application/javascript');

		self._checkPermissionAsync(request.user, self['$mediaManagerPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				throw new Error('Unauthorized Access');
			}

			var dir = undefined;
			if(request.query.id != '#') {
				dir = path.join(self['$mediaStoragePath'], request.query.id);
				return promises.all([dir, filesystem.readdirAsync(dir)]);
			}
			else {
				return promises.all([dir]);
			}
		})
		.then(function(results) {
			var dir = results[0],
				media = results[1];

			var responseData = [],
				promiseResolutions = [];

			if(dir) {
				media.forEach(function(medium) {
					responseData.push({
						'id': path.relative(self['$mediaStoragePath'], path.join(dir, medium)),
						'text': medium
					});
				});
			}
			else {
				responseData.push({
					'id': '/',
					'text': 'Root'
				});
			}

			promiseResolutions.push(responseData);
			responseData.forEach(function(medium) {
				promiseResolutions.push(filesystem.statAsync(path.join(self['$mediaStoragePath'], medium.id)));
			});

			return promises.all(promiseResolutions);
		})
		.then(function(results) {
			var responseData = results.shift();
			results.forEach(function(statData, index) {
				if(!statData.isDirectory())
					return;

				responseData[index]['children'] = true;
			});

			responseData = responseData.filter(function(medium) {
				return !!medium.children;
			});

			response.status(200).json(responseData);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error('Servicing request ' + request.method + ' "' + request.originalUrl + '":\nQuery: ', request.query, '\nParams: ', request.params, '\nBody: ', request.body, '\nError: ', err);
			response.sendStatus(500);
		});
	},

	'_getMediaInFolder': function(request, response, next) {
		var self = this,
			loggerSrvc = self.dependencies['logger-service'];

		loggerSrvc.debug('Servicing request ' + request.method + ' "' + request.originalUrl + '":\nQuery: ', request.query, '\nParams: ', request.params, '\nBody: ', request.body);
		response.type('application/javascript');

		self._checkPermissionAsync(request.user, self['$mediaManagerPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				throw new Error('Unauthorized Access');
			}

			var dir = undefined;
			if(request.query.id != '/') {
				dir = path.join(self['$mediaStoragePath'], request.params.id);
				return promises.all([dir, filesystem.statAsync(dir)]);
			}
			else {
				return promises.all([dir]);
			}
		})
		.then(function(results) {
			var dir = results[0],
				stat = results[1];

			if(stat && stat.isDirectory()) {
				return promises.all([dir, filesystem.readdirAsync(dir)]);
			}

			if(stat && stat.isFile()) {
				return promises.all([dir]);
			}

			return promises.all([dir]);
		})
		.then(function(results) {
			var dir = results[0],
				media = results[1];

			var responseData = [],
				promiseResolutions = [];

			if(dir) {
				if(media && Array.isArray(media)) {
					media.forEach(function(medium) {
						responseData.push({
							'id': path.relative(self['$mediaStoragePath'], path.join(dir, medium)),
							'type': 'folder',
							'text': medium
						});
					});
				}
				else {
					responseData.push({
						'id': path.relative(self['$mediaStoragePath'], dir),
						'type': 'file',
						'text': request.params.id
					});
				}
			}
			else {
				responseData.push({
					'id': '/',
					'type': 'folder',
					'text': 'Root'
				});
			}

			promiseResolutions.push(responseData);
			promiseResolutions.push(filesystem.statAsync(path.join(self['$mediaStoragePath'], request.params.id)));

			responseData.forEach(function(medium) {
				promiseResolutions.push(filesystem.statAsync(path.join(self['$mediaStoragePath'], medium.id)));
			});

			return promises.all(promiseResolutions);
		})
		.then(function(results) {
			var filesData = results.shift(),
				parentStat = results.shift();

			results.forEach(function(statData, index) {
				if(!statData.isDirectory())
					return;

				filesData[index]['children'] = true;
			});

			var responseData = {
				'data': {
					'type': 'media-defaults',
					'id': request.params.id,

					'attributes': {
						'name': ((request.params.id == '/') ? 'Root' : request.params.id.split('/').pop()),
						'type': (parentStat.isFile() ? 'file' : 'folder'),
						'size': parentStat.size,
						'created_at': parentStat.ctime,
						'updated_at': parentStat.mtime
					},

					'relationships': {
						'children': {
							'data': []
						}
					}
				}
			};

			if(parentStat.isFile()) {
				delete responseData.data.relationships;
			}
			else {
				filesData.forEach(function(file) {
					responseData.data.relationships.children.data.push({
						'type': 'media-defaults',
						'id': file.id
					});
				});
			}

			response.status(200).json(responseData);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error('Error servicing request ' + request.method + ' "' + request.originalUrl + '":\nQuery: ', request.query, '\nBody: ', request.body, '\nParams: ', request.params, '\nError: ', err);
			response.status(422).json({
				'errors': [{
					'status': 422,
					'source': { 'pointer': '/data/id' },
					'title': 'Get media error',
					'detail': (err.stack.split('\n', 1)[0]).replace('error: ', '').trim()
				}]
			});
		});
	},

	'_selectTemplates': function(user, mediaType, possibleTemplates, callback) {
		var self = this;
		if(!user) {
			if(callback) callback(null, []);
			return;
		}

		self._checkPermissionAsync(user, self['$mediaManagerPermissionId'])
		.then(function(hasPermission) {
			if(hasPermission) {
				if(callback) callback(null, possibleTemplates);
				return null;
			}

			if(callback) callback(null, []);
			return null;
		})
		.catch(function(err) {
			self.dependencies['logger-service'].error(self.name + '::_selectTemplates Error: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberRoutes': function(user, renderer, callback) {
		var self = this,
			emberRoutes = [];

		if(user) {
			self._checkPermissionAsync(user, self['$mediaManagerPermissionId'])
			.then(function(hasPermission) {
				if(hasPermission) {
					emberRoutes.push({
						'name': 'media-default',
						'path': '/media',

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
			if(callback) callback(null, []);
			return null;
		}

		if(user) {
			self._checkPermissionAsync(user, self['$mediaManagerPermissionId'])
			.then(function(hasPermission) {
				var promiseResolutions = [];
				if(hasPermission) {
					promiseResolutions.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/routeHandlers/media-default.ejs'), 'utf8'));
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

		self._checkPermissionAsync(user, self['$mediaManagerPermissionId'])
		.then(function(hasPermission) {
			var promiseResolutions = [];
			if(hasPermission) {
				promiseResolutions.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/models/media-default.js'), 'utf8'));
			}

			return promises.all(promiseResolutions);
		})
		.then(function(menuModels) {
			if(callback) callback(null, menuModels);
			return null;
		})
		.catch(function(err) {
			self.dependencies['logger-service'].error(self.name + '::_getEmberModels Error: ', err);
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

		self._checkPermissionAsync(user, self['$mediaManagerPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				return '';
			}

			return promises.all([
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/media-default-widget.js'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/media-editor-widget.js'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/media-tree-widget.js'), 'utf8')
			]);
		})
		.then(function(widgetHTMLs) {
			if(callback) callback(null, widgetHTMLs);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponents Error: ', err);
			if(callback) callback(err);
		});

		return null;
	},

	'_getEmberComponentHTMLs': function(user, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$mediaManagerPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				return '';
			}

			return promises.all([
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/media-default-widget.ejs'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/media-editor-widget.ejs'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/media-tree-widget.ejs'), 'utf8')
			]);
		})
		.then(function(widgetHTMLs) {
			if(callback) callback(null, widgetHTMLs);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberComponentHTMLs Error: ', err);
			if(callback) callback(err);
		});

		return null;
	},

	'name': 'media',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.component = mediaComponent;
