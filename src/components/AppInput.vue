<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  type: { type: String, default: 'text' },
  error: String,
  placeholder: String,
  required: Boolean
})
defineEmits(['update:modelValue'])

const inputId = 'input-' + Math.random().toString(36).substring(2, 9)
const errorId = 'error-' + Math.random().toString(36).substring(2, 9)
</script>

<template>
  <div class="space-y-1.5">
    <label 
      v-if="label" 
      :for="inputId"
      class="block text-sm font-medium text-text-secondary font-body select-none"
    >
      {{ label }}
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      @input="$emit('update:modelValue', $event.target.value)"
      class="input-field focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      :class="error ? 'border-negative focus:border-negative' : ''"
      :aria-describedby="error ? errorId : undefined"
      :aria-invalid="error ? 'true' : 'false'"
    />
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
