<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

interface SkeletonProps {
  class?: HTMLAttributes["class"]
}

const props = defineProps<SkeletonProps>()
</script>

<template>
  <!-- bg-accent di shadcn diganti ink-200 karena accent proyek ini biru tua -->
  <div
    data-slot="skeleton"
    :class="cn('animate-pulse rounded-md bg-ink-200', props.class)"
  />
</template>
