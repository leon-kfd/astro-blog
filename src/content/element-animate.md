---
title: 使用Element.animate添加文字与图片动画
date: 2021-12-01
desc: 在网页添加一些简单的切换动画一般使用CSS3的animate或者transition实现，而Element.animate是新的原生Javascript Api，能使用JS快速为Dom添加动画。
img: https://images.unsplash.com/photo-1622737133809-d95047b9e673?w=768
thumbImg: https://images.unsplash.com/photo-1622737133809-d95047b9e673?w=240
---

在网页添加一些简单的切换动画一般使用 CSS3 的 animation 或者 transition 实现，而 Element.animate 是新的原生 Javascript Api，能使用 JS 快速为 Dom 添加动画。

## 前言

为了增加网站的用户体验，在很多场景下一般可以为元素的切换添加一下转场动画。

最简单的方法，一般可以使用 CSS 的`transition`或者`animation`实现。当前也有很多 CSS 动画库，例如[animate.css](https://animate.style/)，它与[wow.js](https://wowjs.uk/)搭配使用经常用于很多产品宣传首页。

当然我们也可以使用一些主流的 JS 动画库操作某些元素的单独动画，例如：[Velocity](https://github.com/julianshapiro/velocity)、[Anime.js](https://github.com/juliangarnier/anime)等。或者更传统的`Jquery`也有提供[.animate](https://api.jquery.com/animate/)操作动画的方案。

而本文则介绍一下原生较新的 Javascript Api: **[Element.animate()](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)**

## 关于 Element.animate

[Element.animate()](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)是`Web Animations API`提供的使用 Javascript 操作元素动画的解决方案。

### 参数

`Element.animate(keyframes, options)`方法接收 2 个参数，第一个为`keyframes`，第二个为`options`。

`keyframes`：与 CSS3 的 keyframes 的概念是一致的，代表关键帧的集合。它可以接收一个关键帧数组，也可以简写成一个对象。它支持所有 CSS 动画支持的属性，另简写写法添加`offset`, `float`, `easing`等关键字 。具体写法请参考[Keyframe Formats (MDN)](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Animations_API/Keyframe_Formats)或下文的案例使用。

`options`: 动画的相关配置。其接收`delay`, `duration`, `easing`, `iterations`等配置参数，可配置动画的延迟执行时间、执行持续时间、缓动曲线、执行次数等，其与 CSS 动画属性也保持一致，更多参数请参考[KeyframeEffect (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/KeyframeEffect)。

这个方法会返回一个[Animation](https://developer.mozilla.org/zh-CN/docs/Web/API/Animation)实例，通过这个实例我们可以对动画进行暂停、取消、读取执行状态等。或者通过`.finished`返回 Promise 来对执行完动画进行下一步操作。

### 兼容性

因为该 API 较新，所以对传统的浏览器支持并不友好，所有 IE 浏览器都不支持。在[Can I use](https://caniuse.com/?search=Element.animate)上查询如下：

![兼容性](https://cdn.kongfandong.cn/img/blog/2xKyCauonPReYEH.png)

但是只要简单使用`if (dom.animate) {}`包裹即可向下兼容，对一些不支持的浏览器不执行动画就可以。

## 使用案例

### 文字动画特效

简单写了三种文字动画特效：

- FadeIn：渐变进入
- FadeUpInOut: 旧文本先淡出新文本再淡入
- Typewriter: 打字机特效

![文字切换特效](https://cdn.kongfandong.cn/img/blog/TKxs5kXyDIz8EPO.gif)

**淡入淡出**

`Effect1`和`Effect2`是更改`opactity`与`translate`属性实现的文字淡入淡出动画。

```html
<div class="text-wrapper" id="Effect1"></div>
<div class="text-wrapper" id="Effect2"></div>
<script>
  // ...省略事件绑定等代码
  function animateEffect1(text) {
    const target = document.querySelector("#Effect1");
    target.innerText = text;
    // 使用对象简写写法opactiy from 0, to 1， 执行时间600ms
    target.animate({ opacity: [0, 1] }, 600);
  }
  async function animateEffect2(text) {
    const target = document.querySelector("#Effect2");
    // finished返回Promise，可等待文本淡出动画执行完再执行新文本淡入动画
    await target.animate(
      {
        opacity: [1, 0],
        transform: ["translateY(0)", "translateY(-20px)"],
      },
      300
    ).finished;
    target.innerText = text; // 当旧文本动画执行完再开始替换文本
    target.animate(
      {
        opacity: [0, 1],
        transform: ["translateY(20px)", "translateY(0)"],
      },
      300
    );
  }
</script>
```

**打字机**

`Effect3`实现了一个文字打字机特效，该特效需要确保文字是**等宽字体**，而且文本不能为多行文本。

```html
<div class="text-wrapper" id="Effect3"></div>
<script>
  // ...省略事件绑定等代码
  async function animateEffect3(text) {
    const target = document.querySelector("#Effect3");
    const beforeWidth = target.offsetWidth; // 计算旧文本宽度
    const textBeforeLength = target.innerText.length; // 计算文本字数
    if (textBeforeLength > 0) {
      // 使用数组参数方式执行宽度减少阶跃动画
      await target.animate([{ width: `${beforeWidth}px` }, { width: 0 }], {
        duration: textBeforeLength * 100,
        easing: `steps(${textBeforeLength})`, // step是阶跃函数，表示动画按多少步执行完
      }).finished;
    }
    target.innerText = text; // 切换新文本
    const afterWidth = target.offsetWidth; // 计算新文本宽度
    const textAfterLength = target.innerText.length; // 计算文本字数
    target.animate([{ width: 0 }, { width: `${afterWidth}px` }], {
      duration: textAfterLength * 100,
      easing: `steps(${textAfterLength})`,
    });
  }
</script>
```

`easing`属性中使用了[`steps`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/easing-function#the_steps_class_of_easing_functions)**阶跃函数**，它表示动画需要按多少步执行完，每一步状态里面是属性是一致的，每步属性变化是跳跃的，没有过渡。这里使得文本每次减少一个字符的宽度，构造出打字机的效果。

以上文字特效的实现已上传到`codepen`，请参考此处: [https://codepen.io/leon-kfd/pen/vYJbodr](https://codepen.io/leon-kfd/pen/vYJbodr)。

### 图片切换特效

在使用 CSS 实现元素动画，一般通过添加类名、移出类名来实现。因为图片无法准确知道需要加载的时间，一般情况是监听图片的 load 事件回调进行判断，所以基本无法使用纯 CSS 来实现切换动画。

本次使用原生`Element.animate()`API 实现了一个简单的图片切换特效。

![图片切换动画特效](https://cdn.kongfandong.cn/img/blog/1s6NA9winbcuPaM.gif)

这个特效主要原理：

- 点击切换时，调用函数切换图片路径，这时候图片会异步加载
- 在新图片加载过程中，旧图片执行一个**高斯模糊**叠加的渐变淡出动画，并把这个 Animation 对象记录下来
- 为图片元素添加 load 事件监听，当图片加载完成，把旧图片淡出动画`cancel`（因为无法确保旧图片淡出动画执行完前新图片已经加载完成，需要**Cancel**掉旧动画防止重复执行）
- 执行新图片的高斯模糊淡入动画，动画执行后修改元素 CSS 最终状态

Demo 代码如下:

```html
<button id="btn">Random Img</button>
<p class="img-wrapper">
  <img id="img" />
</p>

<script>
  let leaveAnimation = null; // 用于记录Animation对象
  btn.addEventListener("click", () => {
    randomPhoto();
  });

  async function randomPhoto(first) {
    const target = `https://source.unsplash.com/random/512x512/?nature,${+new Date()}`;
    img.src = target;
    // 切换图片路径后，执行图片淡出动画，此时新图片在后台加载
    if (!first) {
      try {
        leaveAnimation = img.animate(
          [
            { filter: "blur(20px)", tarnsform: "scale(1,1)" },
            { filter: "blur(60px)" },
          ],
          400
        );
        await leaveAnimation.finished;
        img.style.filter = "blur(60px)";
      } catch {
        console.log("Cancel animation");
      }
    }
  }

  img.addEventListener("load", async () => {
    img.style.opacity = 1; // 用于防止首次加载闪图
    if (leaveAnimation) leaveAnimation.cancel(); // cancel掉淡出动画，防止重复执行
    const changeAnimation = img.animate(
      [
        { filter: "blur(20px)", tarnsform: "scale(1,1)" },
        { filter: "blur(0)", tarnsform: "scale(1)" },
      ],
      400
    );
    await changeAnimation.finished;
    img.style.filter = "blur(0)"; // 等待动画执行完后更改最终状态
  });

  randomPhoto(true); // 页面加载立即执行一遍
</script>
```

以上图片特效的实现已上传到`codepen`，请参考此处: [https://codepen.io/leon-kfd/pen/ZEXYKLR](https://codepen.io/leon-kfd/pen/ZEXYKLR)。

> Demo 中使用了 unsplash 的随机图片接口, `https://source.unsplash.com/random`

另因当前`Element.animate()`仍属于实验特性，并不保证将来 api 会进行改动或添加新的特性。

## Links

- [Element.animate()](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/animate)
- [Text Effect Demo](https://codepen.io/leon-kfd/pen/vYJbodr)
- [Img Effect Demo](https://codepen.io/leon-kfd/pen/ZEXYKLR)
