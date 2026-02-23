<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  file: {
    type: Object,
    default: null
  },
  sessionId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close'])

const content = ref('')
const loading = ref(false)
const error = ref(null)

const isImage = computed(() => {
  if (!props.file) return false
  const ext = props.file.name.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)
})

const isText = computed(() => {
  if (!props.file) return false
  const ext = props.file.name.split('.').pop()?.toLowerCase()
  return ['txt', 'md', 'json', 'js', 'ts', 'py', 'html', 'css', 'xml', 'yaml', 'yml', 'sh', 'bash', 'zsh'].includes(ext)
})

watch(() => props.file, async (newFile) => {
  if (!newFile || !isText.value) {
    content.value = ''
    error.value = null
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await window.electronAPI.sftp.getFile(props.sessionId, newFile.path || newFile.name)
    content.value = result.content
  } catch (err) {
    error.value = err.message || '无法加载文件'
  } finally {
    loading.value = false
  }
}, { immediate: true })

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div v-if="file" class="sftp-preview">
    <div class="preview-header">
      <span class="file-name">{{ file.name }}</span>
      <button @click="handleClose" class="close-btn">×</button>
    </div>
    <div class="preview-content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="isImage" class="image-preview">
        <span class="preview-hint">图片预览需要先下载到本地</span>
      </div>
      <div v-else-if="isText" class="text-preview">
        <pre>{{ content }}</pre>
      </div>
      <div v-else class="unsupported">
        此文件类型不支持预览
      </div>
    </div>
  </div>
</template>

<style scoped>
.sftp-preview {
  height: 300px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
}

.file-name {
  font-weight: 500;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--text-color);
}

.preview-content {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

.loading, .error, .unsupported, .preview-hint {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
}

.error {
  color: var(--error-color);
}

.text-preview pre {
  margin: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--text-color);
}
</style>
