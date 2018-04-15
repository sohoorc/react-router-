### react-router源码学习(3) —— Route

　　在前两节，已经学习了`react-router4`中的最外层组件`Router`，并且了解了 `react-router`中的一个重要的库 `history`。这回，我们开始学习 `react-router` 中离视图最近的一个组件 —— `route`。 
　　我们阅读`route`组件的源码，可以发现它所接收的props要比`router`组件多很多。那么我们现在就来了解一下`route`组件中接收的主要设置有哪些。 

```
    // 设置当前路由的路径，非必填项。若为空，则代表该路由组件默认会渲染。
    path: PropTypes.string,
    // 是否精准匹配，当path === location.pathName才会渲染
    exact: PropTypes.bool,
    // path 的匹配是否包含末尾的 '/', 开启后 /path/ 和 /path 不匹配
    strict: PropTypes.bool,
    // path 的匹配是否区分大小写
    sensitive: PropTypes.bool,
    // 路由组件所接收的component，非必填。因为react-router提供了其他方式渲染组件，如render，children。
    // 大部分的时候，我们使用component的方法渲染组件，若三种渲染方式都为空，则不会渲染组件。
    component: PropTypes.func,
    render: PropTypes.func,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
``` 
现在我们了解了`route`组件所接收的配置属性的含义，再来看看`route`组件的一个核心功能。 
 
``` 
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

    // 接收pathname和各项设置，返回 match数据
    // 根据当前location.pathname是否与match.url相同 若相同则 则返计算的match 否则返回null
    return matchPath(pathname, { path, strict, exact, sensitive }, route.match);
  }
``` 
该函数用来验证当前打开页面的patchname是否能够与定义的path所匹配。若能够匹配，则返回match对象，否则则为空，这是决定组件是否渲的一个重要的函数。实现该核心功能的就是函数`matchPath`，让我们来看看它的源码。 
```
import pathToRegexp from "path-to-regexp";

const patternCache = {};
const cacheLimit = 10000;
let cacheCount = 0;

const compilePath = (pattern, options) => {
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
  const cache = patternCache[cacheKey] || (patternCache[cacheKey] = {});

  if (cache[pattern]) return cache[pattern];

  const keys = [];
  // 使用pathToRegexp来做路径匹配
  // 如下：
  // var re = pathToRegexp('/:foo/:bar')
  // keys = [{ name: 'foo', prefix: '/', ... }, { name: 'bar', prefix: '/', ... }]
  // re.exec('/test/route')
  //=> ['/test/route', 'test', 'route']
  
  const re = pathToRegexp(pattern, keys, options);
  const compiledPattern = { re, keys };

  if (cacheCount < cacheLimit) {
    cache[pattern] = compiledPattern;
    cacheCount++;
  }

  return compiledPattern;
};

/**
 * Public API for matching a URL pathname to a path pattern.
 */
const matchPath = (pathname, options = {}, parent) => {
  if (typeof options === "string") options = { path: options };

  const { path, exact = false, strict = false, sensitive = false } = options;

  if (path == null) return parent;

    
  const { re, keys } = compilePath(path, { end: exact, strict, sensitive });
  // 使用 pathToRegexp 来验证是否匹配 若匹配则返回一个数组 否则返回null
  const match = re.exec(pathname);
  // 若不匹配则返回null
  if (!match) return null;

  const [url, ...values] = match;
  // 是否严格匹配
  const isExact = pathname === url;
  if (exact && !isExact) return null;

  return {
    path, // the path pattern used to match
    url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
    isExact, // whether or not we matched exactly
    params: keys.reduce((memo, key, index) => {
      memo[key.name] = values[index];
      return memo;
    }, {})
  };
};

export default matchPath;
``` 

以上，就是`route`组件的核心功能。下面我们贴上它的完整代码（以忽略警告部分）: 
```
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

  componentWillReceiveProps(nextProps, nextContext) {
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
``` 

### 总结
　　`route`组件的所做的事情就是，根据props所传入的path和当前location.pathname来计算当前路由是否匹配。若成功匹配，则渲染组件，否则返回null。