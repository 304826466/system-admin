<!-- views/system/role/index.vue -->
<template>
  <div class="role-container">
    <div class="operation-area mb-4">
      <el-button type="primary" :icon="AddIcon" @click="handleAdd"> 新增角色 </el-button>
    </div>

    <!-- 搜索区域 -->
    <div class="search-area mb-4">
      <el-form :model="searchForm" label-width="80px" inline>
        <el-form-item label="角色名称">
          <el-input v-model="searchForm.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码">
          <el-input v-model="searchForm.roleCode" placeholder="请输入角色编码" />
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
        :data="roleList"
        :loading="loading"
        :show-pagination="true"
        :pagination-config="paginationConfig"
        :container-selector="'.role-container'"
        border
        stripe
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="roleName" label="角色名称" />
        <el-table-column prop="roleCode" label="角色编码" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="权限配置" width="200">
          <template #default="{ row }">
            <el-button type="primary" link :icon="SettingIcon" @click="handlePermissionConfig(row)">
              配置权限
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="EditIcon" @click="handleEdit(row)"> 编辑 </el-button>
            <el-button type="danger" link :icon="DeleteIcon" @click="handleDelete(row)"> 删除 </el-button>
          </template>
        </el-table-column>
      </ReAdaptiveTable>
    </div>

    <!-- 角色编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="roleFormRef" :model="currentRole" :rules="roleRules" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="currentRole.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="currentRole.roleCode" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="currentRole.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 权限配置弹窗 -->
    <el-dialog v-model="permissionDialogVisible" title="权限配置" width="600px" @close="handlePermissionDialogClose">
      <div class="permission-tree">
        <el-tree
          ref="permissionTreeRef"
          :data="routePermissions"
          :props="defaultProps"
          node-key="path"
          show-checkbox
          :default-expanded-keys="expandedKeys"
          :default-checked-keys="selectedPermissions"
          :check-strictly="false" />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSavePermissions">确定</el-button>
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
import { usePermissionStoreHook } from "@/store/modules/permission";

// 图标引入
const AddIcon = useRenderIcon("ep:plus");
const EditIcon = useRenderIcon("ep:edit");
const DeleteIcon = useRenderIcon("ep:delete");
const SearchIcon = useRenderIcon("ep:search");
const RefreshIcon = useRenderIcon("ep:refresh");
const SettingIcon = useRenderIcon("ep:setting");

defineOptions({
  name: "systemRole"
});

// 搜索表单数据
const searchForm = reactive({
  roleName: "",
  roleCode: ""
});

// 表格数据
const roleList = ref([]);
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
const permissionDialogVisible = ref(false);
const isEdit = ref(false);
const dialogTitle = computed(() => (isEdit.value ? "编辑角色" : "新增角色"));

// 当前角色数据
const currentRole = reactive({
  id: "",
  roleName: "",
  roleCode: "",
  description: ""
});

// 当前权限配置角色
const currentPermissionRole = ref(null);

// 表单引用
const roleFormRef = ref();
const permissionTreeRef = ref();

// 表单验证规则
const roleRules = {
  roleName: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  roleCode: [{ required: true, message: "请输入角色编码", trigger: "blur" }]
};

// 获取路由权限数据
const getRoutePermissions = () => {
  // 获取所有路由
  const permissionStore = usePermissionStoreHook();
  const routes = permissionStore.wholeMenus;

  // 构建权限树
  const buildPermissionTree = (routes, parentPath = "") => {
    return routes.map(route => {
      const currentPath = route.path.startsWith("/") ? route.path : `${parentPath}/${route.path}`;

      const node = {
        path: currentPath,
        label: route.meta?.title || route.name || route.path,
        children: []
      };

      if (route.children && route.children.length > 0) {
        node.children = buildPermissionTree(route.children, currentPath);
      }

      return node;
    });
  };

  return buildPermissionTree(routes);
};

// 路由权限列表
const routePermissions = ref([]);

// 树形控件属性
const defaultProps = {
  children: "children",
  label: "label"
};

// 已选中的权限
const selectedPermissions = ref([]);
const expandedKeys = ref([]);

