---
title: 利用G渲染器实现的音频可视化方案
date: 2021-06-29
desc: 利用阿里Antvis出品的G底层图形渲染器，结合AudioContext提供的音频数据获取API，实现出类似网易云播放音频特效。
img: https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=768
thumbImg: https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=240
---

利用阿里 Antvis 出品的 G 底层图形渲染器，结合 AudioContext 提供的音频数据获取 API，实现出类似网易云播放音频特效。

项目地址：

- <a href="https://github.com/leon-kfd/g-music-visualizer" target="_blank">⚡Github</a>
- <a href="https://leon-kfd.github.io/g-music-visualizer/" target="_blank">💡Demo</a>

## 关于 G 渲染器

`G`是一款易用、高效、强大的 2D 可视化渲染引擎，提供 Canvas、SVG 等多种渲染方式的实现。目前，已有多个顶级的可视化开源项目基于`G`开发，比如图形语法库`G2`、图可视化库`G6`等。

作为一个底层渲染器，其内置了许多常用的内置图形，提供完整的 DOM 事件模拟，同时提供了流程的动画实现，这些特性对我们这次实现音频特效都是很有必要的。

目前与`G`相似的竞品还有`Echart`的`ZRender`，相比较以我个人看法来说，Zrender 提供的 API 更丰富，但是上手难度比 G 要高一点，而`G`的 API 相对`简洁`一点。

类似的还有老大哥`d3`，这个相较以上两个更底层，API 更丰富，但上手难度就更大了。同时`g`里面的一些方法好像也是参考了`d3`算法思路。

