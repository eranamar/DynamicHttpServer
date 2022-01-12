/**
 * Author: Eran Amar.
 * Created on: 01/12/13.
 * This module validates given parsed http requests
 */
var globals = require('./globals');
var SUPPORTED_METHODS =  ['GET', 'POST', 'PUT', 'DELETE'];
var SUPPORTED_VERSIONS = [1.0, 1.1];
var MANDATORY_HEADERS = ['host'];

module.exports.validate = validate;
module.exports.ValidatorException = ValidateException;
/**
 * Constructor for ValidateException
 * @param info_str - informative string regarding the exception. That parameter is optional.
 * @param err_code - the code of the error - this parameter is optional and have a
 *                  default value of 500 (i.e "internal server error").
 * @returns {ValidateException}
 */
function ValidateException(info_str, err_code){
    this.name = 'validateException';
    this.message = (info_str || '');
    this.code = err_code || globals.STATUSES.BAD_REQUEST;
    this.toString = function(){
        return this.name + ": " + this.message;
    };
    return this;
}
ValidateException.prototype = Error.prototype;

/**
 * Complete validation of an HTTP 1.0 and 1.1 request. In case of error throws ValidateException.
 * If the request is valid - add a "version" filed to the RequestData object which contains floating
 * number indicating the version of the request.
 * @param req - a RequestData object, represents the http request.
 */

function validate(req){
    validateMethod(req.method);
    validateHttpVersion(req);
    if (req.versionStr === 'HTTP/1.1'){
        assertContainsMandatoryHeaders(req);
    }
    validatePath(req.path);
    validateHeadersCount(req);
    return true;
}

function validateHeadersCount(req){
    if (globals.MAX_HEADERS < req.headersCount()){
        throw new ValidateException("Request exceeded maximum number of headers.");
    }
}

function validatePath(path){
    if (path.trim() === ''){
        throw new ValidateException("path in HTTP request cannot be empty.");
    }
}

/**
 * Raise ValidateException if one of MANDATORY_HEADERS headers is missing.
 * @param req - a request object.
 */
function assertContainsMandatoryHeaders(req){
    for (var i=0; i<MANDATORY_HEADERS.length; i++){
        var headerVal = req.get(MANDATORY_HEADERS[i]);
        if (!headerVal){
            throw new ValidateException("HTTP request missing the '" + MANDATORY_HEADERS[i] + "' Header.");
        }
    }
}

/**
 * validate that the version match HTTP version format and within the suitable range,
 * if is does - updates the "version" field in req to be that number.
 * else - throws ValidateException
 * @param req - the data structure contains the HTTP request.
 */
function validateHttpVersion(req){
    var versionFormat =  /^HTTP\/(\d+.\d+)$/;
    var versionNumberAsStr = versionFormat.exec(req.versionStr);
    if (versionNumberAsStr === null){
        throw new ValidateException("HTTP version must be in the format 'HTTP/x' whereas x" +
            " is an integer or a float number.");
    }
    // index0 is the whole phase, index1 is the whole version number (with float if exists),
    // index2 is the floating point of the version including the ".".
    var httpVer = parseFloat(versionNumberAsStr[1]);
    if (SUPPORTED_VERSIONS.indexOf(httpVer)=== -1){
        var supporded = '';
        for (var j=0;j<SUPPORTED_METHODS.length-1; j++){
            supporded += (SUPPORTED_METHODS[j]+', ');
        }
        supporded += SUPPORTED_METHODS[j];
        throw new ValidateException("HTTP version is unsupported. The server supports only: "+supporded);
    }
}

/**
 * Asserts that the method of the HTTP request is supported.
 * In case it is not - throws a ValidateException.
 * @param methodName - string represents the methodName of the HTTP request.
 */
function validateMethod(methodName){
    if (SUPPORTED_METHODS.indexOf(methodName) === -1){
        throw new ValidateException('The method "' + methodName + '" is unsupported.', globals.STATUSES.METHOD_NOT_ALLOWED);
    }
}
