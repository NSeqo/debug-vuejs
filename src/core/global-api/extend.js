/* @flow */

/*

   基本上就是处理 extend的，Vue的继承方法，扩展子类
   涉及到的就是原型链的继承方式来实现子类的扩展，这种方式是js中的语言特性，

   这里继承使用的就是 基于原型链的集成

 */


import { ASSET_TYPES } from 'shared/constants'
import { defineComputed, proxy } from '../instance/state'
import { extend, mergeOptions, validateComponentName } from '../util/index'

export function initExtend (Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   */
  Vue.extend = function (extendOptions: Object): Function {
    extendOptions = extendOptions || {}

    const Super = this
    const SuperId = Super.cid // 每个类都有cid标识唯一性

    //基于某个extendOptions对象创建的子类都缓存在 它的_Ctor这个内部属性中
    //这里就是所基于同一个父类以及同一个extendOptions对象创建的子类应该是要缓存下来的，而且是相同的子类，因为是直接返回上次已经创建的。
    //这里就是所 Vue.extend(options)这个方法参数不变同时多次调用时，保证返回的子类是同一个，函数的纯洁性。
    //因为 参数，返回值都是对象类型数据，这样的缓存处理就解决了多次方法调用的问题
    // vue中的封装思想，多利用函数的缓存机制，尤其是开销较大的操作，以后封装函数的时候也要多注意这一点。

    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {}) // 这里注意运算符的优先级，逻辑与或非是高于赋值运算符的
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }


    // 获取参数中的 name
    const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name)
    }

    // 子类
    const Sub = function VueComponent (options) {
      this._init(options)
    }

    // 原型对象的替换赋值
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub

    Sub.cid = cid++ // 记cid

    // 子类的静态属性options
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )

    Sub['super'] = Super

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.

    if (Sub.options.props) {
      initProps(Sub)
    }
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // allow further extension/mixin/plugin usage
    // 子类依然保留进一步进行生成子类的方法
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    // 自调用是查找自己的name值，这里是通过components,可见组件的注册其实就是传建了个一个子类啊
    if (name) {
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.

    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // cache constructor 缓存子类
    cachedCtors[SuperId] = Sub
    return Sub
  }
}

function initProps (Comp) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key) // 所有对props中的数据的访问都去找_props属性取
  }
}

function initComputed (Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
