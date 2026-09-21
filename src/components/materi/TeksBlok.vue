<script setup lang="ts">
import { computed } from "vue";
import { renderTeksCampuran } from "@/lib/mathText";
import type { BlokTeks } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokTeks }>();
const html = computed(() => renderTeksCampuran(props.blok.isi));
</script>

<template>
  <p class="font-serif text-body text-justify leading-relaxed text-ink-800" v-html="html"></p>
</template>
