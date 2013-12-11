Shoper-API in node.js
==========

[API reference](http://www.shoper.pl/help/api)

API do serwisu Shoper.pl napisane w node.js z użyciem request. Zawiera tylko kilka funkcji, ale rozszerzenie go jest proste - wystarczy dopisać kolejną funkcję na podstawie istniejących. Należy zwrócić szczególną uwagę czy argument do wywołania funkcji apiCall ma być obiektem, czy tablicą obiektów (widoczne np. w createProduct - przyjmuje tablicę).

Konfiguracja odbywa poprzez plik settings.json

Przykład w example.js


--------------------------------------------------


This is work in progress implementing only a handful of functions. But extending it is very easy - just read the API docs and write another method based upon the existing ones - simply create a proper argument object and pass it to apiCall. Use at your own risk.

Configuration is done in settings.json

See example.js

TODO
-----------

[] Refactor processError function to use apiCall

[] Refactor API functions to take two parameters in form: `APIFunction( arguments, cb)` where arguments is a product or category, etc.

[] remove session key from globals (**ugh!**)

[] or maybe remove all the API functions and leave just the ApiCall?
