define(
	'twyr-webapp/components/profile-widget',
	['exports', 'ember', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/profile-widget');
		var ProfileWidget = _baseWidget['default'].extend({
			'imageSource': 'profiles/get-image',
			'profileModels': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				self.set('profileModels', self.get('store').peekAll('profile'));
			},

			'onProfileImageChanged': _ember['default'].observer('profileModels.@each.profileImage', function() {
				this.set('imageSource', 'profiles/get-image?_random=' + window.moment().valueOf());
			})
		});

		exports['default'] = ProfileWidget;
	}
);
