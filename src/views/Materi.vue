<script setup lang="ts">
import LayarSection from "@/components/materi/LayarSection.vue";
import kegiatan from "@/content/kegiatan-03-teori-kinetik-gas.json";
import type { Kegiatan } from "@/types/kegiatan";

const data = kegiatan as unknown as Kegiatan;
</script>

<template>
  <div class="min-h-dvh bg-ink-50 text-ink-900 font-sans">
    <main class="flex flex-col gap-8 px-5 py-6 pb-40">
      <section class="flex flex-col gap-3">
        <span class="text-sm font-semibold uppercase tracking-wide text-ink-400">
          {{ data.bab }} · Kelas {{ data.kelas }} · {{ data.alokasiWaktu }} menit
        </span>
        <h1 class="text-2xl font-bold text-ink-900">{{ data.judul }}</h1>
        <p class="text-body text-ink-600">{{ data.subJudul }}</p>

        <div v-if="data.prasyarat.length" class="flex flex-wrap gap-1.5">
          <span
            v-for="p in data.prasyarat"
            :key="p"
            class="rounded-full bg-ink-100 px-2.5 py-1 text-sm text-ink-600"
          >
            {{ p }}
          </span>
        </div>

        <div class="rounded-xl border border-ink-200 bg-white p-4">
          <p class="font-semibold text-ink-800">Tujuan pembelajaran</p>
          <ul class="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed text-ink-700">
            <li v-for="t in data.tujuanPembelajaran" :key="t">{{ t }}</li>
          </ul>
        </div>
      </section>

      <LayarSection v-for="l in data.layar" :key="l.id" :layar="l" :kegiatan-id="data.id" />

      <section v-if="data.glosarium.length" class="flex flex-col gap-3">
        <h2 class="text-xl font-semibold text-ink-900">Glosarium</h2>
        <dl class="flex flex-col gap-2 rounded-xl border border-ink-200 bg-white p-4">
          <div v-for="g in data.glosarium" :key="g.istilah">
            <dt class="font-medium text-ink-800">{{ g.istilah }}</dt>
            <dd class="text-sm text-ink-600">{{ g.arti }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="data.referensi.length" class="flex flex-col gap-2">
        <h2 class="text-xl font-semibold text-ink-900">Referensi</h2>
        <ol class="flex list-decimal flex-col gap-1 pl-5 text-sm text-ink-600">
          <li v-for="r in data.referensi" :key="r">{{ r }}</li>
        </ol>
      </section>
    </main>
  </div>
</template>
