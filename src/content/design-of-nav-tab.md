---
title: 浏览器导航首页设计
date: 2020-04-04
desc: 一个浏览器首页站点, 包含可切换的常用搜索引擎搜索功能, 键盘布局添加快捷收藏网站, 并加入键盘按键监听可快速打开, 自定义背景图, 配置同步功能等功能
img: https://images.unsplash.com/photo-1504292004442-f285299403fa?w=768
thumbImg: https://images.unsplash.com/photo-1504292004442-f285299403fa?w=240
---

> 2021/11/01 更新: 以下内容为旧版网站的记录，站点地址已更新为 Howdz 起始页项目地址

一个浏览器首页站点, 包含可切换的常用搜索引擎搜索功能, 键盘布局添加快捷收藏网站, 并加入键盘按键监听可快速打开, 自定义背景图, 配置同步功能等功能

系统半成品已部署与线上，在线访问：<a href="https://howdz.xyz" target="_blank">https://howdz.xyz</a>

### 目录

1. [搜索引擎切换功能](#搜索引擎切换功能)
2. [键盘收藏夹功能](#键盘收藏夹功能)
3. [背景图切换功能](#背景图切换功能)
4. [配置同步功能](#配置同步功能)
5. [关于优化](#关于优化)

## 搜索引擎切换功能

该功能时为了便于让用户可快速切换不同的搜索引擎，可以涉及不同领域的搜索，例如常用引擎、视频、翻译等搜索。在搜索框聚焦状态下按 Tab 键就可按用户规定的顺序快速切换引擎（Shift + Tab 向上切换）。

```js
handleInputKeyDown (e) {
  if (e.keyCode === 9) {
    if (e.shiftKey) {
      this.activeEngine = this.activeEngine <= 0 ? this.$store.state.engineList.length - 1 : --this.activeEngine
      e.preventDefault()
    } else {
      this.activeEngine = this.activeEngine >= this.$store.state.engineList.length - 1 ? 0 : ++this.activeEngine
      e.preventDefault()
    }
  }
  if (e.keyCode === 13) {
    window.open(this.$store.state.engineList[this.activeEngine].link + encodeURIComponent(this.searchKey))
  }
}
```

寻找目前主流搜索引擎关键字拼接规则记录列表和寻找 Icon 保存到 VUEX 中，目前设置了默认引擎为 Bing 国内、国外、百度，然后备用设置了 Google、搜狗、Bilibili、淘宝等。用户可以在设置页通过拖拽切换引擎顺序与添加备用搜索到当前。

拖拽功能使用 vuedragable 实现，将当前引擎与备用引擎设为同一个 group，即可让两者可以互相拖拽，并且通过 pull 设置实现当 engineList 长度为 1 是不可再向外拖出。

```html
...
<div class="text">当前引擎组</div>
<draggable
  :list="engineList"
  :group="{ name: 'engine',pull: engineList.length > 1 }"
  @end="handleDragEnd"
>
  <transition-group
    type="transition"
    name="flip-list"
    class="now-engine-list engine-list"
  >
    <div class="engine-list-item" v-for="item in engineList" :key="item.name">
      <img :src="item.iconPath" alt="icon" width="24" height="24" />
      <div class="text">{{item.name}}</div>
    </div>
  </transition-group>
</draggable>
<div class="text">备用引擎组</div>
<draggable :list="backupEngineList" group="engine" @end="handleDragEnd">
  <transition-group
    type="transition"
    name="flip-list"
    class="backupEngineList engine-list"
  >
    <div
      class="engine-list-item"
      v-for="item in backupEngineList"
      :key="item.name"
    >
      <img :src="item.iconPath" alt="icon" width="24" height="24" />
      <div class="text">{{item.name}}</div>
    </div>
  </transition-group>
</draggable>
...
```

## 键盘收藏夹功能

用户可通过点击模拟键盘按键快速跳转到收藏好的网站，未设置时点击则弹窗让用户添加。

主要功能实现：

1. 截取用户输入的 http 地址中的域名，然后通过“域名 + /favicon.ico”获取主流网站的 Icon，当获取不到时，使用截取 Title 的首字符作为 Icon。亦可使用谷歌的 Favicon 服务，通过“http://www.google.cn/s2/favicons?domain= + 域名”获取网站 Icon，但获取出来的都是固定 16px x 16px 大小。
2. 使用 Flex 布局实现模拟键盘布局
3. 监听按键添加事件，window.open 打开用户收藏的网站
4. 使用个人组件<a href="https://kongfandong.cn/howdy/animation-dialog" target="_blank">Animation Dialog</a>实现动画弹窗(Where open where close 交互)

```html
<img
  class="icon"
  :src="`${userSettingKeyMap[key].url.match(/^(\w+:\/\/)?([^\/]+)/i) ? userSettingKeyMap[key].url.match(/^(\w+:\/\/)?([^\/]+)/i)[0] : ''}/favicon.ico`"
  alt="link"
  @load="hanldeImgLoad"
  @error="handleImgError"
/>
<div class="no-icon">{{userSettingKeyMap[key].remark.slice(0,1)}}</div>
```

![添加展示](https://cdn.kongfandong.cn/img/blog/kcrP38wJedoSsqT.gif)

## 背景图切换功能

背景图使用的图片来自免费无版权图片壁纸网站<a href="https://unsplash.com/" target="_blank">Unplash</a>，并使用其提供的<a href="https://unsplash.com/documentation" target="_blank">API 服务</a>获取 JSON 图片列表。其 Api 接口不可直接调用，需要注册获取到 accessKey 之后将其放在请求中才可使用接口服务，且普通用户每小时只可调用 50 次，因此不合适直接把获取 unsplash 图片的请求放在前端。

### 后端实现

后端使用 Nodejs 每天定时调用 1 次获取 Unsplash 最新图片的接口，并把返回数据保留为 json 文件，然后由 Nodejs 提供接口，即背景图片以天为单位更新。

```js
// Nodejs后端服务
const { unsplashApiKey } = require('../config/config') // 调用UnsplashAPI的Access Key
const schedule = require('node-schedule') // nodejs定时器服务
...
// 获取Unsplash最新图片
const getUnsplashPhotos = async () => {
  const pageSize = 30
  const photosList = []
  try {
    for (let page = 1; page <= 4; page++) {
      const url = `https://api.unsplash.com/photos?page=${page}&per_page=${pageSize}&client_id=${unsplashApiKey}`
      const { data } = await axios.get(url)
      const result = data.filter(item => {
        return item.width > item.height
      }).map(item => {
        const { id, width, height, color, description, urls, links } = item
        return { id, width, height, color, description, urls, links }
      })
      photosList.push(...result)
    }
    const today = getToday()
    const info = {
      date: today,
      num: photosList.length,
      list: photosList
    }
    const data = JSON.stringify(info, null, '\t')
    fs.writeFileSync(`./unsplash/${today}.json`, data)
    logger('定时获取Unsplash图片')
  } catch (e) {
    logger('定时获取Unsplash图片', 0, e)
  }
}
...
// 获取今日图片
router.get('/photos', async ctx => {
  const fileList = fs.readdirSync('./unsplash').sort((a, b) => {
    const [date1] = a.split('.')
    const [date2] = b.split('.')
    return new Date(date2) - new Date(date1)
  })
  const latest = fileList[0]
  const txt = fs.readFileSync(`./unsplash/${latest}`, 'utf-8')
  try {
    const data = JSON.parse(txt)
    ctx.body = r.successData(data)
  } catch (e) {
    ctx.body = r.error(308, e)
  }
})
...
// 每天1点定时获取Unsplash图片保存JSON
const runUnsplashSchedule = () => {
  schedule.scheduleJob('0 1 1 * * *', () => {
    getUnsplashPhotos()
  })
}
runUnsplashSchedule()
...
```

### 前端处理

前端使用 Vuex 保留用户每次切换获取的图片缓存，在不刷新页面下，同一张图片不需要再次加载。并将最后一次获取到的图片转成 Base64 保存到 Localstorage 里面的，此时要注意多数浏览器 Localstorage 最大存储 5M，需要做下判断，图片过大就不进行缓存了。

关于获取图片资源，一开始是使用 new Image()方案然后监听 onload 事件用 canvas 将 Img 转成 Base64 来实现。但是后面发现 canvas 将 Unsplash 图片转成 base64 会有跨域问题，尽管将<a href="https://www.jianshu.com/p/473cc1ec0b7e" target="_blank">Img 的 crossOrigin 属性设成'anonymous'</a>，在 Chrome 下没问题，但是用 Safari 依然报跨域。最后采用了另外一种方案，使用 Ajax 去加载图片资源。需要将 responseType 改为 arraybuffer 方式，然后读取二进制拼接成 base64。使用 Ajax 方式还有一个优点，就是可以获取到加载进度，直接用 img 的 src 去获取无法监听图片下载进度。

**ajax 获取图片为 base64**

```js
// ajax读取图片为base64
// processFn为监听进度的回调
export const getBase64ByAjax = (url, formatter = "image/png", processFn) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = (e) => {
      if (xhr.status === 200) {
        const uInt8Array = new Uint8Array(xhr.response);
        let i = uInt8Array.length;
        const binaryString = new Array(i);
        while (i--) {
          binaryString[i] = String.fromCharCode(uInt8Array[i]);
        }
        const data = binaryString.join("");
        const base64 = window.btoa(data);
        const dataURL =
          "data:" + (formatter || "image/png") + ";base64," + base64;
        resolve(dataURL);
      }
    };
    xhr.onerror = (e) => {
      reject(e);
    };
    xhr.onprogress = (e) => {
      processFn && processFn(e);
    };
    xhr.send();
  });
};
```

**Vuex 记录图片加载及其缓存**

```js
export default new Vuex.Store({
  state: {
    // ... //
    unsplashImgList: [],
    downloadingImgInfo: null,
    downloadingImgBase64: "",
    downloadingProcess: 0,
    cacheImg: {},
    // ... //
  },
  mutations: {
    // ... //
    setEngineList(state, engineList) {
      state.engineList = engineList;
    },
    setBackupEngineList(state, backupEngineList) {
      state.backupEngineList = backupEngineList;
    },
    setUnsplashImgList(state, unsplashImgList) {
      state.unsplashImgList = unsplashImgList;
    },
    setDownloadingImgInfo(state, downloadingImgInfo) {
      state.downloadingImgInfo = downloadingImgInfo;
    },
    setDownloadingProcess(state, downloadingProcess) {
      state.downloadingProcess = downloadingProcess;
    },
    setDownloadingImgBase64(state, base64) {
      document.body.style.setProperty(
        "--textColor",
        base64 ? "#f8f8f9" : "#262626"
      );
      document.body.style.setProperty(
        "--textShadowColor",
        base64 ? "#262626" : "transparent"
      );
      state.downloadingImgBase64 = base64;
      const userTodayImgCache = {
        date: getToday(),
        base64,
      };
      const toJson = JSON.stringify(userTodayImgCache);
      if (toJson.length < 3.5 * 1024 * 1024) {
        localStorage.setItem(
          "userTodayImgCache",
          JSON.stringify(userTodayImgCache)
        );
      }
    },
    setCacheImg(state, { imgId, base64 }) {
      state.cacheImg = {
        ...state.cacheImg,
        [imgId]: base64,
      };
    },
    // ... //
  },
  actions: {
    // ... //
    getDownloadingImg({ commit, state }, downloadingImg) {
      const imgId = downloadingImg.id;
      if (state.cacheImg[imgId]) {
        commit("setDownloadingImgBase64", state.cacheImg[imgId]);
      } else {
        let imgURL;
        if (document.body.clientWidth >= 1440) {
          imgURL = downloadingImg.urls.regular
            .replace("w=1080", "w=1920")
            .replace("q=80", "q=70");
        } else {
          imgURL = downloadingImg.urls.regular.replace("q=80", "q=70");
        }
        commit("setDownloadingImgInfo", downloadingImg);
        commit("setDownloadingProcess", 0);
        const processFn = (e) => {
          const process = ~~((e.loaded / e.total) * 100);
          commit("setDownloadingProcess", process);
        };
        getBase64ByAjax(imgURL, "image/png", processFn).then((data) => {
          const dataURL = data;
          commit("setDownloadingImgBase64", dataURL);
          commit("setCacheImg", { imgId, base64: dataURL });
          commit("setDownloadingImgInfo", null);
        });
      }
    },
    // ... //
  },
});
```

![背景切换展示](https://cdn.kongfandong.cn/img/blog/leuj5U6YL7GzDZo.gif)

_当前并未实现自定义图片上传功能，后续进行优化_

## 配置同步功能

该功能未在线上版本实现，但已有实现思路。

1. 方案一：用户注册账号，登录后自动同步配置。该方案为传统方案，但是系统功能单一，用上账户功能对用户来说是过于麻烦，而且涉及到账号安全问题。（不推荐）
2. 方案二：用户点击保存配置按钮后生成一串 AccessKey 随机字符串，在另一端设备用户输入该字符串发送请求，后端返回改字符串对应的配置信息。随机字符串生成后有效期为 24 小时，后端定时删除。（推荐）
3. 方案三：导出 json 文件进行同步。（不推荐）

## 关于优化

### 打包优化

项目使用到的 vue、vuex 等资源使用线上 CDN 服务，可减少打包大小并减轻服务端带宽压力。使用 Vue-cli3 的项目在 vue.config.js 中加入 externals 配置，不打包 vue 相关资源，并在 index.html 加入 Vue CDN 资源。

```js
// vue.config.js
module.exports = {
  // ...
  configureWebpack: (config) => {
    config.externals = {
      vue: "Vue",
      vuex: "Vuex",
      // 'vue-router': 'VueRouter',
      // axios: 'axios'
    };
  },
  // ...
};
```

_因系统功能完全是单页面完成，删除了 vue-router 功能，涉及请求不多也将 axios 改为原生 ajax 实现_

### 图片优化

1. 由于 Unsplash 为境外站点，国内访问有可能速度很慢。可以考虑在 nodejs 进行获取图片请求后，再将每张图片保存到本地。或者为了减轻服务器带宽压力，可以将图片上传到七牛云或腾讯云的提供的图片资源服务。
2. Unsplash 提供的图片 api 接口，可以判断当前用户的设备，例如区分手机端和 PC 端，然后更改请求部分参数使其返回不同大小的图片。
3. 将图片缓存到浏览器中。

系统半成品已部署与线上，在线访问：<a href="https://howdz.xyz" target="_blank">https://howdz.xyz</a>

_以上内容未经授权请勿随意转载。_
