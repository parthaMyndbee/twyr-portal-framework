define(
	'twyr-webapp/components/base-widget',
	['exports', 'ember', 'twyr-webapp/application'],
	function(exports, _ember, _app) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/base-widget');
		var BaseWidget = _ember['default'].Component.extend({
			'store': _ember['default'].inject.service(),

			'actions': {
				'controller-action': function(action, data) {
					if(this[action])
						this[action](data);
					else
						this.sendAction('controller-action', action, data);
				}
			}
		});

		exports['default'] = BaseWidget;
	}
);
