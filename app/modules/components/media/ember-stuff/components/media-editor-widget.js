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

			'change-display-view': function(displayType) {
				this.get('model').set('mediaDisplayType', 'media-' + displayType + '-display-view-widget');
			},

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

			'create-folder': function(parent) {
				var self = this,
					newFolder = undefined;

				parent.get('children')
				.then(function(children) {
					var newFolderName = 'New Folder',
						tries = 0,
						siblingWithSameName = children.filter(function(sibling) {
							var name = newFolderName + (tries ? (' ' + tries) : '');
							return (sibling.get('name').indexOf(name) >= 0);
						});

					while(siblingWithSameName.length) {
						tries++;
						siblingWithSameName = children.filter(function(sibling) {
							var name = newFolderName + (tries ? (' ' + tries) : '');
							return (sibling.get('name').indexOf(name) >= 0);
						});
					}

					newFolderName += (tries ? (' ' + tries) : '');
					return newFolderName;
				})
				.then(function(newFolderName) {
					newFolder = self.get('store').createRecord('media-default', {
						'id': parent.get('id') + '/' + _ember['default'].String.dasherize(newFolderName),
						'parent': parent,
						'name': newFolderName,
						'type': 'folder'
					});

					return newFolder.save();
				})
				.then(function() {
					return parent.reload();
				})
				.then(function() {
					self.get('store').unloadRecord(newFolder);
				})
				.then(function() {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'success',
						'message': 'Folder created succesfully'
					});
				})
				.catch(function(err) {
					console.error(err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'errorModel': err.message
					});
				});
			},


			'rename-media': function(data) {
				var self = this;

				data.media.get('parent')
				.then(function(parentFolder) {
					if(!parentFolder) return null;
					return parentFolder.get('children');
				})
				.then(function(siblings) {
					if(siblings) {
						siblings.forEach(function(sibling) {
							sibling.set('isEditing', false);
						});
					}

					data.media.set('isEditing', true);
					_ember['default'].run.scheduleOnce('afterRender', function() {
						self.$(self.$(data.element).find('input.input-sm')[0]).focus();
					});

					return null;
				})
				.catch(function(err) {
					console.error('Error: ', err);
				});
			},

			'cancel-media': function(data) {
				var self = this;

				data.media.rollbackAttributes();
				data.media.set('isEditing', false);
				_ember['default'].run.scheduleOnce('afterRender', function() {
					self.$(data.element).focus();
					self.$(data.element).find('span').addClass('bg-light-blue color-palette');
				});
			},

			'save-media': function(data) {
				var self = this;

				if(!data.media.get('hasDirtyAttributes')) {
					data.media.set('isEditing', false);
					return;
				}

				data.media.save()
				.then(function() {
					data.media.set('isEditing', false);
					return data.media.get('parent');
				})
				.then(function(parentFolder) {
					if(!parentFolder) return null;
					return parentFolder.reload();
				})
				.then(function() {
					if(data.media.get('isDeleted')) return;
					self.get('store').unloadRecord(data.media);
				})
				.catch(function(err) {
					console.error('Error: ', err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});

					data.media.rollbackAttributes();
				});
			},

			'delete-media': function(media) {
				media.destroyRecord()
				.catch(function(err) {
					console.error('Error: ', err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				})
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
			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				self.$().contextMenu({
					'selector': 'table.contextMenu',

					'items': {
						'rename': {
							'name': 'Rename',
							'callback': function(itemKey, options) {
								var mediaToRename = self.get('store').peekRecord('media-default', self.$(options.$trigger).attr('id'));
								self.sendAction('controller-action', 'rename-media', {
									'media': mediaToRename,
									'element': options.$trigger[0]
								});
								return true;
							}
						},

						'delete': {
							'name': 'Delete',
							'callback': function(itemKey, options) {
								var mediaToRemove = self.get('store').peekRecord('media-default', self.$(options.$trigger).attr('id'));
								self.sendAction('controller-action', 'delete-media', mediaToRemove);
								return true;
							}
						}
					}
				});
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);
				self.$().contextMenu('destroy');
			},

			'select-media': function(data) {
				var self = this;
				self.$().find('span').removeClass('bg-light-blue color-palette');

				data.media.get('parent')
				.then(function(parentFolder) {
					return parentFolder.get('children');
				})
				.then(function(children) {
					children.invoke('rollbackAttributes');
					children.invoke('set', 'isEditing', false);

					_ember['default'].run.scheduleOnce('afterRender', function() {
						self.$(data.element).focus();
						self.$(data.element).find('span').addClass('bg-light-blue color-palette');
					});
				})
				.catch(function(err) {
					console.error(err);
				});
			},

			'deselect-media': function(data) {
				var self = this;
				self.$(data.element).find('span').removeClass('bg-light-blue color-palette');
			}
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
	'twyr-webapp/components/base-media-display-media-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/base-media-display-media-widget');
		var BaseMediaDisplayMediaWidget = _baseWidget['default'].extend({
			'click': function(event) {
				this.sendAction('controller-action', 'select-media', {
					'media': this.get('model'),
					'element': event.currentTarget
				});

				return false;
			},

			'doubleClick': function() {
				if(this.get('model').get('type') != 'folder')
					return false;

				this.sendAction('controller-action', 'change-folder', this.get('model').get('id'));
				return false;
			},

			'keyUp': function(event) {
				switch(event.keyCode) {
					case 13:
						this.sendAction('controller-action', 'save-media', {
							'media': this.get('model'),
							'element': this.$()
						});
					break;

					case 27:
						this.sendAction('controller-action', 'cancel-media', {
							'media': this.get('model'),
							'element': this.$()
						});
					break;

					case 113:
						this.sendAction('controller-action', 'rename-media', {
							'media': this.get('model'),
							'element': this.$('table.contextMenu')[0]
						});
					break;
				};

				return true;
			},

			'focusIn': function(event) {
				this.$(event.currentTarget).find('span').addClass('bg-light-blue color-palette');
				return false;
			},

			'focusOut': function(event) {
				var self = this;

				if(self.get('focusChangeTimeout')) {
					clearTimeout(self.get('focusChangeTimeout'));
					self.set('focusChangeTimeout', undefined);
				}

				var focusChangeTimeout = setTimeout(function() {
					self.set('focusChangeTimeout', undefined);

					if(self.$(event.currentTarget).find('input.input-sm').is(':focus'))
						return;

					if(self.get('model').get('isEditing')) {
						if(self.get('model').get('hasDirtyAttributes')) {
							self.sendAction('controller-action', 'save-media', {
								'media': self.get('model'),
								'element': event.currentTarget
							});
						}
						else {
							self.sendAction('controller-action', 'cancel-media', {
								'media': self.get('model'),
								'element': event.currentTarget
							});
						}
					}
					else {
						self.sendAction('controller-action', 'deselect-media', {
							'media': self.get('model'),
							'element': event.currentTarget
						});
					}
				}, 100);

				self.set('focusChangeTimeout', focusChangeTimeout);
				return false;
			}
		});

		exports['default'] = BaseMediaDisplayMediaWidget;
	}
);

