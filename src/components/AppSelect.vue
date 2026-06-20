<script setup>
defineProps({
  modelValue: String,
  label: String,
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Seleccionar...' },
  error: String
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-stone-700 font-body">{{ label }}</label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      class="input-field appearance-none bg-no-repeat select-chevron"
      :class="error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <p v-if="error" class="text-xs text-red-500 font-body">{{ error }}</p>
  </div>
</template>

<style scoped>
.select-chevron {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-size: 1.25rem;
}
</style>
