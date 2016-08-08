exports.config = ({
	"from": "root@twyr.com",
	"sender": "Administrator, Twy'r Framework",
	"newAccount": {
		"subject": "Twy'r Portal Account Registration",
		"template": "templates/newAccount.ejs"
	},
	"randomServer": {
		"options": {
			"data": {
				"id": "",
				"method": "generateStrings",
				"params": {
					"n": 1,
					"apiKey": "e20ac8ec-9748-4736-a61c-d234ac6ac619",
					"length": 10,
					"characters": "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
					"replacement": false
				},
				"jsonrpc": "2.0"
			},
			"host": "api.random.org",
			"path": "/json-rpc/1/invoke",
			"port": 443,
			"method": "POST"
		},
		"protocol": "https"
	},
	"resetPassword": {
		"subject": "Twy'r Portal Reset Password",
		"template": "templates/resetPassword.ejs"
	}
});