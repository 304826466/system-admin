<template>
  <el-drawer
    v-model="visible"
    :title="title"
    direction="rtl"
    size="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="姓名" prop="name">
        <el-input v-model="formData.name" placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="formData.status"
          placeholder="请选择状态"
          style="width: 100%"
        >
          <el-option label="启用" value="enabled" />
          <el-option label="禁用" value="disabled" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";

// 定义事件
const emit = defineEmits<{
  (e: "submit"): void;
}>();

// 抽屉可见性
const visible = ref(false);

// 标题
const title = computed(() => {
  return isEdit.value ? "编辑用户" : "新增用户";
});

// 是否为编辑模式
const isEdit = ref(false);

// 当前行数据
const currentRow = ref(null);

// 表单数据
const formData = reactive({
  name: "",
  email: "",
  status: ""
});

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入姓名", trigger: "blur" }],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

// 表单引用
const formRef = ref();

// 打开抽屉
const open = (row = null) => {
  visible.value = true;
  if (row) {
    // 编辑模式
    isEdit.value = true;
    currentRow.value = row;
    // 填充表单数据
    formData.name = row.name;
    formData.email = row.email;
    formData.status = row.status;
  } else {
    // 新增模式
    isEdit.value = false;
    currentRow.value = null;
    resetFormData();
  }
};

// 重置表单数据
const resetFormData = () => {
  formData.name = "";
  formData.email = "";
  formData.status = "";
};

// 关闭抽屉
const handleClose = () => {
  formRef.value.resetFields();
};

// 提交表单
const handleSubmit = () => {
  formRef.value.validate(valid => {
    if (valid) {
      if (isEdit.value) {
        // 编辑逻辑
        ElMessage.success("编辑成功");
      } else {
        // 新增逻辑
        ElMessage.success("新增成功");
      }
      visible.value = false;
      emit("submit");
    }
  });
};

// 暴露方法给父组件
defineExpose({
  open
});
</script>

<style scoped>
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
