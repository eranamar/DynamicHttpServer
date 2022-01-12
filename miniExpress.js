/**
 * Created by Vlad Karnauch on 12/12/13.
 * This module is a simplified version of Express.js framework.
 */
var responseBuilder = require('./modules/responseBuilder');
var globals = require('./modules/globals');
var Router = require('./modules/Router');
var miniHttp = require('./miniHttp');
var extraSignsPatt = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;
var paramPatt = /\/:[^\/]+/g;

module.exports = function(){return new MiniExpress();};
module.exports.static = require('./modules/middlewares/static');
module.exports.cookieParser = require('./modules/middlewares/cookieParser');
module.exports.json = require('./modules/middlewares/json');
module.exports.urlencoded = require('./modules/middlewares/urlencoded');
module.exports.bodyParser = require('./modules/middlewares/bodyParser');

function MiniExpress(){
    var _resourceHandlerArr = [];

    /**
     * The app returned by express() is in fact a JavaScript Function, designed to be passed to node's http servers
     * as a callbacks to handle requests. This allows you to provide both HTTP and HTTPS versions of your app with
     * the same codebase easily, as the app does not inherit from these, it is simply a callbacks:
     */
    var app = function(request, response){
        var r = new Router(_resourceHandlerArr, defaultHandler, request, response);
    };

    //Interface:

    /**
     * Registers a handler to a given resource, binding all connections with the given path to the handler,
     * If no resource is given, the handler will apply to any resource.
     * @param (optional) resource - resource is the prefix of the resource that you would like to handle
     * @param function(request, response, next()) requestHandler a handler for the given resource, should
     *          receive 3 parameters:
     *          request - the given request,
     *          response - A response object to send
     *          next() - a hint to try another resource of the given path.
     */
    app.use =  new RegisterResourceFunctionCreator();
    /**
     * Bind and listen for connections on the given host and port, this method is identical to node's http.Server#listen().
     * @param port
     * @param callback - function to fire once started listening
     * @returns {createServer} - returns the server object listening on.
     */
    app.listen = listenFunction;
    /**
     * .use() for resources with method 'GET'
     */
    app.get = new RegisterResourceFunctionCreator('GET');
    /**
     * .use() for resources with method 'POST'
     */
    app.post = new RegisterResourceFunctionCreator('POST');
    /**
     * .use() for resources with method 'DELETE'
     */
    app.delete = new RegisterResourceFunctionCreator('DELETE');
    /**
     * .use() for resources with method 'PUT'
     */
    app.put = new RegisterResourceFunctionCreator('PUT');
    /**
     * returns partial data model of registered handler. only the handlers that were registered by any
     * of the 4 methods above ( get, post, put, delete)
     * @returns {{get: Array, delete: Array, post: Array, put: Array}}
     */
    app.route = routeFunction;

    //Implementation:

    /**
     * Returns a function which is used to register a given resource type, or any resource in case
     * of no resType parameter.
     * <This is used to generate functions that act like described .use, that are restricted to a single method>
     * @param (optional)resType, string representation of a resource type to register, 'GET', 'POST', etc..
     *                          leave this for any type.
     */
    function RegisterResourceFunctionCreator(resType){
        var f = function(){
            var resource = '/', requestHandler;
            if (typeof arguments[1] === typeof undefined){
                requestHandler = arguments[0];
            } else {
                resource = arguments[0];
                requestHandler = arguments[1];
            }
            var regexp = generateRegExp(resource);
            var keys = extractKeys(resource);
            _resourceHandlerArr.push({path: resource, callbacks: [requestHandler], method: resType, keys:keys, regexp: regexp});
        };
        return f;
    }
    function routeFunction(){
        var retval = {get:[], delete: [], post: [], put: []};
        for (var i in _resourceHandlerArr){
            if (_resourceHandlerArr.hasOwnProperty(i)){
                var method = _resourceHandlerArr[i].method;
                if (typeof method !== typeof undefined)
                    addToAppropriateResources(retval[method.toLowerCase()],_resourceHandlerArr[i]);
            }
        }
        for (var key in retval){ //Remove empty properties
            if (retval.hasOwnProperty(key))
                if (retval[key].length == 0) delete retval[key];
        }
        return retval;
    }
    function listenFunction(port, callback){
        var server = miniHttp.createServer(app);
        server.listen(port, callback);
        return server;
    }

    return app; //Notice this returns the function with certain attributes
}

function defaultHandler(req, res){
    var errObj = {
        code: globals.STATUSES.NOT_FOUND,
        message:'No handler match your request or non of them sends response.'
    };
    responseBuilder.sendError(res, errObj);
}

function generateRegExp(resource){
    var url = (resource).replace(/\/$/, "").replace(extraSignsPatt, "\\$&");
    return new RegExp('^' + url.replace(paramPatt, "\/([^\/]+)") + '\/?');
}

function extractKeys(path){
    path = path.replace(/\/$/, "").replace(extraSignsPatt, "\\$&");
    var params = [];
    var extractParams = path.replace(paramPatt,function (s) {
        var paramName = s.substring(2);
        if (paramName.charAt(paramName.length - 1) === "/") {
            paramName = paramName.substring(0, paramName.length - 1);
        }
        params.push(paramName);
        return "";
    });
    return params;
}

function addToAppropriateResources(arr, router){
    for (var i=0;i<arr.length; i++){
        if ((arr[i].method === router.method) && (arr[i].path === router.path)){
            for (var t=0;t<router.callbacks.length; t++)
                arr[i].callbacks.push(router.callbacks[t]);
            return;
        }
    }
    arr.push(router);
}