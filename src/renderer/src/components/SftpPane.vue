<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  session: {
    type: Object,
    required: true
  }
})

// 状态
const currentPath = ref('.')
const fileList = ref([])
const treeData = ref([])
const selectedFiles = ref([])
const previewFile = ref(null)
const bookmarks = ref([])
const transfers = ref([])
const isTreeLoading = ref(false)
const isListLoading = ref(false)
const showPreview = ref(false)

// 计算属性
const currentDirName = computed(() => {
  if (currentPath.value === '.') return '/'
  return currentPath.value.split('/').pop() || '/'
})

// 方法
const loadDirectory = async (path) => {
  isListLoading.value = true
  try {
    const result = await window.electronAPI.sftp.ls(props.session.id, path)
    fileList.value = result
    currentPath.value = path
  } catch (error) {
    console.error('Failed to load directory:', error)
  } finally {
    isListLoading.value = false
  }
}

const loadTree = async () => {
  isTreeLoading.value = true
  try {
    const result = await window.electronAPI.sftp.tree(props.session.id, '.', 2)
    treeData.value = result
  } catch (error) {
    console.error('Failed to load tree:', error)
  } finally {
    isTreeLoading.value = false
  }
}

const refresh = () => {
  loadDirectory(currentPath.value)
  loadTree()
}

// 生命周期
onMounted(() => {
  loadDirectory('.')
  loadTree()
})

// 监听上传进度
onMounted(() => {
  window.electronAPI.sftp.onUploadProgress((data) => {
    if (data.sessionId === props.session.id) {
      const transfer = transfers.value.find(t => t.localPath === data.localPath)
      if (transfer) {
        transfer.progress = (data.bytes / data.total) * 100
        transfer.speed = data.bytes
      }
    }
  })
})

onUnmounted(() => {
  window.electronAPI.sftp.removeUploadProgressListener()
})
</script>

<template>
  <div class="sftp-pane">
    <div class="sftp-content">
      <!-- 内容将在后续任务中填充 -->
      <p>SFTP Browser for session: {{ session.id }}</p>
      <p>Current path: {{ currentPath }}</p>
      <p>Files: {{ fileList.length }}</p>
    </div>
  </div>
</template>

<style scoped>
.sftp-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-color);
  color: var(--text-color);
}

.sftp-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
}
</style>
