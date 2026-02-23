<script setup>
import { ref } from 'vue'

const props = defineProps({
  treeData: {
    type: Array,
    default: () => []
  },
  currentPath: {
    type: String,
    default: '.'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['navigate'])

const expandedNodes = ref(new Set(['.']))

const toggleExpand = (node) => {
  if (expandedNodes.value.has(node.path)) {
    expandedNodes.value.delete(node.path)
  } else {
    expandedNodes.value.add(node.path)
  }
}

const handleNodeClick = (node) => {
  emit('navigate', node.path)
}

const isExpanded = (path) => expandedNodes.value.has(path)

const isSelected = (path) => path === props.currentPath
</script>

<template>
  <div class="sftp-tree">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="tree-root">
      <div
        v-for="node in treeData"
        :key="node.path"
        class="tree-node"
        :class="{ 'is-selected': isSelected(node.path) }"
        @click="handleNodeClick(node)"
      >
        <div class="tree-node-content">
          <span
            class="expand-icon"
            @click.stop="toggleExpand(node)"
          >
            {{ node.children?.length ? (isExpanded(node.path) ? '▼' : '▶') : '  ' }}
          </span>
          <span class="folder-icon">📁</span>
          <span class="node-name">{{ node.name }}</span>
        </div>
        <div v-if="isExpanded(node.path) && node.children?.length" class="tree-node-children">
          <div
            v-for="child in node.children"
            :key="child.path"
            class="tree-node tree-node-child"
            :class="{ 'is-selected': isSelected(child.path) }"
            @click="handleNodeClick(child)"
          >
            <div class="tree-node-content">
              <span class="expand-icon">  </span>
              <span class="folder-icon">📁</span>
              <span class="node-name">{{ child.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sftp-tree {
  width: 250px;
  border-right: 1px solid var(--border-color);
  overflow: auto;
  background: var(--bg-secondary);
}

.loading {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
}

.tree-root {
  padding: 8px 0;
}

.tree-node {
  user-select: none;
}

.tree-node-content {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  gap: 6px;
}

.tree-node-content:hover {
  background: var(--hover-bg);
}

.tree-node.is-selected > .tree-node-content {
  background: var(--selection-bg);
  color: var(--selection-text);
}

.tree-node-child {
  padding-left: 16px;
}

.expand-icon {
  width: 16px;
  text-align: center;
  font-size: 10px;
  color: var(--text-secondary);
}

.folder-icon {
  font-size: 14px;
}

.node-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
