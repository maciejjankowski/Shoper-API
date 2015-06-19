var Q = require('q');
var u = require('util');
var request = require('request');
// var colors = require('colors');
// var fs = require('fs');
var _ = require('lodash');

var L = {log:console.log, warn:console.warn, error:console.error, info:console.info};//require('./logor.js');
var nconf = require('nconf').env().file({file: process.cwd() + '/settings.json'});
exports.url = nconf.get("apiUrl");
exports.apiUsername = nconf.get("apiUsername") || "b-good";
exports.apiPassword = nconf.get("apiPassword") || "test123";

exports.key = '';

exports.product = {
  list: {},
  image : {},
  attributes : {}
};

exports.category = {};

exports.attribute = {
  group: {}
};

//url = 'http://localhost:8081/test.php';
//var ii= 15;
function _i(arg){
  return u.inspect(arg, {colors:true, depth:5});
}


function apiCall(params, cb){
  var deferred = Q.defer();

  var save_api = nconf.get("save_api");
  var debug_params = nconf.get("debug_params") || 0;

  if (debug_params)
    L.warn("api call:", u.inspect( params, {depth:6, colors: true} ) );

  if (save_api || params.method == "login" || params.params[1] == "category.tree" || params.params[1] == "product.info"|| params.params[1] == "category.info" || params.params[1] == "internals.validation.errors" ){
    request(

        {
          method : 'POST',
          url: exports.url,
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


            if ( body && typeof body.error !== "undefined" ) {
              L.error( "Wystąpił błąd: " + body.error + " (Kod błędu: " + body.code + ")" );
              console.dir('params:', params);
              if (body.code == 2){
                throw new Error(body.error);
              }

              if (cb){
                processError(cb)
              } else
                processErrorQ(deferred);
//              cb(body);

            }	else if (body == 0 || body == -1){
//							L.error("Wystąpił błąd w obsłudze API 1-----------------------------------\n"
//                  + _i(params) + "\n===========================\n"
//                  + _i(body)+"\n^^^^^^^^^^^^^^^^^^^");
              // TODO jakieś mądrzejsze to powinno być, ale na razie body = 0 lub body = -1 oznacza niekrytyczny błąd w api
              // todo : ... na przykład duplikat produktu, więc odpalamy processError, żeby się dowiedzieć
              if (cb){
                processError( cb );
              } else
                processErrorQ(deferred);
//              cb(body);
            }

            else {
              if (cb){
                cb( body );
              } else
                deferred.resolve(body);
//
            }

          } else { // jeśli nie 200
            L.info("Poważny błąd: " + _i(error));
            L.log("body >", body, "< end body");
            if (nconf.get("exit_on_error") == 1) process.exit(9);
            if (cb){
              cb( error);
            } else
              deferred.reject(error)
          }
        }

    ); //request
    return deferred.promise;
  }
  else
  {
    L.error("fake >", _i([params.params[1], params.params[2] ] ), "< fake" );
    return deferred.resolve( "mock" );
  }

//  deferred.promise;
}// apiCall


function processError (cb){


  var params = {
    'method' : 'call',
    'params' : [exports.key, 'internals.validation.errors', null ]
  };

//	L.error('processError');

  request({
    method : 'POST',
    url: exports.url,
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
          cb(body);
      }

    } else {
      L.error("Błąd komunikacji: "+ _i(error));
    }
  });
}

function processErrorQ (deferred){


  var params = {
    'method' : 'call',
    'params' : [exports.key, 'internals.validation.errors', null ]
  };

//	L.error('processError');

  request({
    method : 'POST',
    url: exports.url,
    body: "json=" + JSON.stringify(params)
//		,encoding: null
  }, function(error, response, body){

    if (!error && response.statusCode == 200) {

      try{
        body = JSON.parse(body);
      }catch(e){
        L.error("Błąd parsowania:\n"+body); //error in the above string(in this case,yes)!
        deferred.reject('błąd parsowania');
      }

      if (typeof body != "undefined" && body != null){

        L.error("> Błąd danych:\n" + _i(body) +"<--------------------------");
        body = body[0];
//				L.warn(body);
        if (typeof body != "undefined" && ~body.indexOf("'code' is not valid") && ~body.indexOf("istnieje")){
//          console.warn(body);
          var re = /ść '(.*)'/; // WTF
          var res = re.exec(body);
          if(res) {
            deferred.resolve( { objId : res[1], type : "code" } );
          }
        } else {
          deferred.reject( body );
        }
      } else {
        L.warn('inspecting: '+ _i(body));
        deferred.reject(body);
      }

    } else {
      L.error("Błąd komunikacji: "+ _i(error));
      deferred.reject();
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
      exports.key,
      'product.create',
      [prod]
    ]
  };

  return apiCall(params, cb);
}

exports.product.create = function ( prodName, prodPrice, prodCode, catId, details ){

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
      exports.key,
      'product.create',
      [prod]
    ]
  };

  return apiCall(params);
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
      exports.key,
      'product.image.save',
      [parseInt(prodId), img, true]
    ]
  };

  apiCall(params, cb);
}

