<!-- components/ReAdaptiveTable/index.vue -->
<template>
  <div ref="tableContainerRef" class="adaptive-table-container">
    <!-- 搜索区域插槽 -->
    <div v-if="$slots.search" class="table-search-area">
      <slot name="search" />
    </div>

    <!-- 工具栏插槽 -->
    <div v-if="$slots.toolbar" class="table-toolbar">
      <slot name="toolbar" />
    </div>

    <!-- 表格容器 -->
    <div class="table-wrapper" :style="{ height: wrapperHeight }">
      <el-table v-bind="$attrs" :data="data" :height="computedTableHeight" :loading="loading" class="adaptive-table"
        v-on="filteredListeners">
        <slot />

        <!-- 空状态插槽 -->
        <template #empty>
          <slot name="empty">
            <el-empty description="暂无数据" />
          </slot>
        </template>
      </el-table>
    </div>

    <!-- 分页组件 -->
    <div v-if="showPagination && data.length > 0" class="adaptive-table-pagination"
      :style="{ justifyContent: paginationAlign }">
      <el-pagination v-bind="mergedPaginationConfig" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, useAttrs, nextTick } from 'vue';

// 定义分页配置接口
interface PaginationConfig {
  currentPage?: number;
  pageSize?: number;
  pageSizes?: number[];
  total?: number;
  layout?: string;
  background?: boolean;
  small?: boolean;
  disabled?: boolean;
  hideOnSinglePage?: boolean;
}

// 定义组件 props
interface Props {
  data: any[];
  offset?: number; // 距离底部的偏移量，默认80px
  showPagination?: boolean; // 是否显示分页
  paginationConfig?: PaginationConfig; // 分页配置
  paginationAlign?: 'flex-start' | 'center' | 'flex-end'; // 分页对齐方式
  containerSelector?: string; // 容器选择器，用于计算高度
  autoHeight?: boolean; // 是否自动计算高度
  loading?: boolean; // 加载状态
  fixedHeight?: number; // 固定高度，优先级最高
  paginationHeight?: number; // 分页高度配置
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  offset: 80,
  showPagination: false,
  paginationAlign: 'flex-end',
  containerSelector: '',
  autoHeight: true,
  loading: false,
  fixedHeight: 0,
  paginationHeight: 60
});

// 定义 emits
const emit = defineEmits<{
  (e: 'update:height', height: number): void;
  (e: 'pagination:size-change', val: number): void;
  (e: 'pagination:current-change', val: number): void;
  (e: 'refresh'): void;
  (e: 'search'): void;
  (e: 'reset'): void;
  (e: 'edit', row: any): void;
  (e: 'delete', row: any): void;
  (e: 'selection-change', rows: any[]): void;
}>();

// 获取所有 attrs
const attrs = useAttrs();

// 过滤掉原生事件，只保留 Element Plus 组件需要的属性
const filteredListeners = computed(() => {
  const listeners: Record<string, any> = {};
  Object.keys(attrs).forEach(key => {
    if (key.startsWith('on') && typeof attrs[key] === 'function') {
      // 将 onXxx 转换为 xxx 事件名
      const event = key.charAt(2).toLowerCase() + key.slice(3);
      listeners[event] = attrs[key];
    }
  });

  // 添加 selection-change 事件处理
  listeners['selection-change'] = (rows: any[]) => {
    emit('selection-change', rows);
  };

  return listeners;
});

// 默认分页配置
const defaultPaginationConfig = {
  currentPage: 1,
  pageSize: 10,
  pageSizes: [10, 20, 50, 100],
  total: 0,
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true
};

// 合并分页配置
const mergedPaginationConfig = computed(() => {
  return {
    ...defaultPaginationConfig,
    ...props.paginationConfig
  };
});

// 表格容器引用
const tableContainerRef = ref<HTMLElement | null>(null);

// 是否已经计算过高度
const hasCalculatedHeight = ref(false);
// 计算后的固定表格高度
const computedTableHeight = ref(0);

// 计算包装器高度
const wrapperHeight = computed(() => {
  if (props.fixedHeight > 0) {
    const paginationHeight =
      props.showPagination && props.data.length > 0 ? props.paginationHeight : 0;
    return `${props.fixedHeight - paginationHeight}px`;
  }
  return 'auto';
});

// 计算表格容器到顶部的距离
const containerTop = computed(() => {
  if (!tableContainerRef.value) return 0;

  // 如果提供了容器选择器，则使用该容器的高度计算
  if (props.containerSelector) {
    const container = document.querySelector(props.containerSelector);
    if (container) {
      const containerRect = container.getBoundingClientRect();
      return containerRect.top + window.scrollY;
    }
  }

  const rect = tableContainerRef.value.getBoundingClientRect();
  return rect.top + window.scrollY;
});

