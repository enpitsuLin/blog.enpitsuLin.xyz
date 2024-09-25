---
title: 使用Syncthing来同步代码
date: 2021-11-10 11:23:00
tags: [Data, Syncthing]
excerpt: 在不同的机器上总会遇到需要同步数据的需求，这时Syncthing就能很好的帮我们解决这个问题。
---

本身日常生活中上班还有业余也会写一写代码或者博客文章，有时候摸鱼时会需要同步这些东西，之前一直是完成一部分就使用 git 仓库来同步，但是往往遇到写到一半的情况就不是很合适，使用移动存储设备又很麻烦，所以我需要一个能够让我在多台设备之间同步工作内容的软件。

我主要是写前端代码比较多，最大的问题的就是 npm 依赖的问题，node_modules 大小实在太恐怖了，能够支持过滤自定义的内容也是很重要的功能之一。

# 使用网盘

在 Syncthing 之前试过百度云、Onedrive 之类的网盘来同步文件，但是一是付费有点贵，二是无法过滤我不想要同步的东西，总的来说就是达不到目标。

~~虽然我上车了一年百度云盘 svip，不过可以拿来下载东西其实也不错~~

# Syncthing

Syncthing 是一款无需第三方服务器，开源的轻量级的 p2p 文件同步软件，能将需要同步的文件在多个设备中加密传输，也不会将我的文件存到其他别的地方。

## Windows 下安装使用

在 Windows 下 使用 syncthing 我建议使用 [syncTrayzor](https://github.com/canton7/SyncTrayzor)，当然如果更喜欢使用命令行工具也可以使用[官网](https://syncthing.net/)的。

运行程序就可以看到界面，下方的控制台可以通过`查看 > 控制台`关闭

![syncTrayzor|1341x769](https://s3.bmp.ovh/imgs/2022/04/14/d24f6550d81b5a82.png)

> 使用官方的命令行工具 运行后打开 http://localhost:8384 就可以打开 web 控制界面来操作了

然后就可以通过设备 id 来连接设备进行同步了，首先获取任意一台设备的 id

在界面右上角操作中有一个显示 ID

![显示ID|263x351](https://s3.bmp.ovh/imgs/2022/04/14/4a41424d7c67c5d8.png)

获得 id 后时在另一台设备上使用添加远程设备将该设备添加到远程设备列表中，就会对该设备发起连接申请，确认之后选在文件夹来同步就可以了，

## 同步速度慢

但是配置完成后发现同步速度特别慢，简直龟爬。因为对于没有公网 IP 的设备，syncthing 会通过中继服务器来数据同步，但是默认的中继服务器速度实在感人。

想要更快的同步速度有下面两种方法（或者说三种）

### 有个人 VPS 或者 ECS

1. 通过在服务器上安装 syncthing 来获得一个公网节点然后其余的设备就可以极速同步了（最简单）

   大多数 linux 包管理器都可以直接获得 syncthing

   ```shell
   sudo yum install syncthing
   ```

   随后在你的`home/username/.config/syncthing/config.xml`中将`gui > address`字段修改成`0.0.0.0:port`并把你服务器的安全组对应端口的权限打开，然后连接`http://{host name[IP]}[:port]`访问 webGUi 界面 然后就是和 window 上一样的方式，别的设备将服务器添加为远程设备列表然后设置同步文件夹就可以了。

2. 服务器搭建中继服务器
   > [可以参考](http://www.senra.me/deploy-syncthing-relay-server-for-yourself-or-the-public/)

### 使用他人共享的 relay server

网络上也有不少人自己部署了中继服务器并共享使用的，中国境内也有几台。可以参照[列表](https://relays.syncthing.net/)
