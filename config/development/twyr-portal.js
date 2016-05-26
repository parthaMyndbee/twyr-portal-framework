/*
 * Name			: config/development/twyr-portal.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: The Twy'r Portal application-level configuration parameters
 *
 */

"use strict";

exports.config = ({
	'utilities': {
		'path': './modules/utilities'
	},

	'services': {
		'path': './modules/services'
	},

	'components': {
		'path': './modules/components'
	},

	'templates': {
		'path': './modules/templates'
	},

	'apiServer': {
		'protocol': 'http',
		'host': 'local-api.twyrframework.com',
		'port': 9090
	},

	'baseYear': '2014'
});
