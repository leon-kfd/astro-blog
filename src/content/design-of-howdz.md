---
title: Howdz起始页开发记录
date: 2021-11-21
desc: Howdz是基于Vue3开发的一个完全自定义配置的浏览器导航起始页，支持按需添加物料组件，可自由编辑组件的位置、大小与功能。支持响应式设计，可自定义随机壁纸、动态壁纸等。项目提供网页在线访问、打包出浏览器插件、打包出桌面应用(Electron)等访问方式。
img: https://images.unsplash.com/photo-1503437313881-503a91226402?w=768
thumbImg: https://images.unsplash.com/photo-1503437313881-503a91226402?w=240
---

## 前言

[Howdz](https://doc.howdz.xyz)是基于`Vue3` + `Typescript`开发的一个完全自定义配置的浏览器导航起始页，支持按需添加物料组件，可自由编辑组件的位置、大小与功能。支持响应式设计，可自定义随机壁纸、动态壁纸等。项目提供[网页在线访问](https://howdz.xyz)、打包出[浏览器插件](https://microsoftedge.microsoft.com/addons/detail/howdz%E8%B5%B7%E5%A7%8B%E9%A1%B5/cgcggcdgjfmeoemmdpleinicgepijegd)、打包出[桌面应用(Electron)](https://github.com/leon-kfd/Dashboard/releases)等访问方式。

本文记录项目开发中使用的相关技术。

## 表单封装

项目中运行自由添加各种物料组件，而每一个物料组件都含有自己的配置项表单，而其中又有部分相同的配置项，所以可以实现一个 JS 数据驱动的表单封装。

当前使用了`ElementPlus`框架，封装了一个 StandardForm 组件，为其传入`formData`与`formConf`两个属性即可生成双向绑定的表单，支持`JSX`插入其他自定义组件。因篇幅问题，组件封装代码可参考此处: [standard-form.vue](https://github.com/leon-kfd/Dashboard/blob/main/src/plugins/standard-form/src/standard-form.vue)

然后可以使用类似 JSON 的格式，实现各个物料组件的配置表单，例如`Weather`组件的`setting.tsx`如下：

```tsx
// @/materials/Weather/setting.tsx
import pick from "../base"; // pick可以自由选取公用的配置
export default {
  formData: {
    weatherMode: 1,
    cityName: "",
    animationIcon: true,
    duration: 15,
    position: 5,
    baseFontSize: 16,
    textColor: "#262626",
    textShadow: "0 0 1px #464646",
    iconShadow: "0 0 1px #464646",
    fontFamily: "",
    padding: 10,
  },
  formConf(formData: Record<string, any>) {
    // 传入formData以实现双向绑定
    return {
      weatherMode: {
        label: "天气城市",
        type: "radio-group",
        radio: {
          list: [
            { name: "自动获取(IP)", value: 1 },
            { name: "手动输入", value: 2 },
          ],
          label: "name",
          value: "value",
        },
      },
      cityName: {
        when: (formData: Record<string, any>) => formData.weatherMode === 2, // 类似v-if
        type: "input",
        attrs: {
          placeholder: "请输入城市名(目前仅支持中国城市名)",
          clearable: true,
        },
        rules: [
          {
            required: true,
            validator: (
              rule: unknown,
              value: string,
              callback: (e?: Error) => void
            ) => {
              formData.weatherMode === 2 && !value
                ? callback(new Error("请输入城市名"))
                : callback();
            },
          },
        ], // 支持el-form原生rule
      },
      animationIcon: {
        label: "动画图标",
        type: "switch",
        tips: "默认使用含动画的ICON，若想提高性能可关闭使用静态ICON",
      },
      duration: {
        label: "自动刷新频率",
        type: "input-number",
        attrs: { "controls-position": "right", min: 5, max: 12 * 60 },
        tips: "刷新频率,单位为分钟",
      },
      ...pick(formData, [
        // 选取公用的配置
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

![JSX生成的表单](https://cdn.kongfandong.cn/img/blog/OboPiN3ZfDayq9s.png)

## 右键菜单

物料组件添加后，在编辑模式下可以右键弹出菜单更改配置或删除等。右键菜单的实现来源与笔者开源的`@howdjs/mouse-menu`。同时在本项目中，为了兼容移动端，对插件进行了二次封装，为其添加了长按弹出菜单的功能。二次封装代码[参考此处](https://github.com/leon-kfd/Dashboard/blob/main/src/plugins/mouse-menu.ts)。

项目中采用的是`vue指令`的方式使用，菜单插件可以接收任意参数进行回调，所以可以把点击的物料组件数据传到回调中进行各种操作。

```html
<template>
  <div v-for="element in affix" :key="affix.id">
    <div v-mouse-menu="{ disabled: () => isLock, params: element, menuList }">
      <!--Material code-->
    </div>
  </div>
</template>
<script>
  setup () {
  	const isLock = computed(() => store.state.isLock)
  	const menuList = ref([
  		{ label: '基础配置', tips: 'Edit Base', fn: (params: ComponentOptions) => emit('edit', params.i) },
  		{ label: '删除', tips: 'Delete', fn: (params: ComponentOptions) => store.commit('deleteComponent', params) }
  	])
  	// fn中的params为组件数据
  }
</script>
```

![右键菜单](https://cdn.kongfandong.cn/img/blog/fYIsvFn7xXAZOac.gif)

## 物料组件布局

当前提供 2 中布局方式，一种是基于类文件流的栅格布局，这种布局会让组件一个接一个排列，另外一个是 Fixed 布局，可以让组件固定与页面任意位置。

### 栅格模式

栅格模式使用[vue-grid-layout](https://github.com/jbaysolutions/vue-grid-layout)实现，该插件 vue3 版本处于 Beta 中。

```html
<template>
  <grid-layout
    v-model:layout="list"
    :col-num="12"
    :row-height="rowHeight"
    :is-draggable="!isLock"
    :is-resizable="!isLock"
  >
    <grid-item
      v-for="item in list"
      :x="item.x"
      :y="item.y"
      :w="item.w"
      :h="item.h"
      :i="item.i"
    >
      <!--Material code-->
    </grid-item>
  </grid-layout>
</template>
<script>
  setup () {
  	const isLock = computed(() => store.state.isLock)
  	const list = computed({
  		get: () => store.state.list,
  		set: (val) => { store.commit('updateList', val) }
  	})
  }
</script>
```

使用`v-model:layout`双向绑定栅格模式物料组件列表数据，因为物料数组存在 vuex 中，这里用`computed`的 setter 进行更新。`isLock`是用于判断当前是否处于编辑模式，在锁定状态下禁用拖拽与大小更改。当前使用的栅格数为 12，即将屏幕宽度分割为 12 份。

![栅格模式](https://cdn.kongfandong.cn/img/blog/OIGFoR6zrCN8cE1.gif)

### Fixed 模式

Fixed 模式使用笔者自己开源的[@howdjs/to-control](https://kongfandong.cn/howdy/to-control)插件完成，可以让物料组件固定在页面的任何位置中，也支持拖拽右下角更改大小。

```html
<template>
  <div
    v-for="element in affix"
    v-to-control="{
			positionMode: element.affixInfo.mode,
			moveCursor: false,
			disabled: () => isLock,
			arrowOptions: { lineColor: '#9a98c3', size: 12, padding: 8 }
		}"
    :key="element.id"
    @todragend="handleAffixDragend($event, element)"
    @tocontrolend="handleAffixDragend($event, element)"
  >
    <!--Material code-->
  </div>
</template>
<script>
  setup () {
  	const isLock = computed(() => store.state.isLock)
  	const affix = computed(() => store.state.affix)
  	const handleAffixDragend = ($event: any, element: ComponentOptions) => {
  		const mode = element.affixInfo?.mode || 1
  		const { left, top, bottom, right, width, height } = $event
  		const _element = JSON.parse(JSON.stringify(element))
  		_element.affixInfo.x = [1, 3].includes(mode) ? left : right
  		_element.affixInfo.y = [1, 2].includes(mode) ? top : bottom
  		if (width && height) {
  			_element.w = width
  			_element.h = height
  		}
  		store.commit('editComponent', _element)
  	}
  }
</script>
```

与栅格模式不同，这里是使用事件回调函数对组件的 Vuex 数据进行更新。也是使用`isLock`判断组件是否锁定。插件支持更改定位方向，记录在右上角、右下角等，这样对响应式布局很有效。更多用法可参考: [@howdjs/to-control](https://kongfandong.cn/howdy/to-control/example3)

![Fixed模式](https://cdn.kongfandong.cn/img/blog/7hEy1qkxtocZwRg.gif)

## 交互弹窗 Popover

系统提供一种配置交互行为的功能，可以配置点击一个组件时弹窗另外一个组件，并配置组件弹出的方向。经过调研后发现`Element-plus`的`Popover`并不太适合用于这种情况，因为弹出的组件时动态的。于是就自己封装了一个组件，不仅支持配置`Popover`的各个方向，还另外扩展了一个`ScreenCenter`的弹出，让组件可以在屏幕中间弹出（类似`dialog`）。

通过传入点击的元素、目标弹窗的宽高和弹窗方向，返回出目标弹窗的`x`和`y`。核心代码如下：

```ts
/**
 * 获取Popover目标信息
 * @param element 来源DOM
 * @param popoverRect popover信息
 * @param direction popover方向
 * @returns [endX, endY, fromX, fromY]
 */
export function getPopoverActivePointByDirection(
  element: HTMLElement,
  popoverRect: PopoverOption,
  direction = DirectionEnum.BOTTOM_CENTER
) {
  const { width, height, top, left } = element.getBoundingClientRect();
  const {
    width: popoverWidth,
    height: popoverHeight,
    offset = 10,
  } = popoverRect;
  const activePointMap = {
    [DirectionEnum.SCREEN_CENTER]: [
      window.innerWidth / 2 - popoverWidth / 2,
      window.innerHeight / 2 - popoverHeight / 2,
    ],
    [DirectionEnum.TOP_START]: [left, top - popoverHeight - offset],
    [DirectionEnum.TOP_CENTER]: [
      left + width / 2 - popoverWidth / 2,
      top - popoverHeight - offset,
    ],
    [DirectionEnum.TOP_END]: [
      left + width - popoverWidth,
      top - popoverHeight - offset,
    ],
    [DirectionEnum.RIGHT_START]: [left + width + offset, top],
    [DirectionEnum.RIGHT_CENTER]: [
      left + width + offset,
      top + height / 2 - popoverHeight / 2,
    ],
    [DirectionEnum.RIGHT_END]: [
      left + width + offset,
      top + height - popoverHeight,
    ],
    [DirectionEnum.BOTTOM_END]: [
      left + width - popoverWidth,
      top + height + offset,
    ],
    [DirectionEnum.BOTTOM_CENTER]: [
      left + width / 2 - popoverWidth / 2,
      top + height + offset,
    ],
    [DirectionEnum.BOTTOM_START]: [left, top + height + offset],
    [DirectionEnum.LEFT_END]: [
      left - popoverWidth - offset,
      top + height - popoverHeight,
    ],
    [DirectionEnum.LEFT_CENTER]: [
      left - popoverWidth - offset,
      top + height / 2 - popoverHeight / 2,
    ],
    [DirectionEnum.LEFT_START]: [left - popoverWidth - offset, top],
  };
  const fromPoint = [left + width / 2, top + height / 2];
  return [...activePointMap[direction], ...fromPoint] || [0, 0, ...fromPoint];
}
```

另外，使用`transform-origin`这个属性可以实现弹窗从点击元素过渡展开的动画。最后配置弹窗的方向与弹出的组件类型即可。代码参考：[ActionPopover.vue](https://github.com/leon-kfd/Dashboard/blob/main/src/components/Action/ActionPopover.vue)

![不同方向的Popover](https://cdn.kongfandong.cn/img/blog/zFgUIwukiKxc5Xh.gif)

## 获取任意网站 Favicon

在`Collection`与`Search`组件中，都有用到一个功能，就是由用户输入网址后能自动获取到网站的 Favicon。在初版实现是直接使用网址 origin + /favicon.ico 获取，但经过大量尝试后发现，当前很多网站的 icon 并不是以这种标准形式存储的。所以后面就自己实现了一个后端接口来获取。

后端接口原理:

1. 从用户输入的网站中读取到 origin
2. 尝试从`Redis`中读取已缓存的图标路径，读取到则返回
3. 若缓存中没有，这使用`cheerio`加载网站，使用`$('link[rel*="icon"]').attr('href')`读取图标路径
4. 若上一步没有读取到，则继续尝试使用标准形式读取，即网站 Origin + /favicon.ico
5. 读取成功则写入`Redis`缓存，否则返回获取失败

同时接口接收`type`参数，可由后端直接返回图片流，以解决一些网站的 ICON 资源做了 CORS 限制。因为在`Collection`组件中，为了减少初次访问请求加载数，前端读取到图标后会将图标转成 BASE64 格式存到本地存储中。这种方式需要使用 Ajax 获取图标，让接口直接返回文件流可以解决跨域问题。

另读取图标时，前端会使用 Canvas 通道法将图标的白色部分扣成透明，代码可[参考此处](https://github.com/leon-kfd/Dashboard/blob/main/src/utils/images.ts#L40)

![添加网站自动获取图标](https://i.imgur.com/xaXQ3St.gif)

## 总结

项目仍在持续优化开发中，欢迎各种建议。由于篇幅问题，部分使用到的技术会不定时更新记录。若感谢的可以持续关注、Star，谢谢。

### 相关链接

- [Howdz 介绍文档](https://doc.howdz.xyz)
- [Github](https://github.com/leon-kfd/Dashboard/)
- [在线网页版地址](https://howdz.xyz)
