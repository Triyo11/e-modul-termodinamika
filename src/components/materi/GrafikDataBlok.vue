<script setup lang="ts">
import { computed } from "vue";
import { useJawabanTersimpan } from "@/lib/jawabanTersimpan";
import { formatAngka, nilaiBaris, useCariBlok, type BarisTabel } from "@/lib/tabelIsian";
import type { BlokGrafikData, BlokTabelIsian } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokGrafikData; kegiatanId: string }>();

const sumber = useCariBlok()(props.blok.sumberData) as BlokTabelIsian | undefined;
const baris = useJawabanTersimpan<BarisTabel[]>(
  `${props.kegiatanId}:${props.blok.sumberData}`,
  Array.from({ length: sumber?.jumlahBaris ?? 0 }, () => ({})),
);

const titik = computed(() => {
  if (!sumber) return [];
  return baris.value
    .map((b) => nilaiBaris(sumber.kolom, b))
    .map((n) => ({ x: n[props.blok.sumbuX] ?? null, y: n[props.blok.sumbuY] ?? null }))
    .filter((t): t is { x: number; y: number } => t.x !== null && t.y !== null);
});

// Ukuran area gambar dalam satuan SVG.
const L = 320;
const T = 220;
const pad = { kiri: 48, bawah: 36, atas: 12, kanan: 12 };
const lebar = L - pad.kiri - pad.kanan;
const tinggi = T - pad.atas - pad.bawah;

const melaluiNol = computed(() => props.blok.garisTren === "linear-melalui-nol");

const skala = computed(() => {
  const xs = titik.value.map((t) => t.x);
  const ys = titik.value.map((t) => t.y);
  const minX = melaluiNol.value ? Math.min(0, ...xs) : Math.min(...xs);
  const minY = melaluiNol.value ? Math.min(0, ...ys) : Math.min(...ys);
  const rentangX = Math.max(...xs) - minX || 1;
  const rentangY = Math.max(...ys) - minY || 1;
  return { minX, minY, maxX: minX + rentangX * 1.08, maxY: minY + rentangY * 1.08 };
});

const px = (x: number) => pad.kiri + ((x - skala.value.minX) / (skala.value.maxX - skala.value.minX)) * lebar;
const py = (y: number) => pad.atas + tinggi - ((y - skala.value.minY) / (skala.value.maxY - skala.value.minY)) * tinggi;

/** Gradien garis kuadrat terkecil yang dipaksa melalui titik nol: k = Σxy / Σx². */
const gradien = computed(() => {
  if (!melaluiNol.value || titik.value.length < 2) return null;
  const sxy = titik.value.reduce((s, t) => s + t.x * t.y, 0);
  const sxx = titik.value.reduce((s, t) => s + t.x * t.x, 0);
  return sxx ? sxy / sxx : null;
});

const garis = computed(() => {
  if (gradien.value === null) return null;
  const x2 = skala.value.maxX;
  return { x1: px(0), y1: py(0), x2: px(x2), y2: py(gradien.value * x2) };
});

const tick = (min: number, max: number) => [0, 0.5, 1].map((f) => min + (max - min) * f);
</script>

<template>
  <div class="flex flex-col gap-2 rounded-xl border border-ink-200 bg-white p-4">
    <p v-if="blok.instruksi" class="text-sm text-ink-700">{{ blok.instruksi }}</p>

    <p v-if="!sumber" class="text-sm text-salah">Tabel data "{{ blok.sumberData }}" tidak ditemukan.</p>
    <p v-else-if="titik.length < 2" class="rounded-lg bg-ink-100 p-3 text-sm text-ink-600">
      Grafik akan muncul setelah minimal dua baris pada tabel "{{ sumber.judul ?? blok.sumberData }}" terisi.
    </p>

    <svg
      v-else
      :viewBox="`0 0 ${L} ${T}`"
      class="w-full max-w-md self-center"
      role="img"
      :aria-label="`Grafik ${blok.labelY} terhadap ${blok.labelX}`"
    >
      <line :x1="pad.kiri" :y1="pad.atas + tinggi" :x2="pad.kiri + lebar" :y2="pad.atas + tinggi" class="stroke-ink-400" />
      <line :x1="pad.kiri" :y1="pad.atas" :x2="pad.kiri" :y2="pad.atas + tinggi" class="stroke-ink-400" />

      <g class="fill-ink-500 text-[9px]">
        <text v-for="v in tick(skala.minX, skala.maxX)" :key="`x${v}`" :x="px(v)" :y="pad.atas + tinggi + 12" text-anchor="middle">
          {{ formatAngka(v) }}
        </text>
        <text v-for="v in tick(skala.minY, skala.maxY)" :key="`y${v}`" :x="pad.kiri - 4" :y="py(v) + 3" text-anchor="end">
          {{ formatAngka(v) }}
        </text>
      </g>
      <text :x="pad.kiri + lebar / 2" :y="T - 4" text-anchor="middle" class="fill-ink-700 text-[10px]">{{ blok.labelX }}</text>
      <text
        :x="10"
        :y="pad.atas + tinggi / 2"
        text-anchor="middle"
        :transform="`rotate(-90 10 ${pad.atas + tinggi / 2})`"
        class="fill-ink-700 text-[10px]"
      >
        {{ blok.labelY }}
      </text>

      <line v-if="garis" v-bind="garis" class="stroke-accent-1" stroke-width="1.5" stroke-dasharray="4 3" />
      <circle v-for="(t, i) in titik" :key="i" :cx="px(t.x)" :cy="py(t.y)" r="4" class="fill-accent-3" />
    </svg>

    <p v-if="gradien !== null && titik.length >= 2" class="text-xs text-ink-500">
      Garis putus-putus: garis lurus terbaik yang melalui titik nol, gradien ≈ {{ formatAngka(gradien) }}.
    </p>
  </div>
</template>
