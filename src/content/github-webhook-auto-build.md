---
title: Github Webhooks与Koa2实现简单的前端自动化部署
date: 2020-04-12
desc: Git仓库配置了Github Webhooks后，在进行Push等事件时，Github会向设定的服务器发送请求，通过监听该请求，然后执行相关脚本文件从而实现简单的自动化构建与部署（服务端使用Koa2接收请求与处理脚本）
img: https://images.unsplash.com/photo-1647166545674-ce28ce93bdca?w=768
thumb: https://images.unsplash.com/photo-1647166545674-ce28ce93bdca?w=240
---

## 前言

因为博客使用 **<a href="https://www.gatsbyjs.org/" target="_blank">Gatsbyjs</a>** 进行搭建，Markdown 文章写完之后会打包成静态 HTML 文件，文章是存在项目文件中并非数据库中，所以每次进行博客文章更新后，都需要重新进行打包构建。在进行 git push 后，我需要连到云服务器中，然后进入项目目录，执行 git pull / npm run clean / npm run build 等命令。

为了简化该操作，通过使用 Github 的 **<a href="https://developer.github.com/webhooks/" target="_blank">Webhooks</a>** 服务，在服务端监听 git push 事件，然后自动执行编写好的脚本从而实现自动化构建部署。以后 Git push 后就无需再进行后续操作，由脚本完成。

目前主流的自动化构建部署工具可以选择 **<a href="https://jenkins.io/zh/" target="_blank">Jenkins</a>**，Jenkins 是一个持续集成管理平台，提供超过 1000 个插件来支持构建、部署、自动化， 满足任何项目的需要。但由于 Jenkins 是基于**Java**环境，而且功能过于强大，对于个人的项目来说有点大材小用，而且加重个人服务器资源的压力。所以没有采用 Jenkins 进行自动化构建部署，而是采用自己编写的**Koa2**服务来接收 Github Webhook 来实现简单自动化构建。

## 配置 Webhooks

1. 进入自己需要监听 Push 请求的 Github 仓库，点击 Settings => Webhooks => Add webhook
   ![Create Webhook](https://cdn.kongfandong.cn/img/blog/7mvAXfC5hNRlFZM.png)
2. 填写自己服务器请求地址，配置 Secret(用于后面的 Sha1 解码验证)，并选择要监听的事件，本次只监听 push
   ![Webhook form](https://cdn.kongfandong.cn/img/blog/gPluNLOBHdbcwsK.png)
3. 进入到对应 Webhooks 详情，下方可以查看到每个请求记录，点击 Redeliver 可以重新发送该请求。
   ![Redeliver](https://cdn.kongfandong.cn/img/blog/KjZe4gN8RDJt7l9.png)

## 后端 Koa2 服务

后端的 Koa2 服务是本功能的最重要的环节。其处理流程：

1. 接收 Github Webhooks 的 Post 请求
2. 提取请求头与请求 Body 信息，并验证是否缺少必要参数
3. 使用 Crypto 的 **<a href="http://nodejs.cn/api/crypto.html#crypto_crypto_createhmac_algorithm_key_options" target="_blank">HMACSHA1</a>** 算法，将服务端设置的密钥对请求 Body 进行哈希编码，然后判断解码出来的与请求头中的 x-hub-signature 是否匹配，防止有他人对自己的服务器发送了伪造的非法请求或篡改了 Github 原请求。
4. 针对不同 Git 事件与 Git 仓库使用 Nodejs 的 **<a href="http://nodejs.cn/api/child_process.html" target="_blank">child_process</a>** 执行不同的脚本文件

```js
const Router = require("koa-router");
const Response = require("../utils/response");
const crypto = require("crypto");
const { exec } = require("child_process");

const logger = require("../utils/log");
const { webhookSecret } = require("../config/config");

const r = new Response();
const router = new Router();

// router的路由路径在Github配置webhook时配置，webhook为向该路径发送请求
router.post("/****", async (ctx) => {
  const requestData = ctx.request.body;
  const sig = ctx.headers["x-hub-signature"];
  const event = ctx.headers["x-github-event"];
  const id = ctx.headers["x-github-delivery"];
  if (!sig || !event || !id) {
    ctx.body = r.error(310, "No Github hook headers");
    return;
  }
  if (!["ping", "push"].includes(event)) {
    ctx.body = r.error(311, "Gihub Hook events not allow");
    return;
  }
  const { repository, sender } = requestData;
  if (!repository || !sender) {
    ctx.body = r.error(312, "Missing essential parameters");
    return;
  }
  const { name: repositoryName } = repository;
  logger("接收到Webhook", 1, `event:${event}, respository: ${repositoryName}`);
  const clientSig = `sha1=${crypto
    .createHmac("sha1", webhookSecret)
    .update(JSON.stringify(requestData))
    .digest("hex")}`;
  if (sig !== clientSig) {
    logger("Webhook X-Hub-Signature解码", 0, "解码不匹配");
    ctx.body = r.error(313, "X-Hub-Signature does not match");
    return;
  }
  if (event === "ping") {
    ctx.body = {
      errCode: 200,
      errMsg: "Success",
    };
  } else if (event === "push") {
    ctx.body = {
      errCode: 200,
      errMsg: "Success",
    };
    if (repositoryName === "****") {
      updateBlog();
    }
  }
});

// updateBlog为接收到hook后要执行的操作
const updateBlog = () => {
  exec("****.bat", (err) => {
    if (err) {
      logger("执行****.bat", 0, err);
      return;
    }
    logger("执行****.bat", 1);
  });
};

module.exports = {
  githubWebhookRouter: router,
};
```

在新建 Webhooks 后，github 会发送一个 ping 事件到目标服务器，所以这里加多了一种 ping 事件的处理（直接返回 200）。

本次我设置了只有 push 事件会发请求，所以只处理了 push 事件，如果设置 Webhooks 监听其他事件，例如 release、issues、star 等，可自行扩展对应功能。

## 其他说明

1. 后端可直接使用原生 Nodejs 搭建服务，使用 **<a href="https://github.com/rvagg/github-webhook-handler#readme" target="_blank">github-webhook-hanlder</a>** 包可快速搭建
2. 建议设置 Secert 密钥，防止伪造的请求
3. 本方式适合简单的前端资源自动化部署构建，对于大型的项目还是建议使用 Jenkins 等持续集成工具进行自动化部署
4. 可监听 Github Webhooks 其他事件，issue、start 等，并通过 **<a href="https://developer.github.com/v3/" target="_blank">Github API</a>** 可实现下 Git 仓库机器人等功能
5. Github Webhooks 请求中有很多有用的信息，例如多人项目中你可以记录是由谁 push 的，或者处理的是哪个分支等，都可以提取出来进行不同的处理。
6. 脚本可使用 Shell 编写再由 Nodejs 的 child_process 去执行，也可以直接编写 nodejs 命令直接去执行文件操作。社区也提供很多类似`shelljs`、`exec-sh`等 NPM 包可以更优雅的编写脚本命令。
7. 这种方式适合将网站自动部署到自己的个人服务器，如果没有服务器可以采用`Github Page`方式部署，这时候可以利用`Github Action`去实现，具体后面再写一篇文章说明。

_以上内容未经授权请勿随意转载。_