define(
	'twyr-webapp/components/media-grid-display-folder-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-media-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-grid-display-folder-widget');
		var GridMediaDisplayFolderWidget = _baseWidget['default'].extend({
			'attributeBindings': ['style', 'tabindex'],

			'style': _ember['default'].String.htmlSafe('cursor:pointer; display:inline-block; margin:0px 40px; padding:0px;'),
			'tabindex': 0,
		});

		exports['default'] = GridMediaDisplayFolderWidget;
	}
);

define(
	'twyr-webapp/components/media-grid-display-file-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-media-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-grid-display-file-widget');
		var GridMediaDisplayFileWidget = _baseWidget['default'].extend({
			'attributeBindings': ['style', 'tabindex'],

			'style': _ember['default'].String.htmlSafe('display:inline-block; margin:0px 40px; padding:0px;'),
			'tabindex': 0
		});

		exports['default'] = GridMediaDisplayFileWidget;
	}
);

define(
	'twyr-webapp/components/media-compact-display-folder-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-media-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-compact-display-folder-widget');
		var CompactMediaDisplayFolderWidget = _baseWidget['default'].extend({
			'attributeBindings': ['style', 'tabindex'],

			'style': _ember['default'].String.htmlSafe('cursor:pointer; display:inline-block; margin:0px 30px; padding:0px;'),
			'tabindex': 0
		});

		exports['default'] = CompactMediaDisplayFolderWidget;
	}
);

