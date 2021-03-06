define(
	'twyr-webapp/models/tenant',
	['exports', 'twyr-webapp/models/base', 'ember', 'ember-data/attr', 'ember-data/relationships'],
	function(exports, _twyrBaseModel, _ember, _attr, _relationships) {
		if(window.developmentMode) console.log('DEFINE: twyr-webapp/models/tenant');
		var TenantModel = _twyrBaseModel['default'].extend({
			'name': _attr['default']('string'),
			'type': _attr['default']('string', { 'defaultValue': 'organization' }),
			'enabled': _attr['default']('string', { 'defaultValue': true }),

			'parent': _relationships.belongsTo('tenant', {  'inverse': 'children', 'async': true  }),
			'children': _relationships.hasMany('tenant', {  'inverse': 'parent', 'async': true  }),

			'typeObserver': _ember['default'].observer('type', function() {
				if(!this.get('isNew')) return;
				this.set('name', 'New ' + _ember['default'].String.capitalize(this.get('type')));
			}),

			'isOrganization': _ember['default'].computed('type', {
				'get': function(key) {
					return (this.get('type') == 'organization');
				}
			}).readOnly()
		});

		exports['default'] = TenantModel;
	}
);
