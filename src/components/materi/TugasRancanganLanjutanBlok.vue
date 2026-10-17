<script setup lang="ts">
import { PhCompassTool } from "@phosphor-icons/vue";
import LangkahRancangan from "./LangkahRancangan.vue";
import { useCariBlok } from "@/lib/tabelIsian";
import type { BlokTugasRancangan, BlokTugasRancanganLanjutan } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokTugasRancanganLanjutan; kegiatanId: string }>();
const tugas = useCariBlok()(props.blok.tugas) as BlokTugasRancangan | undefined;
</script>

<template>
  <div class="flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
    <div class="flex items-center gap-2">
      <PhCompassTool :size="20" class="shrink-0 text-accent" weight="bold" />
      <p class="text-sm font-semibold text-accent">
        Lanjutan tugas rancangan<template v-if="tugas">: {{ tugas.judul }}</template>
      </p>
    </div>
    <LangkahRancangan
      v-for="l in blok.langkah"
      :key="l.id"
      :langkah="l"
      :kegiatan-id="kegiatanId"
      :tugas-id="blok.tugas"
    />
  </div>
</template>
