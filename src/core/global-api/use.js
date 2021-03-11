/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = [])) //用来存储已安装过的插件
    if (installedPlugins.indexOf(plugin) > -1) {//防止重复安装
      return this
    }

    // additional parameters
    const args = toArray(arguments, 1)
    args.unshift(this)
    if (typeof plugin.install === 'function') {//如果插件提供install方法，则调用install进行安装
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {//如果提供的插件是一个函数，就把这个函数作为install进行安装
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)//缓存，防止重复安装
    return this
  }
}
