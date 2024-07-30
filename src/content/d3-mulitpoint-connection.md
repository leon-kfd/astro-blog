---
title: 使用D3.js将离散的点形成平滑曲线及其应用
date: 2020-08-16
desc: D3.js内置了几种可以将离散点连成线的算法，但官方并没有提供效果展示，于是编写了一个简单的可以快速看到各种连线算法的效果图的DEMO。同时利用该功能实现的一个简单的曲线自动校正的Canvas画板Demo。
img: https://images.unsplash.com/photo-1636306950045-4dbb10b7e0f4?w=768
thumbImg: https://images.unsplash.com/photo-1636306950045-4dbb10b7e0f4?w=240
---

## 前言

之前遇到了一个场景，需要将多个离散的点使用一条平滑的曲线连起来。在网上找了很多方案，一般都是说使用**`三次样条插值`**实现。自己参考网上算法写了下，发现效果不太理想。然后看到 D3js 官方原来直接内置了多种相关算法，但官方并没有提供效果展示，于是就编写了一个简单的可以快速看到各种连线算法的效果图的 DEMO。

## 多点连线 Demo

Demo 访问地址: <a href="https://kongfandong.cn/demo/d3-multipoint-connection/index.html" target="_blank">https://kongfandong.cn/demo/d3-multipoint-connection/index.html</a>

<iframe src="https://kongfandong.cn/demo/d3-multipoint-connection/index.html" width="100%" height="750px" style="border: none;outline:none;box-shadow: 0 0 5px #888"></iframe>

_PS:PC 端支持拖拽更改点位置，移动端暂不支持_

- LineType：切换不同的 D3 内置的连线类型
- Add Random Point: 你可以添加更多的点进行连线
- 各个点可以拖拽更改当前位置
- 部分连线算法可以修改系数参数(bundle、cardinal、catmullRom)

利用 D3js 的这个连线算法，实现了一个简单的曲线自动校正的 Canvas 画板，参考下面的 Demo

## 曲线自动校正 Demo

Demo 访问地址: <a href="https://kongfandong.cn/demo/d3-adjust-line/index.html" target="_blank">https://kongfandong.cn/demo/d3-adjust-line/index.html</a>

<iframe src="https://kongfandong.cn/demo/d3-adjust-line/index.html" width="100%" height="750px" style="border: none;outline:none;box-shadow: 0 0 5px #888"></iframe>

- Canvas 简易画板
- 设置的 AdjustAngel 配置偏移角度
- 通过 AdjustAngel 进行点的取样，然后使用 D3js 的连线算法进行重连

## 总结

实现平滑的曲线，可以通过 D3js 内置的几种曲线算法生成一个插值曲线，该曲线原则上是`贝塞尔曲线`，所以可以在 SVG 和 Canvas 中都可以应用上。若要研究各种曲线算法的原理请参考官方源码。

官方文档：<a href="https://d3js.org.cn/document/d3-shape/#curves" target="_blank">https://d3js.org.cn/document/d3-shape/#curves</a>
