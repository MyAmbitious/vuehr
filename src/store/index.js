import Vue from 'vue'
import Vuex from 'vuex'
import '../lib/sockjs'
import '../lib/stomp'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: {
      name: window.localStorage.getItem('user' || '[]') == null ? '未登录' : JSON.parse(window.localStorage.getItem('user' || '[]')).name,
      userface: window.localStorage.getItem('user' || '[]') == null ? '' : JSON.parse(window.localStorage.getItem('user' || '[]')).userface,
      username: window.localStorage.getItem('user' || '[]') == null ? '' : JSON.parse(window.localStorage.getItem('user' || '[]')).username,
      roles: window.localStorage.getItem('user' || '[]') == null ? '' : JSON.parse(window.localStorage.getItem('user' || '[]')).roles
    },
    routes: [],
    msgList: [],
    isDotMap: new Map(),
    currentFriend: {},
    stomp: null,
    nfDot: false
  },
  mutations: {
    initMenu(state, menus){
        // 将当前用户的路由信息存到Store中
      state.routes = menus;
    },
    login(state, user){
         // 为了减少麻烦，用户登录成功后的数据将被保存在localStorage中（防止用户按F5刷新之后数据丢失），
            // 以字符串的形式存入，取的时候再转为json。当用户注销登陆时，将localStorage中的数据清除
    //   state.user = user;
      window.localStorage.setItem('user', JSON.stringify(user));
    },
    logout(state){
      window.localStorage.removeItem('user');
      state.routes = [];
    },
    toggleNFDot(state, newValue){
      state.nfDot = newValue;
    },
    updateMsgList(state, newMsgList){
      state.msgList = newMsgList;
    },
    updateCurrentFriend(state, newFriend){
      state.currentFriend = newFriend;
    },
    addValue2DotMap(state, key){
      state.isDotMap.set(key, "您有未读消息")
    },
    removeValueDotMap(state, key){
      state.isDotMap.delete(key);
    }
  },
  actions: {
    connect(context){
      context.state.stomp = Stomp.over(new SockJS("/ws/endpointChat"));
      context.state.stomp.connect({}, frame=> {
        context.state.stomp.subscribe("/user/queue/chat", message=> {
          var msg = JSON.parse(message.body);
          var oldMsg = window.localStorage.getItem(context.state.user.username + "#" + msg.from);
          if (oldMsg == null) {
            oldMsg = [];
            oldMsg.push(msg);
            window.localStorage.setItem(context.state.user.username + "#" + msg.from, JSON.stringify(oldMsg))
          } else {
            var oldMsgJson = JSON.parse(oldMsg);
            oldMsgJson.push(msg);
            window.localStorage.setItem(context.state.user.username + "#" + msg.from, JSON.stringify(oldMsgJson))
          }
          if (msg.from != context.state.currentFriend.username) {
            context.commit("addValue2DotMap", "isDot#" + context.state.user.username + "#" + msg.from);
          }
          //更新msgList
          var oldMsg2 = window.localStorage.getItem(context.state.user.username + "#" + context.state.currentFriend.username);
          if (oldMsg2 == null) {
            context.commit('updateMsgList', []);
          } else {
            context.commit('updateMsgList', JSON.parse(oldMsg2));
          }
        });
        context.state.stomp.subscribe("/topic/nf", message=> {
          context.commit('toggleNFDot', true);
        });
      }, failedMsg=> {

      });
    }
  }
});
