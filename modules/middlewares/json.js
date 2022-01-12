/**
 * Created by Eran Amar on 12/28/13.
 */

module.exports = jsonFunction;

function jsonFunction(){
    return function(request, response, next){
        if (request.is('application/json')) {
            var rawBody = request.body.toString();
            try{
                var parsedBody = JSON.parse(rawBody);
                request.body = parsedBody;
            }catch(e){ }
        }
        next();
    };
}