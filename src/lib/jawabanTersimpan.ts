import { ref, watch, type Ref } from "vue";

/** State reaktif yang otomatis tersinkron ke localStorage (untuk jawaban LKPD/kuis). */
export function useJawabanTersimpan<T>(kunci: string, nilaiAwal: T): Ref<T> {
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
  watch(nilai, (baru) => {
    localStorage.setItem(kunci, JSON.stringify(baru));
  });
  return nilai;
}
