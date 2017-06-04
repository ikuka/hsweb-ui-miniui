import boot from "boot";
import request from "request";
import "common/common.css";
import "./save.css";
import scriptEditor from "../utils/script-editor";

var permissions = {};
window.dataAccessesType = [
    {text: "只能操作自己创建的数据", id: "OWN_CREATED"},
    // {text: "脚本", id: "SCRIPT"},
    {text: "自定义控制器", id: "CUSTOM"}
    // {text: "自定义控制器", id: "CUSTOM"},
];
window.renderOperationAction = function (e) {
    if (!e.value)return "";
    var row = e.record;
    var strVal = e.value + "";
    var arr = strVal.split(",");
    var text = [];
    var permission = permissions[row.permissionId];
    if (permission) {
        var actionMap = permission.actionsMap;
        if (!actionMap) {
            permission.actionsMap = actionMap = {};
            $(permission.actions).each(function () {
                actionMap[this.action] = this;
            });
        }
        $(arr).each(function () {
            text.push(actionMap[this] ? (actionMap[this].describe ? actionMap[this].describe : actionMap[this].action) : this);
        });
    }
    return text.join(",");
}
window.renderFields = function (e) {
    if (!e.value)return "";
    var strVal = e.value + "";
    var arr = strVal.split(",");
    var text = [];
    var permission = window.nowSelectPermission;
    if (permission) {
        var fieldsMap = permission.fieldsMap;
        if (!fieldsMap) {
            permission.fieldsMap = fieldsMap = {};
            $(permission.optionalFields).each(function () {
                fieldsMap[this.name] = this;
            });
        }
        $(arr).each(function () {
            text.push(fieldsMap[this] ? (fieldsMap[this].describe ? fieldsMap[this].describe : fieldsMap[this].name) : this);
        });
    }
    return text.join(",");
}
window.renderDataAccess = function (e) {
    var text = [];
    $(e.value).each(function () {
        text.push(this.describe ? this.describe : this.type);
    });
    return text.join(",");
};
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
    var loading = boot.loading("加载中...");
    request.get("permission", {paging: false}, function (res) {
        if (res.status == 200) {
            $(res.result.data).each(function () {
                permissions[this.id] = this;
            });
        }
        request.get("role/" + id + "/detail", function (response) {
            loading.hide();
            if (response.status == 200) {
                new mini.Form("#basic-info").setData(response.result);
                mini.getbyName("id").setReadOnly(true);
                mini.get('action-grid').setData(response.result.permissions);
                $(response.result.permissions).each(function () {
                    this.actions = this.actions + "";
                })
            } else {
                boot.showTips("加载数据失败", "danger");
            }
        });
    });

}
function getDataAndValidate() {
    var form = new mini.Form("#basic-info");
    form.validate();
    if (form.isValid() == false) {

        return;
    }
    var data = form.getData();
    data.permissions = mini.clone(mini.get('action-grid').getData());
    $(data.permissions).each(function () {
        this.actions = this.actions.split(",");
    })
    // data.dataAccess = mini.get('data-accesses-grid').getData();
    // data.optionalFields = mini.clone(mini.get('field-accesses-grid').getData());
    // $(data.optionalFields).each(function () {
    //     if (this.actions)
    //         this.actions = this.actions.split(",");
    // });
    return data;
}
function initActionsEditor(grid) {
    grid.on("cellbeginedit", function (e) {
        var row = e.record;
        if (!row.permissionId) {
            boot.showTips("请先设置权限ID");
            return;
        }
        var permission = permissions[row.permissionId];
        if (!permission) {
            boot.showTips("权限不存在,请检查权限ID是否正确!");
            return;
        }
        window.deny_fields_data = permission ? permission.actions : [];
        window.nowSelectPermission = permission;
        if (e.field == "actions") {
            mini.get("actionsBox").setData(window.deny_fields_data);
        }
        if (e.field == "dataAccesses") {
            if (!row.actions) {
                boot.showTips("请先设置可操作类型!");
                return;
            }
            var own_create_html = {};
            $(row.actions.split(",")).each(function () {
                var action = permission.actionsMap[this];
                if (!action)return;
                own_create_html[this] = $("<span style='cursor: pointer'></span>");
                var box = $("<input type='checkbox' name='own_create_box'>").val(this)
                    .attr("describe", action.describe ? ("只能" + action.describe + "自己创建的数据") : "");
                own_create_html[this]
                    .append(box)
                    .append(
                        $("<span>")
                            .text(action.describe ? action.describe : action.action)
                            .on("click", function () {
                                box.prop("checked", !box.prop("checked"))
                            }));
            });

            window.permission_actions = permission ? permission.optionalFields : [];
            if (mini.get("denyActionsBox"))
                mini.get("denyActionsBox").setData(permission_actions);
            if (mini.get("denyFieldsBox"))
                mini.get("denyFieldsBox").setData(window.deny_fields_data);

            var gridData = [];

            $(mini.clone(row.dataAccesses)).each(function () {
                if (this.type == "DENY_FIELDS") {
                    this.config = mini.decode(this.config);
                    this.config.fields = this.config.fields + "";
                    this.permissionId = row.permissionId;
                    gridData.push(this);
                }
                if (this.type == "OWN_CREATED") {
                    if (own_create_html[this.action]) {
                        own_create_html[this.action].find("input").prop("checked", true);
                    }
                }
            });
            $('.action_box').html("");
            for (var action in own_create_html) {
                $('.action_box').each(function () {
                    $(this).append(own_create_html[action].clone());
                });
            }
            mini.get("deny_fields_grid").setData(gridData);

            window.onDataAccessEditAfter = function () {
                var all_config = [];
                $("[name=own_create_box]:checked").each(function () {
                    all_config.push({describe: $(this).attr("describe"), action: $(this).val(), type: "OWN_CREATED"});
                });
                var deny_fields = mini.clone(mini.get("deny_fields_grid").getData());
                $(deny_fields).each(function () {
                    this.type = "DENY_FIELDS";
                    this.config = mini.encode(this.config);
                    if (this.action) {
                        all_config.push(this);
                    }
                });
                grid.updateRow(row, {dataAccesses: all_config});
                mini.get("dataAccessWindow").hide();
            }
            mini.get("dataAccessWindow").show();
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
    boot.initGrid(mini.get("action-grid"));
    initActionsEditor(mini.get('action-grid'));

    var api = "role";
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

    $(".data-access-edit-ok").on("click", function () {
        window.onDataAccessEditAfter();
    });
});