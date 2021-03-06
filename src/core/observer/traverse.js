/* @flow */

import { _Set as Set, isObject } from '../util/index'
import type { SimpleSet } from '../util/index'
import VNode from '../vdom/vnode'

const seenObjects = new Set()

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 * 递归遍历对象以调用所有转换的getter，这样对象中的每个嵌套属性都作为“深层”依赖项收集。
 */
export function traverse (val: any) {
  _traverse(val, seenObjects)
  seenObjects.clear()
}

/**
 * Object.isFrozen判断一个对象是否被冻结
 */
function _traverse (val: any, seen: SimpleSet) {
  let i, keys
  const isA = Array.isArray(val)
  if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {//val非数组、非对象、被冻结、是VNode
    return
  }
  if (val.__ob__) {
    const depId = val.__ob__.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }
  if (isA) {//是数组
    i = val.length
    while (i--) _traverse(val[i], seen)//递归
  } else {
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)//递归
  }
}