[G 官方文档](https://g.antv.vision/zh/docs/api/canvas) _（这里吐槽说一下，G 的官方文档感觉还有很大优化空间，实在太简洁了，很多 API 都是一笔带过，用法也不怎么说明）_

## AudioContext 读取音频数据

实现音频特效动画的前提是需要拿到一个音频的音频数据，浏览网上一些方案后，发现[AudioContext](https://developer.mozilla.org/zh-CN/docs/Web/API/AudioContext)含有相关的 API。

原理：

- 首先需要基于`AudioContext.createAnalyser()`创建一个`Analyser`
- 为`Analyser`关联音频源，目前常用的音频源方式一般为以下两个
  - `createMediaElementSource()`: 关联到`audio`或`video`标签中（当前方案选择了这个）
  - `createMediaStreamSource()`: 关联到本地计算机或网络音频媒体流对象
- 创建`Gain`音量节点并关联到`Analyser`的`destination`中
- 通过`AnalyserNode.getByteFrequencyData()`方法将当前频率数据复制到传入的最终需读取音频的 Uint8Array 中

把以上操作封装到一个类中，便于初始化，可参考以下代码:

```ts
// src/plugins/MusicVisualizer.ts
const _analyser = new window.AudioContext();

type MusicVisualizerOptions = {
  audioEl?: HTMLAudioElement;
  size?: number;
};
export class MusicVisualizer {
  private analyser: AnalyserNode;
  private gainNode: GainNode;
  private audioSource?: MediaElementAudioSourceNode;
  private options: MusicVisualizerOptions & {
    size: number;
  };
  private visualArr: Uint8Array;
  constructor(options?: MusicVisualizerOptions) {
    const defaultOptions = {
      size: 128,
    };
    this.options = {
      ...defaultOptions,
      ...options,
    };
    this.analyser = _analyser.createAnalyser();
    this.analyser.fftSize = this.options.size * 2;
    this.gainNode = _analyser.createGain();
    this.gainNode.connect(_analyser.destination);
    this.analyser.connect(this.gainNode);
    if (this.options.audioEl) {
      this.audioSource = _analyser.createMediaElementSource(
        this.options.audioEl
      );
      this.audioSource.connect(this.analyser);
    }
    this.visualArr = new Uint8Array(this.analyser.frequencyBinCount);
    this.resumeAudioContext();
  }

  // 新版Chrome Audio需要有交互行为后才可以利用JS执行播放
  private resumeAudioContext() {
    if (_analyser) {
      const resumeAudio = () => {
        if (_analyser.state === "suspended") _analyser.resume();
        document.removeEventListener("click", resumeAudio);
      };
      document.addEventListener("click", resumeAudio);
    }
  }

  // 更换Audio
  setAudioEl(el: HTMLAudioElement) {
    if (this.audioSource) {
      this.audioSource.disconnect(this.analyser);
    }
    this.audioSource = _analyser.createMediaElementSource(el);
    this.audioSource.connect(this.analyser);
  }

  // 获取音频频域数据
  getVisualizeValue() {
    this.analyser.getByteFrequencyData(this.visualArr);
    return this.visualArr;
  }

  // 更改音量
  changeVolumn(value: number) {
    this.gainNode.gain.value = value;
  }

  // 卸载
  destory() {
    this.analyser.disconnect(this.gainNode);
    this.audioSource?.disconnect(this.analyser);
    this.gainNode.disconnect(_analyser.destination);
  }
}
```

初始化之后，就可以监听 Audio 的播放事件，当播放时利用`getVisualizeValue()`方法获取到实时音频（可结合利用 requestAnimationFrame 或 setTimeout 获取），这里因为是做可视化动画，当然是利用`requestAnimationFrame`读取每帧的数据后渲染。

还有一个需要注意的点，当 Audio 的数据源是网络音频时，有可能会出现无法读取到音频数据的问题。这个问题一般可能是因为网络音频的**跨域限制**，需要为 Audio 标签加入`crossOrigin="anonymous"`属性。
一般的 CDN 资源是很少设置 AccessHeader 跨域限制的，但加入这个属性后仍然出现了跨域的报错，说明这网络路径是设置了跨域限制的，这时候可以考虑用 Nginx 反向代理或服务端解决。

```html
<audio
  controls
  onPlay="{play}"
  onPause="{pause}"
  ref="{audio}"
  src="{audioURL}"
  crossorigin="anonymous"
></audio>
```

## 可视化特效实现

**以下选取项目部分功能的实现原理进行说明**

### 专辑图片旋转动画

因为每个示例都需要用到专辑图片旋转动画，因此为了方便把专辑图片的创建抽离了出来。

在 G 中画一个圆形图片需要用到`Clip`，这个在文档中并没有说明，但从 github 中找到了该用法。

旋转动画不能直接使用基础属性模拟，这里用到了矩阵变换，利用`shape.getMatrix()`获取初始矩阵，再通过`transform`计算出每个`ratio`对应的矩阵。

`transform`是 G 提供的一个扩展矩阵变换方法，接收 2 个参数，第一个是当前矩阵，第二个参数是 Action 数组。这里的旋转对应的 action 是:

```
['t', -x, -y],
['r', 旋转角度],
['t', x, y],
```

![简单示例](https://cdn.kongfandong.cn/img/blog/gq5J82LKisQHxbI.gif)

代码参考如下:

```ts
import { Canvas } from "@antv/g-canvas";
import { ext } from "@antv/matrix-util";

const { transform } = ext; // G提供的矩阵变换快捷方法

type ImageCircleConfig = {
  x: number;
  y: number;
  r: number;
  shadowColor?: string;
};
export function getImageCircle(
  canvas: Canvas,
  { x, y, r, shadowColor }: ImageCircleConfig
) {
  const shadowConfig = shadowColor
    ? {
        shadowColor,
        shadowBlur: 16,
      }
    : {};
  canvas.addShape("circle", {
    attrs: {
      x,
      y,
      r,
      fill: "#262626",
      ...shadowConfig,
    },
  });
  const shape = canvas.addShape("image", {
    attrs: {
      x: x - r,
      y: y - r,
      width: 2 * r,
      height: 2 * r,
      img: `https://source.unsplash.com/random/${2 * r}x${2 * r}?Nature`,
    },
  });
  shape.setClip({
    type: "circle",
    attrs: {
      x,
      y,
      r,
    },
  });
  // 旋转动画
  const matrix = shape.getMatrix();
  const radian = 2 * Math.PI; // 旋转360度
  shape.animate(
    (ratio: number) => {
      return {
        matrix: transform(matrix, [
          ["t", -x, -y],
          ["r", radian * ratio],
          ["t", x, y],
        ]),
      };
    },
    {
      duration: 10000,
      repeat: true,
    }
  );
  // 创建后先暂停动画，等待播放后再恢复
  setTimeout(() => {
    shape.pauseAnimate();
  });
  return shape;
}
```

### 在圆上的点

示例中经常要计算的就是在圆上的点，以柱状条特效（示例一）为例，首先就是要出围绕着圆的平均 64 个点作为初始坐标。

可通过利用当前点与圆心的夹角结合简单三角函数运算出 x,y 的偏移量。

如下图, **l = cos(θ) \* r**, **t = sin(θ) \* r**, 通过圆心 O 坐标加上偏移量即可算出点 A 坐标。

![获取圆上的点](https://cdn.kongfandong.cn/img/blog/ePWZhx8tjOlBvuk.png)

```ts
// POINT_NUM = 64 柱状条数
sArr.current = Array.from({ length: POINT_NUM }, (item, index: number) => {
  const deg = index * (360 / POINT_NUM) - 150; // 当前角度
  const l = Math.cos((deg * Math.PI) / 180); // x方向偏移系数
  const t = Math.sin((deg * Math.PI) / 180); // y方向偏移系数
  const r = R + OFFSET;
  return (canvas.current as Canvas)
    .addShape("rect", {
      attrs: {
        width: RECT_WIDTH,
        height: RECT_WIDTH,
        radius: RECT_WIDTH / 2,
        x: X + l * r - RECT_WIDTH / 2,
        y: Y + t * r - RECT_WIDTH / 2,
        fill: RECT_COLOR,
      },
    })
    .rotateAtPoint(X + l * r, Y + t * r, ((deg - 90) * Math.PI) / 180);
});
```

这里每个柱状条都需要进行旋转来围绕圆排列，使用的是`rotateAtPoint`绕着初始点旋转对应角度。

基本所有的示例都需要首先计算出围绕圆的点坐标，都是采用这种方式计算即可。

### 使用 Path 绘制圆形

某些场景下需实现一些类圆动画（示例二、三等），但圆形是无法实现这种动画的，这时候可以采用 Path 实现。

在初始状态未进行播放时，默认会显示一个圆形，这是为了减少创建一个圆的实例，可以直接利用 Path 绘制出圆形，后续的动画直接更改这个 Path 实例。

可以使用 2 个圆弧生成生成一个圆形的 Path， 参考以下代码

```ts
export function getCirclePath(cx: number, cy: number, r: number) {
  return `M ${cx - r}, ${cy}
  a ${r}, ${r} 0 1, 0 ${r * 2}, 0 
  a ${r}, ${r} 0 1, 0 ${-r * 2}, 0`;
}
```

### 通过点形成平滑曲线

若仅仅是将目标一组点连接成线，在视觉效果上会显得很突兀，及时改换成 Path 来连接成曲线也是不够平滑。

这时候可以采用插值法为连续目标点再插入中间点来为 Path 更加平滑，一般来说都是采用`三次样条插值`算法实现。

在 d3 中内置了很多连线算法方案，可以直接采用。在本次的示例中，遇到多个点生成平滑曲线的都是采用了 d3 的[curveCardinalClosed](https://d3js.org.cn/document/d3-shape/#curves)算法来生成 Path 路径。

```ts
// s-path.tsx
import { line, curveCardinalClosed } from "d3";
// some other code...
useEffect(() => {
  if (props.data?.length) {
    const pathArr: any[] = [[], [], [], []];
    getArray(props.data).map((item, index) => {
      pathArr[index % 4].push(
        getPointByIndex(index, ((item * item) / 65025) * POINT_OFFSET + 4)
      );
    });
    pathArr.map((item, index) => {
      // 使用d3的curveCardinalClosed为目标点数组插值生成平滑曲线Path
      const path = line()
        .x((d: [number, number]) => d[0])
        .y((d: [number, number]) => d[1])
        .curve(curveCardinalClosed)(item);
      sPathArr.current[index]?.attr("path", path);
    });
  }
}, [props.data]);
```

`d3`其他平滑曲线算法示例可参考笔者在很久以前写的 Demo: [Click here](https://kongfandong.cn/blog/d3-mulitpoint-connection/)

### 在圆上的点跟随圆放大的同时做圆周运动

![圆周运动](https://cdn.kongfandong.cn/img/blog/Hu7aUsYVJ2oQyLK.gif)

示例五中的动画会出现在圆上的点跟随圆放大的同时做圆周运动，这种动画在实现时有两种方案：

第一种，是大圆利用 Path 模拟，然后动画开始后在每帧动画中，利用`Path.getPoint(ratio: number)`获取当前大圆中点当前帧下某个对应点的坐标。

第二种，是直接计算出当前帧下这个点在圆上的位置，利用三角函数结合大圆的放大偏移系数与`ratio`即可计算出当前点坐标。

在实现第一种方案时，发现效果不太理想，不知道是不是有 setTimeout 的原因，弃用了然后选择了方案二实现。

部分参考代码如下:

```ts
Array.from({ length: CIRCLE_NUM }, (item, index) => {
  circleArrStart.current.push(false);
  // circle大圆
  circleArr.current.push(addCircle());
  circleArr.current[index].animate((ratio: number) => {
    return {
      r: R + ratio * CIRCLE_SCALE_OFFSET,
      // path: getCirclePath(X, Y, R + ratio * 80),
      opacity: ratio > 0.02 && ratio < 0.9 ? 0.8 - ratio * 0.8 : 0,
    };
  }, animateOption);
  // circle-dot大圆上的点
  circleDotArr.current.push(addCircleDot());
  circleDotDegArr.current.push(0);
  circleDotArr.current[index].animate((ratio: number) => {
    if (props.data && ratio < 0.05 && !circleDotDegArr.current[index]) {
      circleDotDegArr.current[index] = pickStartPoint();
    } else if (ratio > 0.9) {
      circleDotDegArr.current[index] = 0;
    }
    const deg = circleDotDegArr.current[index] + ratio * 360 - 180;
    const l = Math.cos((deg * Math.PI) / 180);
    const t = Math.sin((deg * Math.PI) / 180);
    const r = R + ratio * CIRCLE_SCALE_OFFSET;
    return {
      x: X + l * r,
      y: Y + t * r,
      r: DOT_R * (1 - ratio / 2),
      opacity: ratio > 0.05 && ratio < 0.9 ? 0.8 - ratio * 0.8 : 0,
    };
  }, animateOption);
});
```

### 粒子特效的实现

示例六是一个粒子特效效果，也是实现这么多示例中耗时比较多的一个，这里拿出来说一下实现原理。

与其他示例一样初始化时，先初始化出专辑圆形图。

然后准备初始化粒子，定义圆形作为粒子形状，尽量小一点，可以开启阴影效果，但是性能会很差，这次就把 Shadow 阴影关闭了。

定义每个取样点周围的粒子数，当前为 64 个音频样点，一个样点设置 12 个粒子（可以更多，同样越多就约耗能），最终粒子数为 64 X 12 个。

使用随机值生成粒子样点，这里可以使用样点当前角度再随机偏移一定量即可生成均匀的粒子。

粒子效果的比较难的在于动画上，要选择一个合适的漂浮动画函数。这次示例选择了`正弦函数`实现左右均匀漂浮，在加上利用`setTimeout`随机延迟粒子生成时间即可完成粒子按一定规律下漂浮的动画。

定义粒子动画时，通过正弦函数与 ratio 计算出每帧粒子的实际 x,y 坐标即可。因为这次还会结合当前音频数据，让某个样点的粒子飘得高一点，让粒子的偏移量加大，这时还需要进一步对动画进行更改。

![粒子特效](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2e05ae8b50c0438687d24c69d1845f14~tplv-k3u1fbpfcp-zoom-in-crop-mark:1304:0:0:0.awebp)

```ts
// POINT_NUM = 64 样点数
// PARTICLE_NUM = 12 样点周围粒子数
Array.from({ length: POINT_NUM }, (point, index1) => {
  Array.from({ length: PARTICLE_NUM }, (particle, index2) => {
    const deg = index1 * (360 / POINT_NUM) - 150 + (Math.random() - 0.5) * 10;
    const l = Math.cos((deg * Math.PI) / 180);
    const t = Math.sin((deg * Math.PI) / 180);
    const r = R + OFFSET;
    const x = X + l * r;
    const y = Y + t * r;
    const particleShape = (canvas.current as Canvas).addShape("circle", {
      attrs: {
        x,
        y,
        r: 0.8,
        fill: "#fff",
        opacity: 0,
        // ⚠开启阴影会掉帧
        // shadowColor: '#fcc8d9',
        // shadowBlur: 1
      },
    });
    particleShape.animate(
      (ratio: number) => {
        const deg = index1 * (360 / POINT_NUM) - 150 + Math.sin(ratio * 20) * 4;
        const l = Math.cos((deg * Math.PI) / 180);
        const t = Math.sin((deg * Math.PI) / 180);
        const _index = POINT_NUM * index1 + index2;
        if (particleActiveArr.current[_index]) {
          if (ratio < 0.02) {
            particleActiveArr.current[_index] =
              index1 >= currentActiveIndex.current - 1 &&
              index1 <= currentActiveIndex.current + 1
                ? POINT_ACTIVE_MOVE_LENGTH
                : POINT_MOVE_LENGTH;
          } else if (ratio > 0.98) {
            particleActiveArr.current[_index] = POINT_MOVE_LENGTH;
          }
        }
        const offset = particleActiveArr.current[_index] || POINT_MOVE_LENGTH;
        return {
          x: x + l * ratio * offset,
          y: y + t * ratio * offset,
          opacity: 1 - ratio,
        };
      },
      {
        duration: POINT_CREATE_DELAY,
        repeat: true,
        easing: "easeSinInOut",
      }
    );
    particleArr.current.push(particleShape);
    particleStartArr.current.push(false);
    particleActiveArr.current.push(POINT_MOVE_LENGTH);
  });
});
```

## 其他说明

这个项目是一个练手项目，基于`vite`、`React`、`Typescript`，因为 react 平时用的不多，项目中存在什么问题或写的不好的地方欢迎指点。

或者有什么好看的特效也可以提 ISSUE 或 PR 交流一下怎么实现。

- 项目 Github: <a href="https://github.com/leon-kfd/g-music-visualizer" target="_blank">**Click Here**</a>

- 项目 Demo: <a href="https://leon-kfd.github.io/g-music-visualizer/" target="_blank">**Click Here**</a>
