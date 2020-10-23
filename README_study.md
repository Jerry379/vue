### 如何调试源码
- `npm i -g rollup`
- `package.json`的`dev`脚本中添加`sourcemap`,`"rollup -w -c scripts/config.js --sourcemap --environment TARGET:web-full-dev"`
- 运行`npm run dev`
- 在`examples\commits\index.html`中引入`<script src="../../dist/vue.js"></script>`

### 了解目录
```
dist 发布目录
examples范例，里面有测试代码
packages核心代码之外的独立库
scripts 构建脚本
src 源码
types ts类型声明
flow 针对flow的类型声明
```

### src目录说明
```
compiler编译器相关
core 核心代码
    components 通用组件如keep-alive
    global-api 全局api
    instance 构造函数等
    observer 响应式相关
    vdom 虚拟dom相关
```

### 属于解释
- runtime:仅包含运行时，不包含编译器，不能使用template
- common: cjs规范打包的,用于webpack1
- esm: ES模块，用于webpack2及以上
- umd: universal module definition,兼容cjs和amd,一般用于浏览器


### 源码
#### 1.找到Vue的构造函数
##### src\platforms\web\entry-runtime-with-compiler.js
- 入口文件，覆盖$mount,执行模板解析和编译工作
- 如果new Vue里既有template和render哪个会起作用：render优先级最高，`if (!options.render) {`这段代码可以说明

##### src\platforms\web\runtime\index.js
- 主要来定义$mount方法

##### src\core\index.js
- 定义全局API

##### src\core\instance\index.js
- Vue的构造函数


##### src\core\instance\init.js
- 初始化方法_init定义的地方
关键代码
```
vm._self = vm
initLifecycle(vm) // 初始化生命周期，设置$parent,$root,$children,$refs
initEvents(vm) // 对父组件传入的事件和回调添加监听
initRender(vm) // 声明了插槽相关的$slots、$scopedSlots，定义了$createElement方法
callHook(vm, 'beforeCreate') // 调用beforeCreate钩子
initInjections(vm) // resolve injections before data/props 注入数据
initState(vm) // 重要：数据初始化，响应式
initProvide(vm) // resolve provide after data/props 提供数据
callHook(vm, 'created') // 
```
- 为什么先注入（initInjections）再提供（initProvide）？来自祖辈的参数要挂载到当前的组件实例上，将来要和当前组件的属性，data等判重，所以initInjections要放在initState上面；父级注入的东西可能会提供给子级，所以要先注入后提供
##### src\core\instance\lifecycle.js
- initLifecycle方法，生命$parent,$root,$children,$refs
- 组件创建的顺序是自上而下的，先创建parent在创建children
- 组件挂载的顺序是自下而上的。

##### src\core\instance\events.js
- initEvents方法，处理父组件传入的事件和回调
- 组件上写的@click等事件监听是挂载在组件上的，而不是父组件上的


初始化过程
new Vue() => this.init(options) => $mount => mountComponent() => _render() => _update()
调用init      初始化各种属性  调用mountComponent 声明updateComponent 创建Watcher _render获取虚拟dom _upate()把虚拟dom转为真实dom



#### 数据响应式
src\core\instance\state.js
initData，获取data,设置代理，启动响应式