/**
 * Created by Vlad Karnauch on 12/28/13.
 */

module.exports = function(){ return new UrlEncodedFunction();};

/**
 * when sending the data to the server using a FROM tag, the http request content-type will
 * be ‘application/x-www-form-urlencoded’ and the body will look like param1=value1&param2=value2….
 * this middleware parses the body and providing the parsed object as req.body.
 */
function UrlEncodedFunction(){
    return function(request, response, next){
        try{
            var body = '';
            if (request.body){
                body = request.body.toString();
            }
            if (request.is('application/x-www-form-urlencoded')){
                if (validateForm(body)){
                    request.body = parseForm(body);
                }
            }
        } catch (e){
            console.log('exception in url parser m.w: e='+e);
        }
        next();
    };
}

function validateForm(form){
    var paramArr = form.split('&');
    for (var i=0; i<paramArr.length; i++){
        if (paramArr[i].indexOf('=') === -1) return false;
        if (!isNaN(paramArr[i].charAt(0))) return false; //variable names cannot start with digits
    }
    return true;
}

function decodeUri(uri){
    var retval;
    try {retval = decodeURIComponent(uri.replace(/\+/g, " ")); }
    catch (e) {retval = uri;}
    return retval;
}

function parseParam(param){
    var eqIndex = param.indexOf('='),
        field = param.substring(0, eqIndex),
        value = param.substring(eqIndex+1);
    return [decodeUri(field), decodeUri(value)];
}

function parseForm(formStr){
    var retval = {};
    var paramArr = formStr.split('&');
    for (var i=0; i<paramArr.length; i++){
        var pair = parseParam(paramArr[i]);
        retval[pair[0]] = pair[1];
    }
    return retval;
}