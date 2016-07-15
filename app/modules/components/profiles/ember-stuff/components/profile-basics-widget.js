define(
	'twyr-webapp/components/profile-basics-widget',
	['exports', 'ember'],
	function(exports, _ember) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/components/profile-basics-widget');
		var ProfileBasicsWidget = _ember['default'].Component.extend({
			'_imageCroppie': null,
			'_enableCroppieUpdates': false,
			'_profileImageUploadTimeout': null,

			'didRender': function() {
				this._super(...arguments);

				var genderSelectElem = _ember['default'].$('select#profile-basics-widget-select-gender'),
					homeSelectElem = _ember['default'].$('select#profile-basics-widget-select-homepage'),
					profileImageElem = _ember['default'].$('div#profile-basics-widget-image'),
					self = this;

				// Initialize the Genders Select
				genderSelectElem.select2({
					'minimumInputLength': 0,
					'minimumResultsForSearch': 10,

					'allowClear': true,
					'closeOnSelect': true,

					'placeholder': 'Gender'
				})
				.on('change', function() {
					self.get('model').set('gender', genderSelectElem.val());
				});

				_ember['default'].$.ajax({
					'url': window.apiServer + 'masterdata/genders',
					'dataType': 'json',
					'cache': true
				})
				.done(function(data) {
					genderSelectElem.html('');
					_ember['default'].$.each(data, function(index, item) {
						var thisOption = new Option(_ember['default'].String.capitalize(item), item, false, false);
						genderSelectElem.append(thisOption);
					});

					genderSelectElem.val(self.get('model').get('gender')).trigger('change');
				})
				.fail(function() {
					console.error(window.apiServer + 'masterdata/genders error:\n', arguments);
				});

				// Initialize the Homepages Select
				homeSelectElem.select2({
					'minimumInputLength': 0,
					'minimumResultsForSearch': 10,

					'allowClear': true,
					'closeOnSelect': true,

					'placeholder': 'Home Page'
				})
				.on('change', function() {
					self.get('model').set('homeModuleMenu', homeSelectElem.val());
				});

				_ember['default'].$('div#profile-basics-widget-input-dob').datetimepicker({
					'format': 'DD MMM YYYY',
					'minDate': '01 Jan 1900',
					'maxDate': window.moment().format('DD MMM YYYY')
				});

				_ember['default'].$.ajax({
					'url': window.apiServer + 'profiles/homepages',
					'dataType': 'json',
					'cache': true
				})
				.done(function(data) {
					homeSelectElem.html('');
					_ember['default'].$.each(data, function(index, item) {
						var thisOption = new Option(_ember['default'].String.capitalize(item.display_name), item.id, false, false);
						homeSelectElem.append(thisOption);
					});

					homeSelectElem.val(self.get('model').get('homeModuleMenu')).trigger('change');
				})
				.fail(function() {
					console.error(window.apiServer + 'profiles/homepages error:\n', arguments);
				});

				// Initialize the Profile Image Container
				profileImageElem.outerHeight(_ember['default'].$('div#profile-basics-widget-text-stuff').height());

				self.set('_imageCroppie', new Croppie(document.getElementById('profile-basics-widget-image'), {
					'boundary': {
						'width': profileImageElem.width(),
						'height': (profileImageElem.height() - 50)
					},

					'viewport': {
						'width': 200,
						'height': 200,
						'type': 'circle'
					},

					'update': self._processCroppieUpdate.bind(self)
				}));

				// Show the existing profile image of the user
				var imgMetadata = JSON.parse(self.get('model').get('profileImageMetadata'));
				self.get('_imageCroppie')
				.bind({
					'url': '/profiles/get-image?_random=' + window.moment().valueOf(),
					'points': imgMetadata.points
				})
				.then(function() {
					console.log('Enabling Croppie Update Processing');
					self.get('_imageCroppie').setZoom(imgMetadata.zoom);

					self.set('_enableCroppieUpdates', true);
				})
				.catch(function(err) {
					console.error('Init Profile Image Error: ', err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message
					});
				});

				// Add an event handler for catching dropped images
				document
				.getElementById('profile-basics-widget-image')
				.addEventListener('drop', self._processDroppedImage.bind(self));
			},

			'willDestroyElement': function() {
				var self = this;
				self._super(...arguments);

				if(self.get('_imageCroppie')) {
					self.get('_imageCroppie').destroy();
					self.set('_imageCroppie', null);
				}
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

			'_processDroppedImage': function(event) {
				event.stopPropagation();
				event.preventDefault();

				var self = this,
					imageFile = event.dataTransfer.files[0];

				if(!imageFile.type.match('image.*'))
					return;

				var imageReader = new FileReader();

				imageReader.onload = (function(imageData) {
					self.get('_imageCroppie').bind({
						'url': imageData.target.result
					});
				});

				imageReader.readAsDataURL(imageFile);
			},

			'_processCroppieUpdate': function () {
				var self = this;

				if(!self.get('_enableCroppieUpdates'))
					return;

				self.get('_imageCroppie')
				.result()
				.then(function(image) {
					if(self.get('_profileImageUploadTimeout')) {
						clearTimeout(self.get('_profileImageUploadTimeout'));
						self.set('_profileImageUploadTimeout', null);
					}

					self.set('_profileImageUploadTimeout', setTimeout(
						self._uploadProfileImage.bind(self, image, self.get('_imageCroppie').get()),
						5000
					));

					return null;
				})
				.catch(function(err) {
					console.error('Croppie Update Error: ', err);
				});
			},

			'_uploadProfileImage': function(imageData, metadata) {
				var self = this;
				console.log('Upload Profile Metadata: ', metadata);

				_ember['default'].RSVP.allSettled([
					_ember['default'].$.ajax({
						'type': 'POST',
						'url': '/profiles/upload-image',

						'dataType': 'json',
						'data': {
							'image': imageData,
							'metadata': metadata
						}
					})
				])
				.then(function(data) {
					self.set('_enableCroppieUpdates', false);

					return self.get('_imageCroppie').bind({
						'url': '/profiles/get-image?_random=' + window.moment().valueOf(),
						'points': metadata.points
					});
				})
				.then(function() {
					self.get('_imageCroppie').setZoom(metadata.zoom);
					self.set('_enableCroppieUpdates', true);

					return null;
				})
				.catch(function(err) {
					console.error('Upload Profile Image Error: ', err);
					self.sendAction('controller-action', 'display-status-message', {
						'type': 'danger',
						'message': err.message || err.error || err.responseJSON.error
					});
				})
				.finally(function() {
					self.set('_profileImageUploadTimeout', null);
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

		exports['default'] = ProfileBasicsWidget;
	}
);
