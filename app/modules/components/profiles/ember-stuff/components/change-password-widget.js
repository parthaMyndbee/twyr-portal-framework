define(
	'twyr-webapp/components/change-password-widget',
	['exports', 'ember'],
	function(exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/change-password-widget');
		var ChangePasswordWidget = _ember['default'].Component.extend({
			'currentPassword': '',
			'newPassword1': '',
			'newPassword2': '',

			'save': function() {
				var self = this;

				_ember['default'].$.ajax({
					'type': 'POST',
					'url': window.apiServer + 'profiles/change-password',

					'dataType': 'json',
					'data': {
						'currentPassword': self.get('currentPassword'),
						'newPassword1': self.get('newPassword1'),
						'newPassword2': self.get('newPassword2')
					}
				})
				.done(function(data) {
					if(data.status) {
						self.sendAction('controller-action', 'display-status-message', {
							'type': 'success',
							'message': 'Password changed'
						});
					}
					else {
						self.sendAction('controller-action', 'display-status-message', {
							'type': 'error',
							'message': data.responseText
						});
					}

					self.cancel();
				})
				.fail(function(err) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.responseJSON.message
					});

					self.cancel();
				});
			},

			'cancel': function() {
				this.setProperties({
					'currentPassword': '',
					'newPassword1': '',
					'newPassword2': ''
				});
			},

			'passwordChanged': _ember['default'].observer('currentPassword', 'newPassword1', 'newPassword2', function(self, property) {
				if((self.get('currentPassword') == '') && (self.get('newPassword1') == '') && (self.get('newPassword2') == '')) {
					self.$('button').attr('disabled', true);
					return;
				}

				if((self.get('currentPassword') != '') || (self.get('newPassword1') != '') || (self.get('newPassword2') != '')) {
					self.$('button.btn-warning').removeAttr('disabled');

					if((self.get('currentPassword') != '') && (self.get('newPassword1') != '') && (self.get('newPassword1') == self.get('newPassword2')))
						self.$('button.btn-primary').removeAttr('disabled');
					else
						self.$('button.btn-primary').attr('disabled', true);
				}
			}),

			'actions': {
				'controller-action': function(action, data) {
					if(this[action])
						this[action](data);
					else
						this.sendAction('controller-action', action, data);
				}
			}
		});

		exports['default'] = ChangePasswordWidget;
	}
);
