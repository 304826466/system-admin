// router/modules/demo.ts
export default {
  path: "/demo",
  redirect: "/demo/table",
  meta: {
    icon: "ep:management",
    title: "demo目录",
    rank: 10
  },
  children: [
    {
      path: "/demo/table",
      name: "DemoTable",
      component: () => import("@/views/demo/table.vue"),
      meta: {
        title: "demo表格",
        icon: "ep:document"
      }
    },
    {
      path: "/demo/table2",
      name: "DemoTable2",
      component: () => import("@/views/demo/table2.vue"),
      meta: {
        title: "demo表格2",
        icon: "ep:document"
      }
    }
  ]
} satisfies RouteConfigsTable;
