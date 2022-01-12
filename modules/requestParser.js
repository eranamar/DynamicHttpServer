/**
 * Author: Vlad Karnauch.
 * Created on: 01/12/13.
 *  This module supply parsing services: parses raw http request (strings) and returns
 *  http Request object (see also Request.js)
 */
var globals = require('./globals');
var Request = require('./Request');

var indexOfEither;
/**
 * Provides the first appearance of an item in <elemArr>
 * @param str{string} string to check for elements in the arr, must be a string object
 * @param elemArr array of elements to check inside the string, can be a string or a regex
 * @param position indicates position to start search from, must be a number
 * @returns {number}
 */
indexOfEither = function(str, elemArr, position){
    if(typeof(String.prototype.trim) === typeof undefined){
        String.prototype.trim = function (){
            return String(this).replace(/^\s+|\s+$/g, '');
        };
    }

    if (typeof position == 'undefined') position = 0;
    var minLoc =  -1;

    for (var i=0;i < elemArr.length; i++){
        var elem = elemArr[i];
        var currentLoc = str.indexOf(elem, position);
        if (currentLoc != -1 && (currentLoc < minLoc || minLoc == -1))
            minLoc = currentLoc;
    }
    return minLoc;
};

/**
 * Partitions the request into <initial line>, <header>, body.
 * @param reqStr string format of the given request
 * @return an object of the form:
 * {initialLine: <initial line>(string), header: <header>(string), body: <body>(string)}
 */
function partitionReqString(reqStr){
    var CR = '\r', LF = '\n';
    var CRLF = CR+LF;
    var reqInitialLine, reqHeader, reqBody;
    var clearFromBegin;

    var endInitialLine = indexOfEither(reqStr, [CRLF, LF]);
    var endHeader = indexOfEither(reqStr, [CRLF+CRLF, LF+LF, CRLF+LF, LF+CRLF],
         (reqStr.charAt(endInitialLine) == CR ? endInitialLine : endInitialLine));

    if (endInitialLine == -1 || endHeader == -1)
        throw parseException('Invalid Structure');

    reqInitialLine = reqStr.substring(0, endInitialLine);

    reqHeader = reqStr.substring(endInitialLine, endHeader);
    clearFromBegin = new RegExp('^(' + CRLF + '|' + LF + ')');
    reqHeader = reqHeader.replace(clearFromBegin, '');
    var replaceHeaderCRLF = new RegExp(CRLF, 'g')
    reqHeader = reqHeader.replace(replaceHeaderCRLF, LF);

    reqBody = reqStr.substring(endHeader);
    clearFromBegin = new RegExp('^(' + CRLF+CRLF + '|' + LF+LF + '|' + CRLF+LF + '|' + LF+CRLF + ')');
    reqBody = reqBody.replace(clearFromBegin, '');

    return {initialLine: reqInitialLine, header: reqHeader, body: reqBody};
}

/**
 * Parses the initial line of a http-request into it's components.
 * -Note this function allows any type of whitespace between the compontents
 * @param initialLine string representation of the initial line
 * @return an object of the form {cmd:<string>, path:<string>, version:<string>}
 */
function parseInitialLine(initialLine){
    var initialLineRegEx = /^([\S]+)\s+([\S]+)+\s+([\S]+)\s*$/;
    var components = initialLineRegEx.exec(initialLine);
    if (components == null)
        throw parseException("Initial Line must be formed (command) (path) (version)");
    return {cmd:components[1], path: components[2], version: components[3]};
}


/**
 * Function cleans the header for easier reading.
 * @param header string representations
 * @returns Updated string representation of the header
 */
function cleanHeaderFormat(header){
    header = header.replace(/\n( |  )/g, '');
    //replaces newline followed with whitespaces with an empty string
    //since newline followed with a whitespace(s) is a part of the previous line
    header = header.replace(/\n+/g, '\n');
    //if (header.charAt(0) == '\n') header = header.substring(1);
    if (header.charAt(header.length-1) == '\n') header = header.substring(0, header.length-1);
    return header;
}

