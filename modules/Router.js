/**
 * Created by Eran Amar on 23/12/13.
 * This module is constructor of router object which handle routing different http request
 * to the suitable handler (middleware)
 */
var events = require('events');
var DEBUG = false;

function debug(s){
    if (DEBUG){
        console.log('DEBUG: '+s);
    }
}

module.exports = ResponseHandler;
module.exports.isMatch = isMatch;

/**
 * This function handle the loop on all matched routers and invoked them. In case
 * there is no matched router - handle the request as static request.
 * @param routersArr - array of {resource : 'string',requestHandler : 'function', type:'string'/undefined}
 *                      each object is a router object.
 * @param defaultRouter - function that operate as the default router, it should calling
 *                      static fileServer internally.
 * @param req - http request object
 * @param res - empty http response object
 * @constructor
 */
function ResponseHandler(routersArr, defaultRouter, req, res){
    try {
        var routers = [];
        for (var i =0; i<routersArr.length; i++){
            var router = routersArr[i];
            if (isMatch(router, req)){
                routers.push(router);
            }
        }
        var loopObj = new events.EventEmitter();

        var nextFunc = function () {
            try {
                if (routers.length > 0){
                    var currRouter = routers.shift();
                    var regexp = new RegExp(currRouter['regexp']);
                    var paramsNames = currRouter.keys;
                    var catchesFromRegexp = regexp.exec(req.path);
                    req['_matchedPath'] = catchesFromRegexp.shift();
                    req.params = {};
                    for (var k=0; k<paramsNames.length; k++){
                        req.params[String(paramsNames[k])] = formatUri(catchesFromRegexp[k]);
                    }
                    (currRouter['callbacks'][0])(req, res, function (){loopObj.emit('callingNext');});
                } else {
                    defaultRouter(req, res);
                }
            } catch (e) {
                debug('error during routers loop! e='+e);
            }
        };
        loopObj.on('callingNext', nextFunc)
               .on('error', function (e){ debug('error event on loopObj! e='+e);  });
        debug('starting router loop. req.path='+req.path);
        nextFunc(); // starts the loop
    } catch (e) {
        debug('error in handle routers loop! e='+e);
    }
}

/**
 * Tests for match of the router's method and root-resource with the method and the
 * path of the request.
 * @param router
 * @param req
 * @returns {boolean} - true iff there is a match.
 */
function isMatch(router, req){
    if (router['method']){
        if (router['method'] !== req['method']){
            return false;
        }
    }
    return (router['regexp']).test(req['path']);
}
function formatUri(uri){
    var retval;
    try{ retval = decodeURIComponent(uri.replace(/\+/g, " ")); }
    catch (e) { retval = uri; }
    return retval;
}
