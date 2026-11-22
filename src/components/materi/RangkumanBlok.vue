<script setup lang="ts">
import { computed, inject } from "vue";
import { PhLockSimple } from "@phosphor-icons/vue";
import RumusBlok from "./RumusBlok.vue";
import { renderTeksCampuran } from "@/lib/mathText";
import { useJawabanTersimpan } from "@/lib/jawabanTersimpan";
import { kegiatanKey } from "@/lib/tabelIsian";
import type { BlokRumus, Rangkuman } from "@/types/kegiatan";

// Hanya dirender LayarSection untuk kegiatan yang punya rangkuman.
const kegiatan = inject(kegiatanKey)!.value;
const rangkuman = kegiatan.rangkuman as Rangkuman;

const kunciKesimpulan = `${kegiatan.id}:${rangkuman.tampilSetelah}`;
const kesimpulan = useJawabanTersimpan<string>(kunciKesimpulan, "");
const terkirim = useJawabanTersimpan<boolean>(
  `${kunciKesimpulan}:terkirim`,
  false,
);
const bisaDikirim = computed(() => kesimpulan.value.trim() !== "");

const poin = rangkuman.poin.map((p) => ({
  ...p,
  teksHtml: renderTeksCampuran(p.teks),
}));

const semuaRumus = kegiatan.layar
  .flatMap((l) => l.blok)
  .filter((b): b is BlokRumus => b.tipe === "rumus");
const rumusKunci = rangkuman.rumusKunci.flatMap((nomor) => {
  const blok = semuaRumus.find((r) => r.nomor === nomor);
  if (!blok)
    console.warn(
      `Rangkuman ${kegiatan.id}: rumus nomor ${nomor} tidak ditemukan.`,
    );
  return blok ? [blok] : [];
});
</script>

<template>
  <div
    v-if="!terkirim"
    class="flex flex-col items-start gap-2 rounded-xl border border-dashed border-ink-300 bg-white p-4"
  >
    <p class="flex items-center gap-1.5 text-sm text-ink-600">
      <PhLockSimple :size="16" weight="bold" class="shrink-0" />
      Kirim kesimpulan Anda di atas untuk membuka rangkuman.
    </p>
    <button
      type="button"
      :disabled="!bisaDikirim"
      class="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-dark disabled:opacity-40"
      @click="terkirim = true"
    >
      Kirim kesimpulan dan buka rangkuman
    </button>
  </div>

  <div
    v-else
    class="flex flex-col gap-4 rounded-xl border border-ink-200 bg-white p-4"
  >
    <p class="text-lg font-semibold text-ink-900">{{ rangkuman.judul }}</p>

    <ul
      class="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-ink-700"
    >
      <li v-for="p in poin" :key="p.tp">
        <span class="mr-1.5 font-semibold text-ink-800">{{ p.tp }}</span
        ><span v-html="p.teksHtml"></span>
      </li>
    </ul>

    <div class="rounded-lg border border-accent-1/30 bg-accent-1/5 p-3">
      <p class="font-semibold text-accent-1">Literasi informasi</p>
      <p class="mt-0.5 text-sm leading-relaxed text-ink-700">
        {{ rangkuman.literasiInformasi }}
      </p>
    </div>

    <div v-if="rumusKunci.length" class="flex flex-col gap-2">
      <p class="font-semibold text-ink-800">Rumus kunci</p>
      <RumusBlok v-for="r in rumusKunci" :key="r.nomor" :blok="r" />
    </div>
  </div>
</template>
