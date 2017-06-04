import boot from "boot";
import request from "request";

import "common/common.css";
import "./index.css";

var menuData = [];
var menuMap = {};
var permissionData = [];
var permissions = {};

boot.loadMiniui(function () {
    mini.parse();
    var grid = window.grid = mini.get("menu-grid");
    boot.initGrid(grid);

    var tree = window.tree = mini.get("group-tree");
    tree.setAjaxType("GET");
    tree.setDataField("result.data");
    tree.setUrl(API_BASE_PATH + "menu-group?paging=false");

    request.get("menu", {paging: false}, function (res) {
        if (res.status == 200) {
            menuData = res.result.data;
            $(menuData).each(function () {
                menuMap[this.id] = this;
            });
            grid.loadList(menuData);
        } else {
            boot.showTips(res.message);
        }
    });
    request.get("permission", {paging: false}, function (res) {
        if (res.status == 200) {
            permissionData = res.result.data;
            $(permissionData).each(function () {
                permissions[this.id] = this;
                var actionMap = this.actionsMap = {};
                $(this.actions).each(function () {
                    actionMap[this.action] = this;
                });
            });
        } else {
            boot.showTips(res.message);
        }
    });

    $(".search-button").on("click", function () {
        var keyword = mini.getbyName("keyword").getValue();
        var param = {};
        if (keyword && keyword.length > 0) {
            param = request.createQuery().where()
                .like("name", "%" + keyword + "%")
                .getParams();
        }
        grid.load(param);
    });

    $(".add-root-group").on("click", function () {
        var node = {name: "新建分组"};
        tree.addNode(node);
        tree.selectNode(node);
    });

    tree.on("nodeselect", function (e) {
        var node = e.node;
        window.nowEditNode = node;
        if (node) {
            new mini.Form("#basic-info").setData(node);
            if (node.bindInfo) {
                var bindInfo = mini.clone(node.bindInfo);
                $(bindInfo).each(function () {
                    this.menu = menuMap[this.menuId];
                    if (this.menu) {
                        this.icon = this.menu.icon;
                        this.permission = permissions[this.menu.permissionId];
                    }
                });
                mini.get("menu-group-grid").loadList(bindInfo);
            }
        }
    });

    bindSaveAction();
    initActionsEditor(mini.get("menu-group-grid"));

    $(".data-access-edit-ok").on("click", function () {
        window.onDataAccessEditAfter();
    });
});

function bindSaveAction() {
    $(".save-group").on("click", function () {
        var data = boot.getFormData("#basic-info");
        var bindInfo = mini.clone(mini.get("menu-group-grid").getData());
        data.bindInfo = bindInfo;
        var api = "menu-group";
        request.patch(api, data, function (res) {
            if (res.status == 200) {
                boot.showTips("保存成功");
            } else {
                boot.showTips(res.message, "danger");
            }
        });
    });
}

window.onBeforeOpen = function (e) {
    var menu = e.sender;
    var node = tree.getSelectedNode();

    //e.cancel = true;
    e.htmlEvent.preventDefault();

}

window.renderOperationAction = function (e) {
    if (!e.value)return "";
    var row = e.record;
    var strVal = e.value + "";
    var arr = strVal.split(",");
    var text = [];
    var permission = row.permission;
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
window.renderMenuAction = function (e) {
    var html = [];
    var row = e.record;

    html.push(boot.createActionButton("添加到分组", "icon-arrow-left", function () {
        var groupGrid = mini.get("menu-group-grid");
        groupGrid.addNode({
            permission: permissions[row.permissionId],
            menuId: row.id,
            icon: row.icon,
            menu: mini.clone(row)
        });
    }));

    return html.join("");
}

function initActionsEditor(grid) {
    grid.on("cellbeginedit", function (e) {
        var row = e.record;
        var permission = row.permission;
        if (!permission) {
            boot.showTips("此菜单无权限信息");
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

            window.deny_option_fields = [];
            $((row.actions + "").split(",")).each(function () {
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
                window.deny_option_fields.push({
                    action: this,
                    describe: action.describe ? action.describe : action.action
                });
            });

            window.permission_actions = permission ? permission.optionalFields : [];

            if (mini.get("denyOptionAction"))
                mini.get("denyOptionAction").setData(window.deny_option_fields);
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
    });
}

window.renderBindInfoAction = function (e) {
    var html = [];
    var row = e.record;
    html.push(boot.createActionButton("删除", "icon-remove", function () {
        mini.get("menu-group-grid").removeNode(row);
    }));
    return html.join("");
}

