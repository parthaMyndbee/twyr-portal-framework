/*
 * Name			: app/modules/templates/hamsadhvani/template.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Hamsadhvani Template
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

var hamsadhvaniTemplate = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'_addRoutes': function() {
		var router = this['$router'],
			serveStatic = require('serve-static');

		router.use(serveStatic(path.join(this.basePath, 'static'), {
			'index': 'index.html',
			'maxAge': 300
		}));
	},

	'name': 'hamsadhvani',
	'basePath': __dirname,
	'dependencies': ['express-service', 'logger-service']
});

exports.template = hamsadhvaniTemplate;
