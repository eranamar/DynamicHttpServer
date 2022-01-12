/**
 * Created by Vlad Karnauch on 12/28/13.
 * Parses the body when content-type is either application/x-www-form-urlencoded or
 * application/json.
 */

var json = require('./json.js');
var urlencoded = require('./urlencoded.js');

module.exports = function(){return new ParseBodyMiddleware();};

function ParseBodyMiddleware(){
    var jsonFunction = json();
    var urlEncodedFunction = urlencoded();

    return function(request ,response ,next){
        var jsonNext = function(){
            urlEncodedFunction(request, response, next);
        };
        jsonFunction(request, response, jsonNext);
    };
}