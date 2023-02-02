# Dynamic Http Server

## Overview
**Subjects**: JS frameworks & HTTP protocol  

**Language**: NodeJS  

**Authors**: Eran Amar & Vlad Karnauch  

This was Exercise NO.3 and NO.4 written during Internet Technologies 
course at HUJI during winter 2014.

In this exercise my partner and I implemented a dynamic http server which 
compose of two main modules:
The first one in miniHttp.js and the second is miniExpress.js, both 
simplifies version of the known http node module and ExpressJS framework.

The propose of those exercises was to learn deeply the HTTP protocol, and 
implement a server which follow most of it. In addition, building from 
scratch a simple version of ExpressJS framework which enables adding dynamic 
functionality to that server (i.e parsing cookies, serving static files, 
URL parameters and more).




### Complete description of the Project

<section>

#### <a href="">Assignment</a>

This was Exercise NO.3 and NO.4 written during _Internet Technologiest_ course at <abbr title="Hebrew University of Jerusalem">HUJI</abbr> during winter 2014.  
In this exercise my partner and I implemented a dymanic http server which compose of two main modules:  
The first one in `miniHttp.js` and the second is `miniExpress.js`, both simplifies version of the known `http` node module and `ExpressJS` framework.  
The propose of those exercises was to learn deeply the HTTP protocol, and implement a server which follow most of it. In addition, building from scratch a simple version of ExpressJS framework which enables adding dynamic functionality to that server (i.e parsing cookies, serving static files, URL parameters and more).

</section>

<section>

#### <a href="">What can be done with this project?</a>

This project supplies 2 main modules, as describe in the previous paragraph, which can be use by another programmer. That programmer can use the supplied middlewares or pass middelwares from his/her own to the server, and build incrementally, a complex functionality for his/her server.  
In addition, I supplied a demonstration file for the skeptic reader.

</section>

<section>

#### <a href="">How to run the sample file?</a>

