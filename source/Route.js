import warning from "warning";
import invariant from "invariant";
import React from "react";
import PropTypes from "prop-types";
import matchPath from "./matchPath";

const isEmptyChildren = children => React.Children.count(children) === 0;

/**
 * The public API for matching a single path and rendering.
 */
class Route extends React.Component {
  static propTypes = {
    computedMatch: PropTypes.object, // private, from <Switch>
    // 设置当前路由的路径，非必填项。若为空，则代表该路由组件默认会渲染。
    path: PropTypes.string,
    // 是否精准匹配，当path === location.pathName才会渲染
    exact: PropTypes.bool,
    // path 的匹配是否包含末尾的 '/', 开启后 /path/ 和 /path 不匹配
    strict: PropTypes.bool,
    // path 的匹配是否区分大小写
    sensitive: PropTypes.bool,
    // 路由组件所接收的component，非必填。因为react-router提供了其他方式渲染组件，如render，children。
    // 大部分的时候，我们使用component的方法渲染组件
    component: PropTypes.func,
    render: PropTypes.func,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    location: PropTypes.object
  };

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired,
      route: PropTypes.object.isRequired,
      staticContext: PropTypes.object
    })
  };

  static childContextTypes = {
    router: PropTypes.object.isRequired
  };

  // 定义react context中的属性
  getChildContext() {
    return {
      router: {
        ...this.context.router,
        route: {
          location: this.props.location || this.context.router.route.location,
          match: this.state.match
        }
      }
    };
  }

  state = {
    match: this.computeMatch(this.props, this.context.router)
    
  };

  // 计算match
  computeMatch(
    { computedMatch, location, path, strict, exact, sensitive },
    router
  ) {
    if (computedMatch) return computedMatch; // <Switch> already computed the match for us

    invariant(
      router,
      "You should not use <Route> or withRouter() outside a <Router>"
    );

    const { route } = router;
    const pathname = (location || route.location).pathname;

    // 接收pathname和各项设置，返回 match数据 根据当前location.pathname是否与match.url相同 若相同则 则返计算的match 否则返回null
    return matchPath(pathname, { path, strict, exact, sensitive }, route.match);
  }

  componentWillMount() {
    warning(
      !(this.props.component && this.props.render),
      "You should not use <Route component> and <Route render> in the same route; <Route render> will be ignored"
    );

    warning(
      !(
        this.props.component &&
        this.props.children &&
        !isEmptyChildren(this.props.children)
      ),
      "You should not use <Route component> and <Route children> in the same route; <Route children> will be ignored"
    );

    warning(
      !(
        this.props.render &&
        this.props.children &&
        !isEmptyChildren(this.props.children)
      ),
      "You should not use <Route render> and <Route children> in the same route; <Route children> will be ignored"
    );
  }

  componentWillReceiveProps(nextProps, nextContext) {
    warning(
      !(nextProps.location && !this.props.location),
      '<Route> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!nextProps.location && this.props.location),
      '<Route> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );

    // 更新state中的match
    this.setState({
      match: this.computeMatch(nextProps, nextContext.router)
    });
  }

  render() {
    const { match } = this.state;
    const { children, component, render } = this.props;
    const { history, route, staticContext } = this.context.router;
    const location = this.props.location || route.location;
    const props = { match, location, history, staticContext };

    // 使用component的方式渲染组件
    if (component) return match ? React.createElement(component, props) : null;

    // 使用render的方式渲染组件
    if (render) return match ? render(props) : null;

    // 使用children的方式渲染组件
    if (typeof children === "function") return children(props);
    if (children && !isEmptyChildren(children))
      return React.Children.only(children);

    return null;
  }
}

export default Route;
