import boot from "boot";
import request from "request";

import "common/common.css";
import "./index.css";


boot.loadMiniui(function () {
    mini.parse();
    var grid = window.grid = mini.get("menu-grid");
    boot.initGrid(grid);
    grid.setUrl(API_BASE_PATH + "menu");
    $(".search-button").on("click", function () {
        var keyword = mini.getbyName("keyword").getValue();
        var param = {};
        if (keyword && keyword.length > 0) {
            param = request.createQuery().where()
                .like("name", "%" + keyword + "%")
                .or().like("permissionId", "%" + keyword + "%")
                .or().like("url", "%" + keyword + "%")
                .getParams();
        }
        grid.load(param);
    });

});

window.renderAction = function (e) {
    var html = [];
    var row = e.record;

    html.push(boot.createActionButton("添加子菜单", "icon-add", function () {
        var sortIndex = row.sortIndex ? (row.sortIndex + "0" + (row.chidren ? row.chidren.length + 1 : 1)) : 1;
        grid.addNode({sortIndex: sortIndex}, row.chidren ? row.chidren.length : 0, row);
    }));

    if (row._state == "added" || row._state == "modified") {
        html.push(boot.createActionButton("保存", "icon-save", function () {
            var api = "menu/";
            request.patch(api, row, function (res) {
                if (res.status == 200) {
                    request.get(api + res.result, function (data) {
                        grid.updateNode(row, data.result);
                        grid.acceptRecord(row);
                        boot.showTips("保存成功!");
                    });
                } else {
                    boot.showTips("保存失败:" + res.message, "danger");
                }
            })
        }));
    }

    return html.join("");
}