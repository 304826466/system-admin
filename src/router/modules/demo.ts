export default {
  path: "/demo",
  redirect: "/demo/index",
  meta: {
    icon: "ep:management",
    title: "demo表格",
    rank: 10
  },
  children: [
    {
      path: "/demo/index",
      name: "Demo",
      component: () => import("@/views/demo/index.vue"),
      meta: {
        title: "demo表格"
      }
    }
  ]
} satisfies RouteConfigsTable;
