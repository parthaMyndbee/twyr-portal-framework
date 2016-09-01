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
	path = require('path'),
	uuid = require('node-uuid');

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
				self['$mediaLibraryPath'] = path.isAbsolute(self.$config.mediaLibraryPath) ? self.$config.mediaLibraryPath : path.join(self.basePath, self.$config.mediaLibraryPath);

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
		this.$router.get('/getImage/:id', this._getImage.bind(this));

		this.$router.post('/uploadImage', this._uploadImage.bind(this));
		this.$router.post('/uploadFile', this._uploadImage.bind(this));

		this.$router.post('/uploadDroppedFile', this._uploadDroppedImage.bind(this));
		this.$router.post('/uploadDroppedImage', this._uploadDroppedImage.bind(this));
	},

	'_getImage': function(request, response, next) {
		var self = this,
			loggerSrvc = self.dependencies['logger-service'];

		loggerSrvc.debug('Servicing request ' + request.method + ' "' + request.originalUrl + '":\nQuery: ', request.query, '\nParams: ', request.params, '\nBody: ', request.body);

		var imagePath = path.join(self.$mediaLibraryPath, request.params.id);
		response.sendFile(imagePath);
	},

	'_uploadImage': function(request, response, next) {
		var self = this,
			Busboy = require('busboy'),
			loggerSrvc = self.dependencies['logger-service'];

		loggerSrvc.debug('Servicing request ' + request.method + ' "' + request.originalUrl + '":\nQuery: ', request.query, '\nParams: ', request.params, '\nBody: ', request.body);

		var busboy = new Busboy({ 'headers': request.headers }),
			fileName = null,
			imageId = uuid.v4().toString(),
			imageName = path.join(self.$mediaLibraryPath, imageId);

		busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			fileName = filename;
			imageName += path.extname(filename);
			file.pipe(filesystem.createWriteStream(imageName));
		});

		busboy.on('finish', function() {
			var html = '';
			html += '<script type="text/javascript">';
			html += '    var funcNum = ' + request.query.CKEditorFuncNum + ';\n';
			html += '    var url     = "' + request.protocol + '://' + request.hostname + ':' + request.app.get('port') + '/pages/getImage/' + imageId + path.extname(fileName) + '";\n';
			html += '    var message = "' + fileName + ' was uploaded successfully";\n\n';

			html += '    window.parent.CKEDITOR.tools.callFunction(funcNum, url, message);\n';
			html += '</script>';

			response.set('Access-Control-Allow-Origin', request.get('Origin'));
			response.set('Access-Control-Allow-Credentials', true);
			response.set('Connection', 'close');
			response.status(200).send(html);
		});

		request.pipe(busboy);
	},

	'_uploadDroppedImage': function(request, response, next) {
		var self = this,
			Busboy = require('busboy'),
			loggerSrvc = self.dependencies['logger-service'];

		loggerSrvc.debug('Servicing request ' + request.method + ' "' + request.originalUrl + '":\nQuery: ', request.query, '\nParams: ', request.params, '\nBody: ', request.body);

		var busboy = new Busboy({ 'headers': request.headers }),
			fileName = null,
			imageId = uuid.v4().toString(),
			imageName = path.join(self.$mediaLibraryPath, imageId);

		busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			fileName = filename;
			imageName += path.extname(filename);
			file.pipe(filesystem.createWriteStream(imageName));
		});

		busboy.on('finish', function() {
			response.status(200).send({
				'uploaded': 1,
				'fileName': fileName,
				'url': request.protocol + '://' + request.hostname + ':' + request.app.get('port') + '/pages/getImage/' + imageId + path.extname(fileName)
			});
		});

		request.pipe(busboy);
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
				pagesComponent.parent._selectTemplates.call(self, user, mediaType, possibleTemplates, callback);
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

	'_getEmberRoutes': function(user, mediaType, renderer, callback) {
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
				if(hasPermission && (mediaType == 'desktop')) {
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

	'_getEmberRouteHandlers': function(user, mediaType, renderer, callback) {
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

		self._checkPermissionAsync(user, self['$pageAuthorPermissionId'])
		.then(function(hasPermission) {
			var promiseResolutions = [];
			promiseResolutions.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/routeHandlers/page-view.ejs'), 'utf8'));

			if(hasPermission && (mediaType == 'desktop')) {
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
	},

	'_getEmberModels': function(user, mediaType, renderer, callback) {
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

		self._checkPermissionAsync(user, self['$pageAuthorPermissionId'])
		.then(function(hasPermission) {
			var promiseResolutions = [];
			promiseResolutions.push(filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/models/page-view.js'), 'utf8'));

			if(hasPermission && (mediaType == 'desktop')) {
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
	},

	'_getEmberComponents': function(user, mediaType, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(mediaType != 'desktop') {
			if(callback) callback(null, []);
			return null;
		}

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

	'_getEmberComponentHTMLs': function(user, mediaType, renderer, callback) {
		var loggerSrvc = this.dependencies['logger-service'],
			self = this;

		if(mediaType != 'desktop') {
			if(callback) callback(null, []);
			return null;
		}

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
