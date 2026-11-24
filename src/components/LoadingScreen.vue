<script setup lang="ts">
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
</script>

<template>
  <div
    class="fixed inset-0 z-30 mx-auto w-full lg:w-2/3 min-h-dvh bg-ink-50 text-ink-900"
    aria-busy="true"
  >
    <div class="px-5 py-6 pb-40">
      <!-- Kerangka halaman: banner lalu daftar kartu -->
      <Skeleton class="h-40 lg:h-80 w-full rounded-xl mb-4" />
      <div class="space-y-3">
        <Skeleton v-for="i in 4" :key="i" class="h-20 w-full rounded-xl" />
      </div>
    </div>

    <div class="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div class="flex items-center gap-3 rounded-xl border border-ink-200 bg-surface px-5 py-3 shadow-sm">
        <Spinner class="size-6 text-accent-1" />
        <span class="text-body text-ink-700">Memuat…</span>
      </div>
    </div>
  </div>
</template>
