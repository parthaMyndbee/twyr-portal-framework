
define(
	'twyr-portal/routes/application',
	['exports', 'ember'],
	function(exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/routes/application');
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
	'twyr-portal/controllers/application',
	['exports', 'ember'],
	function(exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/controllers/application');
		var ApplicationController = _ember['default'].Controller.extend({
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
