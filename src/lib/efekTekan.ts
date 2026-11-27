import type { Router } from "vue-router";

/**
 * Efek tekan sebelum pindah halaman.
 * Saat tombol/tautan diklik, elemen itu diberi kelas `sedang-ditekan` (tampil "turun", lihat style.css)
 * dan perpindahan halaman ditunda sebentar agar murid sempat melihat efeknya.
 * Jeda hanya berlaku untuk perpindahan yang dipicu klik; muat awal dan tombol back browser tidak ditunda.
 * Penghitung layar muat di App.vue baru dimulai setelah jeda ini, jadi layar muat tidak ikut muncul.
 */
export const DURASI_TEKAN_MS = 180;

let waktuKlikTerakhir = -Infinity;

/** Sisa jeda tekan yang sedang berjalan (ms); 0 bila tidak ada. */
export function sisaJedaTekan(): number {
  return Math.max(0, DURASI_TEKAN_MS - (performance.now() - waktuKlikTerakhir));
}

export function pasangEfekTekan(router: Router) {
  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as Element | null)?.closest?.("a, button, [role='button']");
      if (!el || (el as HTMLButtonElement).disabled) return;
      waktuKlikTerakhir = performance.now();
      el.classList.add("sedang-ditekan");
      setTimeout(() => el.classList.remove("sedang-ditekan"), DURASI_TEKAN_MS + 60);
    },
    { capture: true },
  );

  router.beforeEach(async (_to, from) => {
    if (!from.matched.length) return; // muat awal
    const sisa = sisaJedaTekan();
    if (sisa > 0) await new Promise((r) => setTimeout(r, sisa));
  });
}
