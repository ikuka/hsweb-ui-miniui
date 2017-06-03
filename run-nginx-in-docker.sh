#!/usr/bin/env bash

api_host=$(ifconfig | grep "inet addr" | awk '{ print $2}' | awk -F: '{print $2}' | grep "192")
html_host=$api_host
echo "api_host:$api_host"
echo "html_host:$html_host"

docker run --rm -it \
-v ${PWD}/nginx.conf:/etc/nginx/conf.d/default.conf \
-p 80:80 --name hsweb-nginx \
--add-host "api-host":"$api_host" \
--add-host "html-host":"$html_host" \
nginx
