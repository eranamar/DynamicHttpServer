/**
 * Created by Eran Amar on 12/28/13.
 * This module create static fileServer middleware
 */

var fileServer = require('../fileServer');
var responseBuilder = require('../responseBuilder');
var path = require('path');

module.exports = function (rootFolder){
    return new StaticFileServerMiddleWare(rootFolder);
};

function StaticFileServerMiddleWare(rootFolder){
    return function (req, res, next){
        rootFolder = path.resolve(rootFolder);
        if (req.method === 'GET'){
            var matchedPath = (req['_matchedPath'] || '/');
            var pathRouter = function (pathStr){
                pathStr = pathStr.replace(matchedPath, '/');
                return path.join(rootFolder, pathStr);
            };
            var errHandler = function (e){
                responseBuilder.sendError(res, e);
            };
            fileServer.serveFile(req, pathRouter, errHandler, res, next);
        } else {
            next();
        }
    };
}