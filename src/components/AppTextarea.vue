<script setup>
defineProps({
  modelValue: String,
  label: String,
  error: String,
  rows: { type: Number, default: 4 },
  placeholder: String,
  required: Boolean
})
defineEmits(['update:modelValue'])

const textareaId = 'textarea-' + Math.random().toString(36).substring(2, 9)
const errorId = 'error-' + Math.random().toString(36).substring(2, 9)
</script>

<template>
  <div class="space-y-1.5">
    <label 
      v-if="label" 
      :for="textareaId"
      class="block text-sm font-medium text-text-secondary font-body select-none"
    >
      {{ label }}
    </label>
    <textarea
      :id="textareaId"
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :required="required"
      @input="$emit('update:modelValue', $event.target.value)"
      class="input-field resize-y min-h-[100px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
