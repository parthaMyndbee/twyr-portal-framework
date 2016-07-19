define(
	'twyr-webapp/components/logout-widget',
	['exports', 'ember', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/logout-widget');
		var LogoutWidgetComponent = _baseWidget['default'].extend({
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
			}
		});

		exports['default'] = LogoutWidgetComponent;
	}
);
