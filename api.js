var Q = require('q');
var u = require('util');
var request = require('request');
// var colors = require('colors');
// var fs = require('fs');
var _ = require('lodash');

var L = {log:console.log, warn:console.warn, error:console.error, info:console.info};//require('./logor.js');
var nconf = require('nconf');
var Q = require('q');

nconf.env().file({file: 'settings.json'});
var url = nconf.get("apiUrl");

var apiUsername = nconf.get("apiUsername") || "b-good";
var apiPassword = nconf.get("apiPassword") || "test123";

var key = '';
//url = 'http://localhost:8081/test.php';
//var ii= 15;
{
function _i(arg){
	return u.inspect(arg, {colors:true, depth:5});
}


}


function apiCallQ(params, cb){
  var deferred = Q.defer();

  var save_api = nconf.get("save_api");
  var debug_params = nconf.get("debug_params") || 0;

  if (debug_params)
    L.warn("api call:", u.inspect( params, {depth:6, colors: true} ) );

  if (typeof cb != "function")
    cb = function (){};

  if (save_api || params.method == "login" || params.params[1] == "category.tree" || params.params[1] == "product.info"|| params.params[1] == "category.info" || params.params[1] == "internals.validation.errors" ){
    request(

        {
          method : 'POST',
          url: url,
          body: "json=" + JSON.stringify(params)
          //			,encoding: null
        },

        function (error, response, body) {
          if (!error && response.statusCode == 200) {
            try{
              body = JSON.parse(body);
            }catch(e){
              L.error("Błąd parsowania:\n" + body); //error in the above string(in this case,yes)!
            }


            if ( body && typeof body.error != "undefined" ) {
              L.error( "Wystąpił błąd: " + body.error + " (Kod błędu: " + body.code + ")" );
              console.dir('a', params);
              if (body.code == 2){
                throw new Error(body.error);
              }
              processError(cb);
//              cb(body);

            }	else if (body == 0 || body == -1){
//							L.error("Wystąpił błąd w obsłudze API 1-----------------------------------\n"
//                  + _i(params) + "\n===========================\n"
//                  + _i(body)+"\n^^^^^^^^^^^^^^^^^^^");
              // TODO jakieś mądrzejsze to powinno być, ale na razie body = 0 lub body = -1 oznacza niekrytyczny błąd w api
              // todo : ... na przykład duplikat produktu, więc odpalamy processError, żeby się dowiedzieć
              processError(cb);
//              cb(body);
            }

            else {
              deferred.resolve(body);
              cb( body );
            }

          } else { // jeśli nie 200
            L.info("Poważny błąd: " + _i(error));
            L.log("body >", body, "< end body");
            if (nconf.get("exit_on_error") == 1) process.exit(9);
            cb(error)
          }
        }

    ); //request
    return deferred.promise;
  }
  else
  {
    L.error("fake >", _i([params.params[1], params.params[2] ] ), "< fake" );
    cb( "mock" );
  }

//  deferred.promise;
}// apiCall

function apiCall(params, cb){
//  var deferred = Q.defer();

	var save_api = nconf.get("save_api");
	var debug_params = nconf.get("debug_params") || 0;

	if (debug_params)
		L.warn("api call:", u.inspect( params, {depth:6, colors: true} ) );

	if (typeof cb != "function")
		cb = function (){};

	if (save_api || params.method == "login" || params.params[1] == "category.tree" || params.params[1] == "product.info"|| params.params[1] == "category.info" || params.params[1] == "internals.validation.errors" ){
			request(

				{
					method : 'POST',
					url: url,
					body: "json=" + JSON.stringify(params)
	//			,encoding: null
				},

				function (error, response, body) {
					if (!error && response.statusCode == 200) {
            try{
              body = JSON.parse(body);
            }catch(e){
              L.error("Błąd parsowania:\n" + body); //error in the above string(in this case,yes)!
            }


						if ( body && typeof body.error != "undefined" ) {
							L.error( "Wystąpił błąd: " + body.error + " (Kod błędu: " + body.code + ")" );
              console.dir('a', params);
              if (body.code == 2){
                throw new Error(body.error);
              }
							processError(cb);
//              cb(body);

						}	else if (body == 0 || body == -1){
//							L.error("Wystąpił błąd w obsłudze API 1-----------------------------------\n"
//                  + _i(params) + "\n===========================\n"
//                  + _i(body)+"\n^^^^^^^^^^^^^^^^^^^");
							// TODO jakieś mądrzejsze to powinno być, ale na razie body = 0 lub body = -1 oznacza niekrytyczny błąd w api
              // todo : ... na przykład duplikat produktu, więc odpalamy processError, żeby się dowiedzieć
							processError(cb);
//              cb(body);
						}

						else {
							cb( body );
            }

					} else { // jeśli nie 200
						L.info("Poważny błąd: " + _i(error));
						L.log("body >", body, "< end body");
						if (nconf.get("exit_on_error") == 1) process.exit(9);
            cb(error)
					}
				}

		); //request

  }
	else
  {
    L.error("fake >", _i([params.params[1], params.params[2] ] ), "< fake" );
    cb( "mock" );
  }

//  deferred.promise;
}// apiCall