exports.product.image.save = function (o){
  var img = {
    file  : o.prodName + "_" + o.prodId + "_zdjecie.jpg"
    , content : null
    , url  : o.imgUrl
    , name : o.prodName
  };

  var params = {
    'method' : 'call',
    'params' :	[
      exports.key,
      'product.image.save',
      [parseInt( o.prodId), img, true]
    ]
  };

  apiCall(params);
}

exports.category.delete = function (o){

  var params = {
    'method' : 'call',
    'params' :	[
      exports.key,
      'category.delete',
      [o.id, false]
    ]
  };

  apiCall(params);
};

exports.categoryDelete = function (id, cb ){

  var params = {
    'method' : 'call',
    'params' :	[
      exports.key,
      'category.delete',
      [id, false]
    ]
  };

  apiCall(params, cb);
};

exports.product.save = function (o ){

  var params = {
    'method' : 'call',
    'params' :	[
      exports.key,
      'product.save',
      [o.productId, o.product, false]
    ]
  };

  apiCall(params);
};

exports.saveProduct = function (productId, product, cb ){

  var params = {
    'method' : 'call',
    'params' :	[
      exports.key,
      'product.save',
      [productId, product, false]
    ]
  };


  apiCall(params, cb);
};

exports.category.create = function createCategory( o ){

  if (typeof cb != "function")
    cb = function (){};

  if (typeof o.parentId == "undefined"){
    o.parentId = nconf.get("categoryDefaultParentId");
  }

  var category = {
    "parent_id" : o.parentId,
    "order" : 1,
    "translations" : {
      "pl_PL" : {
        "name" : o.name,
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
      exports.key,
      'category.create',
      [o.category]
    ]
  };

  apiCall(params, cb)
}

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
      exports.key,
      'category.create',
      [category]
    ]
  };

  apiCall(params, cb)
}

exports.category.save = function saveCategory(o){


  var category = {
    "parent_id" : o.parentId,
    "order" : 1,
    "translations" : {
      "pl_PL" : {
        "name" : o.name,
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
      exports.key,
      'category.save',
      [o.id, o.category, false]
    ]
  };

  apiCall(params)
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
      exports.key,
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
      exports.key,
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
      exports.key,
      'category.tree',
      []
    ]
  };

  apiCall(params, cb)
}

exports.categoryTreeQ = function getCategory(o){
  if (typeof o === 'undefined') {
    o = {};
  }

  var params = {
    'method' : 'call',
    'params' :	[
      exports.key,
      'category.tree',
          o.categoryId || []
    ]
  };

  return apiCall(params);
};

exports.product.info = function getProduct(o, cb){

//  id
//  translations (boolean) - czy zwrocić dodatkowo informacje o tłumaczeniach
//  options (boolean) - czy zwrócić dodatkowo informacje o wariantach
//  gfx (boolean) - czy zwrócić dodatkowo informacje o zdjęciach
//  attributes (boolean) - czy zwrócić dodatkowo informacje o atrybutach
//  related

  var params = {
    'method' : 'call',
    'params' :	[
      exports.key,
      'product.info',
      [
        o.id,
        o.translations || true,
        o.options || false,
        o.gfx || false,
        o.attributes || true,
        o.related || false
      ] //
    ]
  };

  return apiCall(params, cb)
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
      exports.key,
      'product.info',
      [id, true, false, false, true, false] //
    ]
  };

  return apiCall(params, cb)
}

