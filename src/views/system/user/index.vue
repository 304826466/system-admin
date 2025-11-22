<!-- views/system/user/index.vue -->
<template>
  <div class="user-container">
    <p>用户管理页面</p>

    <!-- 操作按钮区域 -->
    <div class="operation-area mb-4">
      <el-button type="primary" :icon="AddIcon" @click="handleAdd"> 新增用户 </el-button>
      <el-button type="danger" :icon="DeleteIcon" @click="handleBatchDelete"> 批量删除 </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-area mb-4">
      <el-form :model="searchForm" label-width="80px" inline>
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="SearchIcon" @click="handleSearch"> 搜索 </el-button>
          <el-button :icon="RefreshIcon" @click="handleReset"> 重置 </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 自适应表格区域（包含分页） -->
    <div class="table-area">
      <ReAdaptiveTable
        :data="userList"
        :loading="loading"
        :show-pagination="true"
        :pagination-config="paginationConfig"
        :container-selector="'.user-container'"
        border
        stripe
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
        @refresh="handleRefresh">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="role" label="角色" />
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
            <el-button type="primary" link :icon="EditIcon" @click="handleEdit(row)"> 编辑 </el-button>
            <el-button type="danger" link :icon="DeleteIcon" @click="handleDelete(row)"> 删除 </el-button>
          </template>
        </el-table-column>
      </ReAdaptiveTable>
    </div>

    <!-- 用户编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="userFormRef" :model="currentUser" :rules="userRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="currentUser.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="currentUser.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="currentUser.role" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="item in roleList" :key="item.id" :label="item.roleName" :value="item.roleName" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="currentUser.status">
            <el-radio label="enabled">启用</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ReAdaptiveTable from "@/components/ReAdaptiveTable/index.vue";
import { storageLocal } from "@pureadmin/utils";

// 图标引入
const AddIcon = useRenderIcon("ep:plus");
const EditIcon = useRenderIcon("ep:edit");
const DeleteIcon = useRenderIcon("ep:delete");
const SearchIcon = useRenderIcon("ep:search");
const RefreshIcon = useRenderIcon("ep:refresh");

defineOptions({
  name: "systemUser"
});

// 搜索表单数据
const searchForm = reactive({
  username: "",
  status: ""
});

// 表格数据
const userList = ref([]);
const selectedRows = ref([]);
const loading = ref(false);

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 计算分页配置
const paginationConfig = computed(() => ({
  currentPage: pagination.currentPage,
  pageSize: pagination.pageSize,
  pageSizes: [10, 20, 50, 100],
  total: pagination.total,
  layout: "total, sizes, prev, pager, next, jumper",
  background: true
}));

// 弹窗相关
const dialogVisible = ref(false);
const isEdit = ref(false);
const dialogTitle = computed(() => (isEdit.value ? "编辑用户" : "新增用户"));

// 当前用户数据
const currentUser = reactive({
  id: "",
  username: "",
  email: "",
  role: "",
  status: "enabled",
  createTime: ""
});

// 角色列表
const roleList = ref([]);

// 表单引用
const userFormRef = ref();

// 表单验证规则
const userRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" }
  ],
  role: [{ required: true, message: "请选择角色", trigger: "change" }]
};

// 获取用户列表（带分页）
const getUserList = () => {
  loading.value = true;
  try {
    const users = storageLocal().getItem("system_users") || [];

    // 模拟搜索过滤
    let filteredUsers = users;
    if (searchForm.username) {
      filteredUsers = filteredUsers.filter(user => user.username.includes(searchForm.username));
    }
    if (searchForm.status) {
      filteredUsers = filteredUsers.filter(user => user.status === searchForm.status);
    }

    // 模拟分页
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;

    userList.value = filteredUsers.slice(start, end);
    pagination.total = filteredUsers.length;
  } catch (error) {
    userList.value = [];
    pagination.total = 0;
    ElMessage.error("获取用户列表失败");
  } finally {
    loading.value = false;
  }
};

