define(
	'twyr-webapp/components/profile-widget',
	['exports', 'ember'],
	function(exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/profile-widget');
		var ProfileWidget = _ember['default'].Component.extend({
			'actions': {
				'controller-action': function(action, data) {
					if(this[action])
						this[action](data);
					else
						this.sendAction('controller-action', action, data);
				}
			}
		});

		exports['default'] = ProfileWidget;
	}
);
