---
title: Vue3上手, 使用vite实现一个简单的Todolist应用
date: 2020-05-16
desc: 用Vue3的CompositionApi实现一个简单的todolist应用，使用vite搭建，其中结合了vuex、typescript、sass在vue3应用中的简单使用。
img: https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=768
thumbImg: https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=240
---

- Git 仓库: <a href="https://github.com/leon-kfd/TodoListVitePratice" target="_blank" style="display:inline-block">https://github.com/leon-kfd/TodoListVitePratice</a>
- 在线 Demo: <a href="https://kongfandong.cn/todo" target="_blank" style="display:inline-block">https://kongfandong.cn/todo</a>

## Vite

> Vite is an opinionated web dev build tool that serves your code via native ES Module imports during dev and bundles it with Rollup for production.

目前，Vue-cli 还未能直接搭建 vue3 应用，需要在 vue2 的项目上通过执行`vue add next`命令进行升级。

而 Vite 是官方提供的一个可以快速搭建 vue3 新工具，它是一个简易的 http 服务器，无需通过 webpack 打包即可实时解析 vue3 文件，并能实现热更新。

现在最新版的 vite 已经提供了一个简易模板，可以直接使用一下命令快速搭建

### 安装与启动

```bash
$ npx create-vite-app <project-name>
$ cd <project-name>
$ npm install
$ npm run dev
```

具体参考官方仓库: <a href="https://github.com/vuejs/vite#getting-started" target="_blank">https://github.com/vuejs/vite#getting-started</a>

### Typescript

vite 最新版默认已经可以直接对 typescript 进行解析编译，直接在 vue 文件中的`script`标签下加入`lang="ts"`即可。

### Sass

执行命令安装 sass， `npm i sass -D`， 然后在 vue 文件的`style`标签下加入`lang="scss"`即可，这些与以前 vue2 都是一样的。

### Vuex

支持 vue3 的 vuex 最新版现在还未正式发版，需要使用`npm i vuex@next -D`来安装。  
Vuex 的新语法进行了一些变更，你需要使用 Vuex.createStore 来创建，其他语法没有区别。

```js
import Vuex from "vuex";
// or => import { createStore } from 'vuex'
export default Vuex.createStore({
  state: {},
  mutations: {},
  actions: {},
  modules: {},
});
```

然后在 main.js 引入这个文件并 use

```js
import { createApp } from "vue";
import App from "./App.vue";
import store from "./store/index.js";
import "./assets/base.css";
createApp(App).use(store).mount("#app");
```

## Vue Compostion Api

Vue3 最大的一个变化就是使用`Vue Compostion Api`， 现在官方已经提供了 **<a href="https://vue-composition-api-rfc.netlify.app/zh/api.html#setup">中文文档</a>**

本次只用到了其中很少一部分的 API，而且可能使用方式不一定准确，仅供参考，望见谅。

## 功能设计

- 对 TodoList 的操作：完成、取消、添加、删除
- 可记录不同日期的 TodoList
- 对记录了 TodoList 的日期进行标注

现在先来看一下最终项目 DEMO 成果

<iframe src="https://kongfandong.cn/todo" width="100%" height="670px" style="border: none;outline:none;box-shadow: 0 0 5px #888"></iframe>

点击头部的日期会弹出日期选择，可选择其他日期。

## 实现

主要组件`Card.vue`组件，然后里面包含一个日期选择组件`DatePicker.vue`
为了练习一下 vuex 在 vue3 的使用，将当前的选择日期记录在了 vuex 中。

主要逻辑代码

```js
// Card.vue
import { ref, reactive, computed, watch } from "vue";
import { useStore } from "vuex";
import { Todo, getTodoList, setTodoList } from "../model/todo";
import DatePicker from "./DatePicker.vue";
const weekArr: string[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Firday",
  "Saturday",
];
export default {
  name: "Card",
  components: {
    DatePicker,
  },
  directives: {
    focus(el) {
      el.focus();
    },
  },
  props: {
    date: String,
    showAddBtn: Boolean,
  },
  setup(props) {
    const store = useStore();
    const state = {
      editingValue: ref(""),
      showDatePicker: ref(false),
    };
    let todoList = reactive([]);
    watch(
      () => props.date,
      (val) => {
        todoList.length = 0;
        todoList.push(...getTodoList(props.date));
        // state.showDatePicker.value = false
      },
      {
        immediate: true,
      }
    );
    const weekDay = computed(() => weekArr[new Date(props.date).getDay()]);
    const formatterDate = computed((): string => {
      const arr: string[] = new Date(props.date).toDateString().split(" ");
      return `${arr[1]} ${arr[2]}, ${arr[3]}`;
    });
    const handleChecked = (item: Todo): void => {
      item.isChecked = !item.isChecked;
      setTodoList(props.date, todoList);
      store.commit("refreshTodoListDateArr");
    };
    const handleRemove = (index: number): void => {
      todoList.splice(index, 1);
      setTodoList(props.date, todoList);
      store.commit("refreshTodoListDateArr");
    };
    const handleAdd = (): void => {
      state.editingValue.value = "";
      todoList.push({
        content: "",
        isChecked: false,
        isEditing: true,
      });
    };
    const handleEditSubmit = (item: Todo, index: number): void => {
      if (item.isEditing) {
        if (state.editingValue.value) {
          item.content = state.editingValue.value;
          item.isEditing = false;
        } else {
          todoList.splice(index, 1);
        }
        setTodoList(props.date, todoList);
        store.commit("refreshTodoListDateArr");
      }
    };
    return {
      weekDay,
      formatterDate,
      todoList,
      handleChecked,
      handleRemove,
      handleAdd,
      handleEditSubmit,
      ...state,
    };
  },
};
```

