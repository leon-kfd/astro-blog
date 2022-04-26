---
title: CSS实现判断鼠标进入方向
date: 2020-03-21
desc: 使用纯CSS判断鼠标进入方向执行不一样的方向动画，与搭配JS实现同时记录进入方向与移出方向。
img: https://api.lorem.space/image/furniture?w=800&h=500
imgWidth: 800
imgHeight: 500
---

使用纯CSS判断鼠标进入方向执行不一样的方向动画，或搭配JS实现同时记录进入方向与移出方向

### 目录
1. [纯CSS实现](#纯css实现)
    + [Clip-path](#clip-path)
    + [Transform](#transform)
2. [JS实现](#js实现)
    + [Demo展示](#Demo展示)
    + [判断方向算法](#判断方向算法)
    + [移入方向判断](#移入方向判断)
    + [移出方向判断](#移出方向判断)
3. [总结](#总结)

## 纯CSS实现

实现纯CSS判断鼠标进入方向，主要是先通过将DIV以对角线切割为4个部分，然后即可为这4个部分写入:hover选择器执行不同方向的动画。如果DIV是正方形的话，对角线切割就很简单，可以用伪元素通过rotate(45deg)就可以实现。但是当Div是长方形的时候，就需要使用以下的方法了。

![对角线切割DIV](https://s2.loli.net/2021/12/04/Afdp2u1U4S6oVWL.png)

目前可以通过2种CSS3的方式实现
1. 使用CSS3的 <a href="https://developer.mozilla.org/zh-CN/docs/Web/CSS/clip-path" target="_blank">clip-path</a> 属性定向裁剪区域
2. 使用CSS3的 <a href="https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Transforms" target="_blank">transfrom</a> 属性，将div倾斜再旋转一定角度实现，需要同时用到rotate和skew2种2D变换。


### Clip-path

**Demo**
<iframe src="https://kongfandong.cn/demo/judge-enter-direction-by-css-clip-path.html" width="100%" height="470px" style="border: none;outline:none;box-shadow: 0 0 5px #888"></iframe>

**clip-path方式实现主要代码逻辑**

CSS
```css
.box {
  width: 400px;
  height: 300px;
  background: #eee;
  position: relative;
  overflow: hidden;
  border: 2px solid #262626;
}
.top, .right, .bottom, .left {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  transition: all .4s;
}
.top:after, .right:after, .bottom:after, .left:after {
  position: absolute;
  content: '';
  width: 100%;
  height: 100%;
}
.top {
  top: -100%;
  background: rgb(255, 228, 177);
}
.right {
  right: -100%;
  left: auto;
  background: rgb(200, 177, 255);
}
.bottom {
  bottom: -100%;
  top: auto;
  background: rgb(177, 255, 225);
}
.left {
  left: -100%;
  background: rgb(177, 189, 255);
}
.top:after {
  clip-path: polygon(0 0, 50% 50%, 100% 0);
  top: 100%;
  left: 0;
}
.right:after {
  clip-path: polygon(100% 0, 50% 50%, 100% 100%);
  right: 100%;
  top: 0;
}
.bottom:after {
  clip-path: polygon(0 100%, 50% 50%, 100% 100%);
  bottom: 100%;
  left: 0;
}
.left:after {
  clip-path: polygon(0 0, 50% 50%, 0 100%);
  left: 100%;
  top: 0;
}
.top:hover {
  top: 0;
}
.right:hover {
  right: 0;
}
.bottom:hover {
  bottom: 0;
}
.left:hover {
  left: 0;
}
/* 解决层级阻断问题 */
.top:hover ~ .right,
.top:hover ~ .bottom,
.top:hover ~ .left,
.right:hover ~ .bottom,
.right:hover ~ .left,
.bottom:hover ~ .left{
  display: none;
}
```

HTML
```html
<div class="box">
  <span>Hover Here</span>
  <div class="top">From Top</div>
  <div class="right">From Right</div>
  <div class="bottom">From Bottom</div>
  <div class="left">From Left</div>
</div>
```

为.top的Div创建一个伪元素，然后使用clip-path: polygon(0 0, 50% 50%, 100% 0) 定位左上角、中心、右上角切割出上部分的三角形，这时.top实际区域是一个五边形（.top:hover时其伪元素也会包含在其中）。


### Transform

**Demo**
<iframe src="https://kongfandong.cn/demo/judge-enter-direction-by-css-transform.html" width="100%" height="470px" style="border: none;outline:none;box-shadow: 0 0 5px #888"></iframe>

transform实现方式与clip-path方式基本差不多，主要是先将伪类通过旋转加偏移变换成一个平行四边形，将变换顶点定位在中心，然后隐藏超出部分即可。

![transform变换DIV](https://s2.loli.net/2021/12/04/TEaZcDmVvYo2pzB.png)

**transform方式实现主要代码逻辑** *(仅列举与clip-path不一样的代码)*

```css
body {
  --angle: 37deg;
}

/*...省略部分...*/

.top:after,
.right:after,
.bottom:after,
.left:after {
  position: absolute;
  content: '';
  width: 100%;
  height: 100%;
  transform-origin: 0 0;
}
.top:after {
  top: 150%;
  left: 50%;
  transform: rotate(calc(var(--angle) - 180deg)) skew(calc((var(--angle) - 45deg) * 2));
}
.right:after {
  top: 50%;
  left: -50%;
  transform: rotate(calc(0deg - var(--angle))) skew(calc((45deg - var(--angle)) * 2));
}
.bottom:after {
  top: -50%;
  left: 50%;
  transform: rotate(var(--angle)) skew(calc((var(--angle) - 45deg) * 2));
}
.left:after {
  top: 50%;
  left: 150%;
  transform: rotate(calc(180deg - var(--angle))) skew(calc((45deg - var(--angle)) * 2));
}

/*...省略部分...*/
```

transform方式最大缺点就是需要计算角度，先将变换顶点改为0 0（原为50% 50%），就可以直接套用以上的变换公式，再使用acrtan(高/宽)计算出角度，然后赋值给--angle自定义CSS变量即可。

> PS: calc计算函数中值为0时也要带上单位，不然无法生效

## JS实现

### Demo展示

<iframe src="https://kongfandong.cn/demo/judge-enter-direction-by-js.html" width="100%" height="620px" style="border: none;outline:none;box-shadow: 0 0 5px #888"></iframe>

### 判断方向算法

以上的Demo中，为每个DIV加入了mouseenter和mouseleave的事件监听，通过判断方向后然后为其添加不同方向的移入动画和移出动画。

JS实现判断进入方向，依然是将div按对角线切割成4个三角形，然后通过判断鼠标事件中移入的点是否在三角形内来确定方向。这里涉及到了一个如何判断点在区域内的算法实现。

![判断点是否在同侧](https://s2.loli.net/2021/12/04/hf1sQ2w8DOHloGy.png)

以下提供一个函数判断点P和点O是否在直线AB的同一侧
```js
/* 判断两点是否位于直线同一侧
* @param {Object} p - P点坐标
* @param {Object} o - O点坐标
* @param {Object} a - A点坐标(直线AB)
* @param {Object} b - B点坐标(直线AB)
* @return {Boolean}
*/
function isSameSide (p, o, a, b) {
  return ((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) * ((o.x - a.x) * (b.y - a.y) - (o.y - a.y) * (b.x - a.x)) >= 0
}
```
该函数需要传入4个点坐标（含有x,y属性的对象），参数1和参数2是需要判断的两点，参数3和参数4是确定直线的两点。使用的是矢量法，过程无需用到三角函数，而且参数1和参数2顺序可互换，参数3和参数4顺序也可互换。判断点在三角形内，就需要用3次这个函数分别为三条边进行判断。

### 移入方向判断

![移入方向](https://s2.loli.net/2021/12/04/v2qT7iGQoLmBXwW.png)

如图，点P为鼠标事件移入获取到的点，当点P与点O在直线AB同一侧、点P与点A在直线OB同一侧、点P与点B在直线AO同一侧，即可判断出点P在三角形AOB内，即鼠标从上方进入。转换为代码即可写成:
```js
...
if (isSameSide(p,o,a,b) && isSameSide(p,a,o,b) && isSameSide(p,b,a,o)) {
  console.log('Slide From Top')
}
...
```

### 移出方向判断

同理，要判断移出方向，可以判断**点P与点O不在直线AB同一侧**、点P与点A是否在直线OB同一侧、点P与点B是否在直线AO同一侧，即可判断出鼠标从上方移出。转换为代码即可写成:
```js
...
if (!isSameSide(p,o,a,b) && isSameSide(p,a,o,b) && isSameSide(p,b,a,o)) {
  console.log('Slide Out Top')
}
...
```
<br>
<br>
<br>

下面提供Demo实现的主要JS代码，由于CSS需要定义几个简单的Slide动画，代码比较简单，由于篇幅有限就不在本文列出，感兴趣的可以直接查看Demo源码。
```js
var isSameSide = function (p, o, a, b) {
  return ((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) * ((o.x - a.x) * (b.y - a.y) - (o.y - a.y) * (b.x - a.x)) >= 0
}
var boxList = Array.prototype.slice.call(document.querySelectorAll('.box'))
var mouseenterEvent = function (e) {
  var el = e.currentTarget
  var { top, left, width, height } = el.getBoundingClientRect()
  var a = { x: left, y: top }
  var b = { x: left + width, y: top }
  var c = { x: left + width, y: top + height }
  var d = { x: left, y: top + height }
  var o = { x: left + width / 2, y: top + height / 2 }
  var p = { x: e.x, y: e.y }
  if (isSameSide(p, o, a, b) && isSameSide(p, a, o, b) && isSameSide(p, b, o, a)) {
    el.setAttribute('class', 'box slide-from-top')
  } else if (isSameSide(p, o, b, c) && isSameSide(p, b, o, c) && isSameSide(p, c, b, o)) {
    el.setAttribute('class', 'box slide-from-right')
  } else if (isSameSide(p, o, c, d) && isSameSide(p, c, o, d) && isSameSide(p, d, o, c)) {
    el.setAttribute('class', 'box slide-from-bottom')
  } else if (isSameSide(p, o, a, d) && isSameSide(p, a, o, d) && isSameSide(p, d, o, a)) {
    el.setAttribute('class', 'box slide-from-left')
  } else {
    el.setAttribute('class', 'box slide-from-top')
  }
}
var mouseleaveEvent = function (e) {
  var el = e.currentTarget
  var { top, left, width, height } = el.getBoundingClientRect()
  var a = { x: left, y: top }
  var b = { x: left + width, y: top }
  var c = { x: left + width, y: top + height }
  var d = { x: left, y: top + height }
  var o = { x: left + width / 2, y: top + height / 2 }
  var p = { x: e.x, y: e.y }
  if (!isSameSide(p, o, a, b) && isSameSide(p, a, o, b) && isSameSide(p, b, o, a)) {
    el.setAttribute('class', 'box slide-out-top')
  } else if (!isSameSide(p, o, b, c) && isSameSide(p, b, o, c) && isSameSide(p, c, b, o)) {
    el.setAttribute('class', 'box slide-out-right')
  } else if (!isSameSide(p, o, c, d) && isSameSide(p, c, o, d) && isSameSide(p, d, o, c)) {
    el.setAttribute('class', 'box slide-out-bottom')
  } else if (!isSameSide(p, o, a, d) && isSameSide(p, a, o, d) && isSameSide(p, d, o, a)) {
    el.setAttribute('class', 'box slide-out-left')
  } else {
    el.setAttribute('class', 'box slide-out-top')
  }
}
for (var i = 0; i < boxList.length; i++) {
  boxList[i].addEventListener('mouseenter', mouseenterEvent)
  boxList[i].addEventListener('mouseleave', mouseleaveEvent)
}
```

## 总结

使用纯CSS实现判断方向会有一个比较大的缺点，就是浏览器鼠标移动事件含有**一定延迟**，当鼠标速度很快的进入div时，有可能:hover会延迟执行到后面的元素。
同时纯CSS方式只可判断移入方向，还未能实现可以同时判断**移入和移出**。需要在记录移入方向的同时，再记录移出方向目前想到的只可使用JS去辅助实现了。

使用JS实现最主要是要运用到判断两点位于直线同侧的算法，这个算法只涉及四则运算，也比较简洁。获取DIV四个顶点和中心的坐标可以用<a href="https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getBoundingClientRect" target="_blank">getBoundingClientRect()</a>来获取元素的top,left,width,height计算出来。


*以上内容未经授权请勿随意转载。*

> 2021/10/01更新, 找到了一个使用Grid布局实现的移入方向Demo: [CSS-only direction-aware hover effect](https://codepen.io/leon-kfd/pen/dyvJVRL)
