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