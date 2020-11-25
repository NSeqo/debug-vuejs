# vue 源码


1. package.json 中配置 dev, --sourcemap, 生成vue.map.js
2. example下test目录下各种测试demo
3. npm run dev


### 初始化流程

```
new Vue(options) 

    ==> 处理参数options 合并参数

    ==> initLifecycle  $parent $children 关系

    ==> initEvents   收集监听器函数 _events

    ==> initRender

```



### 组件的事件监听处理

1. 事件监听器 {name: "click", once: false, capture: false, passive: false}， 注册事件的时候passive为true，那么监听器函数内的preventDefault() 将会被浏览器忽略

2. 事件处理函数会被存在vm._events数组中