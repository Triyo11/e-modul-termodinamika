<script setup lang="ts">
import { computed, ref, type Ref } from "vue";
import { renderTeksCampuran } from "@/lib/mathText";
import { useJawabanTersimpan } from "@/lib/jawabanTersimpan";
import type { BlokIsian } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokIsian; kegiatanId: string }>();

const pertanyaanHtml = computed(() => renderTeksCampuran(props.blok.pertanyaan));
const petunjukHtml = computed(() => renderTeksCampuran(props.blok.petunjuk ?? ""));
const kunciSimpan = `${props.kegiatanId}:${props.blok.id}`;
// Satu kunci penyimpanan per blok; bentuk nilainya bergantung pada format.
const modeKelompok = props.blok.format === "pilih-kelompok";
const tersimpan = useJawabanTersimpan<string | Record<string, string>>(kunciSimpan, modeKelompok ? {} : "");
const jawaban = tersimpan as Ref<string>;
const pilihanKelompok = tersimpan as Ref<Record<string, string>>;
const sudahDiperiksa = ref(false);

const cocok = computed(() => {
  if (props.blok.format !== "angka" || props.blok.jawabanRujukan === undefined) return null;
  const nilai = Number(jawaban.value);
  if (Number.isNaN(nilai)) return false;
  const toleransi = props.blok.toleransi ?? 0;
  return Math.abs(nilai - props.blok.jawabanRujukan) <= toleransi;
});

const jumlahBenar = computed(
  () => (props.blok.butir ?? []).filter((b) => pilihanKelompok.value[b] === props.blok.kunci?.[b]).length,
);

function pilihKelompok(butir: string, kelompok: string) {
  pilihanKelompok.value = { ...pilihanKelompok.value, [butir]: kelompok };
  sudahDiperiksa.value = false;
}

function kelasKelompok(butir: string, kelompok: string) {
  const dipilih = pilihanKelompok.value[butir] === kelompok;
  if (!dipilih) return "border-ink-200 text-ink-600 hover:border-accent/60";
  if (!sudahDiperiksa.value) return "border-accent-1 bg-accent-1/10 text-accent-1";
  return props.blok.kunci?.[butir] === kelompok
    ? "border-benar bg-benar/10 text-benar"
    : "border-salah bg-salah/10 text-salah";
}

function periksa() {
  sudahDiperiksa.value = true;
}
</script>

<template>
  <div class="rounded-xl border border-ink-200 p-4">
    <p class="font-medium text-ink-800" v-html="pertanyaanHtml"></p>

    <div v-if="blok.format === 'pilih-kelompok'" class="mt-3 flex flex-col gap-2">
      <div
        v-for="b in blok.butir"
        :key="b"
        class="flex flex-col gap-2 rounded-lg border border-ink-100 p-2.5 sm:flex-row sm:items-center sm:justify-between"
      >
        <span class="text-sm text-ink-800">{{ b }}</span>
        <div class="flex gap-2">
          <button
            v-for="k in blok.kelompok"
            :key="k"
            type="button"
            class="rounded-lg border px-3 py-1.5 text-sm transition-colors"
            :class="kelasKelompok(b, k)"
            @click="pilihKelompok(b, k)"
          >
            {{ k }}
          </button>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-dark"
          @click="periksa"
        >
          Periksa jawaban
        </button>
        <p v-if="sudahDiperiksa" class="text-sm font-medium text-ink-700">
          {{ jumlahBenar }} dari {{ blok.butir?.length ?? 0 }} butir sudah tepat.
        </p>
      </div>
    </div>

    <textarea
      v-else-if="blok.format === 'teks-panjang'"
      v-model="jawaban"
      :rows="blok.baris ?? 3"
      placeholder="Tulis jawabanmu di sini..."
      class="mt-3 w-full resize-y rounded-lg border border-ink-200 p-2.5 text-md text-ink-800 outline-none focus:border-accent"
    ></textarea>

    <div v-else class="mt-3 flex flex-wrap items-center gap-2">
      <input
        v-model="jawaban"
        type="number"
        :inputmode="(blok.inputmode as any) ?? 'decimal'"
        placeholder="0"
        class="w-32 rounded-lg border border-ink-200 p-2.5 text-sm text-ink-800 outline-none focus:border-accent"
        @change="sudahDiperiksa = false"
      />
      <span v-if="blok.satuan" class="text-sm text-ink-500">{{ blok.satuan }}</span>
      <button
        type="button"
        class="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-dark"
        @click="periksa"
      >
        Periksa jawaban
      </button>
      <p v-if="sudahDiperiksa" class="w-full text-sm font-medium" :class="cocok ? 'text-benar' : 'text-salah'">
        {{ cocok ? "Jawaban Anda sesuai rentang yang diharapkan." : "Coba periksa kembali perhitungan Anda." }}
      </p>
    </div>

    <p v-if="blok.wajibSumber" class="mt-2 text-sm text-periksa">
      Cantumkan minimal {{ blok.minSumber ?? 1 }} sumber yang Anda pakai.
    </p>

    <details v-if="blok.petunjuk" class="mt-2 text-sm text-ink-500">
      <summary class="cursor-pointer select-none">Petunjuk</summary>
      <p class="mt-1" v-html="petunjukHtml"></p>
    </details>
  </div>
</template>