// 获取角色列表（带分页）
const getRoleList = () => {
  loading.value = true;
  try {
    const roles = storageLocal().getItem("system_roles") || [];

    // 模拟搜索过滤
    let filteredRoles = roles;
    if (searchForm.roleName) {
      filteredRoles = filteredRoles.filter(role => role.roleName.includes(searchForm.roleName));
    }
    if (searchForm.roleCode) {
      filteredRoles = filteredRoles.filter(role => role.roleCode.includes(searchForm.roleCode));
    }

    // 模拟分页
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;

    roleList.value = filteredRoles.slice(start, end);
    pagination.total = filteredRoles.length;
  } catch (error) {
    roleList.value = [];
    pagination.total = 0;
    ElMessage.error("获取角色列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  getRoleList();
};

// 重置搜索
const handleReset = () => {
  searchForm.roleName = "";
  searchForm.roleCode = "";
  pagination.currentPage = 1;
  getRoleList();
};

// 新增角色
const handleAdd = () => {
  isEdit.value = false;
  Object.assign(currentRole, {
    id: "",
    roleName: "",
    roleCode: "",
    description: ""
  });
  dialogVisible.value = true;
  nextTick(() => {
    roleFormRef.value?.clearValidate();
  });
};

// 编辑角色
const handleEdit = row => {
  isEdit.value = true;
  Object.assign(currentRole, row);
  dialogVisible.value = true;
  nextTick(() => {
    roleFormRef.value?.clearValidate();
  });
};

// 删除角色
const handleDelete = row => {
  ElMessageBox.confirm(`确认删除角色"${row.roleName}"吗？`, "提示", {
    type: "warning"
  })
    .then(() => {
      const roles = storageLocal().getItem("system_roles") || [];
      const index = roles.findIndex(item => item.id === row.id);
      if (index > -1) {
        roles.splice(index, 1);
        storageLocal().setItem("system_roles", roles);
        getRoleList();
        ElMessage.success("删除成功");
      }
    })
    .catch(() => {
      // 用户取消删除
    });
};

// 保存角色
const handleSave = () => {
  roleFormRef.value.validate(valid => {
    if (valid) {
      const roles = storageLocal().getItem("system_roles") || [];

      if (isEdit.value) {
        // 编辑角色
        const index = roles.findIndex(item => item.id === currentRole.id);
        if (index > -1) {
          roles[index] = { ...currentRole };
        }
        ElMessage.success("编辑成功");
      } else {
        // 新增角色
        const newRole = {
          ...currentRole,
          id: Date.now().toString()
        };
        roles.push(newRole);
        ElMessage.success("新增成功");
      }

      storageLocal().setItem("system_roles", roles);
      dialogVisible.value = false;
      getRoleList();
    }
  });
};

// 弹窗关闭
const handleDialogClose = () => {
  roleFormRef.value?.resetFields();
};

// 权限配置
const handlePermissionConfig = row => {
  currentPermissionRole.value = row;

  // 获取该角色已配置的权限
  const rolePermissions = storageLocal().getItem(`role_permissions_${row.id}`) || [];
  selectedPermissions.value = rolePermissions;

  permissionDialogVisible.value = true;
};

// 保存权限配置
const handleSavePermissions = () => {
  if (!currentPermissionRole.value) return;

  const checkedKeys = permissionTreeRef.value.getCheckedKeys();

  storageLocal().setItem(`role_permissions_${currentPermissionRole.value.id}`, checkedKeys);

  ElMessage.success("权限配置保存成功");
  permissionDialogVisible.value = false;
};

// 权限配置弹窗关闭
const handlePermissionDialogClose = () => {
  currentPermissionRole.value = null;
  selectedPermissions.value = [];
};

// 分页大小改变
const handleSizeChange = val => {
  pagination.pageSize = val;
  pagination.currentPage = 1;
  getRoleList();
};

// 当前页改变
const handleCurrentChange = val => {
  pagination.currentPage = val;
  getRoleList();
};

// 组件挂载时获取数据
onMounted(() => {
  getRoleList();
  routePermissions.value = getRoutePermissions();

  // 展开所有节点
  const expandAllKeys = [];
  const collectKeys = nodes => {
    nodes.forEach(node => {
      expandAllKeys.push(node.path);
      if (node.children && node.children.length > 0) {
        collectKeys(node.children);
      }
    });
  };
  collectKeys(routePermissions.value);
  expandedKeys.value = expandAllKeys;

  // 初始化默认角色（如果不存在）
  const roles = storageLocal().getItem("system_roles") || [];
  if (roles.length === 0) {
    const defaultRoles = [
      {
        id: "1",
        roleName: "管理员",
        roleCode: "admin",
        description: "系统管理员，拥有所有权限"
      },
      {
        id: "2",
        roleName: "普通用户",
        roleCode: "user",
        description: "普通用户，拥有基础权限"
      }
    ];
    storageLocal().setItem("system_roles", defaultRoles);
    getRoleList();
  }
});
</script>

<style scoped>
.role-container {
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

.permission-tree {
  max-height: 400px;
  overflow-y: auto;
}
</style>
