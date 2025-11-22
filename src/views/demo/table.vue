<template>
  <div class="demo-container">
    <!-- 操作按钮区域 -->
    <div class="operation-area mb-4">
      <el-button type="primary" :icon="AddIcon" @click="handleAdd">
        新增
      </el-button>
      <el-button type="danger" :icon="DeleteIcon" @click="handleBatchDelete">
        批量删除
      </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-area mb-4">
      <el-form :model="searchForm" label-width="80px" inline>
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
          >
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

    <!-- 表格区域 -->
    <div class="table-area mb-4">
      <el-table
        :data="tableData"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
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
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="EditIcon"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              :icon="DeleteIcon"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页插件 -->
    <div class="pagination-area">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 抽屉组件 -->
    <DemoDrawer ref="drawerRef" @submit="handleDrawerSubmit" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import DemoDrawer from "./components/DemoDrawer.vue";

// 图标引入
const AddIcon = useRenderIcon("ep:plus");
const EditIcon = useRenderIcon("ep:edit");
const DeleteIcon = useRenderIcon("ep:delete");
const SearchIcon = useRenderIcon("ep:search");
const RefreshIcon = useRenderIcon("ep:refresh");

defineOptions({
  name: "DemoTable"
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

// 抽屉引用
const drawerRef = ref();

// 获取表格数据（模拟）
const fetchData = () => {
  // 模拟数据
  const mockData = Array.from({ length: 30 }, (_, index) => ({
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

// 组件挂载时获取数据
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.demo-container {
  padding: 20px;
  background-color: #fff;
}

.mb-4 {
  margin-bottom: 1rem;
}
</style>
