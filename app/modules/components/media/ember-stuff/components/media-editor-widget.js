define(
	'twyr-webapp/components/media-editor-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-editor-widget');
		var MediaEditorWidget = _baseWidget['default'].extend({
			'folderPathSegments': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				self.$('div#media-editor-widget-file-upload-popover').popoverX({
					'placement': 'bottom bottom-left',
					'target': self.$('button#media-editor-widget-file-upload-button')
				});
			},

			'onModelChanged': _ember['default'].observer('model', function() {
				var self = this;
				self.$('input#media-editor-widget-file-upload-input').fileinput('destroy');

				if(!self.get('model'))
					return;

				if(!self.get('model').get('mediaDisplayType')) {
					self.get('model').set('mediaDisplayType', 'media-grid-display-view-widget');
				}

				var segments = self.get('model').get('id').split('/').filter(function(segment) {
					return (segment.trim() != '');
				});

				segments.unshift('Root');
				self.set('folderPathSegments', segments);

				self.$('input#media-editor-widget-file-upload-input').fileinput({
					'autoReplace': true,

					'minFileCount': 1,
					'maxFileCount': 10,

					'uploadUrl': '/media/upload-media?parent=' + self.get('model').get('id')
				})
				.on('fileunlock', function() {
					self.get('model')
					.reload()
					.then(function() {
						_ember['default'].run.later(self, function() {
							self.$('input#media-editor-widget-file-upload-input').fileinput('clear');
							self.$('div#media-editor-widget-file-upload-popover').popoverX('hide');
						}, 100);
					})
					.catch(function(err) {
						console.error(err);
					});
				});
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

			'upload-file': function(data) {
				this.$('div#media-editor-widget-file-upload-popover').popoverX('show');
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
			},

			'download-media': function(data) {
				window.location.href = 'media/download-media?id=' + data.media.get('id');
			},

			'download-compressed-media': function(data) {
				window.location.href = 'media/download-compressed-media?id=' + data.media.get('id');
			},

			'extract-media': function(data) {
				_ember['default'].$.ajax({
					'url': 'media/decompress-media?id=' + data.get('id'),
					'dataType': 'json',
					'cache': true
				})
				.done(function() {
					data.get('parent')
					.then(function(parentFolder) {
						return parentFolder.reload();
					})
					.catch(function(err) {
						console.error(err);
					});
				})
				.fail(function() {
					console.error('media/decompress-media?id=' + data.get('id') + ' error:\n', arguments);
				});
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
	'twyr-webapp/components/base-media-display-media-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/base-media-display-media-widget');
		var BaseMediaDisplayMediaWidget = _baseWidget['default'].extend({
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
					if(self.get('isDestroyed')) return false;

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
						self.$(event.currentTarget).find('span').removeClass('bg-light-blue color-palette');
					}
				}, 10);

				self.set('focusChangeTimeout', focusChangeTimeout);
				return false;
			}
		});

		exports['default'] = BaseMediaDisplayMediaWidget;
	}
);

define(
	'twyr-webapp/components/base-media-display-folder-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-media-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/base-media-display-folder-widget');
		var BaseMediaDisplayFolderWidget = _baseWidget['default'].extend({
			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				_ember['default'].run.later(self, function() {
					if(!self.$()) return;
					self.$().contextMenu({
						'selector': 'table.contextMenu',

						'items': {
							'change-folder': {
								'name': 'Navigate To',
								'icon': 'fa-folder',

								'callback': function(itemKey, options) {
									self.sendAction('controller-action', 'change-folder', self.get('model').get('id'));
									return true;
								}
							},

							'sep1': '---------',

							'download': {
								'name': 'Download',
								'icon': 'fa-download',

								'callback': function(itemKey, options) {
									var mediaToDownload = self.get('store').peekRecord('media-default', self.get('model').get('id'));
									self.sendAction('controller-action', 'download-media', {
										'media': mediaToDownload,
										'element': options.$trigger[0]
									});
									return true;
								}
							},

							'sep2': '---------',

							'rename': {
								'name': 'Rename',
								'icon': 'fa-copy',

								'callback': function(itemKey, options) {
									var mediaToRename = self.get('store').peekRecord('media-default', self.get('model').get('id'));
									self.sendAction('controller-action', 'rename-media', {
										'media': mediaToRename,
										'element': options.$trigger[0]
									});
									return true;
								}
							},

							'sep3': '---------',

							'delete': {
								'name': 'Delete',
								'icon': 'fa-trash',

								'callback': function(itemKey, options) {
									var mediaToRemove = self.get('store').peekRecord('media-default', self.get('model').get('id'));
									self.sendAction('controller-action', 'delete-media', mediaToRemove);
									return true;
								}
							}
						}
					});
				}, 1000);
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				self.$('table.contextMenu').contextMenu('destroy');
			}
		});

		exports['default'] = BaseMediaDisplayFolderWidget;
	}
);

