### 目录结构
```
├─dist                   # 项目构建后的文件
├─scripts                # 与项目构建相关的脚本和配置文件
├─flow                   # flow的类型声明文件
├─src                    # 项目源代码
│    ├─complier          # 与模板编译相关的代码，包括把模板解析成ast语法树，语法树优化，生成代码等功能
│    ├─core              # 通用的、与运行平台无关的运行时代码，核心代码，包括内置组件、全局 API 封装，Vue 实例化、观察者、虚拟 DOM、工具函数等等
│    │  ├─observe        # 实现变化侦测的代码
│    │  ├─vdom           # 实现virtual dom的代码
│    │  ├─instance       # Vue.js实例的构造函数和原型方法
│    │  ├─global-api     # 全局api的代码
│    │  └─components     # 内置组件的代码
│    ├─server            # 与服务端渲染相关的代码
│    ├─platforms         # 特定运行平台的代码，如weex
│    ├─sfc               # 单文件组件的解析代码，把 .vue 文件内容解析成一个 JavaScript 的对象
│    └─shared            # 项目公用的工具代码，工具方法都是会被浏览器端的 Vue.js 和服务端的 Vue.js 所共享的
└─test                   # 项目测试代码
```

### 判断是否是数组的方式？优缺点？