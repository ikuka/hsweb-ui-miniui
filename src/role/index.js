import boot from "boot";
import request from "request";
import "common/common.css";
import "./index.css";

window.renderStatus = function (e) {
    return e.value   ? "是" : "否";
}
function edit(id) {
    boot.openWindow("role/save.html?id=" + id, "编辑角色", "80%", "80%", function (e) {
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

    grid.setUrl(request.basePath + "role");
    function search() {
        boot.searchGrid("#search-box", grid);
    }

    $(".search-button").click(search);
    boot.bindOnEnter("#search-box", search);
    $(".add-button").click(function () {
        boot.openWindow("role/save.html", "添加角色", "80%", "80%", function (e) {
            grid.reload();
        })
    });

    $(".add-role-button").on("click", function () {
        roleGrid.addRow({});
    });
    search();
});