exports.productListFilter = function getProduct(o, cb){

  if (typeof o.orderBy === "undefined"){
    o.orderBy = null;
  }

  if (typeof o.limit == "undefined")
    o.limit = null;

  var params = {
    'method' : 'call',
    'params' :	[
      exports.key,
      'product.list.filter',
      [o.conditions, o.orderBy, o.limit]
    ]
  };

  return apiCall(params, cb)
};

exports.product.list.filter = function getProduct(o){

  if (typeof o.orderBy === "undefined"){
    o.orderBy = null;
  }

  if (typeof o.limit == "undefined")
    o.limit = null;

  var params = {
    'method' : 'call',
    'params' :	[
      exports.key,
      'product.list.filter',
      [o.conditions, o.orderBy, o.limit]
    ]
  };

  return apiCall(params)
};

exports.getImages = function(id, cb){
  var params = {
    'method' : 'call',
    'params' :	[
      exports.key,
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
      exports.key,
      'product.image.delete',
      [id, imgId]
    ]
  };
  return apiCall(params, cb)
};

exports.login = function (cb){
  var debug_params = nconf.get("debug_params") || 0;
  var params = {
    'method' : 'login',
    'params' : [exports.apiUsername, exports.apiPassword]
  };

  if (exports.key == '')
    apiCall(params, function(content){
      if (debug_params)
        console.log(content);
      exports.key = content;
      if (typeof cb != "undefined"){
        cb(content);
      }
    });
  else
    cb(exports.key);
};

exports.loginQ = function (){
  var debug_params = nconf.get("debug_params") || 0;

  var deferred = Q.defer();

  var params = {
    'method' : 'login',
    'params' : [exports.apiUsername, exports.apiPassword]
  };

  if (exports.key == ''){
    apiCall(params, function(content){
      if (debug_params)
        console.log(content);
      exports.key = content;
      deferred.resolve(content);
    });
  }
  else{
//    cb();
    deferred.resolve(exports.key);
  }

  return deferred.promise;
};

exports.processError = processError;

exports.product_attributes = function(arrayOfIds, cb){
  if (Array.isArray(arrayOfIds)) {
    var params = {
      'method' : "call",
      "params" : [
        exports.key,
        "product.attributes",
        arrayOfIds
      ]
    };

    return apiCall(params, cb)

  } else {
    return new Error("argument nie jest tablicą");
  }
};// product_attributes
exports.product.attributes = function(o, cb){
  if (Array.isArray(arrayOfIds)) {
    var params = {
      'method' : "call",
      "params" : [
        exports.key,
        "product.attributes",
        o.ids
      ]
    };

    return apiCall(params, cb)

  } else {
    return new Error("argument nie jest tablicą");
  }
};// product_attributes
exports.attribute_group_list = exports.attribute.group.list = function(o){

  var params = {
    'method' : "call",
    "params" : [
      exports.key,
      "attribute.group.list",
      [
        o.extended || false,
        o.attributes || false,
        o.groups || null
      ]
    ]
  };

  return apiCall(params)

};// product_attributes


exports.product.list = exports.product_list = function _product_list(o, cb){
//  extended (boolean) - czy zwrócić informacje o obiektach
//  translations (boolean) - czy zwrocić dodatkowo informacje o tłumaczeniach
//  options (boolean) - czy zwrócić dodatkowo informacje o wariantach
//  gfx (boolean) - czy zwrócić dodatkowo informacje o zdjęciach
//  attributes (boolean) - czy zwrócić dodatkowo informacje o atrybutach
//  products (array|null) - tablica identyfikatorów obiektów do pobrania lub **null** w celu pobrania wszystkich dostępnych obiektów

  var params = {
    'method' : "call",
    "params" : [
      exports.key,
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
      exports.key,
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

exports.product_attributes_saveQ = exports.product.attributes.save = function(o){
//  id (int) - identyfikator obiektu
//  data (array) - tablica asocjacyjna, której kluczami są identyfikatory atrybutów a wartościami, ustawiane wartości atrybutu dla produktu
//  force (boolean) - czy wymusić modyfikację obiektu mimo istniejącej blokady innego administratora

  var params = {
    'method' : "call",
    "params" : [
      exports.key,
      "product.attributes.save",
      [
        o.id,
        o.data,
        o.force || false
      ]
    ]
  };

  return apiCall(params)
};
//834