function processError (cb){


	var params = {
		'method' : 'call',
		'params' : [key, 'internals.validation.errors', null ]
	};

//	L.error('processError');

	request({
		method : 'POST',
		url: url,
		body: "json=" + JSON.stringify(params)
//		,encoding: null
	}, function(error, response, body){

		if (!error && response.statusCode == 200) {

      try{
        body = JSON.parse(body);
      }catch(e){
        L.error("Błąd parsowania:\n"+body); //error in the above string(in this case,yes)!
      }

			if (typeof body != "undefined" && body != null){

				L.error("> Błąd danych:\n" + _i(body) +"<--------------------------");
				body = body[0];
//				L.warn(body);
				if (typeof body != "undefined" && ~body.indexOf("'code' is not valid") && ~body.indexOf("istnieje")){
					console.warn(body);
					var re = /ść '(.*)'/; // WTF
					var res = re.exec(body);
					if(res) {
            if (typeof cb == "function")
              cb( { objId : res[1], type:"code" } );
          }
				}
			} else {
				L.warn('inspecting: '+ _i(body));
        if (typeof cb == "function")
          cb();
			}

		} else {
			L.error("Błąd komunikacji: "+ _i(error));
		}
	});
}


exports.createProduct = function ( prodName, prodPrice, prodCode, catId, details, cb ){

//	args = [].slice.call(arguments);
//	L.info(args);

  // merge

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
			,"stock" : details.stock || null
//			"warn_level" : null,
//			"sold" : null,
			,"weight" : details.weight || 5
//			"availability_id" : null,
//			"delivery_id" : null,
//			"gfx_id" : null,
		},
		"translations" : {
			"pl_PL" : {
				"name" : prodName
				,"short_description" : ""
				,"description" : details.desc || prodName
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

	apiCall(params, cb);
}

exports.createImage = function ( prodId, imgUrl, prodName, cb ){

	var img = {
		file  : prodName + "_" + prodId + "_zdjecie.jpg"
		, content : null
		, url  : imgUrl
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

	apiCall(params, cb);
}

exports.categoryDelete = function (id, cb ){

  var params = {
    'method' : 'call',
    'params' :	[
      key,
      'category.delete',
      [id, false]
    ]
  };

  apiCall(params, cb);
};

exports.saveProduct = function (productId, product, cb ){

	var params = {
		'method' : 'call',
		'params' :	[
			key,
			'product.save',
			[productId, product, false]
		]
	};


	apiCall(params, cb);
};

exports.createCategory = function createCategory( name, parentId, cb ){

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

exports.saveCategory = function saveCategory(name, parentId, id, cb){
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

exports.getCategory = function getCategory(id, cb){
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

exports.categoryTree = function getCategory(cb){
  if (typeof cb != "function")
    cb = function (){};

  var params = {
    'method' : 'call',
    'params' :	[
      key,
      'category.tree',
      []
    ]
  };

  apiCall(params, cb)
}

exports.getProduct = function getProduct(id, cb){
	if (typeof cb != "function")
		cb = function (){};

//  id
//  translations (boolean) - czy zwrocić dodatkowo informacje o tłumaczeniach
//  options (boolean) - czy zwrócić dodatkowo informacje o wariantach
//  gfx (boolean) - czy zwrócić dodatkowo informacje o zdjęciach
//  attributes (boolean) - czy zwrócić dodatkowo informacje o atrybutach
//  related

	var params = {
		'method' : 'call',
		'params' :	[
			key,
			'product.info',
			[id, true, false, false, true, false] //
		]
	};

	return apiCall(params, cb)
}

exports.productListFilter = function getProduct(conditions, orderBy, limit, cb){

	if (typeof conditions == "string")
		conditions = {"stock.code" : conditions };

  if (typeof orderBy == "undefined"){
    orderBy = "product_id";
    limit =1
  }

	if (typeof limit == "undefined")
		limit = 1;

	var params = {
		'method' : 'call',
		'params' :	[
			key,
			'product.list.filter',
			[conditions, orderBy, limit]
		]
	};

	return apiCall(params, cb)
};

exports.getImages = function(id, cb){
  var params = {
    'method' : 'call',
    'params' :	[
      key,
      'product.images',
      [id]
    ]
  };
  return apiCall(params, cb)
};

exports.deleteImage = function(id, imgId, cb){
  var params = {
    'method' : 'call',
    'params' :	[
      key,
      'product.image.delete',
      [id, imgId]
    ]
  };
  return apiCall(params, cb)
};

exports.login = function (cb){

	var params = {
		'method' : 'login',
		'params' : [apiUsername, apiPassword]
	};

	if (key == '')
		apiCall(params, function(content){
			key = content;
      if (typeof cb != "undefined"){
        cb(content);
      }
		});
	else
		cb();
};

exports.loginQ = function (cb){
  var deferred = Q.defer();

  var params = {
    'method' : 'login',
    'params' : [apiUsername, apiPassword]
  };

  if (key == '')
    apiCall(params, function(content){
      key = content;
      if (typeof cb != "undefined"){
        deferred.resolve(content);
//        cb(content);
      }
    });
  else{
//    cb();
    deferred.reject()
  }

  return deferred.promise;
};

exports.processError = processError;

exports.product_attributes = function(arrayOfIds, cb){
  if (Array.isArray(arrayOfIds)) {
    var params = {
      'method' : "call",
      "params" : [
        key,
        "product.attributes",
        arrayOfIds
      ]
    };

    return apiCall(params, cb)

  } else {
    return new Error("argument nie jest tablicą");
  }
};// product_attributes


exports.attribute_group_list = function(o, cb){

  var params = {
      'method' : "call",
      "params" : [
        key,
        "attribute.group.list",
        [o.extended, o.attributes, o.attributeGroupList]
      ]
    };

    return apiCall(params, cb)

};// product_attributes


exports.product_list = function _product_list(o, cb){
//  extended (boolean) - czy zwrócić informacje o obiektach
//  translations (boolean) - czy zwrocić dodatkowo informacje o tłumaczeniach
//  options (boolean) - czy zwrócić dodatkowo informacje o wariantach
//  gfx (boolean) - czy zwrócić dodatkowo informacje o zdjęciach
//  attributes (boolean) - czy zwrócić dodatkowo informacje o atrybutach
//  products (array|null) - tablica identyfikatorów obiektów do pobrania lub **null** w celu pobrania wszystkich dostępnych obiektów

  var params = {
    'method' : "call",
    "params" : [
      key,
      "product.list",
      [
            o.extended || false,
            o.translations || false,
            o.options || false,
            o.gfx || false,
            o.attributes || false,
            o.products || null
      ]
    ]
  };

  return apiCall(params, cb)

};

exports.product_attributes_save = function(o, cb){
  var params = {
    'method' : "call",
    "params" : [
        key,
        "product.attributes.save",
        [
          o.id,
          o.data,
          o.force || false
        ]
    ]
  };

  return apiCall(params, cb)
};

exports.attribute_group_list = function(o, cb){
//  extended (boolean) - czy zwrócić tylko listę identyfikatorów (false), czy tablicę, której wartościami są tablice asocjacyjne informacji o żądanych obiektach (true)
//  attributes (boolean) - czy pobrać informacje o atrybutach
//  groups (array|null) - tablica identyfikatorów obiektów do pobrania lub null w celu pobrania wszystkich dostępnych obiektów

  var params = {
    'method' : "call",
    "params" : [
      key,
      "attribute.group.list",
      [
            o.extended || false,
            o.attributes || false,
            o.groups || null
      ]
    ]
  };

  return apiCall(params, cb)
};


exports.product_attributes_save = function(o, cb){
//  id (int) - identyfikator obiektu
//  data (array) - tablica asocjacyjna, której kluczami są identyfikatory atrybutów a wartościami, ustawiane wartości atrybutu dla produktu
//  force (boolean) - czy wymusić modyfikację obiektu mimo istniejącej blokady innego administratora

  var params = {
    'method' : "call",
    "params" : [
      key,
      "product.attributes.save",
      [
            o.id,
            o.data,
            o.force || false
      ]
    ]
  };

  return apiCall(params, cb)
};
//834
