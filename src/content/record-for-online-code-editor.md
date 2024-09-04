---
title: 开发Online Code Editor过程的一些记录
date: 2021-03-20
desc: OnlineCodeEditor是笔者基于Vue3 + Typescript开发的一个类似Codepen的练手开源项目，本文记录一些项目中使用到技术及实现原理等。
img: https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=768
thumbImg: https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=240
---

OnlineCodeEditor 是笔者基于 Vue3 + Typescript 开发的一个类似`Codepen`的开源项目，本文记录一些项目中使用到技术及实现原理等。

- <a href="https://github.com/leon-kfd/OnlineCodeEditor/" target="_blank">🏹Github</a>
- <a href="https://leon-kfd.github.io/OnlineCodeEditor/#/" target="_blank">🌈Simple Demo from Github pages</a>
- <a href="https://kongfandong.cn/coder/" target="_blank">🎉Simple Demo from author server</a>

## Feature

✅ 纯前端项目静态部署（利用 iframe 与`postMessage`生成实时预览子页）

✅ 响应式布局，布局可弹性伸缩支持拖拽更改宽度、折叠。

✅ HTML/CSS <a href="https://docs.emmet.io/" target="_blank">`Emmet`</a>技术，按`Tab`键快速生成代码

✅ 支持引入外部 CDN 样式和 JS.

✅ 增加`SCSS`解析模块. (基于在线转换 API：<a href="https://sassmeister.com" target="_blank">sassmeister.com</a>)

## 主要原理

使用`codemirror`搭建 HTML、CSS、JS 三种代码块编译器，构建一个 Iframe 网页用于展示效果。然后利用`Postmessage`向 Iframe 传入代码数据并替换旧代码。同时支持传入 jsCDN 与 CssCDN 路径，也是利用新增或更新动态标签实现。注意为了防止一直更改 dom 浪费内存，我们可以使用`debounce`防抖等让其在代码停止编辑一定时间才进行刷新。

通过简单的改写 html/css/js 实现不刷新页面更新页面效果。

```js
function loadPage(htmlCode, cssCode, jsCode) {
  const _html = document.querySelector("#customHTML");
  if (_html) document.body.removeChild(_html);
  const html = document.createElement("div");
  html.id = "customHTML";
  html.innerHTML = htmlCode;
  document.body.appendChild(html);

  const _css = document.querySelector("#customCSS");
  if (_css) document.head.removeChild(_css);
  const css = document.createElement("style");
  css.id = "customCSS";
  css.innerHTML = cssCode;
  document.head.appendChild(css);

  const _script = document.querySelector("#customJS");
  if (_script) document.body.removeChild(_script);
  const script = document.createElement("script");
  script.id = "customJS";
  script.innerHTML = jsCode;
  document.body.appendChild(script);
}
```

当然有一些场景是需要手动刷新页面的，例如：添加 JS 监听器、更新 CDN 路径等。这时为 iframe 更新时间戳，就可以实现页面刷新。

```js
async function sendMessage(refresh = false) {
  if (refresh) {
    state.iframeURL.value = `./iframe.html?t=${+new Date()}`
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(1)
      }, 2000)
    })
  }
  ...
}
```

## Emmet

`emmet`技术，可以让开发者速写 html 代码。官方文档参考：<a href="https://docs.emmet.io/" target="_blank">https://docs.emmet.io/</a>

emmet 有提供 npm 包，可以让我们在浏览器中使用其 API。

```js
import expand from "emmet";
// 传入word与模式即可获取到速写后的代码
const result = expand(word, { type: mode });
```

同时需要注意，在编写代码时，我们需要提取出速写前的单词，我们可以以空格为界限进行切割，可参考以下函数

```typescript
function getWord(line: string, ch: number): [string, number] {
  const getNearTagChar = (str: string): string => {
    for (let i = str.length - 1; i > 0; i--) {
      if (str[i] === ">" || str[i] === "<") return str[i];
    }
    return str[0] || "<";
  };
  // 光标位于行末或单词末尾
  if (
    ch === line.length ||
    (line.length > ch + 1 && (/\s/.test(line[ch]) || line[ch] === "<"))
  ) {
    let i;
    for (i = ch - 1; i >= 0; i--) {
      if (
        /\s/.test(line[i]) ||
        (line[i] === ">" && getNearTagChar(line.slice(0, i)) === "<")
      ) {
        break;
      }
    }
    return [line.slice(i + 1, ch), i + 1];
  }
  return ["", 0];
}
```

