import 'vue-router';

// 扩展 Vue Router 的 RouteMeta 接口
declare module 'vue-router' {
  interface RouteMeta {
    // 是否需要认证
    requiresAuth?: boolean;
    lang?: string;
    // 头部类型，用于控制Header组件显示不同的内容
    // headerOption?: {
    //   //作用于手机端或者PC端
    //   mobile?: {
    //     type: 'Chat' | 'Create' | 'Default'
    //   },
    //   //作用于PC端
    //   pc?: {
    //     type: 'Default'
    //   }
    // }
  }
}
export { };
