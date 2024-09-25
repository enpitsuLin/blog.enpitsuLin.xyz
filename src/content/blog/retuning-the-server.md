---
title: 重新折腾服务器
date: 2022-04-02 17:24:00
tags: [Server]
excerpt: 一年前的为了毕业设计买的学生机，现在续了一下，因为原先安装的 linux发行版 centos8 已经宣布停止生命周期了，重新装个Debian用于学习然后重新折腾一下服务器，简单再部署一些小东西玩玩。
---

# 配置终端

肯定是 zsh+oh-my-zsh 啦

原先是使用 zsh 的插件管理 zinit，原来根据[这篇文章](https://www.aloxaf.com/2019/11/zplugin_tutorial/)简单的自定义了一下

但是后来 zinit 停止维护并删除了原仓库现在转移到[zdharma-continuum/zinit](https://github.com/zdharma-continuum/zinit)下导致原来的配置都不好使了

然后浏览原来的仓库被 readme 带到了[zi](https://z-shell.pages.dev/)，既然如此不如试试咯

## 安装 Zi

很简单，直接按照官方的[手动安装](https://z-shell.pages.dev/docs/getting_started/installation/#手动安装)，当然如果图方便可以使用快速安装的方法

~~甚至有官方简中~~

## 配置

使用 zi 安装 OMZ 和 prezto，直接在.zshrc 中写入

```plain:.zshrc
zi snippet OMZ::plugins/git/git.plugin.zsh
zi snippet PZT::modules/helper/init.zsh
```

## powerlevel10k

一个自定义程度比较高的 zsh 主题，仓库里现在只有 zinit 的安装方法但是 zi 中的方法也很相似，直接使用也可以，或者通过[使用案例](https://z-shell.pages.dev/docs/gallery/collection/themes#thp-romkatvpowerlevel10k)也是直接在.zshrc 加入然后重新`source .zshrc`等待下载完

```plain:.zshrc
zi ice depth=1; zi light romkatv/powerlevel10k
```

接着运行`p10k configure`

# 安装 docker 并配置一些环境

我的服务器是 debian，其他的 linux 发行版可以通过[docker 官方教程](https://docs.docker.com/engine/install/)安装，不过建议更换下源

## 使用 docker 部署 nginx 及配置

简单搞了一个自动配置 nginx 的脚本，会自动停止并删除 nginx 的容器，然后将`~/docker-data/nginx/`映射到容器内的各个目录，然后启动 nginx 并将容器内的 80 端口与本地 80 端口进行映射

```sh
#! /bin/bash

# set nginx config file volume mapping
NGINX_DIR=/home/enpitsulin/docker-data/nginx

# stop and remove nginx
ID=`docker ps -a| grep nginx | awk '{print $1}'`
docker stop $ID
docker rm $ID

docker run --detach --name nginx_tmp nginx
sleep 5
docker cp nginx_tmp:/usr/share/nginx/html/ ${NGINX_DIR}
docker cp nginx_tmp:/etc/nginx/conf.d ${NGINX_DIR}/conf
docker cp nginx_tmp:/etc/nginx/nginx.conf ${NGINX_DIR}/conf/nginx.conf

docker stop nginx_tmp
docker rm nginx_tmp

docker run --detach \
--name nginx \
--publish 80:80 \
--publish 443:443 \
--volume ${NGINX_DIR}/html:/usr/share/nginx/html \
--volume ${NGINX_DIR}/conf/conf.d:/etc/nginx/conf.d \
--volume ${NGINX_DIR}/conf/nginx.conf:/etc/nginx/nginx.conf \
--network=host nginx
```

# 安装 node 环境

安装 nvm 为 node 做版本管理然后安装 lts 版本 node 就完事

```sh
nvm install --lts
```
