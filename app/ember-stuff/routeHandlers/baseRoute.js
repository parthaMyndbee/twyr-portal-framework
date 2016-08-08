
define(
	'twyr-webapp/routes/application',
	['exports', 'ember'],
	function(exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/routes/application');
		var ApplicationRoute = _ember['default'].Route.extend({
			'actions': {
				'controller-action': function(action, data) {
					this.get('controller').send('controller-action', action, data);
				}
			}
		});

		exports['default'] = ApplicationRoute;
	}
);

define(
	'twyr-webapp/controllers/application',
	['exports', 'ember'],
	function(exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/controllers/application');
		var ApplicationController = _ember['default'].Controller.extend({
			'realtimeData': window.Ember.inject.service('realtime-data'),

			'init': function() {
				this._super(...arguments);

				var self = this;
				this.get('realtimeData').on('websocket-data::display-status-message', function(data) {
					self['display-status-message']({ 'type': 'info', 'message': data});
				});
			},

			'resetStatusMessages': function(timeout) {
				window.Ember.$('div#template-status-message').slideUp(timeout || 600);
				window.Ember.$('div#template-status-message span').text('');

				window.Ember.$('div#template-error-message').slideUp(timeout || 600);
				this.set('errorModel', null);
			},

			'display-status-message': function(data) {
				this.resetStatusMessages(2);

				if(data.type != 'ember-error') {
					window.Ember.$('div#template-status-message').addClass('callout-' + data.type);
					window.Ember.$('div#template-status-message span').html(data.message);

					window.Ember.$('div#template-status-message').slideDown(600);
				}
				else {
					this.set('errorModel', data.errorModel);
					window.Ember.$('div#template-error-message').slideDown(600);
				}

				var self = this;
				window.Ember.run.later(self, function() {
					window.Ember.$('div#template-status-message').removeClass('callout-' + data.type);
					self.resetStatusMessages(600);
				}, 10000);
			},

			'actions': {
				'controller-action': function(action, data) {
					if(this[action])
						this[action](data);
					else
						console.log('TODO: Handle ' + action + ' action with data: ', data);
				}
			}
		});

		exports['default'] = ApplicationController;
	}
);

define(
	'twyr-webapp/services/realtime-data',
	['exports', 'ember', 'twyr-webapp/application'],
	function(exports, _ember, _app) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/services/realtime-data');

		var RealtimeService = _ember['default'].Service.extend(_ember['default'].Evented, {
			'init': function() {
				if(window.developmentMode) console.log('twyr-webapp/services/websockets::init: ', arguments);

				var self = this,
					dataProcessor = self._websocketDataProcessor.bind(self),
					streamer = window.Primus.connect(window.apiServer, {
						'strategy': 'online, timeout, disconnect',
						'reconnect': {
							'min': 1000,
							'max': Infinity,
							'retries': 25
						},

						'ping': 3000,
						'pong': 6000
					});

				streamer.on('open', function() {
					if(window.developmentMode) console.log('twyr-webapp/services/websockets::streamer::on::open: ', arguments);

					self.get('streamer').on('data', dataProcessor);
					self.trigger('websocket-connection');
				});

				streamer.on('reconnect', function() {
					if(window.developmentMode) console.log('twyr-webapp/services/websockets::streamer::on::reconnect: ', arguments);
				});

				streamer.on('reconnect scheduled', function() {
					if(window.developmentMode) console.log('twyr-webapp/services/websockets::streamer::on::reconnect scheduled: ', arguments);
				});

				streamer.on('reconnected', function() {
					if(window.developmentMode) console.log('twyr-webapp/services/websockets::streamer::on::reconnected: ', arguments);

					self.get('streamer').on('data', dataProcessor);
					self.trigger('websocket-connection');
				});

				streamer.on('reconnect timeout', function() {
					if(window.developmentMode) console.log('twyr-webapp/services/websockets::streamer::on::reconnect timeout: ', arguments);
				});

				streamer.on('reconnect failed', function() {
					if(window.developmentMode) console.log('twyr-webapp/services/websockets::streamer::on::reconnect failed: ', arguments);
				});

				streamer.on('close', function() {
					if(window.developmentMode) console.log('twyr-webapp/services/websockets::streamer::on::close: ', arguments);
					self.trigger('websocket-disconnection');
					self.get('streamer').off('data', dataProcessor);
				});

				streamer.on('end', function() {
					if(window.developmentMode) console.log('twyr-webapp/services/websockets::streamer::on::end: ', arguments);
					self.trigger('websocket-disconnection');
					self.get('streamer').off('data', dataProcessor);
				});

				streamer.on('error', function() {
					if(window.developmentMode) console.error('twyr-webapp/services/websockets::streamer::on::error: ', arguments);
					self.trigger('websocket-error');
				});

				self.set('streamer', streamer);
				self._super(...arguments);
			},

			'_websocketDataProcessor': function(websocketData) {
				if(window.developmentMode) console.log('twyr-webapp/services/websockets::streamer::on::data: ', websocketData);
				this.trigger('websocket-data::' + websocketData.channel, websocketData.data);
			}
		});

		exports['default'] = RealtimeService;
	}
);
