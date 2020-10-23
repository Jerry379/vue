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
src\platforms\web\entry-runtime-with-compiler.js

如果new Vue里既有template和render哪个会起作用：render优先级最高，`if (!options.render) {`这段代码可以说明