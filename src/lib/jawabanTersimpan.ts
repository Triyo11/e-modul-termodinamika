import { effectScope, ref, watch, type Ref } from "vue";

// Ref dengan kunci sama dipakai bersama, supaya blok lain (mis. grafik-data, refleksi)
// langsung ikut berubah saat jawaban di blok sumbernya diubah.
const cache = new Map<string, Ref<unknown>>();

/**
 * Menghapus jawaban dari berkas KB 3 lama (teori kinetik gas). Berkas penggantinya memakai id kegiatan
 * dan id blok yang sama, sehingga tanpa ini jawaban lama (termasuk kuis yang terkunci) muncul di KB 3 baru.
 * Hanya berjalan sekali per peramban.
 */
export function hapusJawabanKb3Lama() {
  const PENANDA = "migrasi:kb3-teori-kinetik-dihapus";
  try {
    if (localStorage.getItem(PENANDA)) return;
    const idLama = ["lkpd-3-1", "lkpd-3-2", "lkpd-3-3", "lkpd-3-4", "lkpd-3-5", "kuis-3-1", "kuis-3-2", "kuis-3-3"];
    for (const id of idLama) localStorage.removeItem(`kegiatan-03:${id}`);
    localStorage.setItem(PENANDA, "1");
  } catch {
    /* localStorage tidak tersedia */
  }
}

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
