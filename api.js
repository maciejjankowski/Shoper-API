var u = require('util');
var request = require('request');
var colors = require('colors');
var fs = require('fs');

var nconf = require('nconf');


nconf.env().file({file: 'settings.json'});
var url = nconf.get("apiUrl");

var apiUsername = nconf.get("apiUsername");
var apiPassword = nconf.get("apiPassword");

var key = '';

{
function _i(arg){
	return u.inspect(arg, {colors:true, depth:5});
}

function L(arg){
	console.log(arg);
	fs.appendFile('api.txt', u.inspect(arg) + "\n", function (err) {
		if (err) throw err;
	});
//	process.nextTick();
}
function LR(arg){
	fs.appendFile('api.error.txt', u.inspect(arg)+"\n", function (err) {
		if (err) throw err;
	});
	console.log('\033[31m' + arg + '\033[37m');
}
function LY(arg){
	fs.appendFile('api.txt', u.inspect(arg)+"\n", function (err) {
		if (err) throw err;
	});
	console.log('\033[33m' + arg + '\033[37m');
}
}

function apiCall(params, cb){
	var save_api = nconf.get("save_api");
	var debug_params = nconf.get("debug_params") || 0;

	if (debug_params)
		console.warn( u.inspect( params, {depth:6, colors: true} ) );

//	if (typeof params != "undefined" && typeof params.params != "undefined" &&  params.method != "login")
//			LY("api call: " + params.params[1]);
//	if (params.method == "login")
//		LY("login");

	if (typeof cb != "function")
		cb = function (){};

	if (save_api || params.method != "product.create" || params.method != "category.create")
			request(

				{
					method : 'POST',
					url: url,
					body: "json=" + JSON.stringify(params)
	//			,encoding: null
				},

				function (error, response, body) {
					if (!error && response.statusCode == 200) {

						body = JSON.parse(body);

						if ( typeof body.error != "undefined" ) {
							LR( "Wystąpił błąd: " + body.error + " (Kod błędu: " + body.code + ")" );
							processError(0, cb);

						}	else if (body == 0 || body == -1){
							LR("Wystąpił błąd w obsłudze API:\n" + _i(params) + "\n===========================\n"+ _i(body)+"\n^^^^^^^^^^^^^^^^^^^");
//							i(params);
							debugger;
							processError(0, cb);

						}

						else
							cb( body );

					} else { // jeśli nie 200
						L("Poważny błąd: " + _i(error));
//						console.log();
						if (nconf.get("exit_on_error") == 1) process.exit(-1);
					}
				}

		); //request

	else
		LY(_i(params));

}



function processError (arg, cb){
	if (typeof cb != "function")
		cb = function (){};

	var params = {
		'method' : 'call',
		'params' : [key, 'internals.validation.errors', null ]
	}

	LR('processError');

	request({
		method : 'POST',
		url: url,
		body: "json=" + JSON.stringify(params)
//		,encoding: null
	}, function(error, response, body){

		if (!error && response.statusCode == 200) {

			body = JSON.parse(body);
			if (typeof body != "undefined" && body != null){

				LR("> Błąd danych, body: " + typeof body + "\n" + _i(body) +"\n<-");
				body = body[0];
//				LY(body);
				var a= typeof body != "undefined"
				var b= body.indexOf("'code' is not valid")
				var c = body.indexOf("istnieje")
				if (a && b && c){
					LY('Produkt o podanym kodzie istnieje');
					var re = /ść '(.*)'/;
					var res = re.exec(body)
					if(res) cb( { objId : res[1],type:"code" } );
				}
			} else {
				LY('inspecting: '+ _i(body))
				cb();
			}

		} else {
			LR("Błąd komunikacji: "+ _i(error));
		}

		if (arg == 1)
		{
			process.nextTick(function(){
				if (nconf.get("exit_on_error") == 1) process.exit(-1);
			})
		}
			else {
//			cb();
		}
			;
	});
}


