define(
	'twyr-webapp/components/logout-widget',
	['exports', 'ember'],
	function(exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/logout-widget');
		var LogoutWidgetComponent = _ember['default'].Component.extend({
			'doLogout': function() {
				_ember['default'].$.ajax({
					'type': 'GET',
					'url': window.apiServer + 'session/logout',
					'dataType': 'json'
				})
				.always(function(data) {
					window.Cookies.remove('twyr-webapp', { 'path': '/', 'domain': '.twyrframework.com' });
					window.location.href = '/';
				});
			},

			'actions': {
				'controller-action': function(action, data) {
					if(this[action])
						this[action](data);
					else
						this.send('controller-action', action, data);
				}
			}
		});

		exports['default'] = LogoutWidgetComponent;
	}
);
