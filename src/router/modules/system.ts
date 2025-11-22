// router/modules/demo.ts
export default {
  path: "/system",
  redirect: "/system/role",
  meta: {
    icon: "ep:management",
    title: "系统管理",
    rank: 11
  },
  children: [
    {
      path: "/system/role",
      name: "systemRole",
      component: () => import("@/views/system/role/index.vue"),
      meta: {
        title: "角色管理",
        icon: "ep:document"
      }
    },
    {
      path: "/system/user",
      name: "systemUser",
      component: () => import("@/views/system/user/index.vue"),
      meta: {
        title: "用户管理",
        icon: "ep:document"
      }
    }
  ]
} satisfies RouteConfigsTable;
