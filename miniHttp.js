/**
 * Author: Eran Amar.
 * Created on: 22/12/13.
 * This module is a simplified version of node's http module
 */

var net = require('net');
var globals = require('./modules/globals');
var events = require('events');
var ClientHandler = require('./modules/ClientHandler');

function HttpServer(requestCallback){
    var miniHttpServer = this;
    miniHttpServer.__proto__ = events.EventEmitter.prototype;

    var tcpServer, runningStatus = false;
    var checkStatus = function (desireState){
        if (desireState !== runningStatus){
            throw "Can't change state, the server is already " + (runningStatus? 'ON' : 'OFF');
        }
    };
    var timeoutFunc = function (socket){ socket.end();};

    this.timeout = globals.DEFAULT_TIMEOUT;
    this.maxHeadersCount = globals.MAX_HEADERS;

    this.listen = function(port, listenCallback){
        checkStatus(false);
        runningStatus = true;
        if (port == 0){ // according to the docs - should assigned dynamic random port
            // assigned dynamic port in range 49152–65535 (those ports are for dynamic use)
            port = Math.floor((Math.random()*16383)+49152);
        }
        if (requestCallback){
            // start listening for 'request' events (this event is emitted from dataLoopHandler.handleData())
            miniHttpServer.on('request', requestCallback);
        }
        var newTcpConnectionHandler = function (clientSocket){
            var clientHandler = new ClientHandler(clientSocket, miniHttpServer);
            clientSocket.on('error', function (err){miniHttpServer.emit('clientError', err, clientSocket);});
            clientSocket.setTimeout(miniHttpServer.timeout, function(){timeoutFunc(clientSocket); });
            miniHttpServer.emit('connection', clientSocket); //miniHttp notify a new connection
        };
        if (listenCallback){
            miniHttpServer.on('listening', listenCallback);
        }
        tcpServer = net.createServer(newTcpConnectionHandler);
        tcpServer.listen(port, function (){
            miniHttpServer.emit('listening'); // miniHttp notify when starts listening
        });

        tcpServer.on('close', function (){miniHttpServer.emit('close');});
        tcpServer.on('error', function (err){miniHttpServer.emit('error', err);});
    };

    this.close = function(callback){
        checkStatus(true);
        if (callback){
            miniHttpServer.on('close', callback);
        }
        tcpServer.close(); // already assign 'close' emitting at listen() func.
        runningStatus = false;

    };

    this.setTimeout = function (msecs, callback){
        miniHttpServer.timeout = msecs;
        timeoutFunc = callback;
    };

    return this;
}

module.exports.createServer = function (requestCallback){
    return new HttpServer(requestCallback);
};
module.exports.STATUS_CODES = globals.STATUS_TO_STR;