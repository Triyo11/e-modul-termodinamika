<script setup lang="ts">
import { PhCompassTool } from "@phosphor-icons/vue";
import LangkahRancangan from "./LangkahRancangan.vue";
import type { BlokTugasRancangan } from "@/types/kegiatan";

defineProps<{ blok: BlokTugasRancangan; kegiatanId: string }>();
</script>

<template>
  <div class="flex flex-col gap-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
    <div class="flex gap-3">
      <PhCompassTool :size="32" class="shrink-0 text-accent" weight="bold" />
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-accent">Tugas rancangan kelompok</p>
        <p class="font-semibold text-ink-900">{{ blok.judul }}</p>
      </div>
    </div>

    <p class="text-justify text-body leading-relaxed text-ink-800">{{ blok.masalah }}</p>

    <div class="grid gap-3 sm:grid-cols-2">
      <div>
        <p class="text-sm font-semibold text-ink-800">Kriteria</p>
        <ul class="mt-1 flex list-disc flex-col gap-1 pl-5 text-sm text-ink-700">
          <li v-for="k in blok.kriteria" :key="k">{{ k }}</li>
        </ul>
      </div>
      <div>
        <p class="text-sm font-semibold text-ink-800">Batasan</p>
        <ul class="mt-1 flex list-disc flex-col gap-1 pl-5 text-sm text-ink-700">
          <li v-for="b in blok.batasan" :key="b">{{ b }}</li>
        </ul>
      </div>
    </div>

    <div>
      <p class="text-sm font-semibold text-ink-800">Peran dalam kelompok</p>
      <dl class="mt-1 grid gap-2 sm:grid-cols-2">
        <div v-for="p in blok.peranKelompok" :key="p.peran" class="rounded-lg border border-ink-200 bg-white p-2.5">
          <dt class="text-sm font-medium text-ink-800">{{ p.peran }}</dt>
          <dd class="text-sm text-ink-600">{{ p.tugas }}</dd>
        </div>
      </dl>
    </div>

    <p v-if="blok.produk" class="text-sm text-ink-700"><span class="font-semibold">Produk:</span> {{ blok.produk }}</p>

    <div class="flex flex-col gap-4 rounded-lg border border-ink-200 bg-white p-3">
      <LangkahRancangan
        v-for="l in blok.langkah"
        :key="l.id"
        :langkah="l"
        :kegiatan-id="kegiatanId"
        :tugas-id="blok.id"
      />
    </div>
  </div>
</template>
