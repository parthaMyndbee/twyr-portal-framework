define(
	'twyr-webapp/components/media-default-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-default-widget');
		var MediaDefaultWidget = _baseWidget['default'].extend({
			'selectedMedia': null,

			'selected-media-changed': function(mediaId) {
				var self = this;
				if(self.get('selectedMedia') && (self.get('selectedMedia').get('id') == mediaId))
					return;

				self.get('store')
				.findRecord('media-default', mediaId)
				.then(function(media) {
					self.set('selectedMedia', media);
				})
				.catch(function(err) {
					self.set('selectedMedia', null);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			},

			'change-folder': function(folderId) {
				this['selected-media-changed'](folderId);
			}
		});

		exports['default'] = MediaDefaultWidget;
	}
);