define(
	'twyr-webapp/components/base-media-display-file-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-media-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/base-media-display-file-widget');
		var BaseMediaDisplayFileWidget = _baseWidget['default'].extend({
			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				var contextMenuSelector = 'table.contextMenu',
					contextMenuItems = {};

				contextMenuItems['download'] = {
					'name': 'Download',
					'icon': 'fa-download',

					'callback': function(itemKey, options) {
						var mediaToDownload = self.get('store').peekRecord('media-default', self.get('model').get('id'));
						self.sendAction('controller-action', 'download-media', {
							'media': mediaToDownload,
							'element': options.$trigger[0]
						});
						return true;
					}
				};

				contextMenuItems['sep1'] = '---------';

				if(self.get('model').get('type') == 'zip') {
					contextMenuItems['extract'] = {
						'name': 'Extract',
						'icon': 'fa-file-archive-o',

						'callback': function(itemKey, options) {
							var mediaToExtract = self.get('store').peekRecord('media-default', self.get('model').get('id'));
							self.sendAction('controller-action', 'extract-media', mediaToExtract);
							return true;
						}
					};

					contextMenuItems['sep2'] = '---------';
				}
				else {
					contextMenuItems['download-compressed'] = {
						'name': 'Compress and Download',
						'icon': 'fa-download',

						'callback': function(itemKey, options) {
							var mediaToDownload = self.get('store').peekRecord('media-default', self.get('model').get('id'));
							self.sendAction('controller-action', 'download-compressed-media', {
								'media': mediaToDownload,
								'element': options.$trigger[0]
							});
							return true;
						}
					};

					contextMenuItems['sep2'] = '---------';
				}

				contextMenuItems['rename'] = {
					'name': 'Rename',
					'icon': 'fa-copy',

					'callback': function(itemKey, options) {
						var mediaToRename = self.get('store').peekRecord('media-default', self.get('model').get('id'));
						self.sendAction('controller-action', 'rename-media', {
							'media': mediaToRename,
							'element': options.$trigger[0]
						});
						return true;
					}
				};

				contextMenuItems['sep3'] = '---------';

				contextMenuItems['delete'] = {
					'name': 'Delete',
					'icon': 'fa-trash',

					'callback': function(itemKey, options) {
						var mediaToRemove = self.get('store').peekRecord('media-default', self.get('model').get('id'));
						self.sendAction('controller-action', 'delete-media', mediaToRemove);
						return true;
					}
				};

				_ember['default'].run.later(self, function() {
					if(!self.$()) return;
					self.$().contextMenu({
						'selector': contextMenuSelector,
						'items': contextMenuItems
					});
				}, 1000);
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				self.$('table.contextMenu').contextMenu('destroy');
			}
		});

		exports['default'] = BaseMediaDisplayFileWidget;
	}
);

define(
	'twyr-webapp/components/media-grid-display-folder-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-folder-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-grid-display-folder-widget');
		var GridMediaDisplayFolderWidget = _baseWidget['default'].extend({
			'attributeBindings': ['style', 'tabindex'],

			'style': _ember['default'].String.htmlSafe('cursor:pointer; display:inline-block; margin:0px 40px; padding:0px;'),
			'tabindex': 0
		});

		exports['default'] = GridMediaDisplayFolderWidget;
	}
);

define(
	'twyr-webapp/components/media-grid-display-file-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-file-widget'],
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
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-folder-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-compact-display-folder-widget');
		var CompactMediaDisplayFolderWidget = _baseWidget['default'].extend({
			'attributeBindings': ['style', 'tabindex'],

			'style': _ember['default'].String.htmlSafe('cursor:pointer; display:inline-block; margin:0px 30px; padding:5px;'),
			'tabindex': 0
		});

		exports['default'] = CompactMediaDisplayFolderWidget;
	}
);

