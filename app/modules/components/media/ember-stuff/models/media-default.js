define(
	'twyr-webapp/adapters/media-default',
	['exports', 'ember-data/adapters/json-api'],
	function(exports, _jsonapiAdapter) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/adapters/media-default');

		var MediaDefaultAdapter = _jsonapiAdapter['default'].extend({
			'namespace': 'media'
		});

		exports['default'] = MediaDefaultAdapter;
	}
);

define(
	'twyr-webapp/models/media-default',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/media-default');
		var MediaModel = _twyrBaseModel['default'].extend({
			'name': _attr['default']('string'),
			'type': _attr['default']('string'),
			'size': _attr['default']('number'),

			'parent': _relationships.belongsTo('media-default', { 'inverse': 'children', 'async': true }),
			'children': _relationships.hasMany('media-default', { 'inverse': 'parent', 'async': true }),

			'isFolder': _ember['default'].computed('type', {
				'get': function(key) {
					return (this.get('type') == 'folder');
				}
			}).readOnly(),

			'isFile': _ember['default'].computed('type', {
				'get': function(key) {
					return (this.get('type') == 'file');
				}
			}).readOnly(),

			'displaySize': _ember['default'].computed('size', {
				'get': function(key) {
					var rBytes = this.get('size');
					if(rBytes < 1024) {
						return rBytes + 'B';
					}

					rBytes = rBytes / 1024;
					if(rBytes < 1024) {
						return rBytes.toFixed(2) + 'KB';
					}

					rBytes = rBytes / 1024;
					if(rBytes < 1024) {
						return rBytes.toFixed(2) + 'MB';
					}

					rBytes = rBytes / 1024;
					if(rBytes < 1024) {
						return rBytes.toFixed(2) + 'GB';
					}

					rBytes = rBytes / 1024;
					if(rBytes < 1024) {
						return rBytes.toFixed(2) + 'TB';
					}

					rBytes = rBytes / 1024;
					return rBytes.toFixed(2) + 'PB';
				}
			}).readOnly(),

			'childFolders': _ember['default'].computed('children.@each.type', {
				'get': function(key) {
					return (this.get('children').filterBy('isFolder', true).sort(function(left, right) {
						return (left.get('name') <= right.get('name'));
					}));
				}
			}).readOnly(),

			'childFiles': _ember['default'].computed('children.@each.type', {
				'get': function(key) {
					return (this.get('children').filterBy('isFile', true).sort(function(left, right) {
						return (left.get('name') <= right.get('name'));
					}));
				}
			}).readOnly(),

			'isGridDisplay': _ember['default'].computed('mediaDisplayType', {
				'get': function(key) {
					return (this.get('mediaDisplayType') == 'media-grid-display-view-widget');
				}
			}).readOnly(),

			'isCompactDisplay': _ember['default'].computed('mediaDisplayType', {
				'get': function(key) {
					return (this.get('mediaDisplayType') == 'media-compact-display-view-widget');
				}
			}).readOnly(),

			'isListDisplay': _ember['default'].computed('mediaDisplayType', {
				'get': function(key) {
					return (this.get('mediaDisplayType') == 'media-list-display-view-widget');
				}
			}).readOnly()
		});

		exports['default'] = MediaModel;
	}
);
