/*
 * Name			: app/modules/templates/bhairavi/template.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Bhairavi Template
 *
 */

"use strict";

/**
 * Module dependencies, required for ALL Twy'r modules
 */
var base = require('./../template-base').baseTemplate,
	prime = require('prime'),
	promises = require('bluebird');

/**
 * Module dependencies, required for this module
 */
var path = require('path');

var bhairaviTemplate = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'render': function(renderer, configuration, callback) {
		configuration.firstRowModules = false;
		configuration.secondRowModules = false;
		configuration.bottomRowModules = false;

		var positions = configuration.positions;

		// Calculate if we should even display the first row of modules, and
		// if yes, what should be the width of each position
		if((positions.module1 && positions.module1.length) || (positions.module2 && positions.module2.length) || (positions.module3 && positions.module3.length)) {
			configuration.firstRowModules = true;
			configuration.firstRowModuleWidth = 0;

			if(positions.module1 && positions.module1.length)
				configuration.firstRowModuleWidth++;

			if(positions.module2 && positions.module2.length)
				configuration.firstRowModuleWidth++;

			if(positions.module3 && positions.module3.length)
				configuration.firstRowModuleWidth++;

			configuration.firstRowModuleWidth = (12 / configuration.firstRowModuleWidth);
		}

		// Ditto the second row of modules
		if((positions.module4 && positions.module4.length) || (positions.module5 && positions.module5.length) || (positions.module6 && positions.module6.length)) {
			configuration.secondRowModules = true;
			configuration.secondRowModuleWidth = 0;

			if(positions.module4 && positions.module4.length)
				configuration.secondRowModuleWidth++;

			if(positions.module5 && positions.module5.length)
				configuration.secondRowModuleWidth++;

			if(positions.module6 && positions.module6.length)
				configuration.secondRowModuleWidth++;

			configuration.secondRowModuleWidth = (12 / configuration.secondRowModuleWidth);
		}

		// Ditto the bottom row of modules
		if((positions.module7 && positions.module7.length) || (positions.module8 && positions.module8.length) || (positions.module9 && positions.module9.length)) {
			configuration.bottomRowModules = true;
			configuration.bottomRowModuleWidth = 0;

			if(positions.module7 && positions.module7.length)
				configuration.bottomRowModuleWidth++;

			if(positions.module8 && positions.module8.length)
				configuration.bottomRowModuleWidth++;

			if(positions.module9 && positions.module9.length)
				configuration.bottomRowModuleWidth++;

			configuration.bottomRowModuleWidth = (12 / configuration.bottomRowModuleWidth);
		}

		configuration.mainContentWidth = 12;
		if(positions['left-sidebar'] && positions['left-sidebar'].length)
			configuration.mainContentWidth -= 2;

		if(positions['right-sidebar'] && positions['right-sidebar'].length)
			configuration.mainContentWidth -= 2;

		// General stuff
		configuration.baseYear = this.$module.$config.baseYear;
		configuration.currentYear = (new Date()).getUTCFullYear();
		configuration.developmentMode = ((process.env.NODE_ENV || 'development').toLowerCase() == 'development');

		// Call parent for actual rendering
		bhairaviTemplate.parent.render.call(this, renderer, configuration, function(err, renderedTmpl) {
			if(err) {
				if(callback) callback(err);
				return;
			}

			var routesRegExp = new RegExp("<!-- ROUTES -->", 'g'),
				routeHandlersRegExp = new RegExp("<!-- ROUTE_HANDLERS -->", 'g'),
				modelsRegExp = new RegExp("<!-- MODELS -->", 'g'),
				componentsRegExp = new RegExp("<!-- COMPONENTS -->", 'g'),
				componentHTMLsRegExp = new RegExp("<!-- COMPONENTHTMLS -->", 'g'),
				templatesRegExp = new RegExp("<!-- TEMPLATES -->", 'g');

			renderedTmpl = renderedTmpl.replace(routesRegExp, configuration.routes);
			renderedTmpl = renderedTmpl.replace(routeHandlersRegExp, configuration.routeHandlers);
			renderedTmpl = renderedTmpl.replace(modelsRegExp, configuration.models);
			renderedTmpl = renderedTmpl.replace(componentsRegExp, configuration.components);
			renderedTmpl = renderedTmpl.replace(componentHTMLsRegExp, configuration.componentHTMLs);
			renderedTmpl = renderedTmpl.replace(templatesRegExp, configuration.templates);

			if(callback) callback(null, renderedTmpl);
		});
	},

	'_addRoutes': function() {
		var router = this['$router'],
			serveStatic = require('serve-static');

		router.use(serveStatic(path.join(this.basePath, 'static'), {
			'index': 'index.html',
			'maxAge': 300
		}));
	},

	'name': 'bhairavi',
	'basePath': __dirname,
	'dependencies': ['express-service', 'logger-service']
});

exports.template = bhairaviTemplate;
