define(
	'twyr-portal/components/profile-contacts-widget',
	['exports', 'ember'],
	function(exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/components/profile-contacts-widget');
		var ProfileContactsWidget = _ember['default'].Component.extend({
			'actions': {
				'controller-action': function(action, data) {
					if(this[action])
						this[action](data);
					else
						this.sendAction('controller-action', action, data);
				}
			}
		});

		exports['default'] = ProfileContactsWidget;
	}
);
