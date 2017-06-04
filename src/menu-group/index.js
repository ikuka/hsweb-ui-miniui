import boot from "boot";
import request from "request";

import "common/common.css";
import "./index.css";


boot.loadMiniui(function () {
    mini.parse();
    var grid = window.grid = mini.get("menu-grid");
    boot.initGrid(grid);
    var tree = window.tree = mini.get("group-tree");
    tree.setAjaxType("GET");
    tree.setDataField("result.data");
    tree.setUrl(API_BASE_PATH + "menu-group?paging=false");

    grid.setUrl(API_BASE_PATH + "menu");
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
    })

    tree.on("nodeselect", function (e) {
        var node = e.node;
        console.log(node);
    });
});
window.onBeforeOpen = function (e) {
    var menu = e.sender;
    var node = tree.getSelectedNode();

    e.cancel = true;
    e.htmlEvent.preventDefault();
    return;
}
window.renderMenuAction = function (e) {
    var html = [];
    var row = e.record;

    html.push(boot.createActionButton("添加到分组", "icon-arrow-left", function () {
    }));

    return html.join("");
}
