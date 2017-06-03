function doAjax(url, data, method, callback, syc, requestBody) {
    var data_tmp = data;
    if (requestBody == true) {
        if (typeof(data) != 'string') {
            data = JSON.stringify(data);
        }
    }
    var param = {
        type: method,
        url: url,
        data: data,
        cache: false,
        async: syc == true,
        success: callback,
        error: function (e) {
            if (e.status == 200) {
                msg = {code: 200, result: e.statusText, success: true};
                return msg;
            }
            var msg = {};
            if (e.responseJSON) {
                msg = e.responseJSON;
            } else {
                msg = {code: e.status, result: e.statusText, success: false};
            }
            if (msg.code == 401) {
                if (window.doLogin)
                    doLogin(function () {
                        doAjax(url, data_tmp, method, callback, syc, requestBody);
                    });
            } else {
                if (callback)
                    callback(msg);
            }
        },
        dataType: 'json'
    };
    if (requestBody == true) {
        param.contentType = "application/json";
    }
    return $.ajax(param).responseJSON;
}
function getRequestUrl(url) {
    if (url.indexOf("http") == 0) {
        return url;
    } else {
        return ( window.API_BASE_PATH ? window.API_BASE_PATH : window.BASE_PATH) + url;
    }
}
module.exports = {
    basePath: window.API_BASE_PATH ? window.API_BASE_PATH : window.BASE_PATH,
    getParameter: function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]);
        return null;
    },
    encodeQueryParam: function (data) {
        var queryParam = {};
        var index = 0;
        for (var f in data) {
            if (data[f] == "")continue;
            if (f.indexOf('$LIKE') != -1 && data[f].indexOf('%') == -1)data[f] = "%" + data[f] + "%";
            if (f.indexOf('$START') != -1)data[f] = "%" + data[f];
            if (f.indexOf('$END') != -1)data[f] = data[f] + "%";
            queryParam["terms[" + (index) + "].column"] = f;
            queryParam["terms[" + (index) + "].value"] = data[f];
            index++;
        }
        return queryParam;
    },
    createQuery: function (api) {
        var query = {};
        query.param = {};
        query.terms = [];
        query.nowType = "and";
        query.getParams = function () {
            var tmp = buildParam(query.terms);
            for (var f in tmp) {
                query.param[f] = tmp[f];
            }
            return query.param;
        };
        query.select = function (columns) {
            query.param.includes = columns + "";
            return query;
        };
        query.excludes = function (columns) {
            query.param.excludes = columns + "";
            return query;
        };
        query.like = function (k, v) {
            query.terms.push({column: k, type: query.nowType, termType: "like", value: v});
            return query;
        };
        query.where = function (k, v, t) {
            query.and(k, v, t);
            return query;
        };
        query.and = function (k, v, t) {
            query.nowType = "and";
            if (k && v)
                query.terms.push({column: k, termType: t ? "eq" : t, type: query.nowType, value: v});
            return query;
        };
        query.orNest = function (k, v) {
            return query.nest(k, v, true);
        };
        query.nest = function (k, v, isOr) {
            var nest = {column: k, value: v, type: isOr ? 'or' : 'and'};
            var func = {};
            nest.terms = [];
            func.and = function (k, v, t) {
                query.nowType = "and";
                if (k && v)
                    nest.terms.push({column: k, termType: t ? "eq" : t, value: v, type: 'and'});
                return func;
            };
            func.or = function (k, v, t) {
                query.nowType = "or";
                if (k && v)
                    nest.terms.push({column: k, termType: t ? "eq" : t, value: v, type: 'or'});
                return func;
            };
            func.exec = query.exec;
            func.nest = query.nest;
            query.terms.push(nest);
            return func;
        };
        query.or = function (k, v, t) {
            query.nowType = "or";
            if (k && v)
                query.terms.push({column: k, termType: t ? "eq" : t, value: v, type: query.nowType});
            return query;
        };
        query.orderBy = function (f) {
            query.param.sortField = f;
            return query;
        };
        query.desc = function () {
            query.param.sortOrder = 'desc';
            return query;
        };
        query.asc = function () {
            query.param.sortOrder = 'asc';
            return query;
        };
        query.noPaging = function () {
            query.param.paging = 'false';
            return query;
        };
        query.limit = function (pageIndex, pageSize) {
            query.param.pageIndex = start;
            if (pageSize)
                query.param.pageSize = pageSize;
            return query;
        };
        function buildParam(terms) {
            var tmp = {};
            $(terms).each(function (i, e) {
                for (var f in e) {
                    if (f != 'terms')
                        tmp["terms[" + i + "]." + f] = e[f]; else {
                        var tmpTerms = buildParam(e[f]);
                        for (var f2 in tmpTerms) {
                            tmp["terms[" + i + "]." + f2] = tmpTerms[f2];
                        }
                    }
                }
            });
            return tmp
        }

        query.exec = function (callback) {
            var tmp = buildParam(query.terms);
            for (var f in tmp) {
                query.param[f] = tmp[f];
            }
            return doAjax(getRequestUrl(api), query.param, "GET", callback, typeof(callback) != 'undefined', false);
        };
        return query;
    }, get: function (uri, data, callback) {
        var data_ = data, callback_ = callback;
        if (typeof(data) == 'undefined')data_ = {};
        if (typeof(callback) == 'object')data_ = callback;
        if (typeof(data) == 'function')callback_ = data;
        return doAjax(getRequestUrl(uri), data_, "GET", callback_, typeof(callback_) != 'undefined', false);
    }, post: function (uri, data, callback, requestBody) {
        if (requestBody != false)requestBody = true;
        doAjax(getRequestUrl(uri), data, "POST", callback, true, requestBody);
    }, put: function (uri, data, callback, requestBody) {
        if (requestBody != false)requestBody = true;
        doAjax(getRequestUrl(uri), data, "PUT", callback, true, requestBody);
    }, patch: function (uri, data, callback, requestBody) {
        if (requestBody != false)requestBody = true;
        doAjax(getRequestUrl(uri), data, "PATCH", callback, true, requestBody);
    }, "delete": function (uri, data, callback) {
        var data_ = data, callback_ = callback;
        if (typeof(data) == 'undefined')data_ = {};
        if (typeof(callback) == 'object')data_ = callback;
        if (typeof(data) == 'function')callback_ = data;
        return doAjax(getRequestUrl(uri), data_, "DELETE", callback_, typeof(callback_) != 'undefined', false);
    }, doAjax: doAjax
}
