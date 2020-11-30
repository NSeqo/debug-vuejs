/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving(value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
// Observer
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor(value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this) // object.defineProperty 添加对象的属性
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk(obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray(items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment(target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment(target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 * 对象类型的数据value，实例化一个observe对象，将其挂到value的__ob__属性上
 */
export function observe(value: any, asRootData: ?boolean): Observer | void {

  // 只对 对象类型，排除vnode
  if (!isObject(value) || value instanceof VNode) {
    return
  }

  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    // 当前对象上已经有__ob__属性，并且属性值为Observer的实例对象
    ob = value.__ob__

  } else if (
    // shouldObserve 全局变量，控制开关
    // shouldObserve 开关控制， Object.isExtensible 判断对象是否可以扩展，
    // _isVue 表明该对象是vue或者子类的实例对象
    shouldObserve && !isServerRendering() && (Array.isArray(value) || isPlainObject(value)) && Object.isExtensible(value) && !value._isVue
  ) {
    // value 类型是一个对象
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    // asRootData 指的是否是组件的data选项的根对象，不是嵌套的对象
    // console.log('asRootData', asRootData, ob);
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
// defineReactive
export function defineReactive(
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  // 这里初始化了一个dep实例对象，对应就是一个对象的key都又一个dep实例对象，这个变量是必包
  // 因为这个变量在get, set函数中被调用了，set,get是对外暴露的函数，这两个函数在执行的时候就会访问到
  // dep变量，那么dep变量就不能被垃圾回收
  const dep = new Dep()

  // 获取属性的描述符对象，包括属性 configurable, enumerable, get, set, writable, value
  // configurable 为true时，表示该属性可以修改，删除
  // set, get分别为函数，不设置时默认为undefined
  const property = Object.getOwnPropertyDescriptor(obj, key)

  if (property && property.configurable === false) {
    // 该属性不可以修改，删除
    return
  }

  // cater for pre-defined getter/setters
  // 这种情况是自定义的 set / get 的的情况
  const getter = property && property.get
  const setter = property && property.set

  // 传参数就2个的情况下，obj,key
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key] 
  }

  // 这里执行了观察， 这里是递归操作了，如果val是对象类型，遍历属性调用 defineReactive
  // observe 返回值是 new Observer() 的实例对象 return new Observer()
  let childOb = !shallow && observe(val)

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      const value = getter ? getter.call(obj) : val
      // Dep.target 是一个全局的变量, 是一个watcher实例对象，对应一个组件
      if (Dep.target) {
        // Dep.target.addDep(this)，这里就是收集依赖了，就是把当前这个dep加入到当前激活的watcher中
        // watcher是在组件挂载的时候实例化的，这里同时也是把watcher添加到了dep的subs数组中，watcher是订阅者
        // 这就建立的消息广播和订阅者的关系
        dep.depend() 

        if (childOb) {
          childOb.dep.depend() // 如果是有嵌套对象的情况下，将其childOb(Observer的实例对象)的dep也添加到watcher中
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter(newVal) {
      // debugger
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      // NaN !== NaN
      if (newVal === value || (newVal !== newVal && value !== value)) {
        // 值没有发生改变
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }

      // #7981: for accessor properties without setter
      if (getter && !setter) return

      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 对新的值，重新进行observe,如果是对象类型，还要进行递归调用defineReactive
      childOb = !shallow && observe(newVal) // 重新observe
      // 值发生了改变，通知订阅者，订阅者是watcher实例对象
      dep.notify()
    }

  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set(target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del(target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray(value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
