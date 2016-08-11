define(
	'twyr-webapp/components/media-editor-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-editor-widget');
		var MediaEditorWidget = _baseWidget['default'].extend({
			'folderPathSegments': undefined,

			'onModelChanged': _ember['default'].observer('model', function() {
				var self = this;
				if(!self.get('model'))
					return;

				if(!this.get('model').get('mediaDisplayType')) {
					this.get('model').set('mediaDisplayType', 'media-grid-display-view-widget');
				}

				var segments = self.get('model').get('id').split('/').filter(function(segment) {
					return (segment.trim() != '');
				});

				segments.unshift('Root');
				self.set('folderPathSegments', segments);
			}),

			'change-folder': function(folder) {
				var self = this,
					indexOfFolder = self.get('folderPathSegments').indexOf(folder);
					newId = undefined;

				if(indexOfFolder < 0) {
					newId = folder;
				}

				if(indexOfFolder == 0) {
					newId = '/';
				}

				if(indexOfFolder > 0) {
					newId = self.get('folderPathSegments').slice(1, (indexOfFolder + 1)).join('/');
				}

				self.sendAction('controller-action', 'change-folder', newId);
			},

			'change-display-view': function(displayType) {
				this.get('model').set('mediaDisplayType', 'media-' + displayType + '-display-view-widget');
			}
		});

		exports['default'] = MediaEditorWidget;
	}
);

define(
	'twyr-webapp/components/base-media-display-view-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/base-media-display-view-widget');
		var BaseMediaDisplayViewWidget = _baseWidget['default'].extend({
		});

		exports['default'] = BaseMediaDisplayViewWidget;
	}
);

define(
	'twyr-webapp/components/media-grid-display-view-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-view-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-grid-display-view-widget');
		var GridMediaDisplayViewWidget = _baseWidget['default'].extend({
		});

		exports['default'] = GridMediaDisplayViewWidget;
	}
);

define(
	'twyr-webapp/components/media-compact-display-view-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-view-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-compact-display-view-widget');
		var CompactMediaDisplayViewWidget = _baseWidget['default'].extend({
		});

		exports['default'] = CompactMediaDisplayViewWidget;
	}
);

define(
	'twyr-webapp/components/media-list-display-view-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-view-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-list-display-view-widget');
		var ListMediaDisplayViewWidget = _baseWidget['default'].extend({
		});

		exports['default'] = ListMediaDisplayViewWidget;
	}
);
