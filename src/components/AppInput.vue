<script setup>
defineProps({
  modelValue: String,
  label: String,
  type: { type: String, default: 'text' },
  error: String,
  placeholder: String
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="label" class="block text-sm font-medium text-stone-700 font-body">{{ label }}</label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
      class="input-field"
      :class="error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''"
    />
    <p v-if="error" class="text-xs text-red-500 font-body">{{ error }}</p>
  </div>
</template>
