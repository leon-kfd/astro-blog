---
title: 简易电商系统开发记录(Nuxtjs+Koa)
date: 2019-01-30
desc: 使用Nuxtjs + Koa + Mysql实现的电商系统，功能未完全开发完，编写该文档记录之前开发遇到部分问题与系统设计总结
img: https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=768&h=600
thumbImg: https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=240
---

使用 Nuxtjs + Koa + Mysql 实现的极简风格电商系统，此为个人大学课余期间(2018)的练手项目，部分功能未完全实现。

DEMO 系统在线预览地址: <a href="http://eidea.kongfandong.cn" target="_blank">http://eidea.kongfandong.cn</a>

## 系统功能

✅ 登录注销  
✅ 首页商品轮播  
✅ 首页商品推荐  
✅ 商品分类搜索  
✅ 商品详情  
✅ 购物车增删改  
✅ 商品收藏  
✅ 生成订单  
❌ 个人资料/地址管理  
❌ 商品规格模块  
❌ 支付模块

## Nuxtjs 相关

### axios 封装

封装 axios，加入拦截器，统一处理接口返回的错误请求，只有`code`为 200 才为正确请求，其余统一弹窗错误`message`。

Nuxtjs 一个特性就是服务端渲染，同时可以先由服务端请求到异步初始数据后再直出页面，使用`asyncData`方法。若要在 asyncData 里面使用封装后添加了拦截器的 axios，则需要将 axios 实例注入到 nuxt 上下文中。这里采用了<a href="https://zh.nuxtjs.org/guide/plugins#%E5%90%8C%E6%97%B6%E6%B3%A8%E5%85%A5" target="_blank">同时注入</a>的方法将 Axios 注入 Vue 实例与 context 上下文中。

```js {32-34}
// axios.js
import axios from "axios";
const baseURL = "/api/";
const onRequest = (config) => config;
const onResponse = (response) => {
  if (response.data.code == 200) {
    return response;
  } else {
    return Promise.reject(
      (response.data && response.data.message) || "未知错误"
    );
  }
};
const onRequestError = (err) => Promise.reject(err);
const onResponseError = (err) => Promise.reject(err);
const instance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});
instance.interceptors.request.use(
  (config) => onRequest(config),
  (err) => onRequestError(err)
);
instance.interceptors.response.use(
  (response) => onResponse(response),
  (err) => onResponseError(err)
);
const get = (url, params) => instance.get(url, { params });
const post = (url, data) => instance.post(url, data);
export { get, post };
export default ({ app, store }, inject) => {
  const nuxtAxios = app.$axios;
  nuxtAxios.setHeader("Content-Type", "application/json");
  nuxtAxios.onRequest((config) => onRequest(config));
  nuxtAxios.onRequestError((err) => onRequestError(err));
  nuxtAxios.onResponse((response) => onResponse(response));
  nuxtAxios.onResponseError((err) => onResponseError(err));
  inject("get", (url, params) => nuxtAxios.$get(baseURL + url, { params }));
  inject("post", (url, data) => nuxtAxios.$post(baseURL + url, data));
  inject("baseURL", baseURL);
};
```

### 其余插件

- <a href="https://fontawesome.com/icons" target="_blank">font-awesome</a> CSS 图标库
- <a href="https://github.com/hilongjw/vue-lazyload#readme" target="_blank">vue-lazyload</a> 图片懒加载

### 加入购物车动画

使用定位 + transition + transform + 贝塞尔曲线模拟抛物线动画效果

