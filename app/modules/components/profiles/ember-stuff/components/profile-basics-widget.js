define(
	'twyr-portal/components/profile-basics-widget',
	['exports', 'ember'],
	function(exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/components/profile-basics-widget');
		var ProfileBasicsWidget = _ember['default'].Component.extend({
			'didRender': function() {
				this._super(...arguments);

				var genderSelectElem = _ember['default'].$('select#profile-basics-widget-select-gender'),
					self = this;

				genderSelectElem.select2({
					'ajax': {
						'url': window.apiServer + 'masterdata/genders',
						'dataType': 'json',

						'processResults': function (data) {
							return  {
								'results': window.Ember.$.map(data, function(item) {
									return {
										'text': _ember['default'].String.capitalize(item),
										'slug': _ember['default'].String.capitalize(item),
										'id': item
									};
								})
							};
						},

						'cache': true
					},

					'minimumInputLength': 0,
					'minimumResultsForSearch': 10,

					'allowClear': true,
					'closeOnSelect': true,

					'placeholder': 'Gender'
				})
				.on('change', function() {
					self.get('model').set('gender', genderSelectElem.val());
				});

				_ember['default'].$('div#profile-basics-widget-input-dob').datetimepicker({
					'format': 'DD MMM YYYY',
					'minDate': '01 Jan 1900',
					'maxDate': window.moment()
				});

				_ember['default'].$.ajax({
					'url': window.apiServer + 'masterdata/genders',
					'dataType': 'json',
					'cache': true
				})
				.done(function(data) {
					_ember['default'].$.each(data, function(index, item) {
						var thisOption = new Option(_ember['default'].String.capitalize(item), item, false, false);
						genderSelectElem.append(thisOption);
					});

					genderSelectElem.val(self.get('model').get('gender')).trigger('change');
				})
				.fail(function() {
					console.error(window.apiServer + 'masterdata/genders error:\n', arguments);
				});
			},

			'save': function() {
				var self = this;

				this.get('model')
				.save()
				.then(function() {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'success',
						'message': 'Profile Changes saved succesfully'
					});
				}, function() {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'ember-error',
						'errorModel': self.get('model')
					});
				});
			},

			'cancel': function() {
				this.get('model').rollbackAttributes();
			},

			'actions': {
				'controller-action': function(action, data) {
					if(this[action])
						this[action](data);
					else
						this.sendAction('controller-action', action, data);
				}
			}
		});

		exports['default'] = ProfileBasicsWidget;
	}
);
