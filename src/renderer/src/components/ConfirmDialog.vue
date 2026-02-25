<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="confirm-mask" @click.self="handleCancel">
        <Transition name="zoom">
          <div v-if="visible" class="confirm-dialog">
            <div class="confirm-icon" :class="type">
              <svg v-if="type === 'danger'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <svg v-else-if="type === 'warning'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div class="confirm-content">
              <h3 class="confirm-title">{{ title }}</h3>
              <p v-if="message" class="confirm-message">{{ message }}</p>
            </div>
            <div class="confirm-actions">
              <button class="btn btn-ghost" @click="handleCancel">
                {{ cancelText || $t('common.cancel') }}
              </button>
              <button class="btn" :class="type === 'danger' ? 'btn-danger' : 'btn-primary'" @click="handleConfirm">
                {{ confirmText || $t('common.confirm') }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }, // 'info' | 'warning' | 'danger'
  confirmText: { type: String, default: '' },
  cancelText: { type: String, default: '' }
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

function handleConfirm() {
  emit('confirm')
  emit('update:visible', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped>
.confirm-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.confirm-dialog {
  width: 340px;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.confirm-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.confirm-icon.danger {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.confirm-icon.warning {
  background: rgba(251, 191, 36, 0.15);
  color: var(--color-warning);
}

.confirm-icon.info {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.confirm-content {
  margin-bottom: 20px;
}

.confirm-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 6px;
}

.confirm-message {
  font-size: 13px;
  color: var(--color-text-2);
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.confirm-actions .btn {
  flex: 1;
  justify-content: center;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.2s ease;
}

.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
