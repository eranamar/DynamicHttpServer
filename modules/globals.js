/**
 * Authors: Vlad Karnauch & Eran Amar.
 * Created on: 08/12/13.
 */

exports.STATUSES = {
    OK:                       200,
    BAD_REQUEST:              400,
    FORBIDDEN:                403,
    NOT_FOUND:                404,
    METHOD_NOT_ALLOWED:       405,
    INTERNAL_SERVER_ERROR:    500
};

exports.STATUS_TO_STR = {
    200: 'OK',
    500: 'Internal Server Error',
    405: 'Method Not Allowed',
    404: 'Not Found',
    403: 'Forbidden',
    400: 'Bad Request'
};

exports.SERVER_VER = 1.1;

exports.MIME_TYPES = {
    "html"  : "text/html",
    "jpg"   : "image/jpeg",
    "jpeg"  : "image/jpeg",
    "css"   : "text/css",
    "js"    : "application/x-javascript",
    "png"   : "image/png",
    "gif"   : "image/gif",
    "txt"   : "text/plain",
    "json"  : "application/json"
};

exports.DEFAULT_TIMEOUT = 2000;

exports.SERVER_NAME = 'Vlad&Eran_HtttpServer/1.00';

exports.MAX_HEADERS = 1000;
