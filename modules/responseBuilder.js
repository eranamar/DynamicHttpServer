/**
 * Author: Eran Amar.
 * Created on: 01/12/13.
 * This module supply services which related to sending errors messages and sending responses
 */

var globals = require('./globals');
var ERR_TEMPLATE = "<!DOCTYPE html>\n<html>\n<head> <title>{0}</title> </head>\n<body>\n<h2>{0}</h2>\n{1}\n</body>\n</html>";

module.exports.calcBodyInBytes = calcBodyInBytes;
module.exports.generateErrorHtml = generateErrorHtml;
module.exports.sendResponse = sendResponse;
module.exports.sendError = sendError;
/**
 * Retrieve Error object and construct an http from it.
 * @param errObj - an error object with the properties { name, message, [code] }
 * @returns {string} - an HTML string.
 */
function generateErrorHtml(errObj){
    if (!errObj){
        errObj = {name: 'Undefind', message: '', code: globals.STATUSES.INTERNAL_SERVER_ERROR};
    } else if (!errObj.hasOwnProperty('code')){
        errObj.code = globals.STATUSES.INTERNAL_SERVER_ERROR;
    }
    var name = getStatusLineByCode(errObj.code) || errObj.toString();
    var errStr = ERR_TEMPLATE.replace(/\{0\}/g, name).replace(/\{1\}/g,errObj.message);
    //console.log(errStr);
    return errStr;

}

/**
 * Build a response and sends it.
 * @param res - response object
 * @param statusCode
 * @param headersArr - array of headers {headerName: str, valueList: [str,str...]}
 * @param body - string of the body
 */
function sendResponse(res, statusCode, headersArr, body){
    res.status(statusCode);
    //headersArr.push({headerName:'Content-Length', valueList: [calcBodyInBytes(body)]}); // commented-Out because should added here
    for (var i=0;i<headersArr.length; i++){
        res.set(headersArr[i].headerName, headersArr[i].valueList);
    }
    res.send(body);
}

/**
 * Calculates the  body's length
 * @param body - string of the body
 * @returns {number} - the length of the body suitable for "Content-Length" header.
 */
function calcBodyInBytes(body) {
    var buff = new Buffer(body);
    return buff.length;
}
/**
 * Return complete status string from status code.
 * @param code - the status code
 */
function getStatusLineByCode(code){
    if (! (code in globals.STATUS_TO_STR)){
        code = globals.STATUSES.INTERNAL_SERVER_ERROR;
    }
    return String(code) + ' ' + globals.STATUS_TO_STR[code];
}

function sendError(res, errObj){
    var errBody = new Buffer(generateErrorHtml(errObj));
    var errResponseHeaders = [
        {headerName: 'Content-Type', valueList : ['text/html']},
        {headerName: 'Content-Length', valueList : [String(errBody.length)]}
    ];
    sendResponse(
        res,
        (errObj.code || globals.STATUSES.INTERNAL_SERVER_ERROR),
        errResponseHeaders,
        errBody.toString());
}