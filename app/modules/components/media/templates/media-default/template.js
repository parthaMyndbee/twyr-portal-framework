/*
 * Name			: app/modules/components/media/templates/media-default/template.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Media Component Default Template
 *
 */

"use strict";

/**
 * Module dependencies, required for ALL Twy'r modules
 */
var base = require('./../../../../templates/template-base').baseTemplate,
	prime = require('prime'),
	promises = require('bluebird');

/**
 * Module dependencies, required for this module
 */
var path = require('path');

var mediaDefaultTemplate = prime({
	'inherits': base,

	'constructor': function(module) {
		base.call(this, module);
	},

	'name': 'media-default',
	'basePath': __dirname,
	'dependencies': []
});

exports.template = mediaDefaultTemplate;
