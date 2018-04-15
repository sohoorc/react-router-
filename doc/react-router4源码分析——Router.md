### react-router源码分析(2)—— Router

　　通过对`BrowserRouter`、`MemoryRouter`、`HashRouter`源码的学习，我们知道了这三个组件都是对`Router`组件的封装，实际上就是通过对`Router`传入不同种类的createHistory()的值，来实现不同种类的`Router`。我们在了解到Router在react-router中属于基石般的存在后，我们来详细的学习一下它的源码。  
　　让我们来回忆一下Router组件的用法，它接收两个参数，history和children。history在上节中我们已经提到过，在此就不再做陈述。我们知道，`Router`组件在使用时，子组件只能包含一个dom节点。所以，我们猜测`Router`组件内的render函数内是这样的：  
```
static propTypes = {
    // router组件所包含的内容
    children: PropTypes.node
  };

render() {
    const { children } = this.props;
    // 渲染children children是唯一的
    return children ? React.Children.only(children) : null;
  }
```  
而`Router`组件还接收一个props，它就是history，那么代码就应该是这样的：  
```
static propTypes = {
    // 通过history所创建的history对象
    history: PropTypes.object.isRequired,
    // router组件所包含的内容
    children: PropTypes.node
  };

render() {
    const { children } = this.props;
    // 渲染children children是唯一的
    return children ? React.Children.only(children) : null;
  }
```  
　　可是history传入`Router`组件中有什么用呢？这里我们细想一下，我们平时在react项目中。在通过Route所渲染的页面中打印props，都可以看到history、location及match对象。所以在这里我们可以猜到，history应该被当作全局上下文传入了组件中。  
它在`Router`组件中是这样实现的：  
```
  // 接收父组件所传递的context
  static contextTypes = {
    router: PropTypes.object
  };

  // 定义子组件所接收的context类型
  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  // 定义子组件所接收的context包含的属性
  getChildContext() {
    return {
      router: {
        // 全局上下文中的router对象
        ...this.context.router,
        // history对象 将history对象定义在全局上下文中
        // 方便子组件调用创建history后所提供的方法，以及location
        history: this.props.history,
        route: {
          // history中的location对象
          location: this.props.history.location,
          // 全局上下文中的match对象
          match: this.state.match
        }
      }
    };
  }

  state = {
    match: this.computeMatch(this.props.history.location.pathname)
  };

  // 返回当前匹配的match
  computeMatch(pathname) {
    return {
      path: "/",
      url: "/",
      params: {},
      isExact: pathname === "/"
    };
  }
```  
　　当我们了解history库后，我们知道。创建的history对象提供一个监听者方法listen，用于监听location的变化。在react-router组件的上下文中，同样维护着location。所以，需要在`Router`中定义一个listen方法，来维护上下文中的location。  
```
 componentWillMount() {
    const { children, history } = this.props;
    // 调用history的监听器方法，监听pathname的变化，若发生变化则更新到state中
    // 同时由于全局上下文中的match指向this.state.match，所以当前更新也会影响到全局上下文中的match
    this.unlisten = history.listen(() => {
      this.setState({
        match: this.computeMatch(history.location.pathname)
      });
    });
  }

  componentWillUnmount() {
    // 当组件将要卸载时，停止监听
    this.unlisten();
  }

```  
这样，我们就完整的理解了一次`Router`组件的实现方式，它的完整代码看起来是这样子的：  

```
import warning from "warning";
import invariant from "invariant";
import React from "react";
import PropTypes from "prop-types";

class Router extends React.Component {
  static propTypes = {
    // 通过history所创建的history对象
    history: PropTypes.object.isRequired,
    // router组件所包含的内容
    children: PropTypes.node
  };

  // 接收父组件所传递的context
  static contextTypes = {
    router: PropTypes.object
  };

  // 定义子组件所接收的context类型
  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  // 定义子组件所接收的context包含的属性
  getChildContext() {
    return {
      router: {
        // 全局上下文中的router对象
        ...this.context.router,
        // history对象 将history对象定义在全局上下文中，方便子组件调用创建history后所提供的方法，以及location
        history: this.props.history,
        route: {
          // history中的location对象
          location: this.props.history.location,
          // 全局上下文中的match对象
          match: this.state.match
        }
      }
    };
  }

  state = {
    match: this.computeMatch(this.props.history.location.pathname)
  };

  // 返回当前匹配的match
  computeMatch(pathname) {
    return {
      path: "/",
      url: "/",
      params: {},
      isExact: pathname === "/"
    };
  }

  componentWillMount() {
    const { children, history } = this.props;

    invariant(
      children == null || React.Children.count(children) === 1,
      "A <Router> may have only one child element"
    );

    // 调用history的监听器方法，监听pathname的变化，若发生变化则更新到state中
    // 同时由于全局上下文中的match指向this.state.match，所以当前更新也会影响到全局上下文中的match
    this.unlisten = history.listen(() => {
      this.setState({
        match: this.computeMatch(history.location.pathname)
      });
    });
  }

  componentWillReceiveProps(nextProps) {
    warning(
      this.props.history === nextProps.history,
      "You cannot change <Router history>"
    );
  }

  componentWillUnmount() {
    // 当组件将要卸载时，停止监听
    this.unlisten();
  }

  render() {
    const { children } = this.props;
    // 渲染children children是唯一的
    return children ? React.Children.only(children) : null;
  }
}

export default Router;

```  
### 总结  
　　`Router`组件的作用就是，接收history对象，来维护全局上下文。并监听location的变化，当location存在变化时，更新到全局上下文中。