/**
 * 脚本编辑器初始化工具
 */
var boot = require("boot");
var aceEditor = {};

function initAce(el, call) {
    function justInit() {
        var langTools = ace.require("ace/ext/language_tools");
        var editor = ace.edit(el);
        editor.setTheme("ace/theme/eclipse");
        aceEditor[el] = {};

        aceEditor[el].setScript = function (script) {
            if (script) {
                editor.setValue(script, -1);
            }
        }
        aceEditor[el].getScript = function () {
            return editor.getValue();
        }
        aceEditor[el].init = function (lang, script) {
            editor.getSession().setMode("ace/mode/" + lang);
            editor.$blockScrolling = Infinity;
            editor.setOptions({
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true
            });
            editor.setValue(script, -1);
        }
        aceEditor[el].setCompleteData = function (data) {
            langTools.addCompleter({
                getCompletions: function (editor, session, pos, prefix, callback) {
                    if (prefix.length === 0) {
                        return callback(null, []);
                    } else {
                        return callback(null, data);
                    }
                }
            });
        }
        call(aceEditor[el]);
    }

    if (!window.ace) {
        boot.importPlugin("plugins/ace/ace.js", function () {
            boot.importPlugin("plugins/ace/ext-language_tools.js", function () {
                justInit();
            });
        });
    } else {
        justInit();
    }

}

module.exports = {
    /**
     * 创建一个编辑器
     * @param id 编辑器容器ID 如: editor
     * @param cbk 创建后调用回调 并传入编辑器对象,可调用此对象的 setScript getScript init(language,script)等进行操作
     */
    createEditor: function (id, cbk) {
        if (!aceEditor[id]) {
            initAce(id, cbk);
        } else {
            cbk(aceEditor[id]);
        }
    }
}