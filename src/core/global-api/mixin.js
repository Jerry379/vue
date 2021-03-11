/* @flow */

import { mergeOptions } from '../util/index'
// 该API就是通过修改Vue.options属性进而影响之后的所有Vue实例
export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
