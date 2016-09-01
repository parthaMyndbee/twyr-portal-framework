/*
 * Name			: app/modules/components/modules/component.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Modules Component - edit module configuration / templates
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
var _ = require('lodash'),
	cheerio = require('cheerio'),
	filesystem = promises.promisifyAll(require('fs-extra')),
	inflection = require('inflection'),
	path = require('path');

var modulesComponent = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'start': function(dependencies, callback) {
		var self = this,
			configSrvc = dependencies['configuration-service'],
			dbSrvc = (dependencies['database-service']).knex,
			loggerSrvc = dependencies['logger-service'];

		modulesComponent.parent.start.call(self, dependencies, function(err, status) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			configSrvc.getModuleIdAsync(self)
			.then(function(id) {
				return dbSrvc.raw('SELECT id FROM module_permissions WHERE module = ? AND name = ?', [id, 'module-manager']);
			})
			.then(function(moduleManagerPermissionId) {
				self['$moduleManagerPermissionId'] = moduleManagerPermissionId.rows[0].id;

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
		this.$router.get('/template-design/:id', this._getTemplateDesign.bind(this));
	},

	'_selectTemplates': function(user, mediaType, possibleTemplates, callback) {
		var self = this;

		if(!user) {
			if(callback) callback(null, []);
			return;
		}

		self._checkPermissionAsync(user, self['$moduleManagerPermissionId'])
		.then(function(hasPermission) {
			if(hasPermission) {
				modulesComponent.parent._selectTemplates.call(self, user, mediaType, possibleTemplates, callback);
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

	'_getEmberRoutes': function(user, mediaType, renderer, callback) {
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

		self._checkPermissionAsync(user, self['$moduleManagerPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				if(callback) callback(null, []);
				return null;
			}

			if(callback) callback(null, [{
				'name': 'modules-default',
				'path': '/modules',

				'parentRoute': null,
				'subRoutes': []
			}]);
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error(self.name + '::_getEmberRoutes Error: ', err);
			if(callback) callback(err);
		});
	},

	'_getEmberRouteHandlers': function(user, mediaType, renderer, callback) {
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

		self._checkPermissionAsync(user, self['$moduleManagerPermissionId'])
		.then(function(hasPermission) {
			if(hasPermission) {
				return filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/routeHandlers/modules-default.ejs'), 'utf8');
			}

			return '';
		})
		.then(function(routeHandlers) {
			if(callback) callback(null, [routeHandlers]);
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

		if(mediaType != 'desktop') {
			if(callback) callback(null, []);
			return null;
		}

		if(!user) {
			if(callback) callback(null, []);
			return null;
		}

		self._checkPermissionAsync(user, self['$moduleManagerPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				return '';
			}

			return filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/models/modules-default.js'), 'utf8');
		})
		.then(function(models) {
			if(callback) callback(null, [models]);
			return null;
		})
		.catch(function(err) {
			self.dependencies['logger-service'].error(self.name + '::_getEmberModels Error: ', err);
			if(callback) callback(err);
		});

		return null;
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

		self._checkPermissionAsync(user, self['$moduleManagerPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				return '';
			}

			return promises.all([
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/modules-default-widget.js'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/module-details-widget.js'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/module-details-template-editor-widget.js'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/components/module-tree-widget.js'), 'utf8')
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

		self._checkPermissionAsync(user, self['$moduleManagerPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				return '';
			}

			return promises.all([
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/modules-default-widget.ejs'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/module-details-widget.ejs'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/module-details-template-editor-widget.ejs'), 'utf8'),
				filesystem.readFileAsync(path.join(self.basePath, 'ember-stuff/componentHTMLs/module-tree-widget.ejs'), 'utf8')
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

	'_getTemplateDesign': function(request, response, next) {
		var self = this,
			dbSrvc = self.dependencies['database-service'],
			loggerSrvc = self.dependencies['logger-service'],
			renderer = promises.promisify(response.render.bind(response)),
			templateName = null;

		loggerSrvc.debug('Servicing request ' + request.method + ' "' + request.originalUrl + '":\nQuery: ', request.query, '\nParams: ', request.params, '\nBody: ', request.body);

		self._checkPermissionAsync(request.user, self['$moduleManagerPermissionId'])
		.then(function(hasPermission) {
			if(!hasPermission) {
				throw new Error('Unauthorized Access');
			}

			return dbSrvc.knex.raw('SELECT name, module FROM module_templates WHERE id = ?', [request.params.id]);
		})
		.then(function(tmplModule) {
			templateName = tmplModule.rows[0].name;
			return dbSrvc.knex.raw('SELECT name FROM fn_get_module_ancestors(?) ORDER BY level DESC', [tmplModule.rows[0].module]);
		})
		.then(function(componentChain) {
			componentChain.rows.shift();
			componentChain = componentChain.rows;

			var templateModule = self,
				template = null;

			while(templateModule.$module)
				templateModule = templateModule.$module;

			componentChain.forEach(function(component) {
				templateModule = templateModule['$components'][component.name];
				if(!templateModule) throw new Error('Cannot find template module');
			});

			template = templateModule['$templates'][templateName];
			return promises.all([template, dbSrvc.knex.raw('SELECT name FROM module_template_positions WHERE template = ?', [request.params.id])]);
		})
		.then(function(results) {
			var template = results[0],
				positions = _.map(results[1].rows, 'name'),
				configuration = { 'positions': {} };

			positions.forEach(function(positionName) {
				configuration.positions[positionName] = ['template-design-' + positionName];
			});

			return template.renderAsync(renderer, configuration);
		})
		.then(function(templateHTML) {
			var $ = cheerio.load(templateHTML);
			if($('body').length) {
				templateHTML = $('body').find('script[type="text/x-handlebars"]').html();
			}
			else {
				templateHTML = $('script').html();
			}

			var componentSelectorRegExp =  /\{\{(.*?)\}\}/gm,
				replacers = {};

			templateHTML.replace(componentSelectorRegExp, function(comp) {
				if(comp == '{{outlet}}') {
					replacers[comp] = '<div class="box box-solid box-primary" style="text-align:left; width:auto; margin:5px;"><div class="box-header with-border"><h3 class="box-title">Main Template Area</h3></div><div class="box-body" style="min-height:50px; background-color:#fafafa;"></div></div>';
					return comp;
				}

				if((comp[2] == '#') || (comp[2] == '/')) {
					replacers[comp] = '';
					return comp;
				}

				if(comp.indexOf('template-design-') == 2) {
					replacers[comp] = '<div class="box box-primary" style="text-align:left; width:auto; margin:5px;"><div class="box-header with-border"><h3 class="box-title">' + inflection.titleize((comp.split(' ')[0]).replace('template-design-', '').replace('{{', '').replace('}}', '').replace(/-/g, ' ')) + '</h3></div><div id="' + (comp.split(' ')[0]).replace('template-design-', '').replace('{{', '').replace('}}', '') + '" class="box-body dragula-container" style="min-height:50px;"></div></div>';
					return comp;
				}

				var subcomp = comp.split(' ');
				if((comp.indexOf('controller-action') >= 0) && (subcomp[0].indexOf('-') > 0)) {
					replacers[comp] = '<div class="box box-solid box-info" style="text-align:left; width:auto; margin:5px;"><div class="box-header"><h3 class="box-title">' + inflection.titleize(subcomp[0].replace('{{', '').replace('}}', '').replace(/-/g, ' ')) + '</h3></div></div>';
					return comp;
				}

				replacers[comp] = comp;
				return comp;
			});

			Object.keys(replacers).forEach(function(comp) {
				templateHTML = templateHTML.replace(comp, replacers[comp]);
			});

			return promises.all([templateHTML, dbSrvc.knex.raw('SELECT DISTINCT A.id AS position_id, A.name AS position_name, B.display_order, C.id AS widget_id, C.display_name AS widget_name FROM module_template_positions A INNER JOIN module_widget_module_template_positions B ON (A.id = B.template_position) INNER JOIN module_widgets C ON (C.id = B.module_widget) WHERE A.template = ? ORDER BY B.display_order', [request.params.id])]);
		})
		.then(function(results) {
			var templateHTML = results[0],
				widgetPositions = results[1].rows,
				$ = cheerio.load(templateHTML);

			widgetPositions.forEach(function(widgetPositionData) {
				var widgetContainer = ($('div.dragula-container#' + widgetPositionData['position_name']))[0];
				$(widgetContainer).append('<div class="box box-solid box-primary" style="max-height:90px; overflow:initial; cursor:move; text-align:left;" id="' + widgetPositionData.widget_id + '"><div class="box-header no-border"><span class="info-box-text">' + widgetPositionData.widget_name + '</span></div></div>');
			});

			return promises.all([$.html(), dbSrvc.knex.raw('SELECT id, name FROM module_template_positions WHERE template = ?', [request.params.id])]);
		})
		.then(function(results) {
			var templateHTML = results[0],
				widgetPositions = results[1].rows,
				$ = cheerio.load(templateHTML);

			widgetPositions.forEach(function(widgetPositionData) {
				var widgetContainer = ($('div.dragula-container#' + widgetPositionData['name']))[0];
				$(widgetContainer).attr('id', widgetPositionData.id);
			});

			response.status(200).send($.html());
			return null;
		})
		.catch(function(err) {
			loggerSrvc.error('Servicing request ' + request.method + ' "' + request.originalUrl + '":\nQuery: ', request.query, '\nParams: ', request.params, '\nBody: ', request.body, '\nError: ', err);
			response.sendStatus(500);
		});
	},

	'name': 'modules',
	'basePath': __dirname,
	'dependencies': ['configuration-service', 'database-service', 'logger-service']
});

exports.component = modulesComponent;