/**
 * Translates a header, into an object containing, the name, and an array of values.
 * @param headerLine string representation of a single header line
 * @returns {{headerName: string, valueList: Array}}
 */
function convertHeader(headerLine){
    var header, valueArray, valueStr;
    headerLine = headerLine.replace(/\s*:\s*/, ':'); //remove spaces around ':'
    var colonIndex = headerLine.indexOf(':');
    if (colonIndex == -1)
        throw parseException("Header <" + headerLine + "> does not contain an ':'");

    header = headerLine.substring(0, colonIndex)
    header = String(header).toLowerCase().trim();
    if (header == '') throw parseException("Header <" + headerLine + '> has no name');
    valueStr = headerLine.substring(colonIndex+1);
    valueArray = valueStr.split(/\s*,\s*/);
    for (var t=0;t<valueArray.length;t++){
        valueArray[t] = valueArray[t].trim();
    }

    return {headerName: header, valueList: valueArray};
}

/**
 * Parses the headers into an array
 * @param header - String representation of the header
 * @returns {headerDictionary:{*}, CookieDictionary:{*}}
 */
function parseHeader(header){
    function addCookies(cookie){
        cookie.replace(/^\s*/, ''); //remove spaces at the beginning
        cookie.replace(/\s*$/, ''); //remove spaces at the end

        var cookieArr = cookie.split(/\s*;\s*/g);
        for (var i in cookieArr){
            if (cookieArr[i] === '') continue;
            var currCookie = cookieArr[i].split(/\s*=\s*/);
            cookieDictionary[currCookie[0].trim()] = currCookie[1].trim();
        }
    }

    var headerComponents;
    var headerDictionary = {}, cookieDictionary = {};

    header = cleanHeaderFormat(header);
    if (header.replace(/\s*/g, '') == '') return [];
    headerComponents = header.split('\n');
    for (var i=0; i<headerComponents.length; i++){
        var convertedHeader = convertHeader(headerComponents[i]);
        if (convertedHeader.headerName == 'cookie') addCookies(convertedHeader.valueList[0]);
        else headerDictionary[convertedHeader.headerName] = convertedHeader.valueList;
    }
    return {headerDictionary: headerDictionary, cookieDictionary: cookieDictionary};
}


/**
 * parses a request into a {RequestData} object, function can work with either:
 *      -A single parameter containing the entire request as a string
 *      -3 parameters containing initial request line, headers, body of the HTTP request.
 * @returns {request}
 */
module.exports.parseRequest = function(){
    if (arguments.length == 1){
        return parseCompleteRequest(arguments[0]);
    }
    if (arguments.length == 3){
        return parseSlicedRequest(arguments[0], arguments[1], arguments[2]);
    }
};

/**
 * Parser a sliced request, parameters are parts of an HTTP request.
 * Parameters are parts of an http re
 * @param initialLineStr {string}
 * @param headersStr {string}
 * @param bodyStr {string}
 * @returns {request} containing the information concerning the request.
 */
function parseSlicedRequest(initialLineStr, headersStr, bodyStr){
    return parseCompleteRequest(initialLineStr + '\n' + headersStr + '\n' + bodyStr);
}

/**
 * Parsing function which parses http-requests.
 * @param reqStr - an HTTP-request given as a String.
 * @returns {RequestData} - all the data in the supplied request as RequestData object.
 */
function parseCompleteRequest(reqStr){
    if (typeof reqStr != 'string') throw parseException("Can only parse string requests");
    var partitionedRequest = partitionReqString(reqStr);
    var initialLine = parseInitialLine(partitionedRequest.initialLine);
    var header = parseHeader(partitionedRequest.header);
    var req = new Request(initialLine.cmd, initialLine.path, header.headerDictionary, new Buffer(partitionedRequest.body), initialLine.version);
    req._cookies = header.cookieDictionary;
    return req;
}

function parseException(info_str){
    return {
        name: 'parseException',
        message: info_str,
        code: globals.STATUSES.BAD_REQUEST
    };
}