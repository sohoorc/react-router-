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

  // 计算match
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
