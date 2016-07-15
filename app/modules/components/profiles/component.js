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
	path = require('path'),
	uuid = require('node-uuid');

var profilesComponent = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'start': function(dependencies, callback) {
		var self = this,
			dbSrvc = dependencies['database-service'],
			loggerSrvc = dependencies['logger-service'];

		profilesComponent.parent.start.call(self, dependencies, function(err, status) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			// Define the models....
			Object.defineProperty(self, '$UserModel', {
				'__proto__': null,
				'writable': true,

				'value': dbSrvc.Model.extend({
					'tableName': 'users',
					'idAttribute': 'id',
					'hasTimestamps': true
				})
			});

			self['$profileImagePath'] = path.isAbsolute(self.$config.profileImagePath) ? self.$config.profileImagePath : path.join(self.basePath, self.$config.profileImagePath);
			if(callback) callback(null, status);
		});
	},

	'_addRoutes': function() {
		this.$router.get('/get-image', this._getProfileImage.bind(this));
		this.$router.post('/upload-image', this._updateProfileImage.bind(this));
	},

	'_getProfileImage': function(request, response, next) {
		var self = this,
			loggerSrvc = self.dependencies['logger-service'];

		loggerSrvc.debug('Servicing request ' + request.method + ' "' + request.originalUrl + '":\nQuery: ', request.query, '\nParams: ', request.params, '\nBody: ', request.body);

		new self.$UserModel({ 'id': request.user.id })
		.fetch()
		.then(function(user) {
			var profileImageName = path.join(self['$profileImagePath'], (user.get('profile_image') || 'anonymous') + '.png');
			response.sendFile(profileImageName);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error('Error servicing request "' + request.path + '":\nQuery: ', request.query, '\nBody: ', request.body, '\nParams: ', request.params, '\nError: ', err);
			response.status(422).json({ 'code': 422, 'message': err.message || err.detail || 'Error saving profile image to the database' });
		});
	},

	'_updateProfileImage': function(request, response, next) {
		var self = this,
			Busboy = require('busboy'),
			loggerSrvc = self.dependencies['logger-service'];

		loggerSrvc.debug('Servicing request ' + request.method + ' "' + request.originalUrl + '":\nQuery: ', request.query, '\nParams: ', request.params, '\nBody: ', request.body);
		response.type('application/javascript');

		if(!request.user) {
			response.status(422).json({
				'status': false,
				'responseText': 'Unauthorized Access'
			});

			return;
		}

		var image = request.body.image.replace(/' '/g, '+').replace('data:image/png;base64,', ''),
			imageId = uuid.v4().toString(),
			imagePath = path.join(self['$profileImagePath'], imageId + '.png');

		filesystem.writeFileAsync(imagePath, Buffer.from(image, 'base64'))
		.then(function(status) {
			return new self.$UserModel({ 'id': request.user.id })
			.fetch();
		})
		.then(function(user) {
			if(!user.get('profile_image'))
				return null;

			return filesystem.unlinkAsync(path.join(self['$profileImagePath'], user.get('profile_image') + '.png'));
		})
		.then(function(user) {
			return new self.$UserModel({ 'id': request.user.id })
			.save({
				'profile_image': imageId,
				'profile_image_metadata': request.body.metadata
			}, {
				'method': 'update',
				'patch': true
			});
		})
		.then(function() {
			response.status(200).json({
				'status': true,
				'responseText': 'Profile Image Updated succesfully',
			});

			return null;
		})
		.catch(function(err) {
			loggerSrvc.error('Servicing request ' + request.method + ' "' + request.originalUrl + '":\nQuery: ', request.query, '\nParams: ', request.params, '\nBody: ', request.body, '\nError: ', err);
			response.status(422).json({
				'status': false,
				'responseText': (err.stack.split('\n', 1)[0]).replace('error: ', '').trim()
			});
		});
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
