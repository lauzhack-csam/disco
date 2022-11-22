<template>
  <div
    class="
      flex flex-col
      p-7 gap-4
      bg-white
      rounded-lg
      transition duration-200
      group
      hover:-translate-y-1 hover:scale-[101%]
      hover:outline hover:outline-2 hover:outline-disco-cyan
      hover:cursor-pointer
    "
  >
    <div
      :class="'text-' + titlePlacement"
      class="text-xl text-disco-blue group-hover:text-disco-cyan"
    >
      <slot name="title" />
    </div>
    <div class="text-slate-500">
      <slot name="text" />
    </div>
    <div
      :class="'text-' + buttonPlacement"
      class="mt-auto"
    >
      <CustomButton>
        <slot name="button" />
      </CustomButton>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'

import CustomButton from '@/components/simple/CustomButton.vue'

export default defineComponent({
  name: 'ButtonCard',
  components: {
    CustomButton
  },
  props: {
    titlePlacement: {
      type: String,
      default: 'left'
    },
    buttonPlacement: {
      type: String,
      default: 'center'
    }
  }
})
</script>
