---
title: Dashboard自定义面板项目介绍
date: 2021-05-29
desc: 基于Vite、Vue3、Typescript开发的个性化的浏览器导航首页面板，支持自定义添加组件，可编辑组件各种属性。响应式设计，可自定义随机壁纸背景图或动态壁纸。
img: https://images.unsplash.com/photo-1543286386-713bdd548da4?w=768
thumbImg: https://images.unsplash.com/photo-1543286386-713bdd548da4?w=240
---

## 项目介绍

Dashboard 是一个笔者基于`Vite` + `Vue3` + `Typesript`开发的项目，个性化的浏览器导航首页面板，支持自定义添加组件，可编辑组件各种属性。响应式设计，可自定义随机壁纸背景图。

- <a href="https://github.com/leon-kfd/Dashboard/" target="_blank">⚡Github</a>
- <a href="https://howdz.xyz" target="_blank">💡Demo</a>

## 功能特性

#### ✨ 组件长度单位

面板可基于响应式设计布局，添加组件时可选择`FR`单位，FR 单位会基于当前屏幕宽度动态计算出组件宽度。当然也可以使用`PX`固定长度单位，一般建议是宽度使用`FR`而高度使用`PX`。

![组件长度单位](https://cdn.kongfandong.cn/img/blog/VCLtW3Ad9hPGs6w.jpg)

#### 💫 布局模式

当前提供两种布局模式，默认布局是基于文档流的，使用`vuedraggable`可拖拽改变组件顺序。另一种是`Fixed模式`，是基于 Fixed 定位的，使用`@howdyjs/to-drag`拖拽改变位置。

#### 🍭 编辑模式

添加的组件含有较多配置可自定义，不限于背景颜色、阴影、字体颜色大小与组件属性等。点击右下方菜单解除锁定后即可进入`编辑模式`，编辑模式下通过右键点击组件即可弹出菜单进行编辑（移动端下是长按弹出菜单），右键菜单基于`@howdyjs/mouse-menu`。

#### 🍌 数据同步

点击右下方辅助功能进入导入导出面板，现在支持两种同步方式，一种是生成`随机码`进行同步，另一种是导出`JSON文件`进行同步。后续有可能考虑会添加账户功能进行同步。

#### 🎉 默认主题

当前首次进入网站，会弹出默认主题选择，用户可先选择一种默认主题再进行二次创作。

#### 🌟 随机图片与动态壁纸

网站背景图与组件背景可以设置使用随机图片，图片来源于`Unsplash`的随机图片，可选自定义关键词，并提供了可选的国内镜像加速（由`多吉`提供，服务暂未稳定）。最新已加入动态壁纸的支持，选择背景图时选择网络图片后输入一个网络视频路径即会识别成动态壁纸。

#### 🌈 多种物料组件

当前提供了多种物料组件，例如时钟、天气、搜索栏等，后面会陆续添加更多的组件。组件引入采用按需加载，没有使用的组件不会在初始化时加载。

![物料组件选择](https://cdn.kongfandong.cn/img/blog/MfEHxtZsjQu6Tr4.jpg)

## 物料组件

- **Empty**: 占位区块组件，支持一些简单配置与自定义文本

![占位区块](https://kongfandong.cn/images/capture/Empty.png)

- **Clock**: 时钟组件

![时钟](https://kongfandong.cn/images/capture/Clock.png)

- **Verse**: 随机古诗组件，API 来源于`https://www.jinrishici.com/`

![随机古诗](https://kongfandong.cn/images/capture/Verse.png)

- **Search**: 搜索栏，支持自定义搜索引擎，按 Tab 键自动切换下一个，关键词联想

![搜索栏](https://kongfandong.cn/images/capture/Search.png)

- **Collection**: 键盘收藏夹，设置网站后按相应按键自动跳转，网站 Icon 自动获取

![键盘收藏夹](https://kongfandong.cn/images/capture/Collection.png)

- **Iframe**: Iframe 外部网站，最新版浏览器只支持同协议(当前网站为 https)的 Iframe

![Iframe外部网站](https://kongfandong.cn/images/capture/Iframe.png)

- **TodoList**: 备忘清单，可同时设置不同日期

![TodoList备忘清单](https://kongfandong.cn/images/capture/TodoList.png)

- **Weather**: 天气组件，支持通过 IP 自动获取城市也可手动输入，后续考虑添加读取 GPS

![天气](https://kongfandong.cn/images/capture/Weather.png)

- **CountDown**: 倒计时组件，支持天、小时、分钟三种单位

![倒计时组件](https://kongfandong.cn/images/capture/CountDown.png)

- **JuejinList**: 掘金组件，显示最新热门列表

![掘金组件](https://kongfandong.cn/images/capture/JuejinList.png)

- **WeiboList**：微博热搜

![微博热搜](https://kongfandong.cn/images/capture/WeiboList.png)

- **GithubTrending**: Github 趋势，显示当日热门仓库

![Github趋势](https://kongfandong.cn/images/capture/GithubTrending.png)

## 项目相关

## StandardForm 表单封装

项目中使用了`ElementPlus`框架，为了减轻代码量与抽离复用逻辑，封装了一个 StandardForm 组件，可以使用 jsx 文件生成 Element 表单。

各物料组件需提供一个自己的 setting.tsx 文件为该组件的配置，同时将可复用的配置项抽离出来。

例如： Weather 组件的 setting.tsx

```tsx
// @/materials/Weather/setting.tsx
import pick from "../base";
export default {
  formData: {
    weatherMode: 1,
    cityName: "",
    duration: 15,
    position: 5,
    baseFontSize: 16,
    textColor: "#262626",
    textShadow: "0 0 1px #464646",
    iconShadow: "0 0 1px #464646",
    fontFamily: "",
    padding: 10,
  },
  formConf(formData: any) {
    return {
      weatherMode: {
        label: "天气城市",
        type: "radio-group",
        radio: {
          list: [
            {
              name: "自动获取(IP)",
              value: 1,
            },
            {
              name: "手动输入",
              value: 2,
            },
          ],
          label: "name",
          value: "value",
        },
      },
      cityName: {
        when: (formData: any) => formData.weatherMode === 2,
        type: "input",
        attrs: {
          placeholder: "请输入城市名(目前仅支持中国城市名)",
          clearable: true,
        },
        rules: [
          {
            required: true,
            validator: (rule: any, value: any, callback: Function) => {
              if (formData.weatherMode === 2 && !value) {
                callback(new Error("请输入城市名"));
              }
              callback();
            },
          },
        ],
      },
      duration: {
        label: "自动刷新频率",
        type: "input-number",
        attrs: {
          "controls-position": "right",
          min: 5,
          max: 12 * 60,
        },
        tips: "刷新频率,单位为分钟",
      },
      ...pick(formData, [
        "position",
        "baseFontSize",
        "textColor",
        "textShadow",
        "iconShadow",
        "fontFamily",
        "padding",
      ]),
    };
  },
};
```

> formConf 需要传入一个参数为 formData 函数以作为 vModel 的双向绑定

## 字体选择器

组件有一个公用的属性是设置字体，需要获取到用户系统的自带字体列表。参考<a href="https://www.zhangxinxu.com/wordpress/2018/02/js-detect-suppot-font-family/" target="_blank">《小 tips: 使用 JS 检测用户是否安装某 font-family 字体》（张鑫旭）</a>后，抽离出判断`getSupportFontFamilyList`方法。

原理是利用 canvas 画出设置后的字体，看它是否与默认字体生成的一样，如果一样则说明不支持，不一样说明新字体设置生效，用户支持该字体。

同时后面有可能考虑加入`Google Font`支持自定义字体。

## Todo

- 更多的物料组件
- ~~Service worker 存储图片缓存~~（已完成)
- ~~Chrome extension 添加浏览器插件模式~~（已完成）
- ~~Electorn 桌面应用模式~~（已完成）

项目仍在持续开发及优化中，若文章或项目中有做的不好的地方欢迎指出，不胜感激。

- <a href="https://github.com/leon-kfd/Dashboard/" target="_blank">⚡Github</a>
- <a href="https://kongfandong.cn/Dashboard/" target="_blank">💡Demo</a>