当我们输入完关键词后，按`Tab`键时可快速匹配到相应代码块，当前支持`html`与`css`的速写。

![emmet.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7e82060ea405499b9a229bcb49f9be55~tplv-k3u1fbpfcp-zoom-in-crop-mark:1304:0:0:0.awebp)

## 支持编写 SASS 代码

项目中支持切换到 SCSS 预编译器编写 CSS。

由于 SASS 是一般基于`node-sass`或`dart-sass`，这两个可以通过某些技术让其在浏览器中运行，但是占用的文件大小会较大，所以此次仅采用了线上 API 实现。

线上 SASS 转 CSS 地址: <a href="https://sassmeister.com" target="_blank">sassmeister.com</a>

```js
export async function scss2css(scss) {
  try {
    const res = await fetch("https://api.sassmeister.com/compile", {
      method: "POST",
      body: JSON.stringify({
        input: scss,
        outputStyle: "expanded",
        syntax: "SCSS",
        compiler: "dart-sass/1.26.11",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.status === 200) {
      return await res.json();
    } else {
      const json = await res.json();
      return Promise.reject(json);
    }
  } catch (e) {
    return Promise.reject(e);
  }
}
```

## Webpack 配置相关

- 由于生成 iframe 页，项目变成了多页面应用，需要设置 2 个入口
- 定义全局配色 scss 变量，为了减去手动引入，使用 css-loader 时采用了全局注入的方式
- 配置 CDN 路径减轻网站带宽压力（但由于 codemirror 内部结构问题，这次只将 css 文件放在了 CDN）

```js
// vue.config.js
const isProduction = process.env.NODE_ENV === "production";
const assetsCDN = {
  css: [
    "https://cdn.bootcdn.net/ajax/libs/codemirror/5.58.1/codemirror.min.css",
    "https://cdn.bootcdn.net/ajax/libs/codemirror/5.58.1/theme/material-darker.min.css",
  ],
  js: [],
};
const isHashMode = process.env.VUE_APP_ROUTER_MODE === "hash";
const publicPath = isHashMode ? "./" : "/coder";
module.exports = {
  pages: {
    index: "src/main.ts",
    iframe: "src/iframe.ts",
  },
  chainWebpack: (config) => {
    config.plugin("html-index").tap((args) => {
      args[0].cdn = assetsCDN;
      return args;
    });
  },
  css: {
    loaderOptions: {
      scss: {
        prependData: '@import "~@/assets/variable.scss";',
      },
    },
  },
  productionSourceMap: !isProduction,
  publicPath,
};
```

## 兼容手机模式（响应式设计)

项目中代码编辑器布局在 PC 端中支持自定义拉伸与折叠，使用了笔者开源插件`@howdyjs/resize`。

实现响应式设计一般采用 CSS3 的媒体查询实现，但由于布局问题，手机端下不适用拉伸布局，需要额外添加一个手机端下的标签页，所以这次需要使用 js 辅助实现。

![响应式](https://cdn.kongfandong.cn/img/blog/jFqzUH3udXWkM2i.gif)

## 利用 Github Workflows 实现自动构建

由于该项目是纯前端项目，打包后直接部署就行，所以很适合使用 github page 部署。

使用 Github workflows 可以构建任务，让其在代码 push 时自动执行打包，并部署到 github page 分支。

目前已经社区已经有很多成熟的常用任务，不需要自己编写。这次主要用到了`github-pages-deploy-action`可以直接帮我们把代码发布到 github page 分支。

```yaml
# .github/workflows/main.deploy.yml
name: Deploy Doc Website
on:
  push:
    branches:
      - main
jobs:
  main-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        with:
          persist-credentials: false
      - name: Setup node
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: yarn
      - name: Build Demo
        run: yarn build:hash
      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@3.7.1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          BRANCH: gh-pages
          FOLDER: dist
```

> 需要注意 github page 目前不支持`history`的路由模式

## Todo

😴 Javascript Babel 模式  
😴 引入账号系统同步代码  
😴 线上代码展示模式
