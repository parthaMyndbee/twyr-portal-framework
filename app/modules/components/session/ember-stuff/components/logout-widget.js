define(
	'twyr-portal/components/logout-widget',
	['exports', 'ember'],
	function(exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/components/logout-widget');
		var LogoutWidgetComponent = _ember['default'].Component.extend({
			'doLogout': function() {
				_ember['default'].$.ajax({
					'type': 'GET',
					'url': window.apiServer + 'session/logout',
					'dataType': 'json',

					'success': function(data) {
						window.location.href = '/';
					},

					'error': function(err) {
						window.location.href = '/';
					}
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
