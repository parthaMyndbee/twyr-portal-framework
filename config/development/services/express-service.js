exports.config = ({
	"ssl": {
		"key": "./ssl/portal.key",
		"cert": "./ssl/portal.crt",
		"rejectUnauthorized": false
	},
	"port": 9090,
	"session": {
		"key": "twyr-portal",
		"ttl": 86400,
		"store": {
			"media": "redis",
			"prefix": "twyr!portal!session!"
		},
		"secret": "Th1s!sTheTwyrP0rta1Framew0rk"
	},
	"protocol": "http",
	"poweredBy": "Twyr Portal",
	"cookieParser": {
		"path": "/",
		"domain": ".twyrframework.com",
		"secure": false,
		"httpOnly": false
	},
	"maxRequestSize": 1000000,
	"requestTimeout": 25,
	"templateEngine": "ejs",
	"connectionTimeout": 30
});