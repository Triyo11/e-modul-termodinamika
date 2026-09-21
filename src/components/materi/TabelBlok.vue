<script setup lang="ts">
import { computed } from "vue";
import { renderTeksCampuran } from "@/lib/mathText";
import type { BlokTabel } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokTabel }>();

const baris = computed(() =>
  props.blok.baris.map((sel) => sel.map((cell) => renderTeksCampuran(cell))),
);
const kolom = computed(() => props.blok.kolom.map((k) => renderTeksCampuran(k)));
</script>

<template>
  <div class="flex flex-col gap-2">
    <p v-if="blok.judul" class="font-semibold text-ink-800">{{ blok.judul }}</p>

    <div v-if="blok.mobile === 'kartu'" class="flex flex-col gap-3 sm:hidden">
      <div v-for="(baris1, i) in baris" :key="i" class="rounded-xl border border-ink-200 p-3">
        <dl class="flex flex-col gap-1.5">
          <div v-for="(sel, j) in baris1" :key="j" class="flex flex-col gap-0.5">
            <dt class="text-xs font-medium uppercase tracking-wide text-ink-400" v-html="kolom[j]"></dt>
            <dd class="text-justify text-sm text-ink-800" v-html="sel"></dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="overflow-x-auto" :class="blok.mobile === 'kartu' ? 'hidden sm:block' : ''">
      <table class="w-full border-collapse text-left text-sm">
        <thead>
          <tr class="border-b border-ink-200">
            <th v-for="(k, j) in kolom" :key="j" class="py-2 pr-4 font-semibold text-ink-800" v-html="k"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(baris1, i) in baris" :key="i" class="border-b border-ink-100">
            <td v-for="(sel, j) in baris1" :key="j" class="py-2 pr-4 align-top text-ink-700" v-html="sel"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