This project is build on NodeJS and it is the only thing needed to run the sample (besides a browser) - if you don't have NodeJS install on your computer, you can find the latest version [here](http://www.nodejs.org/).  
Running instructions:  
First, download all the files of the project from [here](https://github.com/eranamar/DynamicHttpServer). Then open a terminal /windows command processor and change it's working directory into the downloaded folder.  
Run the command `node sample.js`. An `Hello` message will be printed to the console, then open your browser to that location: [http://127.0.0.1:3000/static/](http://127.0.0.1:3000/static/) (localhost on port 3000) to play with the interactive-sample.

</section>
</article>

### Capabilities and Functionality

<article><a href="" class="Fold_all">Fold</a> <a href="" class="expand_all">Expand</a>

<section>

#### <a href="">Receiving Http requests & Sending Http responses</a>

The server (construct by `miniHttp` module) assumes that any request received from any incoming connection is an HTTP request. The server parses the requests (which may be in either HTTP/1.1 or HTTP/1.0 protocols), process the parsed request through the suitable middlewares and if applicable sends an HTTP response.  
When there is no suitable middleware to process the request, a 'Not Found' (404 code) html-page is returns as a response.

</section>

<section>

#### <a href="">Serves files statically</a>

The `miniExpress` module supplies static middleware which can serve static files as an http response. That middleware processes only `'GET'` requests even when it was registered as a middleware to any request (by the `app.use()` method). When a requested file is not found on the server, the request is passed to the next suitable middleware.

</section>

<section>

#### <a href="">Asynchronous I/O</a>

Any I/O operation (i.e getting file information, reading from file etc) is done in asynchronous way. Some of the public API of the server is also asynchronous (such as `'server.listen(port)'` method).

</section>

<section>

#### <a href="">Dynamic functionality</a>

The server returned by `miniHttp.createServer([app])` received an `app` object which is created by the `miniExpress` module. That `app` object is actually a data structure which register middelwares (handlers, i.e functions) upon paths prefixes. Meaning that the programmer can set different behavior to different requests (for instance, register any `'GET'` request which started with the path `'/static/'` to static middleware thar returens a static file from some `rootFolder`.)

</section>

<section>

#### <a href="">Parsing MiddleWares</a>

<div>

This project include basic parsing middlewares:

*   `urlencoded()` which parses the body of the request when its content-type is 'application/x-www-form-urlencoded', and populated the `req.body` with an object keyed by the keys from the raw-body.
*   `json()` parser which parses the body of the request when its content-type is 'application/json', and populated the `req.body` with the parsed object.
*   `bodyParser()` which invokes both `urlencoded()` and `json()` as described above.
*   `cookieParser()` which search the requests' headers for 'Cookie' header and populated the `req.cookies` with an object keyed by the cookie names.

</div>

</section>

<section>

#### <a href="">URI Parameters and Queries</a>

The server supports URI parameters and queries. Meaning, the url can include parameters such "mySite.com/:param1/subDir/index.html" and also may contain query i.e "mySite.com/:param1/index.html?key1=value1&key2=value2". The queries and parameters are parsed automatically upon any request, and the corresponding values are stored at `request.query` and `request.params`.

</section>

<section>

#### <a href="">Persistent connection and absolut path</a>

The server maintains persistent connection when applicable (default behavior for HTTP/1.1 or on demand for HTTP/1.0 requests with the `Connection: keep-alive` header). The default TimeOut interval for each connection is: 2 secs. In addition, the server demands the `host` header for HTTP/1.1 requests or absolut path inside the url. For instance, `http://example.com:80/index.html` is allowed as an url.

</section>
</article>

### Public API

<article><a href="" class="Fold_all">Fold</a> <a href="" class="expand_all">Expand</a>  
Following is the list and description of each main module. That is the "Public" API of those modules, visible to any programmer who wish to use that project. Note that each simplified module and a similar API as the original one.  
**miniHttp.js**  
To use the miniHttp server one must `require('./miniHttp')`.  

<section>

#### <a href="">`miniHttp.STATUS_CODES`</a>

An Object.  
A collection of most of the standard HTTP response status codes, and the short description of each. For example, `miniHttp.STATUS_CODES[404] === 'Not Found'`. The server supports (and uses) the following codes: 200, 400, 403, 405, 405 and 500.

</section>

<section>

#### <a href="">`miniHttp.createServer([requestListener])`</a>

Returns a new TCP web server object. The `requestListener` is an optional function which is automatically added to the 'request' event. The `app` object which is constructed by the `miniExpress` module designed to be passes to this function as a `requestListener` (more about it at the **miniExpress.js** sub-section).

</section>

**Class: miniHttp.Server**  
This is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter) with the following events:  

<section>

#### <a href="">`Event: 'request'`</a>

`function (request, response) { }`  
Emitted each time there is a request. Note that there may be multiple requests per connection (in the case of keep-alive connections). `request` is an instance of an object can be found at `modules/Request.js` and `response` is an instance of an object can be found at `modules/Response.js`.

</section>

<section>

#### <a href="">`Event: 'connection'`</a>

`function (socket) { }`  
When a new TCP stream is established. `socket` is an object of type `net.Socket`. Usually users will not want to access this event. In particular, the socket will not emit `readable` events because of how the protocol parser attaches to the socket.

</section>

<section>

#### <a href="">`Event: 'close'`</a>

`function () { }`  
Emitted when the server closes.

</section>

<section>

#### <a href="">`Event: 'clientError'`</a>

`function (exception, socket) { }`  
If a client connection emits an 'error' event - it will forwarded here. `socket` is the `net.Socket` object that the error originated from.

</section>

<section>

#### <a href="">`Event: 'listening'`</a>

`function () { }`  
Emitted when the server has been bound after calling `server.listen`

</section>

<section>

#### <a href="">`server.listen(port, [callback])`</a>

Begin accepting connections on the specified `port` on localhost (127.0.0.1). A port value of zero will assign a random port. This function is asynchronous. When the server has been bound, 'listening' event will be emitted. The last parameter callback will be added as an listener for the 'listening' event.  
One issue some users run into is getting `EADDRINUSE` errors. This means that another server is already running on the requested port. One way of handling this would be to wait a second and then try again.

</section>

<section>

#### <a href="">`server.close([callback])`</a>

Stops the server from accepting new connections and keeps existing connections. This function is asynchronous, the server is finally closed when all connections are ended and the server emits a 'close' event. Optionally, you can pass a callback to listen for the 'close' event.

</section>

<section>

#### <a href="">`server.maxHeadersCount`</a>

Limits maximum incoming headers count, equal to 1000 by default. If set to 0 - no limit will be applied.

</section>

<section>

#### <a href="">`server.setTimeout(msecs, callback)`</a>

`msecs` Number  
`callback` Function  
Sets the timeout value for sockets, and emits a 'timeout' event on the Server object, passing the socket as an argument, if a timeout occurs. If there is a 'timeout' event listener on the Server object, then it will be called with the timed-out socket as an argument.  
By default, the Server's timeout value is 2 seconds, and sockets are destroyed automatically if they time out. However, if you assign a callback to the Server's 'timeout' event, then you are responsible for handling socket timeouts.

</section>

**miniExpress.js**  
To use the miniExpress application one must `require('./miniExpress')`.  
The `miniExpress` module exposes parsing middleware that is simply generated by invocation of the middlewares' name, that returns a function ready to be registered within the `app` object.  
For instance, to generate the `bodyParser` middleware one have to:  
`var miniExpress = require('./miniExpress');  
var bodyParserMiddleware = miniExpress.bodyParser();  
`  
The `app` object is simply constructed by:  
`var miniExpress = require('./miniExpress');  
var app = miniExpress();  
`  
The registration of middlewares upon the `app` will be explained below. That `app` object is designed to be consumed by `miniHttp.createServer([requestListener])` mentioned above. Explanation about the parsing middleware appears under the [Parsing MiddleWares](#parsingSection) section.

<section>

#### <a href="">`app.use([pathPrefix], middlewareFunction)`</a>

Register the `middlewareFunction` to any http request with a path starts with `pathPrefix` (may includes parameters). When `pathPrefix` is omitted it is set internally to the default prefix: `"/"`.

</section>

<section>

#### <a href="">`app.get([pathPrefix], middlewareFunction)`</a>

The same as `app.use()` but the `middlewareFunction` applies only to http requests that uses the `'GET'` method.

</section>

<section>

#### <a href="">`app.put([pathPrefix], middlewareFunction)`</a>

The same as `app.use()` but the `middlewareFunction` applies only to http requests that uses the `'PUT'` method.

</section>

<section>

#### <a href="">`app.delete([pathPrefix], middlewareFunction)`</a>

The same as `app.use()` but the `middlewareFunction` applies only to http requests that uses the `'DELETE'` method.

</section>

<section>

#### <a href="">`app.post([pathPrefix], middlewareFunction)`</a>

The same as `app.use()` but the `middlewareFunction` applies only to http requests that uses the `'POST'` method.

</section>

<section>

#### <a href="">`app.listen([port], [callback])`</a>

Utilize the `miniHttp.createServer([requestListener])` method to instantiate a new TCP server which get this `app` object as a `requestListener`, then invokes it's `listen([port], [callback])` method with the given (optional) arguments. Then, returns that server object.

</section>

<section>

#### <a href="">`app.route`</a>

Returns a partial data structure which contains the middelwares that were registered only by `get()`, `put()`, `delete()`, `post()` methods above. Example of the returened object can be found in this [link](https://gist.github.com/eranamar/8330192).

</section>
</article>

### Request and Response objects

<article>

The `Request` object is a data structure that combine both NodeJS `http.IncomingMessage` object and `ExpressJS:Request` object. The exact API can be found inside `modules/Request.js` documentation (see the project's files), but in general that object supports the following properties and methods (which their full documentation can be found [here](http://expressjs.com/api.html#req.params)): `params, query, body, cookies, path, host, protocol, get(), param()` and `is()`. Similarly, the `Response` object supports: `set(), status(), get() , cookie(), send()` and `json()`. The complete description of those function can be found [here](http://expressjs.com/api.html#res.status).
</article>

### Error Messages

<article>

In general, any exception is captured by the server and cause (most of the time) to an http 'Internal Server Error' html response (code 500). The only prints are errors from sockets (i.e `ECONNRESET` exception).
</article>
