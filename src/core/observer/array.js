/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

// 以下的这几个方法调用时，才会触发组件更新渲染，
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args)

    // 获取当前数组的observer对象
    const ob = this.__ob__
    
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 数组元素有插入操作，重新进行observe,执行响应式操作
    if (inserted) ob.observeArray(inserted)
    // notify change
    ob.dep.notify()
    
    return result
  })
})


// console.log('arrayMethods', arrayMethods); //sy-log