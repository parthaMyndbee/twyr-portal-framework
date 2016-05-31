define(
	'twyr-portal/components/login-widget',
	['exports', 'ember'],
	function(exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/components/login-widget');
		var LoginWidgetComponent = _ember['default'].Component.extend({
			'actions': {
				'controller-action': function(action, data) {
					if(this[action])
						this[action](data);
					else
						this.send('controller-action', action, data);
				}
			}
		});

		exports['default'] = LoginWidgetComponent;
	}
);
