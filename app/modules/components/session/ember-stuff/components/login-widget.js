define(
	'twyr-webapp/components/login-widget',
	['exports', 'ember', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/login-widget');
		var LoginWidgetComponent = _baseWidget['default'].extend({
			'username': '',
			'password': '',

			'resetUsername': '',

			'registerUsername': '',
			'registerFirstname': '',
			'registerLastname': '',

			'usernameChanged': _ember['default'].observer('username', 'resetUsername', function(self, property) {
				var constraints = {
						'username': {
							'presence': true,
							'email': {
								'message': '%value does not look like it\'s a valid email'
							}
						}
					},
					buttonElem = null;

				switch(property) {
					case 'username':
						buttonElem = self.$('button#login-button-submit');
						break;

					case 'resetUsername':
						buttonElem = self.$('button#reset-password-button-submit');
						break;
				};

				var validatorResults = window.validate({ 'username': self.get(property) }, constraints);
				if(validatorResults == undefined) {
					buttonElem.addClass('btn-primary');
					buttonElem.removeAttr('disabled', 'disabled');
				}
				else {
					buttonElem.removeClass('btn-primary');
					buttonElem.attr('disabled', true);
				}
			}),

			'newAccountFormChanged': _ember['default'].observer('registerUsername', 'registerFirstname', 'registerLastname', function(self) {
				var constraints = {
					'registerUsername': {
						'presence': true,
						'email': {
							'message': '%value does not look like it\'s a valid email'
						}
					},

					'registerFirstname': {
						'presence': true
					},

					'registerLastname': {
						'presence': true
					}
				};

				var validatorResults = window.validate({
					'registerUsername': self.get('registerUsername'),
					'registerFirstname': self.get('registerFirstname'),
					'registerLastname': self.get('registerLastname')
				}, constraints);

				if(validatorResults == undefined) {
					self.$('button#register-account-button-submit').addClass('btn-primary');
					self.$('button#register-account-button-submit').removeAttr('disabled', 'disabled');
				}
				else {
					self.$('button#register-account-button-submit').removeClass('btn-primary');
					self.$('button#register-account-button-submit').attr('disabled', true);
				}
			}),

			'resetAllForms': function() {
				this.resetLoginForm();
				this.resetForgotPasswordForm();
				this.resetRegisterAccountForm();
				this.resetStatusMessages();
			},

			'lockAllForms': function() {
				this.lockLoginForm();
				this.lockForgotPasswordForm();
				this.lockRegisterAccountForm();
			},

			'resetLoginForm': function() {
				this.resetStatusMessages();
				this.lockLoginForm();

				this.set('username', '');
				this.set('password', '');
			},

			'lockLoginForm': function() {
				this.$('button#login-button-submit').removeClass('btn-primary');
				this.$('button#login-button-submit').attr('disabled', 'disabled');
			},

			'resetForgotPasswordForm': function() {
				this.resetStatusMessages();
				this.lockForgotPasswordForm();

				this.set('resetUsername', '');
			},

			'lockForgotPasswordForm': function() {
				this.$('button#reset-password-button-submit').removeClass('btn-primary');
				this.$('button#reset-password-button-submit').attr('disabled', 'disabled');
			},

			'resetRegisterAccountForm': function() {
				this.resetStatusMessages();
				this.lockRegisterAccountForm();

				this.set('registerUsername', '');
				this.set('registerFirstname', '');
				this.set('registerLastname', '');
			},

			'lockRegisterAccountForm': function() {
				this.$('button#register-account-button-submit').removeClass('btn-primary');
				this.$('button#register-account-button-submit').attr('disabled', 'disabled');
			},

			'resetStatusMessages': function(timeout) {
				this.$('div#div-login-component-alert-message').slideUp(timeout || 600);
				this.$('span#login-component-alert-message').text('');

				this.$('div#div-login-component-progress-message').slideUp(timeout || 600);
				this.$('span#login-component-progress-message').text('');

				this.$('div#div-login-component-success-message').slideUp(timeout || 600);
				this.$('span#login-component-success-message').text('');
			},

			'showStatusMessage': function(statusMessageType, messageText) {
				this.resetStatusMessages(2);

				this.$('span#login-component-' + statusMessageType + '-message').html(messageText);
				this.$('div#div-login-component-' + statusMessageType + '-message').slideDown(600);
			},

			'showLoginForm': function() {
				this.$('div#div-box-body-register-account').slideUp(600);
				this.$('div#div-box-body-reset-password').slideUp(600);

				this.resetLoginForm();
				this.$('div#div-box-body-login').slideDown(600);
			},

			'showResetPasswordForm': function() {
				this.$('div#div-box-body-login').slideUp(600);
				this.$('div#div-box-body-register-account').slideUp(600);

				this.resetForgotPasswordForm();
				this.$('div#div-box-body-reset-password').slideDown(600);
			},

			'showNewAccountForm': function() {
				this.$('div#div-box-body-login').slideUp(600);
				this.$('div#div-box-body-reset-password').slideUp(600);

				this.resetRegisterAccountForm();
				this.$('div#div-box-body-register-account').slideDown(600);
			},

			'doLogin': function() {
				var self = this;

				self.lockLoginForm();
				self.showStatusMessage('progress', 'Logging you in...');

				_ember['default'].$.ajax({
					'type': 'POST',
					'url': window.apiServer + 'session/login',

					'dataType': 'json',
					'data': {
						'username': self.get('username'),
						'password': self.get('password')
					}
				})
				.done(function(data) {
					if(data.status) {
						self.showStatusMessage('success', data.responseText);
						_ember['default'].run.later(self, function() {
							window.location.href = '/';
						}, 500);
					}
					else {
						self.showStatusMessage('alert', data.responseText);
						self.resetLoginForm();

						_ember['default'].run.later(self, function() {
							self.resetStatusMessages();
						}, 5000);
					}
				})
				.fail(function(err) {
					self.showStatusMessage('alert', (err.responseJSON ? err.responseJSON.responseText : (err.responseText || 'Unknown error' )));
					self.resetLoginForm();

					_ember['default'].run.later(self, function() {
						self.resetStatusMessages();
					}, 5000);
				});
			},

			'doSocialLogin': function(socialNetwork) {
				var currentLocation = window.location.href;
				window.location.href = window.apiServer + 'session/' + socialNetwork + '?currentLocation=' + currentLocation;
			},

			'resetPassword': function() {
				var self = this;

				self.lockForgotPasswordForm();
				self.showStatusMessage('progress', 'Resetting your password...');

				_ember['default'].$.ajax({
					'type': 'POST',
					'url': window.apiServer + 'session/resetPassword',

					'dataType': 'json',
					'data': {
						'username': this.get('resetUsername')
					}
				})
				.done(function(data) {
					if(data.status) {
						self.showStatusMessage('success', data.responseText);

						_ember['default'].run.later(self, function() {
							self.resetForgotPasswordForm();
							self.resetStatusMessages();
						}, 5000);
					}
					else {
						self.showStatusMessage('alert', data.responseText);
						self.resetForgotPasswordForm();

						_ember['default'].run.later(self, function() {
							self.resetStatusMessages();
						}, 5000);
					}
				})
				.fail(function(err) {
					self.showStatusMessage('alert', (err.responseJSON ? err.responseJSON.responseText : (err.responseText || 'Unknown error' )));
					self.resetForgotPasswordForm();

					_ember['default'].run.later(self, function() {
						self.resetStatusMessages();
					}, 5000);
				});
			},

			'registerAccount': function() {
				var self = this;

				self.lockRegisterAccountForm();
				self.showStatusMessage('progress', 'Creating your account...');

				_ember['default'].$.ajax({
					'type': 'POST',
					'url': window.apiServer + 'session/registerAccount',

					'dataType': 'json',
					'data': {
						'username': self.get('registerUsername'),
						'firstname': self.get('registerFirstname'),
						'lastname': self.get('registerLastname')
					}
				})
				.done(function(data) {
					if(data.status) {
						self.showStatusMessage('success', data.responseText);

						_ember['default'].run.later(self, function() {
							self.resetRegisterAccountForm();
							self.resetStatusMessages();
						}, 5000);
					}
					else {
						self.showStatusMessage('alert', data.responseText);
						self.resetRegisterAccountForm();

						_ember['default'].run.later(self, function() {
							self.resetStatusMessages();
						}, 5000);
					}
				})
				.fail(function(err) {
					self.showStatusMessage('alert', (err.responseJSON ? err.responseJSON.responseText : (err.responseText || 'Unknown error' )));
					self.resetRegisterAccountForm();

					_ember['default'].run.later(self, function() {
						self.resetStatusMessages();
					}, 5000);
				});
			}
		});

		exports['default'] = LoginWidgetComponent;
	}
);
