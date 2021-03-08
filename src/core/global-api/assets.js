/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */

   // ASSET_TYPES     ['component','directive','filter']
   // 这里就是注册或者获取 三个全局方法 Vue.component, Vue.directive, Vue.filter
   
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        // 这里是获取
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }

        // 组件注册
        if (type === 'component' && isPlainObject(definition)) {
          //  this.options._base 指向的就是Vue本身,这里全局注册其实就是使用extend生成了一个子类
          // 并且将生成子类加入到自身的基础options中,所谓的全局其实就是自身内部的compontents
          /**
           *  {
           *    components:{
           *        KeepAlive,
           *        Transition,
           *        TransitionGroup
           *    },
           *    directives:{
           *        model,
           *        show,
           *    },
           *    filters:{}
           *  }
           */
          definition.name = definition.name || id
          definition = this.options._base.extend(definition) 
        }
        // 自定义指令
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        
        
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
