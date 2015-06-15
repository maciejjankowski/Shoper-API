var methods = [].forEach.call($$('a[href^="/help/api/method/name"]'), function(e){console.log(e.innerText)});


// method:
var code = $('pre').innerText.trim();
code.match(/array\((.+)\)\)/)[1].split(", ").map(function(e){
  
})


var inputArgs = $('h3').nextElementSibling;
var inputArgsArray = [].map
  .call(inputArgs.children, function(e){return e.innerText})
  .map(function(e){return e .split('-')
                            .map(function(e){return e.trim()})
                  });
                  
inputArgsArray.map(function(e){
  var v = e[0].split(' ');
  eval('$' + v[0] +"=''" )
  return {'name': v[0], validator : v[1].replace("(","").replace(")","")}
})

function array(){
return arguments;
}

function validator(){

}

function call(){
return validate(arguments)
}

// create vars from input args
// eval 