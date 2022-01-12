/**
 * Created by Eran Amar on 08/12/13.
 * This module supply the fileServer service
 */

var fs = require('fs');
var path = require('path');
var globals = require('./globals');

module.exports.getMime = getMime;
module.exports.serveFile = serveFile;

var DEBUG = false;
function debug(str){
    if (DEBUG){
        console.log("DEBUG: "+ str);
    }
}

/**
 * The function that serve a static local file.
 * @param req        - the http request data structure.
 * @param pathRouter - function which transfer the path of the request to the static root folder.
 * @param errHandler - function which handle errors and exceptions (given one parameter which is the exception itself)
 * @param res        - the response object the the server fill in the content of the requested file. The response also
 *               automatically set the CONTENT_TYPE, CONTENT_LENGTH and LAST_MODIFIED headers. The content of the
 *               file itself, is passed to the response via ".send(buff)" method with buff is a Buffer object.
 * @param next - function to invoke when the request resource doesn't found.
 */
function serveFile(req, pathRouter, errHandler, res, next) {
    try {
        var resHeadersArr = [];
        validatePath(req.path);
        var originalPath = reformatPath(req.path);
        var formattedPath = pathRouter(originalPath);
        resHeadersArr.push(makeHeader('Content-Type', getMime(formattedPath)));
        isFileExists(originalPath, formattedPath, resHeadersArr, errHandler, res, next);
    } catch (e) {
        debug('Error in serveFile! e='+e);
        errHandler(e);
    }
}

/**
 * An error object representing logical error serving a file
 * @param infoStr - string of the error
 * @param errCode - the http-status suitable for that error
 * @returns {FileServerError} - the error object.
 * @constructor
 */
function FileServerError(infoStr, errCode){
    this.name =   "FileServerError";
    this.message = infoStr;
    this.code = errCode;
    this.toString = function(){
        return this.name + ": " + this.message;
    };
    return this;
}
FileServerError.prototype = Error.prototype;


/**
 * validate the path
 * @param path - string represents the path
 * @returns {boolean} true iff the path is valid
 */
function validatePath(path){
    if (path.indexOf('~/') !== -1 || path.indexOf('../') !== -1) {
        throw new FileServerError("Relative path is forbidden.", globals.STATUSES.NOT_FOUND);
    } else if (path.charAt(0) !== '/') {
        throw new FileServerError('Path must start with "/".', globals.STATUSES.INTERNAL_SERVER_ERROR);
    }
    return true;
}

/**
 * Reformat the path - if the whole path was "/" adding the suffix "index.html". In addition replacing all
 *                      occurrence (if any) of "%5C" in the string with "\" instead.
 * @param path - the path to reformat
 * @returns {string} - the reformatted path
 */
function reformatPath(path){
    path = decodeURI(path);
    var lastChar = path.charAt(path.length - 1);
    if (lastChar === "/" || lastChar === "\\"){
        path += "index.html";
    }
    return path.toString();
}

/**
 * get the mime type of the file in the path (according the string itself - no checking
 * on the file). If the file have no-extension assumes it is text file
 * @param path - string represents the path
 * @returns {*} - string representing the mime type if supported, else "application/octet-stream"
 */
function getMime(path){
    var extensionIndex = path.lastIndexOf(".");
    if (extensionIndex === -1) {
        return globals.MIME_TYPES["txt"];  //assumes text
    }
    var extensionStr = path.substring(extensionIndex + 1).toLowerCase();
    return globals.MIME_TYPES[extensionStr] || "application/octet-stream";
}

function makeHeader(name, value){
    return {headerName: name, valueStr: value};
}

/**
 * Check that the file exists.
 * @param originalPath - the original path of the file (string)
 * @param path - the formatted path of the file (string)
 * @param resHeadersArr - array of headers object (added later to the res object)
 * @param errHandler - function to handle errors (see parameters on 'serveFile' documentation)
 * @param res - the response object the the server fill in the content of the requested file. The response also 
 *                      automatically set the CONTENT_TYPE, CONTENT_LENGTH and LAST_MODIFIED headers. The content of the 
 *                      file itself, is passed to the response via ".send(buff)" method with buff is a Buffer object.
 * @param next - function to invoke when the file doesnt exists
 */
function isFileExists(originalPath, path, resHeadersArr, errHandler, res, next){
    fs.exists(path, function (exists){
        if (exists){
            processFile(path, resHeadersArr, errHandler, res);
        } else {
            debug('file not exists '+originalPath); // DEBUG
            next();
        }
    });
}

/**
 * Processing the request to get a local file
 * @param path - path to existing file
 * @param resHeadersArr - headers-object array to pass to okHandler - data structure contains the http request
 * @param errHandler - function to handle errors (see parameters on 'serveFile' documentation)
 * @param res - the response object the the server fill in the content of the requested file. The response also 
 *                      automatically set the CONTENT_TYPE, CONTENT_LENGTH and LAST_MODIFIED headers. The content of the 
 *                      file itself, is passed to the response via ".send(buff)" method with buff is a Buffer object.
 */
function processFile(path, resHeadersArr, errHandler, res){
    try {
        fs.stat(path, function (err, fileInfo){
            if (err){
                errHandler(new FileServerError('Failed processing the file.', globals.STATUSES.INTERNAL_SERVER_ERROR));
            } else {
                if (!fileInfo.isFile()){
                    errHandler(new FileServerError('The path leads to folder.', globals.STATUSES.INTERNAL_SERVER_ERROR));
                } else {
                    // adding information headers about the file:
                    var lastModifyStr = (new Date(fileInfo['mtime'])).toUTCString();
                    resHeadersArr.push(makeHeader('Last-Modified', lastModifyStr));
                    var sizeStr = String(fileInfo['size']);
                    resHeadersArr.push(makeHeader('Content-Length', sizeStr));

                    fs.readFile(path, function(err, data){
                        if (err){
                            debug(' error when read the file. e='+err);
                            errHandler(err);
                        } else {
                            res.status(globals.STATUSES.OK);
                            var buff = new Buffer(data);
                            for (var i=0; i<resHeadersArr.length; i++){
                                res.set(resHeadersArr[i].headerName, resHeadersArr[i].valueStr);
                            }
                            res.send(buff);
                        }
                    });
                }
            }
        });
    } catch (e) {
        debug('Exception in process file: ' + e); // DEBUG
        errHandler(new FileServerError('Failed processing the file.', globals.STATUSES.INTERNAL_SERVER_ERROR));
    }
}