![抛物线动画](https://cdn.kongfandong.cn/img/blog/GSIrLKOJPXNV1pW.gif)

将过渡动画 left 设为线性，top 设为为 cubic-bezier(0.56, 0.15, 0.43, 0.85)时，在执行过渡时就能模拟出元素一个抛物线运动，曲线函数可以在 Chrome 控制台试出来

```js
// 主要代码
showAnimateAddCart () {
  const imgEl = document.getElementById('goodsImg')
  const { offsetTop, offsetLeft, offsetWidth, offsetHeight } = imgEl
  const newImgEl = new Image()
  newImgEl.src = this.goodsimg
  newImgEl.style.cssText = `
    position:fixed;
    width: ${offsetWidth}px;
    height: ${offsetHeight}px;
    left: ${offsetLeft}px;
    top: ${offsetTop}px;
    opacity: 1;
    transform: rotate(0)`
  document.body.appendChild(newImgEl)
  const cartEl = document.getElementById('ShoppingCartBtn')
  const { offsetTop: cartTop, offsetLeft: cartLeft } = cartEl.parentNode
  newImgEl.style.cssText = `
    position:fixed;
    width: 0;
    height: 0;
    left: ${cartLeft}px;
    top: ${cartTop}px;
    opacity: 0;
    transform: rotate(360deg);
    transition: width 1s,
    height 1s,
    left 1s,
    top 1s cubic-bezier(0.56, 0.15, 0.43, 0.85),
    opacity 1s ease-out,
    transform 1s ease-out`
  setTimeout(() => {
    document.body.removeChild(newImgEl)
  }, 2000)
}
```

### 关于 Nuxtjs 部署

因为网站有动态数据，所有无法使用 npm run generate 的方式生成静态资源来部署。只能通过 npm run build，然后 npm run start 启动一个服务来跑。这是还是要保留开发环境用的 proxy 环境，使用反向代理方式代理所有后端接口。

```js
// nuxt.config.js
proxy: {
  '/api/': {
    target: 'http://localhost:3001',
    pathRewrite: {
      '^/api/': ''
    }
  }
}
```

## 后端 Koa 相关

后端只用作一个普通的接口服务器，涉及的技术不多，只用到了几个基本的 koa 插件

- koa-router
- koa-session
- koa-static
- koa-bodyparser
- mysql

### 备注

1. SQL 语句尽量都采用`escaping query values`，使用`?`占位符代替变量，可以防止 SQL 注入攻击
2. SQL 查询分页，查询总数时可以采用子查询方法，虽然性能差别不大，但是代码看上去可以较简洁

```js
// 搜索商品
router.get("/query", async (ctx) => {
  const {
    sex,
    classify,
    page = 1,
    pageSize = 12,
    minPrice = 0,
    maxPrice = 99999,
    order = "default",
    word,
  } = ctx.query;
  let sql = `select * from goods where goodsprice between ? and ? `;
  let paramsArr = [minPrice, maxPrice];
  if (sex) {
    sql += `and sex = ? `;
    paramsArr.push(sex);
  }
  if (classify) {
    sql += `and classify = ? `;
    paramsArr.push(classify);
  }
  if (word) {
    sql += `and goodsname like ? or goodsdetail like ? `;
    paramsArr.push(`%${word}%`, `%${word}%`);
  }
  const totalSql = `select count(*) as total from (${sql}) as temp `;
  const totalResult = await query(totalSql, paramsArr);
  if (!totalResult) {
    ctx.body = r.error();
    return;
  }
  if (order) {
    if (order === "low") {
      sql += `order by goodsprice `;
    } else if (order === "high") {
      sql += `order by goodsprice desc `;
    }
  }
  sql += `limit ?, ? `;
  paramsArr.push((page - 1) * pageSize, pageSize);
  const result = await query(sql, paramsArr);
  if (!result) {
    ctx.body = r.error;
    return;
  }
  ctx.body = r.successPage(result, page, pageSize, totalResult[0].total);
});
```

## 网站截图

1. **首页**
   ![首页.jpg](https://cdn.kongfandong.cn/img/blog/wxI5W4KsCBYncuk.png)
2. **搜索页**
   ![搜索.jpg](https://cdn.kongfandong.cn/img/blog/kPg3fHJIsMvD68o.png)
3. **购物车**
   ![购物车.jpg](https://cdn.kongfandong.cn/img/blog/iLDbIzdspo3tgwy.png)
4. **订单**
   ![订单.jpg](https://cdn.kongfandong.cn/img/blog/uIpYdnAq4Kb35WP.png)
5. **个人中心**
   ![个人中心.jpg](https://cdn.kongfandong.cn/img/blog/xL51dQUCFKh4Tfz.png)

**PS: 该项目仅作学习交流所用，不可作商业用途，所有图片来源于网上**

_以上内容未经授权请勿随意转载。_

DEMO 系统在线预览地址: <a href="http://eidea.kongfandong.cn" target="_blank">http://eidea.kongfandong.cn</a>
