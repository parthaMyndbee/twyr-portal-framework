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
					return (this.get('type') != 'folder');
				}
			}).readOnly(),

			'displaySize': _ember['default'].computed('size', {
				'get': function(key) {
					var rBytes = this.get('size');
					if(rBytes == 0) return '0B';

					var i = Math.floor(Math.log(rBytes) / Math.log(1024)),
						sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

					return (rBytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
				}
			}).readOnly(),

			'displayIcon': _ember['default'].computed('type', {
				'get': function(key) {
					var faClass = '';
					switch(this.get('type')) {
						case 'folder':
							faClass = 'fa fa-folder';
						break;

						case 'audio':
							faClass = 'fa fa-file-audio-o';
						break;

						case 'document':
							faClass = 'fa fa-file-word-o';
						break;

						case 'image':
							faClass = 'fa fa-file-image-o';
						break;

						case 'pdf':
							faClass = 'fa fa-file-pdf-o';
						break;

						case 'presentation':
							faClass = 'fa fa-file-powerpoint-o';
						break;

						case 'sheet':
						case 'spreadsheet':
							faClass = 'fa fa-file-excel-o';
						break;

						case 'text':
							faClass = 'fa fa-file-text-o';
						break;

						case 'video':
							faClass = 'fa fa-file-movie-o';
						break;

						case 'zip':
							faClass = 'fa fa-file-archive-o';
						break;

						default:
							faClass = 'fa fa-file-o';
						break;
					}

					return faClass;
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
