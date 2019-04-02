import {getRequest} from './api'
import {Message} from 'element-ui'

export const isNotNullORBlank = (...args)=> {
  for (var i = 0; i < args.length; i++) {
    var argument = args[i];
    if (argument == null || argument == '' || argument == undefined) {
      Message.warning({message: '数据不能为空!'})
      return false;
    }
  }
  return true;
}
export const initMenu = (router, store)=> {
    // 在初始化菜单中，首先判断store中的数据是否存在，如果存在，
    // 说明这次跳转是正常的跳转，而不是用户按F5或者直接在地址栏输入
    // 某个地址进入的，不需要再次进行加载菜单。否则就去加载菜单。拿到菜单之后，首先通过formatRoutes方法
    //将服务器返回的json转为router需要的格式，这里主要是转component，因为服务端返回的component是一个
    // 字符串，而router中需要的却是一个组件，因此我们在formatRoutes方法中动态的加载需要的组件即可。数据
    // 格式准备成功之后，一方面将数据存到store中，另一方面利用路由中的addRoutes方法将之动态添加到路由中。
  if (store.state.routes.length > 0) {
    return;
  }
  getRequest("/config/sysmenu").then(resp=> {
    if (resp && resp.status == 200) {
      var fmtRoutes = formatRoutes(resp.data);

      // 拿到菜单之后，首先通过formatRoutes方法将服务器返回的json转为router需要的格式，
      // 这里主要是转component，因为服务端返回的component是一个字符串，而router中需要的却是一个组件，
      // 因此我们在formatRoutes方法中动态的加载需要的组件即可。数据格式准备成功之后，一方面将数据存到store中，另一方面利用路由中的addRoutes方法将之动态添加到路由中
      router.addRoutes(fmtRoutes);
      store.commit('initMenu', fmtRoutes);
      store.dispatch('connect');
    }
  })
}
export const formatRoutes = (routes)=> {
// 根据后台传过来的用户角色数据，来获得当前要动态加载的路由，组装成一个数组，存到store中
  let fmRoutes = [];
  routes.forEach(router=> {
    let {
      path,
      component,
      name,
      meta,
      iconCls,
      children
    } = router;
    if (children && children instanceof Array) {
      children = formatRoutes(children);
    }
    let fmRouter = {
      path: path,
      component(resolve){
          // 路由懒加载
        //   　　vue这种单页面应用，如果没有应用懒加载，运用webpack打包后的文件将会异常的大，
        // 造成进入首页时，需要加载的内容过多，时间过长，会出啊先长时间的白屏，即使做了loading也是
        // 不利于用户体验，而运用懒加载则可以将页面进行划分，需要的时候加载页面，可以有效的分担首页所承担的加载压力，减少首页加载用时。
        // 简单的说就是：进入首页不用一次加载过多资源造成用时过长！
        if (component.startsWith("Home")) {
          require(['../components/' + component + '.vue'], resolve)
        } else if (component.startsWith("Emp")) {
          require(['../components/emp/' + component + '.vue'], resolve)
        } else if (component.startsWith("Per")) {
          require(['../components/personnel/' + component + '.vue'], resolve)
        } else if (component.startsWith("Sal")) {
          require(['../components/salary/' + component + '.vue'], resolve)
        } else if (component.startsWith("Sta")) {
          require(['../components/statistics/' + component + '.vue'], resolve)
        } else if (component.startsWith("Sys")) {
          require(['../components/system/' + component + '.vue'], resolve)
        }
      },
      name: name,
      iconCls: iconCls,
      meta: meta,
      children: children
    };
    fmRoutes.push(fmRouter);
  })
  return fmRoutes;
}
