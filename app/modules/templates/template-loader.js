/*
 * Name			: app/modules/templates/template-loader.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal Templates dependency manager and template loader
 *
 */

"use strict";

/**
 * Module dependencies, required for ALL Twy'r modules
 */
var prime = require('prime'),
	promises = require('bluebird');

/**
 * Module dependencies, required for this module
 */
var baseLoader = require('./../../module-loader').loader,
	path = require('path');

var templateLoader = prime({
	'inherits': baseLoader,

	'constructor': function(module) {
		baseLoader.call(this, module);
	},

	'load': function(configSrvc, basePath, callback) {
		Object.defineProperty(this, '$basePath', {
			'__proto__': null,
			'value': path.resolve(basePath)
		});

		if(callback) callback(null, true);
	},

	'initialize': function(callback) {
		if(callback) callback(null, true);
	},

	'start': function(callback) {
		if(callback) callback(null, true);
	},

	'stop': function(callback) {
		if(callback) callback(null, true);
	},

	'uninitialize': function(callback) {
		if(callback) callback(null, true);
	},

	'unload': function(callback) {
		if(callback) callback(null, true);
	}
});

exports.loader = templateLoader;