define(
	'twyr-webapp/components/media-compact-display-file-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-file-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-compact-display-file-widget');
		var CompactMediaDisplayFileWidget = _baseWidget['default'].extend({
			'attributeBindings': ['style', 'tabindex'],

			'style': _ember['default'].String.htmlSafe('display:inline-block; margin:0px 30px; padding:5px;'),
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

					'columnDefs': [{
						'targets': [0],
						'render': function(whatever, type, row) {
							return '<div class="media-list-display-name-col" id="' + row.id + '" style="width:100%;">' + whatever + '</div>';
						}
					}],

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
					rowIds = self.get('_mediaListDataTable').rows().ids();
					children.forEach(function(child) {
						var doesAlreadyExist = rowIds.indexOf(child.get('id'));
						if(doesAlreadyExist >= 0)
							return;

						self.get('_mediaListDataTable').row.add({
							'id': child.get('id'),
							'name': child.get('name'),
							'type': ((child.get('type') == 'folder') ? 'Folder' : 'File <i>(' + child.get('type') + ')</i>'),
							'size': child.get('displaySize'),
							'created': child.get('formattedCreatedAt'),
							'updated': child.get('formattedUpdatedAt')
						});
					});

					// Redraw for display...
					self.get('_mediaListDataTable').draw();
					self.$('table.table-hover tr').dblclick(self._onDblClickRow.bind(self));
					self.$('table.table-hover td').css({
						'border': '0px',
						'padding': '0px 8px',
						'vertical-align': 'middle'
					});

					// Add in the Ember Components dynamically
					var nameCols = self.$('div.media-list-display-name-col');
					window.$.each(nameCols, function(idx, nameColDiv) {
						var mediaModel = self.get('store').peekRecord('media-default', window.$(nameColDiv).attr('id'));
						if(mediaModel.get('type') == 'folder') {
							var folderWidget = _ember['default'].getOwner(self).lookup('component:media-list-display-folder-widget');
							folderWidget.setProperties({
								'model': mediaModel,
								'controller-action': 'controller-action',
								'parentView': self,
								'colElement': window.$(nameColDiv)
							});

							self.appendChild(folderWidget);
							folderWidget.append();

							return;
						}

						var fileWidget = _ember['default'].getOwner(self).lookup('component:media-list-display-file-widget');
						fileWidget.setProperties({
							'model': mediaModel,
							'controller-action': 'controller-action',
							'parentView': self,
							'colElement': window.$(nameColDiv)
						});

						self.appendChild(fileWidget);
						fileWidget.append();
					});
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

define(
	'twyr-webapp/components/media-list-display-folder-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-folder-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-list-display-folder-widget');
		var ListMediaDisplayFolderWidget = _baseWidget['default'].extend({
			'layoutName': 'components/media-list-display-folder-widget',
			'attributeBindings': ['style', 'tabindex'],

			'style': _ember['default'].String.htmlSafe('cursor:pointer;'),
			'tabindex': 0,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				self.get('colElement').html('');
				self.$().appendTo(self.get('colElement'));

				var myId = Number(self.$().attr('id').replace('ember', '')),
					otherInsts = self.get('colElement').find('div.ember-view');

				if(otherInsts.length) {
					var shouldSelfDestruct = false;
					window.$.each(otherInsts, function(idx, otherInst) {
						var otherId = Number(window.$(otherInst).attr('id').replace('ember', ''))
						if(myId == otherId) return;
						if(myId > otherId) shouldSelfDestruct = true;
					});

					if(shouldSelfDestruct)
						self.destroy();
				}
			}
		});

		exports['default'] = ListMediaDisplayFolderWidget;
	}
);

define(
	'twyr-webapp/components/media-list-display-file-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-media-display-file-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/media-list-display-file-widget');
		var ListMediaDisplayFileWidget = _baseWidget['default'].extend({
			'layoutName': 'components/media-list-display-file-widget',
			'attributeBindings': ['tabindex'],
			'tabindex': 0,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				self.get('colElement').html('');
				self.$().appendTo(self.get('colElement'));

				var myId = Number(self.$().attr('id').replace('ember', '')),
					otherInsts = self.get('colElement').find('div.ember-view');

				if(otherInsts.length) {
					var shouldSelfDestruct = false;
					window.$.each(otherInsts, function(idx, otherInst) {
						var otherId = Number(window.$(otherInst).attr('id').replace('ember', ''))
						if(myId == otherId) return;
						if(myId > otherId) shouldSelfDestruct = true;
					});

					if(shouldSelfDestruct)
						self.destroy();
				}
			}
		});

		exports['default'] = ListMediaDisplayFileWidget;
	}
);