define(
	'twyr-webapp/components/media-compact-display-file-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-media-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-compact-display-file-widget');
		var CompactMediaDisplayFileWidget = _baseWidget['default'].extend({
			'attributeBindings': ['style', 'tabindex'],

			'style': _ember['default'].String.htmlSafe('display:inline-block; margin:0px 30px; padding:0px;'),
			'tabindex': 0
		});

		exports['default'] = CompactMediaDisplayFileWidget;
	}
);

define(
	'twyr-webapp/components/media-list-display-view-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-view-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-list-display-view-widget');
		var ListMediaDisplayViewWidget = _baseWidget['default'].extend({
			'_mediaListDataTable': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				self.set('_mediaListDataTable', self.$('table.table-hover').DataTable({
					'rowId': 'id',

					'lengthMenu': [ [10, 25, 50, -1], [10, 25, 50, 'All'] ],
					'pageLength': -1,

					'columns': [
						{ 'data': 'name' },
						{ 'data': 'type' },
						{ 'data': 'size' },
						{ 'data': 'created' },
						{ 'data': 'updated' }
					],

					'order': [
						[ 1, 'desc' ],
						[ 0, 'asc' ]
					],

					'orderFixed': [1, 'desc']
				}));

				self._redrawDataTable();
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				if(self.get('_mediaListDataTable')) {
					self.get('_mediaListDataTable').destroy();
					self.set('_mediaListDataTable', undefined);
				}
			},

			'onModelChanged': _ember['default'].observer('model', function() {
				this._redrawDataTable();
			}),

			'onModelChildrenChanged': _ember['default'].observer('model.children.[]', function() {
				this._redrawDataTable();
			}),

			'_onDblClickRow': function(event) {
				event.preventDefault();
				event.stopPropagation();

				var rowId = $(event.currentTarget).attr('id'),
					media = this.get('store').peekRecord('media-default', rowId);

				if(media.get('type') != 'folder')
					return;

				this.sendAction('controller-action', 'change-folder', rowId);
			},

			'_redrawDataTable': function() {
				var self = this;

				if(!self.get('model')) {
					self.get('_mediaListDataTable').rows().remove();
					self.get('_mediaListDataTable').draw();

					return;
				}

				self.get('model').get('children')
				.then(function(children) {
					if(!children.get('length')) {
						self.get('_mediaListDataTable').rows().remove();
						self.get('_mediaListDataTable').draw();

						return;
					}

					// Remove all rows from the table who are not children of the current model
					var rowIds = self.get('_mediaListDataTable').rows().ids(),
						toBeRemoved = [];

					window.$.each(rowIds, function(index, rowId) {
						var isChildOfCurrentModel = children.filterBy('id', rowId).length;
						if(isChildOfCurrentModel)
							return;

						toBeRemoved.push(index);
					});

					toBeRemoved.reverse();
					window.$.each(toBeRemoved, function(index, rowIndex) {
						self.get('_mediaListDataTable').row(rowIndex).remove();
					});

					// Add all rows from the children of the current model not in the table
					children.forEach(function(child) {
						var doesAlreadyExist = self.get('_mediaListDataTable').rows().ids().indexOf(child.get('id'));
						if(doesAlreadyExist >= 0)
							return;

						self.get('_mediaListDataTable').row.add({
							'id': child.get('id'),
							'name': '<i class="fa fa-' + child.get('type') + '-o" style="margin-right:5px;"></i>' + child.get('name'),
							'type': child.get('type'),
							'size': child.get('displaySize'),
							'created': child.get('formattedCreatedAt'),
							'updated': child.get('formattedUpdatedAt')
						});
					});

					// Redraw for display...
					self.get('_mediaListDataTable').draw();
					self.$('table.table-hover tr').dblclick(self._onDblClickRow.bind(self));
				})
				.catch(function(err) {
					console.error(err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});
			}
		});

		exports['default'] = ListMediaDisplayViewWidget;
	}
);
