import { effectScope, ref, watch, type Ref } from "vue";

// Ref dengan kunci sama dipakai bersama, supaya blok lain (mis. grafik-data, refleksi)
// langsung ikut berubah saat jawaban di blok sumbernya diubah.
const cache = new Map<string, Ref<unknown>>();

/** State reaktif yang otomatis tersinkron ke localStorage (untuk jawaban LKPD/kuis). */
export function useJawabanTersimpan<T>(kunci: string, nilaiAwal: T): Ref<T> {
  const ada = cache.get(kunci);
  if (ada) return ada as Ref<T>;

  let nilaiTersimpan: T = nilaiAwal;
  const mentah = localStorage.getItem(kunci);
  if (mentah !== null) {
    try {
      nilaiTersimpan = JSON.parse(mentah) as T;
    } catch {
      nilaiTersimpan = nilaiAwal;
    }
  }

  const nilai = ref(nilaiTersimpan) as Ref<T>;
  // Scope terlepas agar watcher tetap hidup walau komponen pertama yang memakainya di-unmount.
  effectScope(true).run(() =>
    watch(
      nilai,
      (baru) => {
        localStorage.setItem(kunci, JSON.stringify(baru));
      },
      { deep: true },
    ),
  );
  cache.set(kunci, nilai as Ref<unknown>);
  return nilai;
}
