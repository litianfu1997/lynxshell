<template>
  <div ref="editorRef" class="monaco-editor-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

const props = defineProps({
  modelValue: { type: String, default: '' },
  language: { type: String, default: 'plaintext' },
  theme: { type: String, default: 'vs-dark' },
  readOnly: { type: Boolean, default: false },
  fontSize: { type: Number, default: 13 }
})

const emit = defineEmits(['update:modelValue', 'save'])

const editorRef = ref(null)
let editor = null

onMounted(async () => {
  // Use a nicer dark theme close to VSCode default dark+
  monaco.editor.defineTheme('openssh-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6b7a8a', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569cd6' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'number', foreground: 'b5cea8' },
      { token: 'type', foreground: '4ec9b0' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#161b22',
      'editor.selectionBackground': '#264f78',
      'editorLineNumber.foreground': '#3b4455',
      'editorLineNumber.activeForeground': '#7d8da1',
      'editor.inactiveSelectionBackground': '#1f2937',
      'editorCursor.foreground': '#4f8ef7',
      'editorIndentGuide.background1': '#21262d',
      'editorWidget.background': '#161b22',
      'editorSuggestWidget.background': '#161b22',
      'editorSuggestWidget.border': '#30363d',
      'scrollbarSlider.background': '#30363d66',
      'scrollbarSlider.hoverBackground': '#484f5888',
      'minimap.background': '#0d1117',
    }
  })

  editor = monaco.editor.create(editorRef.value, {
    value: props.modelValue,
    language: props.language,
    theme: 'openssh-dark',
    readOnly: props.readOnly,
    fontSize: props.fontSize,
    fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace",
    fontLigatures: true,
    lineNumbers: 'on',
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    wordWrap: 'off',
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    folding: true,
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true, indentation: true },
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    renderLineHighlight: 'all',
    padding: { top: 8, bottom: 8 },
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }
  })

  // Emit changes
  editor.onDidChangeModelContent(() => {
    emit('update:modelValue', editor.getValue())
  })

  // Ctrl+S to save
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    emit('save', editor.getValue())
  })
})

// Update content from outside
watch(() => props.modelValue, (val) => {
  if (editor && editor.getValue() !== val) {
    editor.setValue(val || '')
  }
})

// Update language
watch(() => props.language, (lang) => {
  if (editor && monaco) {
    monaco.editor.setModelLanguage(editor.getModel(), lang)
  }
})

onUnmounted(() => {
  editor?.dispose()
})

// Expose focus
defineExpose({
  focus: () => editor?.focus(),
  getValue: () => editor?.getValue()
})
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
}
</style>
