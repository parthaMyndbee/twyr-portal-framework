/*
 * Name			: index.js
 * Author		: Vish Desai (vishwakarma_d@hotmail.com)
 * Version		: 0.7.1
 * Copyright	: Copyright (c) 2014 - 2016 Vish Desai (https://www.linkedin.com/in/vishdesai).
 * License		: The MITNFA License (https://spdx.org/licenses/MITNFA.html).
 * Description	: Entry point into the Twy'r Portal Framework
 *
 */

"use strict";

/**
 * Module dependencies.
 */
var promises = require('bluebird'),
	domain = require('domain'),
	path = require('path'),
	printf = require('node-print'),
	repl = require('repl'),
	uuid = require('node-uuid');

// Get what we need - environment, and the configuration specific to that environment
var env = (process.env.NODE_ENV || 'development').toLowerCase(),
	config = require(path.join(__dirname, 'config', env, 'index-config')).config,
	numForks = Math.floor(require('os').cpus().length * config['loadFactor']);

var timeoutMonitor = {},
	clusterId = uuid.v4().toString().replace(/-/g, ''),
	cluster = promises.promisifyAll(require('cluster'));

// One log to rule them all, one log to find them...
var onlineCount = 0,
	port = 0;

process.title = config['title'];

// Instantiate the application, and start the execution
if (cluster.isMaster) {
	cluster
	.on('fork', function(worker) {
		console.log('\nForked Twyr Portal #' + worker.id);
		timeoutMonitor[worker.id] = setTimeout(function() {
			console.error('Twyr Portal #' + worker.id + ' did not start in time! KILL!!');
			worker.kill();
		}, 300000);
	})
	.on('online', function(worker, address) {
		console.log('Twyr Portal #' + worker.id + ': Now online!\n');
		clearTimeout(timeoutMonitor[worker.id]);
	})
	.on('listening', function(worker, address) {
		console.log('Twyr Portal #' + worker.id + ': Now listening\n');
		clearTimeout(timeoutMonitor[worker.id]);

		port = address.port;
	})
	.on('disconnect', function(worker) {
		console.log('Twyr Portal #' + worker.id + ': Disconnected');
		clearTimeout(timeoutMonitor[worker.id]);
		if (cluster.isMaster && config['restart']) cluster.fork();
	})
	.on('exit', function(worker, code, signal) {
		console.log('Twyr Portal #' + worker.id + ': Exited with code: ' + code + ' on signal: ' + signal);
		clearTimeout(timeoutMonitor[worker.id]);
	})
	.on('death', function(worker) {
		console.error('Twyr Portal #' + worker.pid + ': Death!');
		clearTimeout(timeoutMonitor[worker.id]);
	});

	// Setup listener for online counts
	cluster.on('message', function(msg) {
		if(msg != 'worker-online')
			return;

		onlineCount++;
		if(onlineCount < numForks)
			return;

		var networkInterfaces = require('os').networkInterfaces(),
			forPrint = [];

		for(var intIdx in networkInterfaces) {
			var thisNetworkInterface = networkInterfaces[intIdx];
			for(var addIdx in thisNetworkInterface) {
				var thisAddress = thisNetworkInterface[addIdx];
				forPrint.push({
					'Interface': intIdx,
					'Protocol': thisAddress.family,
					'Address': thisAddress.address,
					'Port': port
				});
			}
		}

		console.log('\n\n' + process.title + ' Listening On:');
		if (forPrint.length) printf.printTable(forPrint);
		console.log('\n\n');
	});

	// Fork workers.
	for (var i = 0; i < numForks; i++) {
		cluster.fork();
	}

	// In development mode (i.e., start as "npm start"), wait for input from command line
	// In other environments, start a telnet server and listen for the exit command
	if(env == 'development') {
		var replConsole = repl.start(config.repl);
		replConsole.on('exit', function() {
			console.log('Twyr Portal Master: Stopping now...');
			config['restart'] = false;

			for(var id in cluster.workers) {
				(cluster.workers[id]).send('terminate');
			}
		});
	}
	else {
		var telnetServer = require('net').createServer(function(socket) {
			config.repl.parameters.input = socket;
			config.repl.parameters.output = socket;

			var replConsole = repl.start(config.repl.parameters);
			replConsole.context.socket = socket;

			replConsole.on('exit', function() {
				console.log('Twyr Portal Master: Stopping now...');
				config['restart'] = false;

				for(var id in cluster.workers) {
					(cluster.workers[id]).send('terminate');
				}

				socket.end();
				telnetServer.close();
			});
		});

		telnetServer.listen(config.repl.controlPort, config.repl.controlHost);
	}
}
else {
	// Worker processes have a Twyr Portal running in their own
	// domain so that the rest of the process is not infected on error
	var serverDomain = domain.create(),
		TwyrPortal = require(config['main']).twyrPortal,
		twyrPortal = promises.promisifyAll(new TwyrPortal(null, clusterId, cluster.worker.id));

	var startupFn = function () {
		var allStatuses = [];
		if(!twyrPortal) return;

		// Call load / initialize / start...
		twyrPortal.loadAsync(null)
		.timeout(60000)
		.then(function(status) {
			allStatuses.push('Twyr Portal #' + cluster.worker.id + '::Load status:\n' + JSON.stringify(status, null, '\t') + '\n\n');
			if(!status) throw status;

			return twyrPortal.initializeAsync();
		})
		.timeout(60000)
		.then(function(status) {
			allStatuses.push('Twyr Portal #' + cluster.worker.id + '::Initialize status:\n' + JSON.stringify(status, null, '\t') + '\n\n');
			if(!status) throw status;

			return twyrPortal.startAsync(null);
		})
		.timeout(60000)
		.then(function(status) {
			allStatuses.push('Twyr Portal #' + cluster.worker.id + '::Start Status:\n' + JSON.stringify(status, null, '\t') + '\n\n');
			if(!status) throw status;

			return null;
		})
		.timeout(60000)
		.catch(function(err) {
			console.error('\n\n' + 'Twyr Portal #' + cluster.worker.id + '::Startup Error:\n', err, '\n\n');
	        cluster.worker.disconnect();
		})
		.finally(function () {
			console.log(allStatuses.join('\n'));
			process.send('worker-online');
			return null;
		});
	};

	var shutdownFn = function () {
		var allStatuses = [];
		if(!twyrPortal) return;

		twyrPortal.stopAsync()
		.timeout(60000)
		.then(function (status) {
			allStatuses.push('Twyr Portal #' + cluster.worker.id + '::Stop Status:\n' + JSON.stringify(status, null, '\t') + '\n\n');
			if (!status) throw status;

			return twyrPortal.uninitializeAsync();
		})
		.timeout(60000)
		.then(function (status) {
			allStatuses.push('Twyr Portal #' + cluster.worker.id + '::Uninitialize Status:\n' + JSON.stringify(status, null, '\t') + '\n\n');
			if (!status) throw status;

			return twyrPortal.unloadAsync();
		})
		.timeout(60000)
		.then(function (status) {
			allStatuses.push('Twyr Portal #' + cluster.worker.id + '::Unload Status:\n' + JSON.stringify(status, null, '\t') + '\n\n');
			if (!status) throw status;

			return null;
		})
		.timeout(60000)
		.then(function() {
	        cluster.worker.disconnect();
			timeoutMonitor[cluster.worker.id] = setTimeout(function() {
				cluster.worker.kill();
			}, 2000);

			timeoutMonitor[cluster.worker.id].unref();
			return null;
		})
		.catch(function (err) {
			console.error('\n\n' + 'Twyr Portal #' + cluster.worker.id + '::Shutdown Error:\n', err, '\n\n');
		})
		.finally(function () {
			console.log(allStatuses.join('\n'));
			return null;
		});
	};

	process.on('message', function(msg) {
		if(msg != 'terminate') return;
		shutdownFn();
	});

	serverDomain.on('error', function(err) {
		console.error('Twyr Portal #' + cluster.worker.id + '::Domain Error:\n', JSON.stringify(err, null, '\t'));
		shutdownFn();
	});

	process.on('uncaughtException', function(err) {
		console.error('Twyr Portal #' + cluster.worker.id + '::Process Error: ', JSON.stringify(err, null, '\t'));
		shutdownFn();
	});

	serverDomain.run(startupFn);
}
