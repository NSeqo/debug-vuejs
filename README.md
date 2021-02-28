# vue 源码 (v2.6.12)

## 源码下载后处理
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

    ==> 

```



### 组件的事件监听处理

1. 事件监听器 {name: "click", once: false, capture: false, passive: false}， 注册事件的时候passive为true，那么监听器函数内的preventDefault() 将会被浏览器忽略

2. 事件处理函数会被存在vm._events数组中








### 源码的解读

> vue 的简要概述

 ```
vue 本身是一个视图框架，解决的是构建页面视图的问题，采用的方式是数据驱动视图的逻辑，开发者只需要做好数据相关的业务处理，数据和视图的自动更新是有框架来帮助实现的。从技术上说vue是一个构造函数，它的实例对象对应的都是页面中的一个视图部分（组件），这个组件是数据和UI的结合体，又数据来驱动视图的生命周期，可以这么说视图和vue组件实例是紧密绑定的，那么整个页面都是不同的Vue组件来组成的，其实对应背后的就是多个不同的vue实例对象，这么实例对象的整体组织方式是树结构，就是数据结构中的树。这一点和真是的dom结构组织形式是完全一致的。

 ```

1. Vue的既然是一个构造函数，页面本质上就是由多个vue的实例在进行管理的，那么页面的初始化过程？

```javascript
const app = new Vue({
	 el:'#app',
   data: {
     foo: 'bar'
	 }
})

# 初始化的代码很简单，就是一个普通的构造函数的实例化过程，具体在深入源码调用栈分析



```
















