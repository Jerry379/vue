/* @flow */

import { emptyNode } from 'core/vdom/patch'
import { resolveAsset, handleError } from 'core/util/index'
import { mergeVNodeHook } from 'core/vdom/helpers/index'

// 当虚拟DOM渲染更新的时候会触发的钩子函数
export default {
  create: updateDirectives,
  update: updateDirectives,
  destroy: function unbindDirectives (vnode: VNodeWithData) {
    updateDirectives(vnode, emptyNode)
  }
}

function updateDirectives (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (oldVnode.data.directives || vnode.data.directives) {//新旧VNode中只要有一方涉及到了指令，那就调用_update方法去处理指令逻辑
    _update(oldVnode, vnode)
  }
}

function _update (oldVnode, vnode) {
  const isCreate = oldVnode === emptyNode//判断旧节点是不是空节点，如果是的话说明是新创建的节点
  const isDestroy = vnode === emptyNode //判断新节点是不是空节点，如果是的话说明是要销毁
  const oldDirs = normalizeDirectives(oldVnode.data.directives, oldVnode.context) //旧的指令集合，即oldVnode中保存的指令
  const newDirs = normalizeDirectives(vnode.data.directives, vnode.context) //新的指令集合，即vnode中保存的指令

  const dirsWithInsert = [] //保存需要触发inserted指令钩子函数的指令列表
  const dirsWithPostpatch = [] //保存需要触发componentUpdated指令钩子函数的指令列表

  let key, oldDir, dir
  for (key in newDirs) {
    // 从oldDirs和newDirs取出当前循环到的指令分别保存在变量oldDir和dir中
    oldDir = oldDirs[key]
    dir = newDirs[key]
    if (!oldDir) {//判断当前循环到的指令名key在旧的指令列表oldDirs中是否存在，如果不存在，说明该指令是首次绑定到元素上的一个新指令
      // new directive, bind
      callHook(dir, 'bind', vnode, oldVnode)
      if (dir.def && dir.def.inserted) {
        // 如果该新指令在定义时设置了inserted钩子函数，那么将该指令添加到dirsWithInsert中，以保证执行完所有指令的bind钩子函数后再执行指令的inserted钩子函数
        dirsWithInsert.push(dir)
      }
    } else {
      // existing directive, update
      // 保存上一次的指令的value和arg属性
      dir.oldValue = oldDir.value
      dir.oldArg = oldDir.arg
      callHook(dir, 'update', vnode, oldVnode)
      if (dir.def && dir.def.componentUpdated) {
        // 如果该指令在定义时设置了componentUpdated钩子函数，那么将该指令添加到dirsWithPostpatch中
        // 以保证让指令所在的组件的VNode及其子VNode全部更新完后再执行指令的componentUpdated钩子函数
        dirsWithPostpatch.push(dir)
      }
    }
  }
  // 执行每一个指令的钩子函数
  if (dirsWithInsert.length) {
    const callInsert = () => {
      for (let i = 0; i < dirsWithInsert.length; i++) {
        callHook(dirsWithInsert[i], 'inserted', vnode, oldVnode)
      }
    }
    if (isCreate) {
      /**
       * 当一个新创建的元素被插入到父节点中时虚拟DOM渲染更新的insert钩子函数和指令的inserted钩子函数都要被触发。
       * 既然如此，那就可以把这两个钩子函数通过调用mergeVNodeHook方法进行合并，
       * 然后统一在虚拟DOM渲染更新的insert钩子函数中触发，
       * 这样就保证了元素确实被插入到父节点中才执行的指令的inserted钩子函数
       */
      mergeVNodeHook(vnode, 'insert', callInsert)
    } else {
      callInsert()
    }
  }
  // 
  if (dirsWithPostpatch.length) {
    mergeVNodeHook(vnode, 'postpatch', () => {
      for (let i = 0; i < dirsWithPostpatch.length; i++) {
        callHook(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode)
      }
    })
  }

  if (!isCreate) {
    for (key in oldDirs) {
      if (!newDirs[key]) {
        // 旧的里有该指令，新的没有，说明被废弃
        // no longer present, unbind
        callHook(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy)
      }
    }
  }
}

const emptyModifiers = Object.create(null)

function normalizeDirectives (
  dirs: ?Array<VNodeDirective>,
  vm: Component
): { [key: string]: VNodeDirective } {
  const res = Object.create(null)
  if (!dirs) {
    // $flow-disable-line
    return res
  }
  let i, dir
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i]
    if (!dir.modifiers) {
      // $flow-disable-line
      dir.modifiers = emptyModifiers
    }
    res[getRawDirName(dir)] = dir
    dir.def = resolveAsset(vm.$options, 'directives', dir.name, true)
  }
  // $flow-disable-line
  return res
}

function getRawDirName (dir: VNodeDirective): string {
  return dir.rawName || `${dir.name}.${Object.keys(dir.modifiers || {}).join('.')}`
}

function callHook (dir, hook, vnode, oldVnode, isDestroy) {
  const fn = dir.def && dir.def[hook]
  if (fn) {
    try {
      fn(vnode.elm, dir, vnode, oldVnode, isDestroy)
    } catch (e) {
      handleError(e, vnode.context, `directive ${dir.name} ${hook} hook`)
    }
  }
}
