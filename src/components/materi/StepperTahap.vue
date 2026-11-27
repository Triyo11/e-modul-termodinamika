<script setup lang="ts">
import { PhArrowLeft, PhCheck, PhHouse } from "@phosphor-icons/vue";
import { computed } from "vue";
import { labelStem, warnaTahap, type Tahap } from "@/lib/tahap";

/**
 * Penunjuk tahap yang menempel di atas layar: tombol pengantar KB, lalu satu lingkaran bernomor
 * per tahap STEM-CTL. Tahap aktif ditonjolkan, tahap yang pernah dibuka diberi centang.
 */
const props = defineProps<{
  kb: number;
  judulKb: string;
  tahap: Tahap[];
  /** Indeks tahap aktif; -1 berarti halaman pengantar KB. */
  aktif: number;
  dibuka: string[];
}>();

const emit = defineEmits<{ pilih: [id: string | null]; kembali: [] }>();

// Label tahap aktif + huruf STEM gabungan dari semua layar tahap itu (tanpa duplikat).
const tahapAktif = computed(() => (props.aktif >= 0 ? props.tahap[props.aktif] : undefined));
const stemAktif = computed(() => [...new Set(tahapAktif.value?.layar.flatMap((l) => l.stem ?? []) ?? [])]);
const warnaAktif = computed(() =>
  tahapAktif.value ? (warnaTahap[tahapAktif.value.id] ?? "var(--color-pastel-lavender)") : "var(--color-pastel-lavender)",
);
</script>

<template>
  <nav
    aria-label="Tahap pembelajaran"
    class="sticky top-0 z-20 border-b border-ink-200 bg-ink-50/95 px-3 pt-2 pb-2.5 backdrop-blur sm:px-6"
  >
    <div class="flex items-center gap-2.5 px-1">
      <button
        type="button"
        class="tombol-ikon size-9 shrink-0"
        aria-label="Kembali ke Daftar Materi"
        title="Kembali ke Daftar Materi"
        @click="emit('kembali')"
      >
        <PhArrowLeft :size="18" weight="bold" />
      </button>
      <p class="truncate text-sm text-ink-500">
        <span class="font-semibold text-accent-4-teks">KB {{ kb }}</span> · {{ judulKb }}
      </p>
    </div>

    <ol class="relative mt-1.5 flex items-center">
      <!-- Garis penghubung di belakang lingkaran -->
      <span aria-hidden="true" class="absolute inset-x-5 top-1/2 h-0.5 -translate-y-1/2 bg-ink-200"></span>

      <li class="relative flex flex-1 justify-center">
        <button
          type="button"
          class="flex size-11 items-center justify-center"
          :aria-current="aktif === -1 ? 'page' : undefined"
          aria-label="Pengantar kegiatan belajar"
          @click="emit('pilih', null)"
        >
          <span
            class="flex size-8 items-center justify-center rounded-full border-2 transition-colors"
            :class="aktif === -1 ? 'border-brand-dark bg-brand text-brand-dark' : 'border-ink-300 bg-ink-50 text-ink-600'"
          >
            <PhHouse :size="16" weight="bold" />
          </span>
        </button>
      </li>

      <li v-for="(t, i) in tahap" :key="t.id" class="relative flex flex-1 justify-center">
        <button
          type="button"
          class="flex size-11 items-center justify-center"
          :aria-current="aktif === i ? 'step' : undefined"
          :aria-label="`Tahap ${i + 1}: ${t.label}${dibuka.includes(t.id) ? ', sudah dibuka' : ''}`"
          @click="emit('pilih', t.id)"
        >
          <span
            class="relative flex size-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors"
            :class="
              aktif === i
                ? 'border-brand-dark bg-brand text-brand-dark'
                : dibuka.includes(t.id)
                  ? 'border-accent-4 bg-ink-50 text-accent-4-teks'
                  : 'border-ink-300 bg-ink-50 text-ink-600'
            "
          >
            {{ i + 1 }}
            <span
              v-if="dibuka.includes(t.id) && aktif !== i"
              aria-hidden="true"
              class="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-accent-4 text-ink-50"
            >
              <PhCheck :size="9" weight="bold" />
            </span>
          </span>
        </button>
      </li>
    </ol>

    <!-- Label tahap aktif, lalu huruf STEM di bawahnya; keduanya rata tengah. -->
    <div class="flex flex-col items-center gap-1 px-1">
      <span class="text-xs font-bold uppercase tracking-widest" :style="{ color: warnaAktif }">
        {{ tahapAktif?.label ?? "Pengantar" }}
      </span>
      <div v-if="stemAktif.length" class="flex items-center justify-center gap-1.5">
        <span
          v-for="s in stemAktif"
          :key="s"
          :title="labelStem[s]"
          class="flex size-6 items-center justify-center rounded-full border border-accent-4/60 bg-surface text-[11px] font-semibold text-accent-4-teks"
        >
          {{ s }}
        </span>
      </div>
    </div>
    <p class="sr-only" aria-live="polite">
      <template v-if="tahapAktif">Tahap {{ aktif + 1 }} dari {{ tahap.length }}: {{ tahapAktif.label }}</template>
      <template v-else>Pengantar</template>
    </p>
  </nav>
</template>
