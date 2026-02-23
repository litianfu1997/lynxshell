<script setup>
import { computed } from 'vue'
import { FolderPlus, Upload, Download, Trash2, RefreshCw, Eye, Star } from 'lucide-vue-next'

const props = defineProps({
  selectedCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'upload',
  'download',
  'delete',
  'mkdir',
  'refresh',
  'toggle-preview',
  'add-bookmark'
])

</script>

<template>
  <div class="sftp-toolbar">
    <div class="toolbar-group">
      <button class="tool-btn" @click="emit('mkdir')" title="新建文件夹">
        <FolderPlus :size="14" />
        <span>新建文件夹</span>
      </button>
      <button class="tool-btn" @click="emit('upload')" title="上传">
        <Upload :size="14" />
        <span>上传</span>
      </button>
      <button class="tool-btn" @click="emit('download')" :disabled="selectedCount === 0" title="下载所选">
        <Download :size="14" />
        <span>下载</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button class="tool-btn danger" @click="emit('delete')" :disabled="selectedCount === 0" title="删除所选">
        <Trash2 :size="14" />
        <span>删除</span>
      </button>
      <button class="tool-btn" @click="emit('refresh')" title="刷新当前目录">
        <RefreshCw :size="14" />
        <span>刷新</span>
      </button>
      <button class="tool-btn" @click="emit('toggle-preview')" :disabled="selectedCount !== 1" title="预览所选文件">
        <Eye :size="14" />
        <span>预览</span>
      </button>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-group">
      <button class="tool-btn" @click="emit('add-bookmark')" title="收藏当前路径">
        <Star :size="14" />
        <span>收藏</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.sftp-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-secondary, #131825);
  border-bottom: 1px solid var(--border-color, #2a3347);
  overflow-x: auto;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-divider {
  width: 1px;
  height: 16px;
  background: var(--border-color, #2a3347);
  margin: 0 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-color, #e2e8f0);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tool-btn span {
  white-space: nowrap;
}

/* Hover & Active Effects */
.tool-btn:hover:not(:disabled) {
  background: var(--hover-bg, rgba(255,255,255,0.08));
  border-color: rgba(255,255,255,0.1);
  transform: translateY(-1px);
}

.tool-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.97);
}

/* Disabled State */
.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(100%);
}

/* Danger Button Specific */
.tool-btn.danger:hover:not(:disabled) {
  color: #f87171;
  background: rgba(248, 113, 113, 0.12);
  border-color: rgba(248, 113, 113, 0.2);
}
</style>