exports.productCreate = function ( prodName, prodPrice, prodCode, catId, details, cb ){

//	args = [].slice.call(arguments);
//	L(args);
//	process.exit(-1);

	var prod = {
		"producer_id" : details.producer_id,
		"tax_id" : 1,
		"category_id" : parseInt(catId),
		"unit_id" : 2,
//		"other_price" : null,
		"code" : prodCode,
//		"pkwiu" : null,
		"stock" : {
			"price" : prodPrice
//			,"stock" : null,
//			"warn_level" : null,
//			"sold" : null,
			,"weight" : details.weight
//			"availability_id" : null,
//			"delivery_id" : null,
//			"gfx_id" : null,
		},
		"translations" : {
			"pl_PL" : {
				"name" : prodName
				,"short_description" : details.desc
				,"description" : details.desc
				,"active" : 0
//				,"seo_title" : null,
//				"seo_description" : null,
//				"seo_keywords" : null,
				,"order" : 12
//				"main_page" : null,
//				"main_page_order" : null
			}
		}
		//*/
	};
	var params = {
		'method' : 'call',
		'params' :	[
			key,
			'product.create',
			[prod]
		]
	};

//	process.exit(-1);
	apiCall(params, cb);
}

exports.productImageSave = function ( prodId, imgUrl, prodName, cb ){

	var img = {
		file  : prodName + "_" + prodId + "_zdjecie.jpg"
		, content : null
		, url  :imgUrl
		, name : prodName
	};

	var params = {
		'method' : 'call',
		'params' :	[
			key,
			'product.image.save',
			[parseInt(prodId), img, true]
		]
	};
	// console.warn( u.inspect( params, {depth:6, colors: true} ) );
	apiCall(params, cb);
}


exports.productSave = function (productId, product, cb ){

	var params = {
		'method' : 'call',
		'params' :	[
			key,
			'product.save',
			[productId, product, false]
		]
	};
	// console.warn( u.inspect( params, {depth:6, colors: true} ) );

	apiCall(params, cb);
}

exports.categoryCreate = function ( name, parentId, cb ){

	if (typeof cb != "function")
		cb = function (){};

	if (typeof parentId == "undefined"){
		parentId = nconf.get("categoryDefaultParentId");
	}

	var category = {
		"parent_id" : parentId,
		"order" : 1,
		"translations" : {
			"pl_PL" : {
				"name" : name,
				"description" : "",
				"active" : 1,
				"seo_title" : "",
				"seo_description" : "",
				"seo_keywords" : ""
			}
		}
	}

	var params = {
		'method' : 'call',
		'params' :	[
			key,
			'category.create',
			[category]
		]
	};

	apiCall(params, cb)
}

exports.categorySave = function saveCategory(name, parentId, id, cb){
	if (typeof cb != "function")
		cb = function (){};

	var category = {
		"parent_id" : parentId,
		"order" : 1,
		"translations" : {
			"pl_PL" : {
				"name" : name,
				"description" : "",
				"active" : 1,
				"seo_title" : "",
				"seo_description" : "",
				"seo_keywords" : ""
			}
		}
	}

	var params = {
		'method' : 'call',
		'params' :	[
			key,
			'category.save',
			[id, category, false]
		]
	};

	apiCall(params, cb)
}

exports.categoryInfo = function (id, cb){
	if (typeof cb != "function")
		cb = function (){};

	var params = {
		'method' : 'call',
		'params' :	[
			key,
			'category.info',
			[id, true]
		]
	};

	apiCall(params, cb)
}

exports.productInfo = function (id, cb){
	if (typeof cb != "function")
		cb = function (){};

	var params = {
		'method' : 'call',
		'params' :	[
			key,
			'product.info',
			[id, true, false, false, false]
		]
	};

	apiCall(params, cb)
}

exports.productListFilter = function getProduct(conditions, orderBy, limit, cb){
	if (typeof cb != "function")
		cb = function (){};
	if (typeof conditions == "string")
		conditions = {"stock.code" : conditions};
	if (typeof orderBy == "undefined" || orderBy == "" || orderBy == null)
		orderBy = "product_id";
	if (typeof limit == "number" || limit == "" || limit == null)
		limit = 1;


	var params = {
		'method' : 'call',
		'params' :	[
			key,
			'product.list.filter',
			[conditions, orderBy, limit]
		]
	};

	apiCall(params, cb)
}

exports.login = function (cb){

	if (typeof cb == "undefined"){
		cb = function(){};
	}
	var params = {
		'method' : 'login',
		'params' : [apiUsername, apiPassword]
	}

	if (key == '')
		apiCall(params, function(content){
			key = content;
			cb();
		});
	else
		cb();
};


exports.processError = processError;