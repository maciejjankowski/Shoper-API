Shoper-API in node.js
==========

[API reference](http://www.shoper.pl/help/api)

API do serwisu Shoper.pl napisane w node.js z użyciem request.
 
Większość funkcji działa na promisach.
Moduł zawiera tylko kilka funkcji, ale rozszerzenie go jest proste - wystarczy dopisać kolejną funkcję na podstawie istniejących. Należy zwrócić uwagę na nazwy argumentów przekazywane w obiekcie `options` do każdego wywołania. Szczegóły w kodzie oraz dokumentacji API shopera.

Konfiguracja odbywa poprzez plik settings.json

Przykład w example.js


--------------------------------------------------

There is a rewrite taking place to make all functions promise-based.
This is work in progress implementing only a handful of functions. But extending it is very easy - just read the API docs and write another method based upon the existing ones - simply create a proper argument object and pass it to apiCall. Use at your own risk.

Configuration is done in settings.json

EXAMPLE
----------------------

````
require('shoper-pl')
    .loginQ()

    .then(function (){
        var options  = {
            "extended" : true,
            "translations" : true,
            "options" : false,
            "gfx" : false,
            "attributes" : true,
            "products" : [30995]
        };
      return api.product_list(options)
    })

    .then(function(productList){
      // do something with productList
      var options = {
        conditions : {"category.category_id" :  90}
      };
      return api.product.list.filter(options)
    })

    .then(function(productList){
      // do something with results
      var options = {
        "id" : 184,
        "data" : [],
        "force" : true
      };
      return api.product.attributes.save(options)
    })

    .then(function(result){
      console.log(result)
    })

    .done(); // end promise chain


````

See example.js