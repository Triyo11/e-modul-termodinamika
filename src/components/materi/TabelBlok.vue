<script setup lang="ts">
import { computed } from "vue";
import { PhLockSimple } from "@phosphor-icons/vue";
import { renderTeksCampuran } from "@/lib/mathText";
import { useJawabanTersimpan } from "@/lib/jawabanTersimpan";
import { tabelLengkap, useCariBlok, type BarisTabel } from "@/lib/tabelIsian";
import type { BlokTabel, BlokTabelIsian } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokTabel; kegiatanId?: string }>();

// Tabel dengan `tampilSetelah` (mis. tabel rujukan) baru dapat dibuka setelah tabel isian sumbernya lengkap.
const sumber = props.blok.tampilSetelah
  ? (useCariBlok()(props.blok.tampilSetelah) as BlokTabelIsian | undefined)
  : undefined;
const isianSumber = useJawabanTersimpan<BarisTabel[]>(`${props.kegiatanId}:${props.blok.tampilSetelah ?? ""}`, []);
const dibuka = useJawabanTersimpan<boolean>(
  `${props.kegiatanId}:${props.blok.tampilSetelah ?? ""}:rujukan-dibuka`,
  false,
);
const terkunci = computed(() => !!sumber && !dibuka.value);
const sumberLengkap = computed(() => !!sumber && tabelLengkap(sumber, isianSumber.value));

const baris = computed(() =>
  props.blok.baris.map((sel) => sel.map((cell) => renderTeksCampuran(cell))),
);
const kolom = computed(() => props.blok.kolom.map((k) => renderTeksCampuran(k)));
</script>

<template>
  <div class="flex flex-col gap-2">
    <p v-if="blok.judul" class="font-semibold text-ink-800">{{ blok.judul }}</p>

    <div v-if="terkunci" class="flex flex-col items-start gap-2 rounded-xl border border-dashed border-ink-300 bg-white p-4">
      <p class="flex items-center gap-1.5 text-sm text-ink-600">
        <PhLockSimple :size="16" weight="bold" />
        {{
          sumberLengkap
            ? "Tabel Anda sudah lengkap. Bandingkan dengan tabel rujukan."
            : `Lengkapi dulu tabel "${sumber?.judul ?? blok.tampilSetelah}" untuk membuka tabel ini.`
        }}
      </p>
      <button
        type="button"
        :disabled="!sumberLengkap"
        class="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-dark disabled:opacity-40"
        @click="dibuka = true"
      >
        Tampilkan tabel rujukan
      </button>
    </div>

    <template v-else>
    <div v-if="blok.mobile === 'kartu'" class="flex flex-col gap-3 sm:hidden">
      <div v-for="(baris1, i) in baris" :key="i" class="rounded-xl border border-ink-200 p-3">
        <dl class="flex flex-col gap-1.5">
          <div v-for="(sel, j) in baris1" :key="j" class="flex flex-col gap-0.5">
            <dt class="text-xs font-medium uppercase tracking-wide text-ink-500" v-html="kolom[j]"></dt>
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
    <p v-if="blok.sumber" class="text-xs text-ink-500">Sumber: {{ blok.sumber }}</p>
    </template>
  </div>
</template>
