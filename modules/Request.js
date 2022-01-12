/**
 * Author: Eran Amar.
 * Created on: 22/12/13.
 * a constructor of request object
 */

module.exports = Request;

/**
 * Data structure contains a single http request.
 * @param methodStr - (mandatory) string represents the method (i.e 'GET', 'POST' ect)
 * @param pathStr - (optional) strings represent the path from the request
 * @param headersMap - (optional) map of headers in the form {headerName: valueList}
 * @param bodyBuff - (optional) Buffer object contains the body of the request (empty
 *                  buffer also acceptable for empty body)
 * @param httpVerString - (optional) string represents the version (default = 'HTTP/1.1')
 * @returns {Request}
 * @constructor
 */
function Request(methodStr, pathStr, headersMap, bodyBuff, httpVerString){
    var that = this;
    var headers =  {};
    if (headersMap){
        for (var n in headersMap){
            if (headersMap.hasOwnProperty(n)){
                headers[String(n).toLowerCase()] = headersMap[n];
            }
        }
    }

    this.param = function (name){
        var paramVal = that.params[name];
        if (typeof paramVal === typeof undefined){
            if ((typeof that.body !== typeof '') &&(typeof that.body !== typeof (new Buffer(1)))){
                paramVal = that.body[name];
            }
            if (typeof paramVal === typeof undefined ){
                paramVal = that.query[name];
            }
        }
        return paramVal;
    };

    this.header = function (field){
        var valsArr = headers[String(field).toLowerCase()];
        if (valsArr){
            if (typeof valsArr === typeof []){
                var valsAsString = '';
                for (var i=0; i<valsArr.length;i++){
                    valsAsString += valsArr[i] +' , ';
                }
                if (i>0){
                    return valsAsString.substring(0,valsAsString.length-3);
                }
            }
        }
        return valsArr;
    };

    this.get = function (field){
        return that.header(field);
    };

    this.headersCount = function (){
        return Object.keys(headers).length;
    };

    this.is = function (type){
        var contentType = that.header('content-type');
        if (typeof contentType === typeof undefined){
            return false;
        }
        else {
            var regexp = new RegExp(String(type), 'i');
            return regexp.test(String(contentType));
        }
    };
    this.method = methodStr;
    this.params = {};
    this.query = {};
    this.body = (bodyBuff ||(new Buffer('')));
    this.cookies = {};
    this._cookies = {};
    this.path = (pathStr || '');
    this.host = this.header('host');
    this.protocol = 'http';
    this.versionStr = httpVerString || 'HTTP/1.1';
    this.setHost = function (h){
        headers['host'] = h;
    };
    return this;
}