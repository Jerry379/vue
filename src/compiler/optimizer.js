/* @flow */

import { makeMap, isBuiltInTag, cached, no } from 'shared/util'

let isStaticKey
let isPlatformReservedTag

const genStaticKeysCached = cached(genStaticKeys)

/**
 * Goal of the optimizer: walk the generated template AST tree
 * and detect sub-trees that are purely static, i.e. parts of
 * the DOM that never needs to change.
 *
 * Once we detect these sub-trees, we can:
 *
 * 1. Hoist them into constants, so that we no longer need to
 *    create fresh nodes for them on each re-render;
 * 2. Completely skip them in the patching process.
 * 优化器的目标：遍历生成的模板AST树并检测纯静态的子树，即DOM中不需要更改的部分。
 * 一旦我们检测到这些子树，我们就可以：
 * 1 将它们提升为常量，这样我们就不再需要在每次重新渲染时为它们创建新的节点；
 * 2 在修补过程中完全跳过它们。
 * 优化阶段,为了提高虚拟DOM中patch过程的性能
 */
export function optimize (root: ?ASTElement, options: CompilerOptions) {
  if (!root) return
  isStaticKey = genStaticKeysCached(options.staticKeys || '')
  isPlatformReservedTag = options.isReservedTag || no
  // first pass: mark all non-static nodes.
  // 标记静态节点
  markStatic(root)
  // second pass: mark static roots.
  // 标记静态根节点
  markStaticRoots(root, false)
}

function genStaticKeys (keys: string): Function {
  return makeMap(
    'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
    (keys ? ',' + keys : '')
  )
}

function markStatic (node: ASTNode) {
  node.static = isStatic(node) //调用isStatic函数标记节点是否为静态节点
  if (node.type === 1) {
    // do not make component slot content static. this avoids
    // 不要将组件插槽的内容设为静态。这样可以避免
    // 1. components not able to mutate slot nodes
    // 1. 组件无法更改插槽节点
    // 2. static slot content fails for hot-reloading
    // 2. 静态广告位内容无法热加载
    if (
      !isPlatformReservedTag(node.tag) &&
      node.tag !== 'slot' &&
      node.attrsMap['inline-template'] == null
    ) {
      return
    }
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i]
      markStatic(child)//如果该节点是元素节点，那么还要继续去递归判断它的子节点
      if (!child.static) {//如果当前节点的子节点有一个不是静态节点，那就把当前节点也标记为非静态节点
        node.static = false
      }
    }
    // 如果当前节点的子节点中有标签带有v-if、v-else-if、v-else等指令时，这些子节点在每次渲染时都只渲染一个，
    // 所以其余没有被渲染的肯定不在node.children中，而是存在于node.ifConditions，所以我们还要把node.ifConditions循环一遍
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        const block = node.ifConditions[i].block
        markStatic(block)
        if (!block.static) {
          node.static = false
        }
      }
    }
  }
}

function markStaticRoots (node: ASTNode, isInFor: boolean) {
  if (node.type === 1) {
    if (node.static || node.once) { //对于已经是 static 的节点或者是 v-once 指令的节点，node.staticInFor = isInFor
      node.staticInFor = isInFor
    }
    // For a node to qualify as a static root, it should have children that
    // are not just static text. Otherwise the cost of hoisting out will
    // outweigh the benefits and it's better off to just always render it fresh.
    // 为了使节点有资格作为静态根节点，它应具有不只是静态文本的子节点。 否则，优化的成本将超过收益，最好始终将其更新。
    /**
     * 一个节点要想成为静态根节点，它必须满足以下要求：
     * 节点本身必须是静态节点；
     * 必须拥有子节点 children；
     * 子节点不能只是只有一个文本节点；
     */
    if (node.static && node.children.length && !(
      node.children.length === 1 &&
      node.children[0].type === 3
    )) {
      node.staticRoot = true
      return
    } else {
      node.staticRoot = false
    }
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for)
      }
    }
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        markStaticRoots(node.ifConditions[i].block, isInFor)
      }
    }
  }
}

/**
 * 如果节点使用了v-pre指令，那就断定它是静态节点；
 * 如果节点没有使用v-pre指令，那它要成为静态节点必须满足：
 * 不能使用动态绑定语法，即标签上不能有v-、@、:开头的属性；
 * 不能使用v-if、v-else、v-for指令；
 * 不能是内置组件，即标签名不能是slot和component；
 * 标签名必须是平台保留标签，即不能是组件；
 * 当前节点的父节点不能是带有 v-for 的 template 标签；
 * 节点的所有属性的 key 都必须是静态节点才有的 key，注：静态节点的key是有限的，它只能是type,tag,attrsList,attrsMap,plain,parent,children,attrs之一；
 */
function isStatic (node: ASTNode): boolean {
  if (node.type === 2) { // expression // 包含变量的动态文本节点
    return false
  }
  if (node.type === 3) { // text // 不包含变量的纯文本节点
    return true
  }
  return !!(node.pre || (//元素节点
    !node.hasBindings && // no dynamic bindings 没有动态绑定
    !node.if && !node.for && // not v-if or v-for or v-else
    !isBuiltInTag(node.tag) && // not a built-in
    isPlatformReservedTag(node.tag) && // not a component 不是组件
    !isDirectChildOfTemplateFor(node) &&
    Object.keys(node).every(isStaticKey)
  ))
}

function isDirectChildOfTemplateFor (node: ASTElement): boolean {
  while (node.parent) {
    node = node.parent
    if (node.tag !== 'template') {
      return false
    }
    if (node.for) {
      return true
    }
  }
  return false
}
