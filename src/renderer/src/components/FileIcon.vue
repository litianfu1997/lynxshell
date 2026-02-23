<template>
  <component :is="iconComponent" :size="size" :color="iconColor" :class="className" />
</template>

<script setup>
import { computed } from 'vue'
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileJson,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileTerminal,
  FileSpreadsheet,
  File,
  Settings,
  Database,
  Lock,
  Braces
} from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  isDirectory: {
    type: Boolean,
    default: false
  },
  isExpanded: {
    type: Boolean,
    default: false
  },
  size: {
    type: Number,
    default: 16
  },
  className: {
    type: String,
    default: ''
  }
})

const iconMapping = {
  // text
  txt: { icon: FileText, color: '#888888' },
  md: { icon: FileText, color: '#42a5f5' },
  log: { icon: FileText, color: '#888888' },
  // code
  js: { icon: FileCode, color: '#fbc02d' },
  ts: { icon: FileCode, color: '#1976d2' },
  vue: { icon: FileCode, color: '#4caf50' },
  html: { icon: FileCode, color: '#e65100' },
  css: { icon: FileCode, color: '#1e88e5' },
  scss: { icon: FileCode, color: '#c2185b' },
  less: { icon: FileCode, color: '#1e88e5' },
  py: { icon: FileCode, color: '#0277bd' },
  java: { icon: FileCode, color: '#d32f2f' },
  c: { icon: FileCode, color: '#1976d2' },
  cpp: { icon: FileCode, color: '#1976d2' },
  go: { icon: FileCode, color: '#00bcd4' },
  rs: { icon: FileCode, color: '#ff9800' },
  sh: { icon: FileTerminal, color: '#4caf50' },
  bat: { icon: FileTerminal, color: '#4caf50' },
  // config
  json: { icon: FileJson, color: '#fbc02d' },
  xml: { icon: FileCode, color: '#e65100' },
  yaml: { icon: FileCode, color: '#d32f2f' },
  yml: { icon: FileCode, color: '#d32f2f' },
  ini: { icon: Settings, color: '#888888' },
  conf: { icon: Settings, color: '#888888' },
  config: { icon: Settings, color: '#888888' },
  env: { icon: Settings, color: '#fbc02d' },
  // image
  jpg: { icon: FileImage, color: '#4caf50' },
  jpeg: { icon: FileImage, color: '#4caf50' },
  png: { icon: FileImage, color: '#4caf50' },
  gif: { icon: FileImage, color: '#4caf50' },
  svg: { icon: FileImage, color: '#ff9800' },
  webp: { icon: FileImage, color: '#4caf50' },
  ico: { icon: FileImage, color: '#4caf50' },
  // video
  mp4: { icon: FileVideo, color: '#f44336' },
  mkv: { icon: FileVideo, color: '#f44336' },
  avi: { icon: FileVideo, color: '#f44336' },
  mov: { icon: FileVideo, color: '#f44336' },
  // audio
  mp3: { icon: FileAudio, color: '#ff9800' },
  wav: { icon: FileAudio, color: '#ff9800' },
  ogg: { icon: FileAudio, color: '#ff9800' },
  flac: { icon: FileAudio, color: '#ff9800' },
  // archive
  zip: { icon: FileArchive, color: '#e53935' },
  tar: { icon: FileArchive, color: '#e53935' },
  gz: { icon: FileArchive, color: '#e53935' },
  rar: { icon: FileArchive, color: '#e53935' },
  '7z': { icon: FileArchive, color: '#e53935' },
  // other
  pdf: { icon: FileText, color: '#d32f2f' },
  doc: { icon: FileText, color: '#1976d2' },
  docx: { icon: FileText, color: '#1976d2' },
  xls: { icon: FileSpreadsheet, color: '#4caf50' },
  xlsx: { icon: FileSpreadsheet, color: '#4caf50' },
  csv: { icon: FileSpreadsheet, color: '#4caf50' },
  sql: { icon: Database, color: '#0288d1' },
  db: { icon: Database, color: '#0288d1' },
  sqlite: { icon: Database, color: '#0288d1' },
  pem: { icon: Lock, color: '#888888' },
  crt: { icon: Lock, color: '#888888' },
  key: { icon: Lock, color: '#888888' },
}

const exactMapping = {
  '.gitignore': { icon: Settings, color: '#fc6d26' },
  '.dockerignore': { icon: Settings, color: '#2496ed' },
  'dockerfile': { icon: FileCode, color: '#2496ed' },
  'package.json': { icon: FileJson, color: '#cb3837' },
  'package-lock.json': { icon: FileJson, color: '#cb3837' },
  'yarn.lock': { icon: FileJson, color: '#2c8ebb' },
  'readme.md': { icon: FileText, color: '#42a5f5' },
  'license': { icon: FileText, color: '#888888' }
}

const fileInfo = computed(() => {
  if (props.isDirectory) {
    if (props.isExpanded) {
      return { icon: FolderOpen, color: '#4fc3f7' }
    }
    return { icon: Folder, color: '#4fc3f7' }
  }

  const lowerName = props.name.toLowerCase()
  if (exactMapping[lowerName]) {
    return exactMapping[lowerName]
  }

  const parts = lowerName.split('.')
  const ext = parts.length > 1 ? parts[parts.length - 1] : ''
  
  if (iconMapping[ext]) {
    return iconMapping[ext]
  }

  return { icon: File, color: '#b0bec5' }
})

const iconComponent = computed(() => fileInfo.value.icon)
const iconColor = computed(() => fileInfo.value.color)
</script>

<style scoped>
/* Optional styling */
</style>
