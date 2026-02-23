<script setup>
import { computed } from 'vue'

const props = defineProps({
  path: {
    type: String,
    default: '.'
  }
})

const emit = defineEmits(['navigate'])

const breadcrumbs = computed(() => {
  if (props.path === '.') return [{ name: '/', path: '.' }]

  const parts = props.path.split('/')
  const result = []
  let currentPath = ''

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    currentPath = i === 0 ? part : `${currentPath}/${part}`
    result.push({
      name: part || '/',
      path: i === parts.length - 1 ? props.path : currentPath
    })
  }

  return result
})

const handleNavigate = (path) => {
  emit('navigate', path)
}
</script>

<template>
  <div class="sftp-breadcrumb">
    <span
      v-for="(crumb, index) in breadcrumbs"
      :key="index"
      class="breadcrumb-item"
      :class="{ 'is-last': index === breadcrumbs.length - 1 }"
      @click="handleNavigate(crumb.path)"
    >
      {{ crumb.name }}
      <span v-if="index < breadcrumbs.length - 1" class="separator">/</span>
    </span>
  </div>
</template>

<style scoped>
.sftp-breadcrumb {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  font-size: 14px;
}

.breadcrumb-item {
  cursor: pointer;
  color: var(--text-color);
}

.breadcrumb-item:hover:not(.is-last) {
  color: var(--accent-color);
}

.breadcrumb-item.is-last {
  cursor: default;
  font-weight: 500;
}

.separator {
  margin: 0 4px;
  color: var(--text-secondary);
}
</style>