// 获取角色列表
const getRoleList = () => {
  try {
    roleList.value = storageLocal().getItem("system_roles") || [];
  } catch (error) {
    roleList.value = [];
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  getUserList();
};

// 重置搜索
const handleReset = () => {
  searchForm.username = "";
  searchForm.status = "";
  pagination.currentPage = 1;
  getUserList();
};

// 处理选择变化
const handleSelectionChange = rows => {
  selectedRows.value = rows;
};

// 新增用户
const handleAdd = () => {
  isEdit.value = false;
  Object.assign(currentUser, {
    id: "",
    username: "",
    email: "",
    role: "",
    status: "enabled",
    createTime: ""
  });
  dialogVisible.value = true;
  nextTick(() => {
    userFormRef.value?.clearValidate();
  });
};

// 编辑用户
const handleEdit = row => {
  isEdit.value = true;
  Object.assign(currentUser, row);
  dialogVisible.value = true;
  nextTick(() => {
    userFormRef.value?.clearValidate();
  });
};

// 删除用户
const handleDelete = row => {
  ElMessageBox.confirm(`确认删除用户"${row.username}"吗？`, "提示", {
    type: "warning"
  })
    .then(() => {
      const users = storageLocal().getItem("system_users") || [];
      const index = users.findIndex(item => item.id === row.id);
      if (index > -1) {
        users.splice(index, 1);
        storageLocal().setItem("system_users", users);
        getUserList();
        ElMessage.success("删除成功");
      }
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

  ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条用户数据吗？`, "提示", {
    type: "warning"
  })
    .then(() => {
      const users = storageLocal().getItem("system_users") || [];
      const selectedIds = selectedRows.value.map(item => item.id);
      const filteredUsers = users.filter(user => !selectedIds.includes(user.id));
      storageLocal().setItem("system_users", filteredUsers);
      getUserList();
      ElMessage.success("批量删除成功");
    })
    .catch(() => {
      // 用户取消删除
    });
};

// 保存用户
const handleSave = () => {
  userFormRef.value.validate(valid => {
    if (valid) {
      const users = storageLocal().getItem("system_users") || [];

      if (isEdit.value) {
        // 编辑用户
        const index = users.findIndex(item => item.id === currentUser.id);
        if (index > -1) {
          users[index] = { ...currentUser };
        }
        ElMessage.success("编辑成功");
      } else {
        // 新增用户
        const newUser = {
          ...currentUser,
          id: Date.now().toString(),
          createTime: new Date().toLocaleString()
        };
        users.push(newUser);
        ElMessage.success("新增成功");
      }

      storageLocal().setItem("system_users", users);
      dialogVisible.value = false;
      getUserList();
    }
  });
};

// 弹窗关闭
const handleDialogClose = () => {
  userFormRef.value?.resetFields();
};

// 分页大小改变
const handleSizeChange = val => {
  pagination.pageSize = val;
  pagination.currentPage = 1;
  getUserList();
};

// 当前页改变
const handleCurrentChange = val => {
  pagination.currentPage = val;
  getUserList();
};

// 刷新数据
const handleRefresh = () => {
  getUserList();
};

// 组件挂载时获取数据
onMounted(() => {
  getUserList();
  getRoleList();

  // 初始化默认用户（如果不存在）
  const users = storageLocal().getItem("system_users") || [];
  if (users.length === 0) {
    const defaultUsers = [
      {
        id: "1",
        username: "admin",
        email: "admin@example.com",
        role: "管理员",
        status: "enabled",
        createTime: "2023-05-01 12:00:00"
      },
      {
        id: "2",
        username: "user",
        email: "user@example.com",
        role: "普通用户",
        status: "enabled",
        createTime: "2023-05-01 12:00:00"
      }
    ];
    storageLocal().setItem("system_users", defaultUsers);
    getUserList();
  }
});
</script>

<style scoped>
.user-container {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 130px);
  padding: 20px;
  overflow: hidden;
  background-color: #fff;
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

.adaptive-table-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dialog-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
</style>
