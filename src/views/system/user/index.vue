<!-- views/system/role/index.vue -->
<template>
  <div class="role-container">
    <div class="operation-area mb-4">
      <el-button type="primary" :icon="AddIcon" @click="handleAdd">
        新增角色
      </el-button>
    </div>

    <!-- 角色表格 -->
    <div class="table-area mb-4">
      <el-table :data="roleList" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="roleName" label="角色名称" />
        <el-table-column prop="roleCode" label="角色编码" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="权限配置" width="200">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="SettingIcon"
              @click="handlePermissionConfig(row)"
            >
              配置权限
            </el-button>
          </template>
        </el-table-column>
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

    <!-- 角色编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="roleFormRef"
        :model="currentRole"
        :rules="roleRules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="roleName">
          <el-input
            v-model="currentRole.roleName"
            placeholder="请输入角色名称"
          />
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input
            v-model="currentRole.roleCode"
            placeholder="请输入角色编码"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="currentRole.description"
            type="textarea"
            placeholder="请输入描述"
          />
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
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限配置"
      width="600px"
      @close="handlePermissionDialogClose"
    >
      <div class="permission-tree">
        <el-alert
          title="提示：父级菜单权限会自动包含子级权限"
          type="info"
          show-icon
          class="mb-3"
        />
        <el-tree
          ref="permissionTreeRef"
          :data="routePermissions"
          show-checkbox
          node-key="path"
          :props="defaultProps"
          :default-checked-keys="selectedPermissions"
          :default-expanded-keys="expandedKeys"
          check-strictly
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSavePermissions"
            >保存</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { storageLocal } from "@pureadmin/utils";
import { ascending } from "@/router/utils";
import { usePermissionStoreHook } from "@/store/modules/permission";

// 图标引入
const AddIcon = useRenderIcon("ep:plus");
const EditIcon = useRenderIcon("ep:edit");
const DeleteIcon = useRenderIcon("ep:delete");
const SettingIcon = useRenderIcon("ep:setting");

// 表单引用
const roleFormRef = ref();
const permissionTreeRef = ref();

// 角色列表
const roleList = ref([]);

// 当前编辑的角色
const currentRole = reactive({
  id: "",
  roleName: "",
  roleCode: "",
  description: ""
});

// 弹窗控制
const dialogVisible = ref(false);
const permissionDialogVisible = ref(false);
const isEdit = ref(false);

// 当前配置权限的角色
const currentPermissionRole = ref(null);

// 表单验证规则
const roleRules = {
  roleName: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  roleCode: [{ required: true, message: "请输入角色编码", trigger: "blur" }]
};

// 弹窗标题
const dialogTitle = computed(() => {
  return isEdit.value ? "编辑角色" : "新增角色";
});

// 获取路由权限数据
const getRoutePermissions = () => {
  // 获取所有路由
  const permissionStore = usePermissionStoreHook();
  const routes = permissionStore.wholeMenus;

  // 构建权限树
  const buildPermissionTree = (routes, parentPath = "") => {
    return routes.map(route => {
      const currentPath = route.path.startsWith("/")
        ? route.path
        : `${parentPath}/${route.path}`;

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

// 获取角色列表
const getRoleList = () => {
  const roles = storageLocal().getItem("system_roles") || [];
  roleList.value = roles;
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
};

// 编辑角色
const handleEdit = row => {
  isEdit.value = true;
  Object.assign(currentRole, row);
  dialogVisible.value = true;
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
  roleFormRef.value.resetFields();
};

// 权限配置
const handlePermissionConfig = row => {
  currentPermissionRole.value = row;

  // 获取该角色已配置的权限
  const rolePermissions =
    storageLocal().getItem(`role_permissions_${row.id}`) || [];
  selectedPermissions.value = rolePermissions;

  permissionDialogVisible.value = true;
};

// 保存权限配置
const handleSavePermissions = () => {
  if (!currentPermissionRole.value) return;

  const checkedKeys = permissionTreeRef.value.getCheckedKeys();

  storageLocal().setItem(
    `role_permissions_${currentPermissionRole.value.id}`,
    checkedKeys
  );

  ElMessage.success("权限配置保存成功");
  permissionDialogVisible.value = false;
};

// 权限配置弹窗关闭
const handlePermissionDialogClose = () => {
  currentPermissionRole.value = null;
  selectedPermissions.value = [];
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
  padding: 20px;
  background-color: #fff;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mb-3 {
  margin-bottom: 1rem;
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
