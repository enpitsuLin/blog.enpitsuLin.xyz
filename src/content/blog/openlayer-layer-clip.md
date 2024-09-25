---
title: Openlayers中的将图层裁切
date: 2022-02-11 17:00:00
tags: [WebGis,Canvas]
excerpt: 业务中遇到需要对图层裁切可以使用Openlayer根据矢量数据对图层裁切而不是依赖于gis所发布的服务
---

一般来说使用 ol 绘制地图时从 gis 服务中获取的贴片地图可以是为所需的设计切好行政区划形状的，但是遇到提供的服务不太好去修改这个形状的时候可能就需要前端来将地图来裁切加工。

一般来说行政区划形状可以通过 gis 服务获取或者使用静态 geojson 资源获取一个面要素数据，我们可以通过面要素数据来将所需的形状切出来，但是 openlayer 没有现成的 api 来完成。这时候我们就需要用到 canvas 的 [globalCompositeOperation](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation) 来完成。

首先保证你的 layer 并不是 WebGL 层，然后我们需要定义好基础图层`baseLayer`作为需要裁切的目标。

```typescript
import { Tile } from 'ol/layer'
import { XYZ } from 'ol/source'
const baseLayer = new Tile({
  source: new XYZ({
    url: `sourceUrl`,
  }),
})
```

当然这个图层可以不一定是贴片地图，不过大多数业务上还是以这个为主的。

# GIS 服务中获取裁切范围

然后需要以裁切的面要素数据建立一个`Vector`图层，并绑定其 source 的`addFeature`事件使基础图层可见范围与`clipLayer`一致

```typescript
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import EsriJson from 'ol/format/EsriJSON';
const clipLayer = new VectorLayer({
  source: new VectorSource({
    url: `提供面要素服务地址`,
    format: new EsriJson() // 这里因为gis服务是EsriJson格式 如果是GeoJson或其他则使用对应的format
  });
});

clipLayer.getSource().on('addfeature', ()=> {
  baseLayer.setExtent(clipLayer.getSource().getExtent());
});
```

如此基础图层就只会加载切片范围里的贴片了，接着就是需要对边界进行裁切。

这里需要用到图层的`postrender`事件，这是在贴图渲染完成后但未加载淡入的事件，然后通过对此时 canvas 的`globalCompositeOperation`的设置就可以得到裁切的效果

```typescript
baseLayer.on('postrender', (evt) => {
  if (!evt.context || !('save' in evt.context))
    return
  const vecCtx = getVectorContext(evt)
  evt.context.globalCompositeOperation = 'destination-in'
  clipLayer.getSource().forEachFeature((feature) => {
    vecCtx.drawFeature(feature, style)
  })
  evt.context.globalCompositeOperation = 'source-over'
})
```

当`globalCompositeOperation`设置为`destination-in`，canvas 会仅绘制与画布内容重合的内容，其他会保持透明，同时我们将`getVectorContext(evt)`即`baseLayer`重新绘制要素就能够获得被裁切后的贴片地图了。

# 静态内容中获取裁切范围

文件中获取就是把`VectorLayer`构造参数中的 url 换成 features 然后用 format 从文件中读取 features 就行了

```typescript
const clipLayer = new VectorLayer({
  source: new VectorSource({
    features: [new EsriJson().readFeatures(require('路径'))],//format 同服务
  });
});
```
