import "common/common.css";
import boot from "boot";
import request from "request";
var script;

window.setScript = function (e) {
    script = e;
}
boot.loadMiniui(function () {
    var editor = document.getElementById("editor");
    var win;

    function initEditor() {
        var language = request.getParameter("lang");
        if (!language)language = "javascript";
        win = editor.contentWindow;
        if (win && win.init) {
            win.init(language, script ? script : "");
        }
        window.setScript = function (e) {
            script = e;
            win.setScript(script);
        }
    }

    initEditor();
    $(editor).on("load", initEditor)

   window.ok=function () {
       if (win) {
           var script = win.getScript();
           boot.closeWindow(script);
       }
   }
});
