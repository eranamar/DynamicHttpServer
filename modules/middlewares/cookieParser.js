/**
 * Created by Eran Amar & Vlad Karnauch on 12/28/13.
 */

if (!String.prototype.trim){
    String.prototype.trim = function(){
        return this.replace(/^\s+|\s+$/g,'');
    };
}

/**
 * Return a cookies parser middleWare.
 *  That middleWare received (req, res, next), and update the 'cookies' property of the
 *  req with the cookies where parsed by the requestParser. Than calls next().
 * @returns {Function} - the cookies parser middleWare
 */
module.exports = function (){
    return function (req, res, next){
        req.cookies = req._cookies;
        next();
    };
};
