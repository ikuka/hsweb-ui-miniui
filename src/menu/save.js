import boot from "boot";
import request from "request";
import "common/common.css";

boot.loadMiniui(function () {
    const id = request.getParameter("id");

    console.log(id);
});