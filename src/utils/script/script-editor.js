import "./script-editor.css";

import boot from "boot";


boot.importPlugin("plugins/ace/ace.js", function () {
    boot.importPlugin("plugins/ace/ext-language_tools.js", function () {
        let langTools = ace.require("ace/ext/language_tools");
        let editor = ace.edit("editor");
        editor.setTheme("ace/theme/eclipse");
        window.setScript = function (script) {
            if (script) {
                editor.setValue(script, -1);
            }
        }
        window.getScript = function () {
            return editor.getValue();
        }
        window.init = function (lang, script) {
            editor.getSession().setMode("ace/mode/" + lang);
            editor.$blockScrolling = Infinity;
            editor.setOptions({
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true
            });
            editor.setValue(script, -1);
        }
        window.setCompleteData = function (data) {
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
    });
});