define(
	'twyr-webapp/components/profile-contacts-widget',
	['exports', 'ember', 'twyr-webapp/application'],
	function(exports, _ember, _app) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/profile-contacts-widget');
		var ProfileContactsWidget = _ember['default'].Component.extend({
			'didRender': function() {
				var self = this;
				self._super(...arguments);

				self.get('model').get('profileContacts')
				.then(function(profileContacts) {
					profileContacts.forEach(function(profileContact) {
						if(!profileContact.get('isNew')) return;
						self._setupContactTypeSelect(profileContact);
					});
				})
				.catch(function(err) {
					console.error(err);
				});
			},

			'_setupContactTypeSelect': function(contact) {
				var typeSelectElem = _ember['default'].$('select#profile-contacts-widget-select-type-' + contact.get('id'));
				typeSelectElem.select2({
					'ajax': {
						'url': window.apiServer + 'masterdata/contactTypes',
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

					'placeholder': 'Type'
				})
				.on('change', function() {
					contact.set('type', typeSelectElem.val());
				});

				_ember['default'].$.ajax({
					'url': window.apiServer + 'masterdata/contactTypes',
					'dataType': 'json',
					'cache': true
				})
				.done(function(data) {
					_ember['default'].$.each(data, function(index, item) {
						var thisOption = new Option(_ember['default'].String.capitalize(item), item, false, false);
						typeSelectElem.append(thisOption);
					});

					typeSelectElem.val(contact.get('type')).trigger('change');
				})
				.fail(function() {
					console.error(window.apiServer + 'masterdata/contactTypes error:\n', arguments);
				});
			},

			'add': function() {
				var self = this,
					newProfileContact = this.get('model').store.createRecord('profile-contact', {
						'id': _app['default'].UUID(),
						'profile': this.get('model'),

						'createdAt': new Date(),
						'updatedAt': new Date()
					});

				_ember['default'].run.scheduleOnce('afterRender', function() {
					self._setupContactTypeSelect(newProfileContact);
				});

				self.get('model').get('profileContacts').pushObject(newProfileContact);
			},

			'save': function(contact) {
				var self = this;

				contact.save()
				.then(function() {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'success',
						'message': contact.get('contact') + ' saved succesfully'
					});
				})
				.catch(function(reason) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'ember-error',
						'errorModel': contact
					});
				});
			},

			'delete': function(contact) {
				var self = this;

				contact.destroyRecord()
				.then(function() {
					self.get('model').get('profileContacts').removeObject(contact);
					if(!contact.get('contact')) return;

					self.sendAction('controller-action', 'display-status-message', {
						'type': 'success',
						'message': contact.get('contact') + ' deleted succesfully'
					});
				})
				.catch(function(reason) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'ember-error',
						'errorModel': contact
					});
				});
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

		exports['default'] = ProfileContactsWidget;
	}
);
