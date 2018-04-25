
### react-router源码学习(1)—— BrowserRouter及history简介

　　使用react也有很长一段时间了，但一直停留在 “仅仅会使用” 阶段,没有更深入的了解底层实现的原理。趁着这几天有点空闲时间，打算深入了解react技术栈，从react-router开始，记录一系列react技术栈源码分析学习笔记。若有错误，希望能够不灵赐教。在此感谢！  
　　众所周知，react-router是一个基于react的强大路由库，如今已经更新到react-router v4。在升级到4.X版本后，不同于之前版本的是，提出了just component的概念。每一个路由，同时也是一个组件，不再像之前版本那样路由和组件分开。在这里我们就不再说明如何使用该库，直接开始分析源码。  
我们先从大家常用的 `BrowserRouter`(`BrowserRouter from react-router-dom`)开始：
```
import warning from "warning";
import React from "react";
import PropTypes from "prop-types";
import { createBrowserHistory as createHistory } from "history";
import Router from "./Router";

/**
 * The public API for a <Router> that uses HTML5 history.
 */
class BrowserRouter extends React.Component {
  static propTypes = {
    basename: PropTypes.string,
    forceRefresh: PropTypes.bool,
    getUserConfirmation: PropTypes.func,
    keyLength: PropTypes.number,
    children: PropTypes.node
  };

  // 创建history
  history = createHistory(this.props);

  componentWillMount() {
    warning(
      !this.props.history,
      "<BrowserRouter> ignores the history prop. To use a custom history, " +
        "use `import { Router }` instead of `import { BrowserRouter as Router }`."
    );
  }

  render() {
    return <Router history={this.history} children={this.props.children} />;
  }
}

export default BrowserRouter;

```
　　从源码中我们可以看到，react-router中引用了histroy这个库。这个库到底是干什么的呢？让我们看看他所提供的API。  

| API | Histroy | Router | 
| - | :-: | -: | 
| createBrowserHistory | HTML5 history| BrowserRouter | 
| createHashHistory | Hash history | HashRouter | 
| createMemoryHistory| Memory history | MemoryRouter |

当我们使用其中一个create方法创建了一个history对象之后，我们打印它的内容：  
![](http://omla32aer.bkt.clouddn.com/browerHistory.png)

可以看到，它所提供了一系列管理location的方法。我们通过history对象提供的方法，即可做到控制页面的跳转、回退、重定向等操作。  
　　`BrowserRouter`这个组件，其实就是使用了`history`中的`createBrowserHistory`方法来创建histroy对象。该histroy对象，就是我们平时在路由组件中所看到的`this.props.history`，我们通过控制台打印出来便可一目了然。  
打印`this.props.history`：  
![](http://omla32aer.bkt.clouddn.com/props.png)

打印`createBrowserHistory`：  
![](http://omla32aer.bkt.clouddn.com/browerHistory.png)

　　在`BrowserRouter` 的reander方法中，我们可以看到，实际上该组将就是将Router组件进行了封装，并将`createBrowserHistory`方法创建的history对象通过props的形式传给Router组件。
```
render() {
    return <Router history={this.history} children={this.props.children} />;
  }
```  
　　在实际项目中，我们也可以不使用react-router-dom为我们封装好的组件，使用自己的方式去实现`BrowserRouter`。


