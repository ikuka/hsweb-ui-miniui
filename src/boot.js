window.BASE_PATH = __webpack_public_path__;
window.API_BASE_PATH = getCookie("api_root", "/");

window.mini_debugger = false;
/**
 * 引入一个插件(js或者css)
 * @param path 插件路径
 * @param callback 加载完成回调,css不会执行回调
 */
function importPlugin(path, callback) {
    if (path.indexOf("http") != 0 || path.indexOf("//") != 0) {
        path = window.BASE_PATH + path;
    }
    var head = document.getElementsByTagName('head')[0];
    if (path.indexOf("js") == path.length - 2) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.timeout = 120000;
        if (typeof callback != "undefined")
            script.async = true;
        script.src = path;
        head.appendChild(script);
        function onload() {
            script.onerror = script.onload = undefined;
            if (callback)callback();
        }

        script.onload = onload;
        script.onerror = onload;

    } else if (path.indexOf("css") == path.length - 3) {
        var style = document.createElement('link');
        style.rel = "stylesheet";
        style.href = path;
        style.type = "text/css";
        head.appendChild(style);
    }
}

/**
 * 获取cooke
 * @param sName cookie名称
 * @param defaultVal 默认值
 * @returns {*} cookie值
 */
function getCookie(sName, defaultVal) {
    var aCookie = document.cookie.split("; ");
    var lastMatch = null;
    for (var i = 0; i < aCookie.length; i++) {
        var aCrumb = aCookie[i].split("=");
        if (sName == aCrumb[0]) {
            lastMatch = aCrumb;
        }
    }
    if (lastMatch) {
        var v = lastMatch[1];
        if (v === undefined) return v;
        return unescape(v);
    }
    return defaultVal;
}
function loadMiniui(callback) {
    var theme = getCookie("theme", window.miniui_theme ? window.miniui_theme : "pure");
    var mode = getCookie("mode", "large");

    function loadMini() {
        importPlugin("plugins/miniui/themes/default/miniui.css");
        importPlugin("plugins/miniui/themes/icons.css");
        importPlugin('plugins/miniui/themes/' + theme + '/skin.css');
        importPlugin("plugins/miniui/themes/default/" + mode + "-mode.css");
        importPlugin("plugins/miniui/miniui.js", callback);
    }

    if (!window.jQuery) {
        importPlugin("plugins/jquery/jquery.min.js", loadMini);
    } else {
        loadMini();
    }
}
function showTips(msg, state) {
    mini.showTips({
        content: msg,
        state: state || 'success',
        x: 'center',
        y: 'top',
        timeout: 3000
    });
}
/**
 * 打开窗口
 * @param url 窗口的URL
 * @param title 标题
 * @param width 宽度
 * @param height 高度
 * @param ondestroy 销毁时回调 , 打开的页面通过 boot.closeWindow(response) ;传递返回值. 通过回调参数获取.
 * @param onload 加载时毁掉 , 可通过 this.getIFrameEl(); 获取frame对象
 */
function openWindow(url, title, width, height, ondestroy, onload) {
    if (url.indexOf("http") != 0) {
        if (url.indexOf("/") == 0)url = url.substr(1);
        url = window.BASE_PATH + url;
    }
    mini.open({
        url: url,
        showMaxButton: true,
        title: title,
        width: width,
        height: height,
        maskOnLoad: false,
        showModal: false,
        onload: onload,
        ondestroy: ondestroy
    });
}

module.exports = {
    /**
     * 给表单绑定回车事件
     * @param formEl 表单选择器,如:#search-box
     * @param fun 回调
     */
    bindOnEnter: function (formEl, fun) {
        var form = new mini.Form(formEl);
        var fields = form.getFields();
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (!field.onenter && field.on) {
                field.on("enter", fun);
            }
        }
    },
    /**
     * 查询表格
     * @param formEL 查询条件表单选择器,如:#search-box
     * @param grid 表格对象
     */
    searchGrid: function (formEL, grid) {
        var param = new mini.Form(formEL).getData();
        var request = require("request");
        grid.load(request.encodeQueryParam(param));
    },
    /**
     * 引入一个插件
     */
    importPlugin: importPlugin,
    /**
     * 引入miniui
     */
    loadMiniui: loadMiniui,
    /**
     * 打开窗口
     */
    openWindow: openWindow,
    /**
     * 显示消息提示
     */
    showTips: showTips,
    /**
     * 关闭窗口并返回数据
     * @param data
     * @returns {*}
     */
    closeWindow: function (data) {
        if (window.CloseOwnerWindow) return window.CloseOwnerWindow(data);
        else window.close();
    },
    showFormErrors: function (formEl, result) {
        var errorMessage;
        if (typeof result == 'string') {
            errorMessage = mini.decode(result);
        } else {
            errorMessage = result;
        }
        if (errorMessage) {
            $(errorMessage).each(function () {
                var field = mini.getbyName(this.field);
                if (field) {
                    field.setIsValid(false);
                    field.setErrorText(this.message);
                    field.focus();
                }
            });
        }
    },
    /**
     * 初始化表格对象,修改其默认配置,以适配后台api
     * @param grid 表格对象
     */
    initGrid: function (grid) {
        grid.setSortFieldField("sorts[0].name");
        grid.setSortOrderField("sorts[0].dir");
        //后台响应数据格式
        grid.setDataField("result.data");
        grid.setTotalField("result.total");
        grid.allowAlternating = true;
        //查询全部为GET
        grid.setAjaxOptions({
            type: "GET",
            dataType: "json"
        });
        grid.un("loaderror",
            function (e) {
            });
        // 解决弹出选择控件的bug
        grid.on("cellbeginedit", function (e) {
            if (e.editor && e.editor.type == "buttonedit") {
                e.editor.setValue(e.value);
                e.editor.setText(e.value);
            }
        });
        //加载失败进行提示
        grid.on("loaderror",
            function (e) {
                try {
                    var res = mini.decode(e.xhr.responseText);
                    if (res.status == 401) {
                        if (window.doLogin) {
                            window.doLogin(function () {
                                grid.reload()
                            });
                        } else {
                            showTips("请登录", "danger");
                        }

                    } else if (res.status == 403) {
                        showTips("权限不够", "danger");
                    } else if (res.status == 500) {
                        showTips("数据加载失败:" + res.message, "danger");
                        if (window.console) {
                            window.console.log(res.message);
                        }
                    } else {
                        showTips("数据加载失败:" + res.message, "danger");
                    }
                } catch (e) {
                    showTips("加载失败...");
                }
            });

        var tip = new mini.ToolTip();
        tip.set({
            target: document,
            selector: '.action-button'
        });
    },
    createActionButton: function (title, icon, onclick) {
        if (!window.action_countter)window.action_countter = 0;
        var callId = "action_" + (++window.action_countter);
        window[callId] = onclick;
        return ["<span", " onclick='", callId, "()'", " title='", title, "'", " class='action-button ", icon, "'", "></span>"].join("");
    },
    /**
     * 显示加载中提示
     * @param message 提示的消息
     * @returns {{close: hide,hide:hide}} 关闭显示的回调,调用close和hide都可以
     */
    loading: function (message) {
        mini.mask({
            el: document.body,
            cls: 'mini-mask-loading',
            html: message
        });
        function hide() {
            mini.unmask(document.body);
        }

        return {
            close: hide,
            hide: hide
        };
    },
    getCookie: getCookie
}