// 计算需要排除的高度（搜索区域、操作按钮等）
const calculateExcludedHeight = () => {
  if (!tableContainerRef.value) return 0;

  // 查找同级的搜索区域和操作区域
  const parentElement = tableContainerRef.value.parentElement;
  if (!parentElement) return 0;

  let excludedHeight = 0;

  // 查找所有兄弟元素并累加它们的高度
  const siblings = Array.from(parentElement.children);
  for (const sibling of siblings) {
    // 排除表格容器本身
    if (sibling === tableContainerRef.value) continue;

    // 确保元素在DOM中并且可见
    if (!document.contains(sibling) || sibling.offsetParent === null) {
      continue;
    }

    // 获取元素的实际高度（包括margin）
    const styles = window.getComputedStyle(sibling);
    const marginTop = parseFloat(styles.marginTop) || 0;
    const marginBottom = parseFloat(styles.marginBottom) || 0;

    // 使用 getBoundingClientRect 获取更准确的高度
    const rect = sibling.getBoundingClientRect();
    const height = rect.height || sibling.offsetHeight || 0;

    excludedHeight += height + marginTop + marginBottom;
  }

  return excludedHeight;
};

// 计算表格高度 - 只计算一次
const calculateFixedHeight = () => {
  // 如果已经计算过高度，则不再计算
  if (hasCalculatedHeight.value) {
    return;
  }

  // 如果设置了固定高度属性，直接使用
  if (props.fixedHeight > 0) {
    computedTableHeight.value = props.fixedHeight;
    hasCalculatedHeight.value = true;
    emit('update:height', computedTableHeight.value);
    return;
  }

  // 如果不启用自动高度计算，直接返回
  if (!props.autoHeight) {
    computedTableHeight.value = 0; // 0 表示不限制高度
    hasCalculatedHeight.value = true;
    emit('update:height', computedTableHeight.value);
    return;
  }

  // 获取窗口高度
  const windowHeight = window.innerHeight;

  // 计算需要排除的高度
  const excludedHeight = calculateExcludedHeight();

  // 固定分页组件高度
  const paginationHeight = props.paginationHeight; // 固定分页组件高度

  // 计算表格最大高度：窗口高度 - 容器到顶部的距离 - 排除的高度 - 固定分页高度 - 偏移量
  const maxHeight =
    windowHeight - containerTop.value - excludedHeight - paginationHeight - props.offset;

  // 确保最小高度不少于200px
  computedTableHeight.value = Math.max(maxHeight, 200);
  hasCalculatedHeight.value = true;
  console.log('高度' + computedTableHeight.value);
  // 发出高度更新事件
  emit('update:height', computedTableHeight.value);
};

// 处理分页大小变化
const handleSizeChange = (val: number) => {
  emit('pagination:size-change', val);
};

// 处理当前页变化
const handleCurrentChange = (val: number) => {
  emit('pagination:current-change', val);
};

// 刷新方法 - 允许重新计算高度
const refresh = () => {
  hasCalculatedHeight.value = false;
  nextTick(() => {
    calculateFixedHeight();
  });
  emit('refresh');
};

// 搜索方法
const search = () => {
  emit('search');
};

// 重置方法
const reset = () => {
  emit('reset');
};

// 处理窗口大小变化
const handleResize = () => {
  hasCalculatedHeight.value = false;
  nextTick(() => {
    calculateFixedHeight();
  });
};

// 监听滚动事件优化性能
let ticking = false;
const handleScroll = () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      hasCalculatedHeight.value = false;
      calculateFixedHeight();
      ticking = false;
    });
    ticking = true;
  }
};

// 创建 ResizeObserver 监听搜索区域高度变化
let resizeObserver: ResizeObserver | null = null;

// 组件挂载时
onMounted(() => {
  // 延迟执行确保DOM完全渲染
  setTimeout(() => {
    calculateFixedHeight();
  }, 100);

  // 添加事件监听器
  window.addEventListener('resize', handleResize);
});

// 组件卸载时
onUnmounted(() => {
  // 移除事件监听器
  window.removeEventListener('resize', handleResize);
});

// 暴露方法给父组件
defineExpose({
  refreshHeight: calculateFixedHeight,
  calculateMaxHeight: calculateFixedHeight,
  refresh,
  search,
  reset
});
</script>

<style scoped>
.adaptive-table-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.adaptive-table {
  width: 100%;
}

/* 分页容器 - 始终占据固定空间 */
.adaptive-table-pagination {
  min-height: v-bind('props.paginationHeight + "px"');
  display: flex;
  align-items: center;
  padding: 10px 0;
  flex-shrink: 0;
}

.table-search-area,
.table-toolbar {
  margin-bottom: 1rem;
  flex-shrink: 0;
}
</style>
