import boot from "boot";
import request from "request";
import "common/common.css";
import "./save.css";
import scriptEditor from "../utils/script-editor";

window.dataAccessesType = [
    {text: "只能操作自己创建的数据", id: "OWN_CREATED"},
    // {text: "脚本", id: "SCRIPT"},
    {text: "自定义控制器", id: "CUSTOM"}
    // {text: "自定义控制器", id: "CUSTOM"},
];

window.renderDataAccessedType = function (e) {
    var value = $(dataAccessesType).filter(function () {
        return this.id == e.value;
    });
    return value[0] ? value[0].text : e.value;
}
window.renderAction = function (e) {
    let row = e.record;
    return [
        boot.createActionButton("删除", "icon-remove", function () {
            e.sender.removeRow(row);
        })
    ].join("");
}
window.rendererTrueFalse = function (e) {
    return e.value ? "是" : "否";
}
window.openScript = function (e) {
    var grid = mini.get('data-accesses-grid');
    var cell = grid.getCurrentCell();
    var row = cell[0];
    if (row.type == "OWN_CREATED") {
        e.sender.emptyText = "此类型无需配置";
    } else if (row.type == "SCRIPT") {
        var lang_box = mini.getbyName("script-language");
        lang_box.un("valuechanged");
        var old = e.sender.getValue();
        if (!old) {
            old = mini.encode({"language": "javascript", "script": ""});
        }
        old = mini.decode(old);
        scriptEditor.createEditor("editor", function (editor) {
            lang_box.on("valuechanged", function () {
                editor.init(lang_box.getValue(), editor.getScript())
            });

            editor.init(old.language, old.script);
            mini.get('scriptEditorWindow').show();
            $(".script-ok").click(function () {
                var script = editor.getScript();
                mini.get('scriptEditorWindow').hide();
                cell[0][cell[1].field] = mini.encode({"script": script, "language": lang_box.getValue()});
                grid.updateRow(cell[0]);
            });
        });
    } else {
        e.sender.emptyText = "请输入类全名或spring bean name";
    }
}

function loadData(id) {
    request.get("permission/" + id, function (response) {
        if (response.status == 200) {
            new mini.Form("#basic-info").setData(response.result);
            mini.getbyName("id").setReadOnly(true);
            mini.get('action-grid').setData(response.result.actions);
            // mini.get('data-accesses-grid').setData(response.result.dataAccess);
            $(response.result.optionalFields).each(function () {
                this.actions = this.actions + "";
            });
            mini.get('field-accesses-grid').setData(response.result.optionalFields);
        } else {
            boot.showTips("加载数据失败", "danger");
        }
    });

}
function getDataAndValidate() {
    var form = new mini.Form("#basic-info");
    form.validate();
    if (form.isValid() == false) {

        return;
    }
    var data = form.getData();
    data.actions = mini.get('action-grid').getData();

    // data.dataAccess = mini.get('data-accesses-grid').getData();
    data.optionalFields = mini.clone(mini.get('field-accesses-grid').getData());
    $(data.optionalFields).each(function () {
        if (this.actions)
            this.actions = this.actions.split(",");
    });
    return data;
}
function initDataAccessEditor(grid) {
    grid.on("cellbeginedit", function (e) {
        var row = e.record;
        if (e.field == "config") {
            if (row.type == "OWN_CREATED") {
                e.cancel = true;
                boot.showTips("此类型无需配置");
            } else if (row.type == "SCRIPT") {
                var loading = boot.loading("正在加载编辑器...");
                var lang_box = mini.getbyName("script-language");
                lang_box.un("valuechanged");
                var old = row.config;
                if (!old) {
                    old = mini.encode({"language": "javascript", "script": ""});
                }
                old = mini.decode(old);
                scriptEditor.createEditor("editor", function (editor) {
                    loading.close();
                    lang_box.on("valuechanged", function () {
                        editor.init(lang_box.getValue(), editor.getScript())
                    });
                    editor.init(old.language, old.script);
                    mini.get('scriptEditorWindow').show();
                    $(".script-ok").click(function () {
                        var script = editor.getScript();
                        row.config = mini.encode({"script": script, "language": lang_box.getValue()});
                        grid.updateRow(row);
                        mini.get('scriptEditorWindow').hide();
                    });
                });
            } else {
                if (!window.custom_editor)
                    window.custom_editor = mini.getbyName("config-custom");
                e.editor = window.custom_editor;
            }
        }
    });
    grid.on("cellcommitedit", function (e) {
        var record = e.record;
        if (e.field == 'config') {
            if (e.editor) {
                if (e.editor.getValue) {
                    record.config = e.editor.getValue();
                }
            }
        }
    });
}
boot.loadMiniui(function () {
    mini.parse();
    mini.getbyName("id").on("validation", function (e) {
        if (e.isValid) {
            var re = new RegExp("^[a-zA-Z0-9_\-]+$");
            e.isValid = re.test(e.value);
            if (!e.isValid) {
                e.errorText = "必须由数字,字母,下划线,-组成";
            }
        }
    });
    // mini.get("data-accesses-grid").setData([{}]);
    // boot.initGrid(mini.get("data-accesses-grid"));
    boot.initGrid(mini.get("field-accesses-grid"));
    // initDataAccessEditor(mini.get('data-accesses-grid'));
    mini.get("tabs").on("activechanged", function (e) {
        // var action_editor = mini.get("action_editor"),
        //     action_editor_2 = mini.get("action_editor_2");
        // window.action_editor_data = mini.get('action-grid').getData();
        // if (action_editor)
        //     action_editor.setData(window.action_editor_data);
        // if (action_editor_2)
        //     action_editor_2.setData(window.action_editor_data);
    });

    var api = "permission";
    var func = request.post;

    var id = request.getParameter("id");
    if (id) {
        loadData(id);
        api += "/" + id;
        func = request.put;
    }
    $(".save-button").on("click", (function () {
        var data = getDataAndValidate();
        if (!data)return;
        var loading = boot.loading("提交中");
        func(api, data, function (response) {
            loading.close();
            if (response.status == 200) {
                boot.showTips("保存成功");
                if (!id)id = response.result;
            } else {
                boot.showTips("保存失败:" + response.message, "danger");
                if (response.result)
                    boot.showFormErrors("#basic-info", response.result);
            }
        })
    }));

});