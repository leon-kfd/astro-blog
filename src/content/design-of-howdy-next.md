---
title: Howdyjs组件库迁移Vue3设计与总结
date: 2021-01-30
desc: 将个人组件库Howdyjs使用Vue + Typescript进行重构，使用Vite构建开发站点，Rollup进行组件打包并分包发布NPM
img: https://images.unsplash.com/photo-1516031190212-da133013de50?w=768
thumbImg: https://images.unsplash.com/photo-1516031190212-da133013de50?w=240
---

将个人组件库 Howdyjs 使用 Vue + Typescript 进行重构，使用 Vite 构建开发站点，Rollup 进行组件打包并分包发布 NPM。

## Link

- <a href="https://github.com/leon-kfd/howdyjs" target="_blank">⚡Github</a>
- <a href="https://kongfandong.cn/howdy" target="_blank">📖Document</a>
- <a href="https://www.npmjs.com/search?q=%40howdyjs" target="_blank">💾NPM</a>

## 主要变更

1. 新版全面采用`Typescript`
2. Vue 组件部分将使用`Vue3`重构，不向下兼容，有 Vue2.X 需求的请使用旧版
3. 因各组件内的关联性不强，新版的组件库将进行分包发布，可便于按需加载
4. 旧版多数包都将功能封装成 Vue 指令，并默认导出的是 Vue 指令，现在新版将默认导出原生构造函数，便于跨框架或原生使用，但同时保留了 Vue 指令封装的使用方式
5. 使用`lerna`进行分包管理
6. 使用`Rollup`进行组件打包
7. 展示站点使用`Vite`搭建

## 架构说明

### Vite

综合对比之后，发现采用 Vite 基本可以实现当前展示站点的所有功能，而且在开发环境下热更新速度极快，所以新版项目采用了 Vite 构建开发站点。

由于项目有导入.md 文件的需求，而 Vite 并不能直接使用 Webpack 的 markdown-loader，所以暂时自己写一个简单的 markdown-plugin 在 Vite 中使用

```js
// vite.config.ts
const markdownPlugin = (options: any) => {
  return {
    name: "markdown",
    transform(code: string, id: string) {
      if (!/\.md/.test(id)) {
        return;
      }
      const result = marked(code, options);
      return `export default ${JSON.stringify(result)}`;
    },
  };
};
export default {
  plugins: [
    vue(),
    markdownPlugin({
      highlight: (code: string) => {
        if (code.includes("template")) {
          return hljs.highlight("html", code).value;
        } else if (code.includes('lang="ts"')) {
          return hljs.highlight("typescript", code).value;
        } else {
          return hljs.highlightAuto(code).value;
        }
      },
    }),
  ],
};
```

Vite 新版文档地址: <a href="https://vitejs.dev/" target="_blank">https://vitejs.dev/</a>

### Lerna

Lerna 是一个项目内包管理工具，虽然当前项目内的组件关联性不强，但也提前先引入了 Lerna 进行分包管理。

- 执行`npm run bootstrap`命令进行项目初始化.
- 执行`npm run publish`命令可快速发包

### Rollup 打包

组件使用 Rollup 进行打包，执行`npm run build:pkg`打包各 Packages，包含 cjs、es 和其 d.ts 文件。

使用 nodejs 执行 rollup 打包，代码位于/scripts 下，build.js 为打包初始模板，一个组件会被打包出 3 种格式：`cjs`/`esm`/`umd`，格式说明参考[格式](https://www.rollupjs.com/guide/big-list-of-options#%E6%A0%BC%E5%BC%8Fformat--f--outputformat)

### Vue 路由自动生成

使用 Vite 打包时，Vue 路由懒加载是基于 Rollup 的动态引入插件的，它对我原站点的格式不太适用。而由于展示站点中，各个路由格式是具有一定通用性的，所有采用了一种读取文件目录自动生成路由文件的方式。

```js
// scripts/gen-route.js
// 自动生成路由文件
const fs = require("fs");
const packagesDirs = fs.readdirSync("./src/pages");
const packagesMap = {};
packagesDirs.map((package) => {
  const exampleDirs = fs.readdirSync(`./src/pages/${package}/example`);
  const exampleNum = exampleDirs.length;
  packagesMap[package] = exampleNum;
});
const packages = Object.keys(packagesMap).map((key) => {
  return {
    name: key,
    exampleNum: packagesMap[key],
  };
});
const routes = [
  {
    path: "/",
    name: "home",
    component: "i(../views/home.vue)",
  },
  ...packages.map((pkg) => {
    const { name, exampleNum } = pkg;
    return {
      path: `/${name}`,
      name: `${name}`,
      redirect: `/${name}/readme`,
      component: `i(../pages/${name}/index.vue)`,
      children: [
        {
          path: `/${name}/readme`,
          name: `${name}-readme`,
          component: "i(../components/PageReadme.vue)",
        },
        ...Array.from({ length: exampleNum }, (_, exampleIndex) => {
          return {
            path: `/${name}/example${exampleIndex + 1}`,
            name: `${name}-example${exampleIndex + 1}`,
            component: `i(../pages/${name}/example/example${
              exampleIndex + 1
            }.vue)`,
          };
        }),
      ],
    };
  }),
];

const reg = /"i\((.*?)\)"/g;
const routesStr = JSON.stringify(routes, null, 2).replace(
  reg,
  (...arg) => `() => import("${arg[1]}")`
);

const output = `
/* eslint-disable */
import { createRouter, createWebHistory } from 'vue-router';
const router = createRouter({
  history: createWebHistory('/howdy/'),
  routes: ${routesStr}
});

export default router;
`;

fs.writeFileSync("./src/router/index.ts", output);
```

执行命令`npm run gen-router`后，会自动读取/packages 下的包文件，然后生成出对应的路由。

## 说明

- 新版地址: [Howdy](https://kongfandong.cn/howdy)
- 旧版地址: [Howdy-old](https://kongfandong.cn/howdy-old)
- 使用的是同一个 github 仓库，新版参考[master 分支](https://github.com/leon-kfd/howdyjs)，旧版参考[howdy 分支](https://github.com/leon-kfd/howdyjs/tree/howdy)
