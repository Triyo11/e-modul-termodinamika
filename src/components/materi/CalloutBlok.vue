<script setup lang="ts">
import { computed } from "vue";
import { renderTeksCampuran } from "@/lib/mathText";
import type { BlokCallout } from "@/types/kegiatan";
import { PhWarning, PhPushPin, PhLightbulb } from "@phosphor-icons/vue";

const props = defineProps<{ blok: BlokCallout }>();
const html = computed(() => renderTeksCampuran(props.blok.isi));

const gaya: Record<string, { ikon: string; kelas: string }> = {
  "hati-hati": {
    ikon: "warning",
    kelas: "border-periksa/40 bg-periksa/10 text-periksa",
  },
  ingat: {
    ikon: "push_pin",
    kelas: "border-accent/40 bg-accent/10 text-accent",
  },
  tahukah: {
    ikon: "lightbulb",
    kelas: "border-brand-dark/30 bg-brand-light text-brand-dark",
  },
};

const gayaAktif = computed(() => gaya[props.blok.gaya] ?? gaya.ingat);
</script>

<template>
  <div class="flex gap-3 rounded-xl border p-4" :class="gayaAktif.kelas">
    <span v-if="gayaAktif.ikon == 'warning'" class="shrink-0"
      ><PhWarning :size="32" weight="bold"
    /></span>
    <span v-else-if="gayaAktif.ikon == 'push_pin'" class="shrink-0"
      ><PhPushPin :size="32" weight="bold"
    /></span>
    <span v-else-if="gayaAktif.ikon == 'lightbulb'" class="shrink-0"
      ><PhLightbulb :size="32" weight="bold"
    /></span>
    <div class="min-w-0">
      <p v-if="blok.judul" class="font-semibold">{{ blok.judul }}</p>
      <p class="mt-0.5 text-sm text-justify leading-relaxed" v-html="html"></p>
    </div>
  </div>
</template>
