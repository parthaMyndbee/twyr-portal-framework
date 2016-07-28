define(
	'twyr-webapp/components/menu-edit-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/menu-edit-widget');
		var MenuEditWidget = _baseWidget['default'].extend({
			'didInsertElement': function() {
				var typeSelectElem = _ember['default'].$('select#menu-edit-widget-select-type-' + this.get('model').get('id')),
					statusSelectElem = _ember['default'].$('select#menu-edit-widget-select-status-' + this.get('model').get('id')),
					permissionSelectElem = _ember['default'].$('select#menu-edit-widget-select-permission-' + this.get('model').get('id')),
					self = this;

				self._super(...arguments);

				typeSelectElem.select2({
					'minimumInputLength': 0,
					'minimumResultsForSearch': 10,

					'allowClear': true,
					'closeOnSelect': true,

					'placeholder': 'Menu Type'
				})
				.on('change', function() {
					self.get('model').set('type', typeSelectElem.val());
				});

				_ember['default'].$.ajax({
					'url': window.apiServer + 'menus/type-list',
					'dataType': 'json',
					'cache': true
				})
				.done(function(data) {
					typeSelectElem.html('');
					_ember['default'].$.each(data, function(index, item) {
						var thisOption = new Option(_ember['default'].String.capitalize(item), item, false, false);
						typeSelectElem.append(thisOption);
					});

					typeSelectElem.val(self.get('model').get('type')).trigger('change');
				})
				.fail(function() {
					console.error(window.apiServer + 'masterdata/publish-status-list error:\n', arguments);
				});


				statusSelectElem.select2({
					'minimumInputLength': 0,
					'minimumResultsForSearch': 10,

					'allowClear': true,
					'closeOnSelect': true,

					'placeholder': 'Publish Status'
				})
				.on('change', function() {
					self.get('model').set('status', statusSelectElem.val());
				});

				_ember['default'].$.ajax({
					'url': window.apiServer + 'masterdata/publish-status-list',
					'dataType': 'json',
					'cache': true
				})
				.done(function(data) {
					statusSelectElem.html('');
					_ember['default'].$.each(data, function(index, item) {
						var thisOption = new Option(_ember['default'].String.capitalize(item), item, false, false);
						statusSelectElem.append(thisOption);
					});

					statusSelectElem.val(self.get('model').get('status')).trigger('change');
				})
				.fail(function() {
					console.error(window.apiServer + 'masterdata/publish-status-list error:\n', arguments);
				});


				permissionSelectElem.select2({
					'minimumInputLength': 0,
					'minimumResultsForSearch': 10,

					'allowClear': true,
					'closeOnSelect': true,

					'placeholder': 'View Permission'
				})
				.on('change', function() {
					self.get('model').set('permission', permissionSelectElem.val());
				});

				_ember['default'].$.ajax({
					'url': window.apiServer + 'masterdata/server-permissions',
					'dataType': 'json',
					'cache': true
				})
				.done(function(data) {
					permissionSelectElem.html('');
					_ember['default'].$.each(data, function(index, item) {
						var thisOption = new Option(item.name, item.id, false, false);
						permissionSelectElem.append(thisOption);
					});

					if(self.get('model').get('permission'))
						permissionSelectElem.val(self.get('model').get('permission')).trigger('change');
					else
						permissionSelectElem.val(data[0].id).trigger('change');
				})
				.fail(function() {
					console.error(window.apiServer + 'masterdata/server-permissions error:\n', arguments);
				});
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				self.get('model').set('isEditing', false);
			},

			'menuStateChanged': _ember['default'].observer('model.hasDirtyAttributes', 'model.menuItems.@each.hasDirtyAttributes', function() {
				var self = this;

				self.get('model').get('menuItems')
				.then(function(menuItems) {
					self.get('model').set('shouldEnableSave', (self.get('model').get('hasDirtyAttributes') || (!!menuItems.filterBy('hasDirtyAttributes', true).length)));
					return null;
				})
				.catch(function(err) {
					self.get('model').set('shouldEnableSave', false);

					console.error(err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			})
		});

		exports['default'] = MenuEditWidget;
	}
);
