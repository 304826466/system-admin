<!-- views/demo/table2.vue -->
<template>
  <div class="demo-container">
    <p>封装统一表格组件，统一计算高度，并抽离分页组件。</p>

    <!-- 搜索区域 -->
    <div class="search-area mb-4">
      <el-form :model="searchForm" label-width="80px" inline>
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" style="width: 140px" clearable>
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="SearchIcon" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="RefreshIcon" @click="handleReset"> 重置 </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 自适应表格区域（包含分页） -->
    <div class="table-area">
      <ReAdaptiveTable :data="tableData" :loading="loading" :show-pagination="true"
        :pagination-config="paginationConfig" :container-selector="'.demo-container'" border stripe
        @selection-change="handleSelectionChange" @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange" @refresh="handleRefresh">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'danger'">
              {{ row.status === "enabled" ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="EditIcon" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link :icon="DeleteIcon" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </ReAdaptiveTable>
    </div>

    <!-- 抽屉组件 -->
    <DemoDrawer ref="drawerRef" @submit="handleDrawerSubmit" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import DemoDrawer from "./components/DemoDrawer.vue";
import ReAdaptiveTable from "@/components/ReAdaptiveTable/index.vue";

// 图标引入
const AddIcon = useRenderIcon("ep:plus");
const EditIcon = useRenderIcon("ep:edit");
const DeleteIcon = useRenderIcon("ep:delete");
const SearchIcon = useRenderIcon("ep:search");
const RefreshIcon = useRenderIcon("ep:refresh");

defineOptions({
  name: "demotable2"
});

// 搜索表单数据
const searchForm = reactive({
  name: "",
  status: ""
});

// 表格数据
const tableData = ref([]);
const selectedRows = ref([]);

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 加载状态
const loading = ref(false);

// 抽屉引用
const drawerRef = ref();

// 计算分页配置
const paginationConfig = computed(() => ({
  currentPage: pagination.currentPage,
  pageSize: pagination.pageSize,
  pageSizes: [10, 20, 50, 100],
  total: pagination.total,
  layout: "total, sizes, prev, pager, next, jumper",
  background: true
}));

// 获取表格数据（模拟）
const fetchData = () => {
  loading.value = true;
  // 模拟异步请求
  setTimeout(() => {
    // 模拟数据
    const mockData = Array.from({ length: 100 }, (_, index) => ({
      id: index + 1,
      name: `用户${index + 1}`,
      email: `user${index + 1}@example.com`,
      status: index % 2 === 0 ? "enabled" : "disabled",
      createTime: "2023-05-01 12:00:00"
    }));

    // 模拟分页
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;

    tableData.value = mockData.slice(start, end);
    pagination.total = mockData.length;
    loading.value = false;
  }, 500);
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchData();
};

// 重置搜索
const handleReset = () => {
  searchForm.name = "";
  searchForm.status = "";
  pagination.currentPage = 1;
  fetchData();
};

// 处理选择变化
const handleSelectionChange = rows => {
  selectedRows.value = rows;
};

// 新增
const handleAdd = () => {
  drawerRef.value.open();
};

// 编辑
const handleEdit = row => {
  drawerRef.value.open(row);
};

// 删除
const handleDelete = row => {
  ElMessageBox.confirm("确认删除该条数据吗？", "提示", {
    type: "warning"
  })
    .then(() => {
      // 实际项目中这里调用删除接口
      ElMessage.success("删除成功");
      fetchData();
    })
    .catch(() => {
      // 用户取消删除
    });
};

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请至少选择一条数据");
    return;
  }

  ElMessageBox.confirm(
    `确认删除选中的 ${selectedRows.value.length} 条数据吗？`,
    "提示",
    {
      type: "warning"
    }
  )
    .then(() => {
      // 实际项目中这里调用批量删除接口
      ElMessage.success("批量删除成功");
      fetchData();
    })
    .catch(() => {
      // 用户取消删除
    });
};

// 处理抽屉提交事件
const handleDrawerSubmit = () => {
  fetchData();
};

// 分页大小改变
const handleSizeChange = val => {
  pagination.pageSize = val;
  pagination.currentPage = 1;
  fetchData();
};

// 当前页改变
const handleCurrentChange = val => {
  pagination.currentPage = val;
  fetchData();
};

// 刷新数据
const handleRefresh = () => {
  fetchData();
};

// 组件挂载时获取数据
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.demo-container {
  box-sizing: border-box;

  /* 减去顶部导航栏和其他固定元素的高度 */
  display: flex;
  flex-direction: column;
  height: calc(100vh - 130px);
  padding: 20px;
  overflow: hidden;
  background: var(--el-bg-color) !important;
  /* 使用 Element Plus 主题背景色 */
  /* 防止出现外部滚动条 */
}

.mb-4 {
  margin-bottom: 1rem;
}

.table-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

/* 确保表格容器正确填充空间 */
.adaptive-table-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
