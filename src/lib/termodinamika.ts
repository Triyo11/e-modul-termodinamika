/** Tetapan Laplace (γ = Cp/Cv) untuk gas ideal. */
export const GAMMA_MONOATOMIK = 5 / 3; // ≈ 1,67
export const GAMMA_DIATOMIK = 7 / 5; // = 1,4

/** Volume di bawah nilai ini dianggap tidak sah untuk menghindari pembagian dengan nol. */
export const VOLUME_MIN_SAH = 1e-9;

/**
 * Suhu akhir proses adiabatik reversibel gas ideal: T₂ = T₁ · (V₁ / V₂)^(γ − 1).
 *
 * Karena hanya bergantung pada rasio volume, rangkaian perubahan V₁ → V₂ → … → V₁
 * selalu mengembalikan suhu ke T₁ (faktor-faktornya saling meniadakan).
 * Mengembalikan T₁ apa adanya bila masukan tidak sah (volume ≤ batas, NaN, atau tak hingga).
 */
export function suhuAdiabatik(
  suhuAwal: number,
  volumeAwal: number,
  volumeAkhir: number,
  gamma: number = GAMMA_MONOATOMIK,
): number {
  if (!Number.isFinite(suhuAwal) || suhuAwal <= 0) return suhuAwal;
  if (!Number.isFinite(volumeAwal) || !Number.isFinite(volumeAkhir)) return suhuAwal;
  if (volumeAwal < VOLUME_MIN_SAH || volumeAkhir < VOLUME_MIN_SAH) return suhuAwal;
  if (volumeAwal === volumeAkhir) return suhuAwal;
  return suhuAwal * Math.pow(volumeAwal / volumeAkhir, gamma - 1);
}

/** Faktor pengali kecepatan partikel agar energi kinetik rata-rata sesuai suhu baru: √(T_baru / T_lama). */
export function skalaKecepatan(suhuLama: number, suhuBaru: number): number {
  if (!(suhuLama > 0) || !(suhuBaru > 0) || !Number.isFinite(suhuLama) || !Number.isFinite(suhuBaru)) return 1;
  return Math.sqrt(suhuBaru / suhuLama);
}
