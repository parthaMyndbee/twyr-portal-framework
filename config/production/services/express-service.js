exports.config = ({
	'protocol': 'http',
	"port": {
		'twyr-api-gateway': 80,
		'twyr-portal': 80
	},

	'poweredBy': 'Twyr Web Application',

	'cookieParser': {
		'path': '/',
		'domain': '.twyrframework.com',
		'secure': true,
		'httpOnly': false
	},

	'session': {
		'key': 'twyr-webapp',
		'secret': 'Th1s!sTheTwyrP0rta1Framew0rk',
		'ttl': 86400,
		'store': {
			'media': 'redis',
			'prefix': 'twyr!webapp!session!'
		}
	},

	'ssl': {
		'key': './ssl/portal.key',
		'cert': './ssl/portal.crt',
		'rejectUnauthorized': false
	},

	'corsAllowedDomains': [
		'https://api.twyrframework.com'
	],

	'templateEngine': 'ejs',

	'maxRequestSize': 5242880,
	'requestTimeout': 25,
	'connectionTimeout': 30,
	'favicon': './favicon.ico'
});