import boot from "boot";
import request from "request";
import "common/common.css";
import "./index.css";

window.renderStatus = function (e) {
    return e.value == 1 ? "正常" : "失效";
}
function edit(id) {
    boot.openWindow("permission/save.html?id=" + id, "编辑权限信息", "80%", "80%", function (e) {
        grid.reload();
    })
}
function updatePermissionStatus(id, status) {

}
window.renderAction = function (e) {
    var row = e.record;

    var html = [
        boot.createActionButton("编辑", "icon-edit", function () {
            edit(row.id);
        })
    ];
    if (row.status == 0) {
        html.push(
            boot.createActionButton("启用", "icon-ok", function () {
                updatePermissionStatus(row.id, 1);
            })
        )
    } else {
        html.push(
            boot.createActionButton("禁用", "icon-exclamation", function () {
                updatePermissionStatus(row.id, 0);
            })
        )
    }
    html.push(
        boot.createActionButton("删除", "icon-remove", function () {

        })
    )
    return html.join("");
}

boot.loadMiniui(function () {
    mini.parse();
    var grid = window.grid = mini.get("datagrid");
    boot.initGrid(grid);

    grid.setUrl(request.basePath + "permission");
    function search() {
        boot.searchGrid("#search-box", grid);
    }

    $(".search-button").click(search);
    boot.bindOnEnter("#search-box", search);
    $(".add-button").click(function () {
        boot.openWindow("permission/save.html", "添加权限信息", "80%", "80%", function (e) {
            grid.reload();
        })
    });

    $(".add-role-button").on("click", function () {
        roleGrid.addRow({});
    });
    search();
});

