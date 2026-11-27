<script setup lang="ts">
import type { BlokRubrik } from "@/types/kegiatan";

defineProps<{ blok: BlokRubrik }>();
</script>

<template>
  <div class="kotak-rubrik flex flex-col gap-2">
    <span class="label-rubrik rounded-full px-3 py-0.5 text-xs font-bold">Rubrik penilaian</span>
    <p class="font-semibold text-ink-800">{{ blok.judul }}</p>

    <div class="flex flex-col gap-3 sm:hidden">
      <div v-for="k in blok.kriteria" :key="k.aspek" class="rounded-xl border border-ink-200 p-3">
        <p class="font-medium text-ink-800">{{ k.aspek }}</p>
        <dl class="mt-2 flex flex-col gap-1.5">
          <div v-for="s in blok.skala" :key="s" class="flex gap-2 text-sm">
            <dt class="w-6 shrink-0 font-semibold text-accent">{{ s }}</dt>
            <dd class="text-ink-700">{{ k.deskriptor[String(s)] }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="hidden overflow-x-auto sm:block">
      <table class="w-full border-collapse text-left text-sm">
        <thead>
          <tr class="border-b border-ink-200">
            <th class="py-2 pr-4 font-semibold text-ink-800">Aspek</th>
            <th v-for="s in blok.skala" :key="s" class="py-2 pr-4 font-semibold text-ink-800">Skor {{ s }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="k in blok.kriteria" :key="k.aspek" class="border-b border-ink-100">
            <td class="py-2 pr-4 align-top font-medium text-ink-800">{{ k.aspek }}</td>
            <td v-for="s in blok.skala" :key="s" class="py-2 pr-4 align-top text-ink-700">
              {{ k.deskriptor[String(s)] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
