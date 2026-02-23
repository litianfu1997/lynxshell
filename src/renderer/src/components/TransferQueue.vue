<script setup>
import { ref } from 'vue'

const props = defineProps({
  transfers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['cancel', 'pause', 'resume'])

const expanded = ref(true)

const toggleExpand = () => {
  expanded.value = !expanded.value
}

const handleCancel = (transferId) => {
  emit('cancel', transferId)
}

const handlePause = (transferId) => {
  emit('pause', transferId)
}

const handleResume = (transferId) => {
  emit('resume', transferId)
}

const formatSpeed = (bytes) => {
  if (!bytes) return '-'
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(1)} ${units[i]}`
}
</script>

<template>
  <div class="transfer-queue">
    <div class="queue-header" @click="toggleExpand">
      <span class="toggle-icon">{{ expanded ? '▼' : '▶' }}</span>
      <span>传输队列</span>
      <span class="count">({{ transfers.length }})</span>
    </div>
    <div v-if="expanded" class="queue-content">
      <div v-if="transfers.length === 0" class="empty">
        暂无传输任务
      </div>
      <div v-else class="transfer-list">
        <div
          v-for="transfer in transfers"
          :key="transfer.id"
          class="transfer-item"
        >
          <div class="transfer-info">
            <span class="file-name" :title="transfer.fileName">{{ transfer.fileName }}</span>
            <span class="transfer-type">{{ transfer.type === 'upload' ? '上传 ↑' : '下载 ↓' }}</span>
            <span class="file-size">{{ transfer.paused ? '已暂停' : formatSpeed(transfer.speed) }}</span>
          </div>
          <div class="transfer-actions">
            <div class="transfer-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: transfer.progress + '%' }"></div>
              </div>
              <span class="progress-text">{{ transfer.progress.toFixed(1) }}%</span>
            </div>
            <button v-if="!transfer.paused" @click="handlePause(transfer.id)" class="action-btn" title="暂停">⏸</button>
            <button v-else @click="handleResume(transfer.id)" class="action-btn" title="继续">▶</button>
            <button @click="handleCancel(transfer.id)" class="action-btn cancel-btn" title="取消">⏹</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transfer-queue {
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.queue-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
}

.queue-header:hover {
  background: var(--hover-bg);
}

.toggle-icon {
  font-size: 12px;
  color: var(--text-secondary);
}

.count {
  color: var(--text-secondary);
}

.queue-content {
  border-top: 1px solid var(--border-color);
  max-height: 200px;
  overflow: auto;
}

.empty {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.transfer-list {
  padding: 8px;
}

.transfer-item {
  padding: 8px;
  background: var(--bg-color);
  border-radius: 4px;
  margin-bottom: 8px;
}

.transfer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.transfer-type {
  margin: 0 8px;
  color: var(--accent-color);
}

.file-size {
  color: var(--text-secondary);
  font-size: 12px;
}

.transfer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.transfer-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s;
}

.progress-text {
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 45px;
  text-align: right;
}

.action-btn {
  padding: 4px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  width: 24px;
  height: 24px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--hover-bg);
}

.cancel-btn:hover {
  color: #f87171;
  border-color: #f87171;
  background: rgba(248, 113, 113, 0.1);
}
</style>
