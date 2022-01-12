/**
 * Created by Vlad Karnauch & Eran Amar on 08/12/13.
 * This module create object which handles a single tcp connection from a client.
 */

var requestParser = require('./requestParser');
var validator = require('./validator');
var Response = require('./Response');
var responseBuilder = require('./responseBuilder');
var DataHandler = require('./DataHandler');
var Request = require('./Request');

var DEBUG = false;
function debug(s){
    if (DEBUG){
        console.log('DEBUG: '+s);
    }
}

module.exports = function(socket, miniHttpServer){
    function processRawReq(initialLine, headers, body){
        var req = new Request();
        try {
            req = requestParser.parseRequest(initialLine, headers, body);
            validator.validate(req);
            extractQuery(req);
            extractHost(req);
            var emptyRes = new Response(socket);
            var connectionVal = req.get('connection');
            if (!connectionVal){
                if (req.versionStr === 'HTTP/1.0'){
                    connectionVal = 'close';
                } else {
                    connectionVal = 'keep-alive';
                }
            }
            emptyRes.set('connection', connectionVal);
            miniHttpServer.emit('request', req, emptyRes);
        } catch (errObj) {
            responseBuilder.sendError(new Response(socket), errObj);
            debug('Exception in client handler! e='+errObj);
            handleDisconnect(socket, req);
        }
    }
    var dataHandler = new DataHandler(processRawReq);
    socket.on('data', function (d){
        dataHandler.handleData(d);
    });
    return this;
};

function handleDisconnect(socket, req){
    debug('testing for keep alive'); // DEBUG
    var connectionVal = req.header('Connection');
    if (typeof connectionVal === typeof undefined){
        if (req.versionStr === 'HTTP/1.0'){
            connectionVal = 'close';
        } else {
            connectionVal = 'keep-alive';
        }
    }
    if (String(connectionVal).toLowerCase() === 'close'){
        socket.end();
    }
}
module.exports.handleDisconnect = handleDisconnect;

function extractQuery(req){
    var url = req.path;
    url = url.split('?');
    if (url.length > 2){
        throw new validator.ValidatorException('Invalid Url-query: contains more than one "?".');
    }
    req.path = url.shift();
    if (url.length > 0){
        var keyValPairsArr = url[0].split('&');
        for (var i=0;i<keyValPairsArr.length; i++){
            var pair = (keyValPairsArr[i]).split('=');
            if (pair.length !== 2){
                throw new validator.ValidatorException('Invalid Url-query: pair of "key=value" should contains exactly one "=".');
            }
            req.query[formatUri(pair[0])] = formatUri(pair[1]);
        }
    }
}
function formatUri(uri){
    var retval;
    try{ retval = decodeURIComponent(uri.replace(/\+/g, " ")); }
    catch (e) { retval = uri; }
    return retval;
}

function extractHost(req){
    var protocol = String(req.protocol).toLowerCase() + '://';
    var url = String(req.path);
    var host = req.get('host');
    if (host){
        url = url.replace(protocol, '');
        url = url.replace(host, '');
    } else {
        var hostRegex = new RegExp(protocol+'[^/]+','i');
        host = hostRegex.exec(url);
        if (host === null){
            return;
        }
        url = url.replace(host, '');
        req.setHost(host.replace(protocol,''));
    }
    req.path = url;
}