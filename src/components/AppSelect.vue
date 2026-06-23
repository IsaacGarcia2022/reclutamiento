<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Seleccionar...' },
  error: String,
  required: Boolean
})
defineEmits(['update:modelValue'])

const selectId = 'select-' + Math.random().toString(36).substring(2, 9)
const errorId = 'error-' + Math.random().toString(36).substring(2, 9)
</script>

<template>
  <div class="space-y-1.5">
    <label 
      v-if="label" 
      :for="selectId"
      class="block text-sm font-medium text-text-secondary font-body select-none"
    >
      {{ label }}
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      :required="required"
      @change="$emit('update:modelValue', $event.target.value)"
      class="input-field appearance-none bg-no-repeat select-chevron focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      :class="error ? 'border-negative focus:border-negative' : ''"
      :aria-describedby="error ? errorId : undefined"
      :aria-invalid="error ? 'true' : 'false'"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <p 
      v-if="error" 
      :id="errorId"
      class="text-xs text-negative font-body"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.select-chevron {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2365757C' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-size: 1.25rem;
}
</style>
