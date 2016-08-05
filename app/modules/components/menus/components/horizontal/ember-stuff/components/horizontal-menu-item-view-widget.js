define(
	'twyr-webapp/components/horizontal-menu-item-view-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/horizontal-menu-item-view-widget');
		var HorizontalMenuItemViewerWidget = _baseWidget['default'].extend({
			'tagName': 'li',

			'classNames': ['dropdown'],
			'classNameBindings': ['model.isExpanded:open'],

			'attributeBindings': ['style'],
			'style': _ember['default'].String.htmlSafe('border-bottom:1px solid #eee; padding:5px 0px;'),

			'isHorizontal': false,
			'isVertical': false,
			'caretClass': 'fa fa-caret-down',

			'_currentlyExpandedChild': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);

				self.set('isHorizontal', (self.get('orientation') == 'horizontal'));
				self.set('isVertical', (self.get('orientation') == 'vertical'));
				self._setCaretClass();
			},

			'click': function(event) {
				event.preventDefault();
				event.stopPropagation();

				this.get('model').set('isExpanded', !this.get('model').get('isExpanded'));
			},

			'expandedChanged': _ember['default'].observer('model.isExpanded', function() {
				this._setCaretClass();
			}),

			'onChildExpandedChanged': _ember['default'].observer('model.children.@each.isExpanded', function() {
				var self = this,
					expandedChild = self.get('model').get('sortedMenuItems').filterBy('isExpanded', true);

				if(expandedChild.length <= 1) {
					self.set('_currentlyExpandedChild', undefined);
					self.set('_currentlyExpandedChild', expandedChild[0]);
					return;
				}

				if(self.get('_currentlyExpandedChild')) {
					self.get('_currentlyExpandedChild').set('isExpanded', false);
					self.set('_currentlyExpandedChild', undefined);
				}

				expandedChild = self.get('model').get('sortedMenuItems').filterBy('isExpanded', true);
				self.set('_currentlyExpandedChild', expandedChild[0]);
			}),

			'_setCaretClass': function() {
				var self = this;

				if(self.get('orientation') == 'vertical') {
					if(self.get('model').get('isExpanded'))
						self.set('caretClass', 'fa fa-caret-up');
					else
						self.set('caretClass', 'fa fa-caret-down');
				}

				if(self.get('orientation') == 'horizontal') {
					if(self.get('model').get('isExpanded'))
						self.set('caretClass', 'fa fa-caret-left');
					else
						self.set('caretClass', 'fa fa-caret-right');
				}
			}
		});

		exports['default'] = HorizontalMenuItemViewerWidget;
	}
);

define(
	'twyr-webapp/components/horizontal-component-menu-item-view-widget',
	['exports', 'ember', 'twyr-webapp/application', 'twyr-webapp/components/base-widget'],
	function(exports, _ember, _app, _baseWidget) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/horizontal-component-menu-item-view-widget');
		var HorizontalComponentMenuItemViewerWidget = _baseWidget['default'].extend({
			'tagName': 'li',

			'classNames': ['dropdown'],
			'classNameBindings': ['model.isExpanded:open'],

			'attributeBindings': ['style'],
			'style': _ember['default'].String.htmlSafe('border-bottom:1px solid #eee; padding:5px 0px;'),

			'isHorizontal': false,
			'isVertical': false,
			'caretClass': 'fa fa-caret-down',

			'_currentlyExpandedChild': undefined,

			'didInsertElement': function() {
				var self = this;
				self._super(...arguments);
				self._setCaretClass();
			},

			'click': function(event) {
				event.stopPropagation();
				event.preventDefault();

				this.get('model').set('isExpanded', !this.get('model').get('isExpanded'));
			},

			'expandedChanged': _ember['default'].observer('model.isExpanded', function() {
				this._setCaretClass();
			}),

			'onChildExpandedChanged': _ember['default'].observer('model.children.@each.isExpanded', function() {
				var self = this,
					expandedChild = self.get('model').get('sortedMenuItems').filterBy('isExpanded', true);

				if(expandedChild.length <= 1) {
					self.set('_currentlyExpandedChild', undefined);
					self.set('_currentlyExpandedChild', expandedChild[0]);
					return;
				}

				if(self.get('_currentlyExpandedChild')) {
					self.get('_currentlyExpandedChild').set('isExpanded', false);
					self.set('_currentlyExpandedChild', undefined);
				}

				expandedChild = self.get('model').get('sortedMenuItems').filterBy('isExpanded', true);
				self.set('_currentlyExpandedChild', expandedChild[0]);
			}),

			'_setCaretClass': function() {
				var self = this;

				if(self.get('orientation') == 'vertical') {
					if(self.get('model').get('isExpanded'))
						self.set('caretClass', 'fa fa-caret-up');
					else
						self.set('caretClass', 'fa fa-caret-down');
				}

				if(self.get('orientation') == 'horizontal') {
					if(self.get('model').get('isExpanded'))
						self.set('caretClass', 'fa fa-caret-left');
					else
						self.set('caretClass', 'fa fa-caret-right');
				}
			}
		});

		exports['default'] = HorizontalComponentMenuItemViewerWidget;
	}
);
