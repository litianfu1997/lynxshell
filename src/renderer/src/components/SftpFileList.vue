<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'dblclick', 'delete', 'rename'])

const selectedIndices = ref(new Set())

const sortedFiles = computed(() => {
  return [...props.files].sort((a, b) => {
    if (a.type === 'directory' && b.type !== 'directory') return -1
    if (a.type !== 'directory' && b.type === 'directory') return 1
    return a.name.localeCompare(b.name)
  })
})

const toggleSelect = (index, event) => {
  if (event.ctrlKey || event.metaKey) {
    if (selectedIndices.value.has(index)) {
      selectedIndices.value.delete(index)
    } else {
      selectedIndices.value.add(index)
    }
  } else if (event.shiftKey) {
    // Range selection
    const indices = Array.from(selectedIndices.value)
    const lastSelected = indices.length > 0 ? Math.max(...indices) : 0
    const start = Math.min(lastSelected, index)
    const end = Math.max(lastSelected, index)
    for (let i = start; i <= end; i++) {
      selectedIndices.value.add(i)
    }
  } else {
    selectedIndices.value.clear()
    selectedIndices.value.add(index)
  }
  emit('select', Array.from(selectedIndices.value).map(i => sortedFiles.value[i]))
}

const handleDblClick = (file) => {
  emit('dblclick', file)
}

const getIcon = (file) => {
  if (file.type === 'directory') return '📁'
  const ext = file.name.split('.').pop()?.toLowerCase()
  const iconMap = {
    txt: '📄',
    md: '📝',
    pdf: '📕',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    svg: '🎨',
    mp3: '🎵',
    mp4: '🎬',
    zip: '📦',
    tar: '📦',
    gz: '📦',
    js: '📜',
    ts: '📜',
    py: '🐍',
    json: '📋',
    html: '🌐',
    css: '🎨'
  }
  return iconMap[ext] || '📄'
}

const formatSize = (bytes) => {
  if (!bytes) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(1)} ${units[i]}`
}

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString()
}
</script>

<template>
  <div class="sftp-file-list">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="sortedFiles.length === 0" class="empty">
      此文件夹为空
    </div>
    <div v-else class="file-list-container">
      <div
        v-for="(file, index) in sortedFiles"
        :key="file.name"
        class="file-item"
        :class="{ 'is-selected': selectedIndices.has(index) }"
        @click="toggleSelect(index, $event)"
        @dblclick="handleDblClick(file)"
      >
        <span class="file-icon">{{ getIcon(file) }}</span>
        <span class="file-name">{{ file.name }}</span>
        <span class="file-size">{{ formatSize(file.size) }}</span>
        <span class="file-date">{{ formatDate(file.mtime) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sftp-file-list {
  flex: 1;
  overflow: auto;
  background: var(--bg-color);
}

.loading, .empty {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

.file-list-container {
  padding: 8px;
}

.file-item {
  display: grid;
  grid-template-columns: 30px 1fr 100px 180px;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  align-items: center;
  font-size: 14px;
}

.file-item:hover {
  background: var(--hover-bg);
}

.file-item.is-selected {
  background: var(--selection-bg);
  color: var(--selection-text);
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size, .file-date {
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