组件功能实现都比较简单，本次只为了熟悉语法，所以具体代码逻辑在这就不进行讲解了。

## 项目打包

使用`npm run build`或者`npx vite build`即可打包项目。

> Vite 的打包基于 Rollup

需要注意的是，vite 也是想 vue-cli 那样提供了配置文件的，在根目录下添加`vite.config.js`即可，例如本地打包后项目是通过 **https://kongfandong.cn/todo** 来访问的，如果使用默认的打包配置，会出现资源 404 的问题。这时需要给打包配置资源路径`/todo`，加入以下配置：

```js
// vite.config.js
module.exports = {
  base: "/todo",
};
```

Vite 还提供了很多其他的配置，具体请参考: <a href="https://github.com/vuejs/vite/blob/master/src/node/config.ts" target="_blank">https://github.com/vuejs/vite/blob/master/src/node/config.ts</a>

## 一个插曲

一开始，我使用 vuex 是使用`getCurrentInstance`获取 vue 的实例想像 vue2 那样类似`this.$store.state`来使用 vuex 的，就像下面的代码

```js
import { computed, getCurrentInstance } from "vue";
export default {
  setup() {
    const { ctx } = getCuurentInstance();
    const selectedDate = computed(() => ctx.$store.state.selectedDate);
    return {
      selectedDate,
    };
  },
};
```

这样 ts 会报错，提示 ctx 的类型没找到，通过查源码发现 vue 并没有把 ctx 的类型抛出。然后我就改成了

```js
import { computed, getCurrentInstance } from "vue";
export default {
  setup() {
    const instance: any = getCuurentInstance();
    const ctx = instance.ctx;
    const selectedDate = computed(() => ctx.$store.state.selectedDate);
    return {
      selectedDate,
    };
  },
};
```

然后一切如愿进行，开发环境下什么问题也没有了。但是，到了打包之后运行，浏览器就报错了

```
index.js:9 Uncaught TypeError: Cannot read property 'state' of undefined
    at index.js:9
    at n (index.js:1)
    at Object.get value [as value] (index.js:1)
    at Object.get (index.js:1)
    at Object.get (index.js:1)
    at index.js:9
    at Vn (index.js:1)
    at Proxy.<anonymous> (index.js:9)
    at Proxy.<anonymous> (index.js:1)
    at nt (index.js:1)
(anonymous) @ index.js:9
...
```

报错 state 没找到，程序上的 vuex 的$store 是 undefined。然后我查了好久也没找到解决办法，于是只能在 github 上提个 issue。

最后得到了解答，**原来在`setup()`中是不能使用`getCurrentInstance`的!**

具体 Issue: <a href="https://github.com/vuejs/vite/issues/156" target="_blank">https://github.com/vuejs/vite/issues/156</a>

最终的解决办法，引入 vuex 的 useStore 方法，就可以在 setup 中使用 vuex 了。

最后代码改为:

```js
import { computed } from "vue";
import { useStore } from "vuex";
export default {
  setup() {
    const store = useStore();
    const selectedDate = computed(() => ctx.$store.state.selectedDate);
    return {
      selectedDate,
    };
  },
};
```

## 总结

这个小 Demo 的实现过来还是遇到了不少问题，但还是一一解决了，可以让我对 vue3 与 typescript 进行了初步的了解。目前只是因为还不太熟悉，但感觉 vue3 未来发展潜力还是很大的。

还有 Vite 这个工具好像也是很强大的，目测 Vue3 官方后面有可能会直接推荐使用该工具进行开发了，有可能会放弃的 Webpack 了。
