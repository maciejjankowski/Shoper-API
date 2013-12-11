api = require('./api');
_u = require('util');


api.login(function(){
	api.getProduct(5266, function(body){
		console.log('body:')
		console.log( _u.inspect(body) );
	});
})