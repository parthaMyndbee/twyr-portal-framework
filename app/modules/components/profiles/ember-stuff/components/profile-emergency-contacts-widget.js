define(
	'twyr-portal/components/profile-emergency-contacts-widget',
	['exports', 'ember', 'twyr-portal/application'],
	function(exports, _ember, _app) {
		if(window.developmentMode) console.log('DEFINE: twyr-portal/components/profile-emergency-contacts-widget');
		var ProfileEmergencyContactsWidget = _ember['default'].Component.extend({
			'didRender': function() {
				var self = this;
				self._super(...arguments);

				self.get('model').get('profileEmergencyContacts')
				.then(function(profileEmergencyContacts) {
					profileEmergencyContacts.forEach(function(profileEmergencyContact) {
						if(!profileEmergencyContact.get('isNew')) return;
						self._setupEmergencyContactSelects(profileEmergencyContact);
					});
				})
				.catch(function(err) {
					console.error(err);
				});
			},

			'_setupEmergencyContactSelects': function(emergencyContact) {
				var relSelectElem = _ember['default'].$('select#profile-emergency-contacts-widget-select-relationship-' + emergencyContact.get('id'));
				relSelectElem.select2({
					'ajax': {
						'url': window.apiServer + 'masterdata/emergencyContactTypes',
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

					'placeholder': 'Relationship'
				})
				.on('change', function() {
					emergencyContact.set('relationship', relSelectElem.val());
				});

				var userSelectElem = _ember['default'].$('select#profile-emergency-contacts-widget-select-user-' + emergencyContact.get('id'));
				userSelectElem.select2({
					'ajax': {
						'url': window.apiServer + 'profiles/emergencyContact',
						'dataType': 'json',

						'data': function (params) {
							var queryParameters = {
								'filter': params.term
							}

							return queryParameters;
						},

						'processResults': function (data) {
							return  {
								'results': window.Ember.$.map(data, function(item) {
									return {
										'text': _ember['default'].String.capitalize(item.name),
										'slug': _ember['default'].String.capitalize(item.name),
										'id': item.id
									};
								})
							};
						},

						'cache': true
					},

					'minimumInputLength': 3,
					'minimumResultsForSearch': 10,

					'allowClear': true,
					'closeOnSelect': true,

					'placeholder': 'Contact'
				})
				.on('change', function() {
					emergencyContact.store.findRecord('profile', userSelectElem.val())
					.then(function(contactUser) {
						emergencyContact.set('contact', contactUser);
					})
					.catch(function(err) {
						console.error('Error Adding Emergency Contact User: ', err);
					});
				});

				_ember['default'].$.ajax({
					'url': window.apiServer + 'masterdata/emergencyContactTypes',
					'dataType': 'json',
					'cache': true
				})
				.done(function(data) {
					_ember['default'].$.each(data, function(index, item) {
						var thisOption = new Option(_ember['default'].String.capitalize(item), item, false, false);
						relSelectElem.append(thisOption);
					});

					relSelectElem.val(emergencyContact.get('relationship')).trigger('change');
				})
				.fail(function() {
					console.error(window.apiServer + 'masterdata/emergencyContactTypes error:\n', arguments);
				});
			},

			'add': function() {
				var self = this,
					newProfileEmergencyContact = this.get('model').store.createRecord('profile-emergency-contact', {
						'id': _app['default'].UUID(),
						'profile': this.get('model'),

						'createdAt': new Date(),
						'updatedAt': new Date()
					});

				_ember['default'].run.scheduleOnce('afterRender', function() {
					self._setupEmergencyContactSelects(newProfileEmergencyContact);
				});

				self.get('model').get('profileEmergencyContacts').pushObject(newProfileEmergencyContact);
			},

			'save': function(emergencyContact) {
				var self = this;

				emergencyContact.save()
				.then(function() {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'success',
						'message': emergencyContact.get('contact').get('fullName') + ' saved succesfully'
					});
				})
				.catch(function(reason) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'ember-error',
						'errorModel': emergencyContact
					});
				});
			},

			'delete': function(emergencyContact) {
				var self = this;

				emergencyContact.destroyRecord()
				.then(function() {
					self.get('model').get('profileEmergencyContacts').removeObject(emergencyContact);
					if(!emergencyContact.get('contact')) return;

					self.sendAction('controller-action', 'display-status-message', {
						'type': 'success',
						'message': emergencyContact.get('contact').get('fullName') + ' deleted succesfully'
					});
				})
				.catch(function(reason) {
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'ember-error',
						'errorModel': emergencyContact
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

		exports['default'] = ProfileEmergencyContactsWidget;
	}
);
