/**
 * Created by Vlad Karnauch on 12/13/13.
 * This module create objects which handles raw data received from the socket.
 */


module.exports = DataHandler;

function DataHandler(processRawReq){
    var CR = '\r', LF = '\n', CRLF = CR+LF;
    var currentRequest = '', currentRequestLength;
    var slicedRequest = {initialLine: undefined, header: undefined, body: undefined};

    function getNextToken(){
        if (typeof slicedRequest.body !== typeof undefined){
            retval = currentRequest;
            currentRequest = '';
            return retval;
        }
        var retval = '';
        var CRLFIndex = currentRequest.indexOf(CRLF);
        var LFIndex = currentRequest.indexOf(LF);

        if (LFIndex === -1 || (CRLFIndex !== -1 && CRLFIndex < LFIndex)){
            retval = currentRequest.substring(0, CRLFIndex);
            currentRequest = currentRequest.substring(CRLFIndex + CRLF.length);
        }
        else if (CRLFIndex === -1 || (LFIndex !== -1 && LFIndex < CRLFIndex)){
            retval = currentRequest.substring(0, LFIndex);
            currentRequest = currentRequest.substring(LFIndex + LF.length);
        }
        return retval;
    }
    function hasToken(){
        var CRLFIndex = currentRequest.indexOf(CRLF);
        var LFIndex = currentRequest.indexOf(LF);
        if (LFIndex != -1 || CRLFIndex != -1) return true;
        if ((typeof slicedRequest.body !== typeof undefined) && (slicedRequest.body.currentLength < currentRequestLength)) return true;
        return false;
    }
    function isRequestComplete(){
        if (typeof slicedRequest.body === typeof undefined) return false; //Beelining of a new request
        if (slicedRequest.body.currentLength < currentRequestLength) return false; //Current request still reading body
        return true;
    }
    /**
     * Updates content length in case header contains it.
     */
    function updateContentLength(line){
        var splitLine = line.replace(/\s*/g, '').toLowerCase().split(':');
        if (splitLine[0] === 'content-length')
            currentRequestLength = new Number(splitLine[1]);
    }
    function addBody(str){
        if (typeof currentRequestLength === undefined || currentRequestLength === 0) return;
        var lineLength = (new Buffer(str)).length;
        if (slicedRequest.body.currentLength + lineLength <= currentRequestLength){
            slicedRequest.body.content += str;
            slicedRequest.body.currentLength += lineLength;
            return;
        }
        for (var i=0; i<str.length; i++){
            var subStr = str.substring(0, i);
            var subStrLength = (new Buffer(subStr)).length;
            if (slicedRequest.body.currentLength + subStrLength == currentRequestLength){
                slicedRequest.body.currentLength += subStrLength;
                slicedRequest.body.content += subStr;
                currentRequest = str.substring(i);
                return;
            }
        }
    }
    function addTokenToSlicedRequest(line){
        if (typeof slicedRequest.initialLine === typeof undefined) { //Case we have nothing
            slicedRequest.initialLine = line;
            return;
        }
        if (typeof slicedRequest.header === typeof undefined) { //Case we have an initial line, but no header
            if (line != '') {
                slicedRequest.header = line + '\n';
                updateContentLength(line);
            }else{
                //slicedRequest.header = '\n';
                slicedRequest.body = {content: '', currentLength: 0}; //signify header is over
            }
            return;
        }
        if (typeof slicedRequest.body === typeof undefined) { //Case we are loading the header
            if (line != ''){
                slicedRequest.header += line + '\n';
                updateContentLength(line);
            }else{
                //slicedRequest.header += '\n';
                slicedRequest.body = {content: '', currentLength: 0}; //signify header is over
            }
            return;
        }
        // Case we are loading the body according to content length
        if (currentRequestLength > 0) addBody(line);
    }
    function initVariables(){
        currentRequestLength = undefined;
        slicedRequest.initialLine = undefined;
        slicedRequest.header = undefined;
        slicedRequest.body = undefined;
    }

    this.handleData = function(dataStr){
        try{
            currentRequest += dataStr.toString();
            while (hasToken()){
                var token = getNextToken();
                addTokenToSlicedRequest(token);
                if (isRequestComplete()){
                    var initialLine = slicedRequest.initialLine;
                    var header = slicedRequest.header;
                    var body = slicedRequest.body.content;
                    processRawReq(initialLine, (header || ''), body);
                    initVariables();
                }
            }
        } catch (e){
            console.log('Exception on data handler. e='+e);
        }
    };
    return this;
}