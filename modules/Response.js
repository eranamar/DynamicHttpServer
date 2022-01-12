/**
 * Authors: Vlad Karnauch & Eran Amar.
 * Created on: 22/12/13.
 * a constructor of response object
 */

var globals = require('./globals.js');
var CRLF = '\r\n';

module.exports = Response;

function Response(socket){
    var that = this;
    var _headerDictionary = {}, _status, _cookieDictionary = {}, _body;

    /**
     * Set the given status code
     * @param status
     */
    this.status = statusFunction;
    /**
     * Set header field to value, or pass an object to set multiple fields at once.
     */
    this.set = setFunction;
    /**
     * Get the case-insensitive response header field.
     */
    this.get = getFunction;
    /**
     * Set cookie name to value, which may be a string or object converted to JSON. The path option defaults to "/".
     */
    this.cookie = cookieFunction;
    /**
     * Send a response.
     * This method performs a myriad of useful tasks for simple non-streaming responses such as automatically
     * assigning the Content-Length unless previously defined and providing automatic HEAD and HTTP cache freshness
     * support.
     * Unless previously defined:
     * When a Buffer is given the Content-Type is set to "application/octet-stream"
     * When a String is given the Content-Type is set defaulted to "text/html"
     * When an Array or Object is given Express will respond with the JSON representation
     * when a Number is given without any of the previously mentioned bodies, then a response body string is assigned
     * for you. For example 200 will respond will the text "OK", and 404 "Not Found" and so on.
     */
    this.send = sendFunction;
    /**
     * Send a JSON response. This method is identical to res.send() when an object or array is passed,
     * however it may be used for explicit JSON conversion of non-objects (null, undefined, etc),
     * though these are technically not valid JSON.
     */
    this.json = jsonFunction;
    /**
     * Closes the connection on the socket
     */
    this.end = endFunction;

    //Implementation:

    function statusFunction(status){
        _status = status;
        return that;
    }
    function setFunction(){
        if (typeof arguments[1] !== typeof undefined){
            _headerDictionary[String(arguments[0]).toLowerCase()] = arguments[1];
            return;
        }

        var headers = arguments[0];
        for (var key in headers){
            if (headers.hasOwnProperty(key)){
                setFunction(key, headers[key]);
            }
        }
    }
    function getFunction(field){
        return _headerDictionary[String(field).toLowerCase()];
    }
    function cookieFunction(name, value, options){
        if (typeof options == 'undefined') options = {};
        _cookieDictionary[String(name).toLowerCase()] = {value: value, options: options};
    }
    function sendFunction(){
        var sendBuffer = function(buffer){
            updateHeader('Content-Type', 'application/octet-stream');
            updateHeader('Content-Length', buffer.length);
        };
        var sendString = function(string){
            updateHeader('Content-Type', 'text/html');
            updateHeader('Content-Length', (new Buffer(string)).length);
        };
        var sendObject = function(object){
            updateHeader('Content-Type','application/json');
            _body = JSON.stringify(object);
            updateHeader('Content-Length', (new Buffer(_body)).length);
        };
        var sendNumber = function(number){
            statusFunction(number);
        };
        var body = arguments[0];
        if (typeof arguments[1] !== typeof undefined){
            that.status(arguments[0]);
            body = arguments[1];
        }
        if (!body) body = '';
        _body = body;
        if (typeof body === typeof '') sendString(body);
        else if (typeof body === typeof 1) sendNumber(body);
        else if (body instanceof Buffer) sendBuffer(body);
        else sendObject(body);

        writeResponse();
    }
    function jsonFunction(){
        if (!_status) statusFunction(globals.STATUSES.OK);
        sendFunction(arguments[0], arguments[1]);
    }
    function endFunction(){
        socket.end();
    }

        //Helper methods

    /**
     * Updates the given header value, only in case in case it has no value, does nothing if the header
     * already exists.
     */
    function updateHeader(field, value){
        field = String(field).toLowerCase();
        if (typeof _headerDictionary[field] == 'undefined')
            _headerDictionary[field] = value;
    }
    function writeResponse(){
        function writeInitialLine(){
            var initialLine = 'HTTP/1.1 ' + _status +' '+ globals.STATUS_TO_STR[_status];
            socket.write(initialLine+CRLF);
        }
        function writeHeaders(){
            for (var key in _headerDictionary){
                if (_headerDictionary.hasOwnProperty(key)){
                    var headerLine = key + ': ' + _headerDictionary[key];
                    socket.write(headerLine+CRLF);
                }
            }
        }
        function writeCookies(){
            for (var cookie in _cookieDictionary){
                if (_cookieDictionary.hasOwnProperty(cookie))
                    socket.write('Set-Cookie: '+getCookieString(cookie, _cookieDictionary[cookie])+CRLF);
            }
        }
        function writeBody(){
            socket.write(_body);
        }
        function writeBreakLine(){
            socket.write(CRLF);
        }
        addExtraInfoHeaders();
        writeInitialLine();
        writeHeaders();
        writeCookies();
        writeBreakLine();
        writeBody();
        handlePersistentConnection();
    }
    function getCookieString(name, value, options){
        if (arguments.length == 2)
            return getCookieString(arguments[0], arguments[1].value, arguments[1].options);
        //To work with a cookie object
        function isOptions(){
            for (var key in options)
                if (options.hasOwnProperty(key)) return true;
            return false;
        }

        var cookieString = name +'='+value;
        if (isOptions()){
            cookieString += '; ';
            for (var key in options){
                if (options.hasOwnProperty(key) && key != 'HttpOnly' && key != 'Secure'){                        var val = options[key];
                    var val = options[key];
                    if (val instanceof Date || key.toLowerCase() ==='expires'){
                        val = (new Date(val)).toUTCString();
                    }
                    cookieString += key +'='+ val + '; ';
                }
            }
            cookieString = cookieString.substring(0, cookieString.length-2); //remove last '; '
            if (options && options.HttpOnly == true) cookieString += '; HttpOnly';
            if (options && options.Secure == true) cookieString += '; Secure';
        }
        return cookieString;
    }

    function addExtraInfoHeaders(){
        updateHeader('Server', globals.SERVER_NAME);
        updateHeader('Date', (new Date()).toUTCString()); // timestamp
    }

    function handlePersistentConnection(){
        // handle Persistent connection:
        var connectionVal = that.get('Connection');
        if (typeof connectionVal === typeof undefined){
                connectionVal = 'keep-alive';
        }
        if (connectionVal.toString().toLowerCase() === 'close'){
            endFunction();
        }
    }

    return this;
}