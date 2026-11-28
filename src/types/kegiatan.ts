export interface KeteranganSimbol {
  simbol: string;
  arti: string;
  satuan: string;
}

export interface BlokGambar {
  tipe: "gambar";
  src: string | null;
  alt: string;
  rasio?: string;
  caption?: string;
  sumber?: string | null;
  status?: string;
}

export interface BlokVideo {
  tipe: "video";
  src: string | null;
  poster?: string | null;
  alt: string;
  rasio?: string;
  caption?: string;
  sumber?: string | null;
  status?: string;
}

export interface BlokTeks {
  tipe: "teks";
  isi: string;
}

export interface BlokIsian {
  tipe: "isian";
  id: string;
  format: "teks-panjang" | "angka" | "pilih-kelompok";
  inputmode?: string;
  pertanyaan: string;
  petunjuk?: string;
  baris?: number;
  satuan?: string;
  toleransi?: number;
  jawabanRujukan?: number;
  indikatorVariabel?: string[];
  /** Khusus format "pilih-kelompok". */
  butir?: string[];
  kelompok?: string[];
  kunci?: Record<string, string>;
  wajibSumber?: boolean;
  minSumber?: number;
}

export interface BlokTabel {
  tipe: "tabel";
  judul?: string;
  mobile?: "kartu" | string;
  kolom: string[];
  baris: string[][];
  sumber?: string;
  /** id blok tabel-isian yang harus diisi murid dulu sebelum tabel ini (mis. tabel rujukan) dibuka. */
  tampilSetelah?: string;
}

export interface BlokCallout {
  tipe: "callout";
  gaya: "hati-hati" | "ingat" | "tahukah" | string;
  judul?: string;
  isi: string;
}

export type IdWidgetSimulasi = "partikel-gas" | "difusi" | "energi-termal" | "efek-rumah-kaca";

export interface BlokSimulasi {
  tipe: "simulasi";
  widget: IdWidgetSimulasi;
  judul?: string;
  /** Langkah kerja, ditampilkan sebagai daftar bernomor. */
  instruksi?: string[];
}

export interface BlokRumus {
  tipe: "rumus";
  nomor?: string;
  tex: string;
  keterangan?: KeteranganSimbol[];
}

export interface BlokContoh {
  tipe: "contoh";
  judul?: string;
  soal: string;
  langkah: string[];
  catatan?: string;
}

export interface OpsiKuis {
  id: string;
  teks: string;
}

export interface BlokKuis {
  tipe: "kuis";
  id: string;
  pertanyaan: string;
  opsi: OpsiKuis[];
  kunci: string;
  pembahasan?: string;
  indikatorVariabel?: string[];
  jenisPenilaian?: "formatif" | "autentik";
}

export interface BlokAnimasi {
  tipe: "animasi";
  mp4: string;
  webm?: string;
  poster?: string;
  alt: string;
  rasio?: string;
  caption?: string;
  sumber?: string;
}

export interface BlokKebutuhanInformasi {
  tipe: "kebutuhan-informasi";
  id: string;
  pertanyaan: string;
  petunjuk?: string;
  kolom: string[];
  jumlahBaris: number;
  indikatorVariabel?: string[];
}

export interface KolomTabelIsian {
  kunci: string;
  label: string;
  satuan: string;
  tipe: "angka" | "hitung" | "teks";
  /** Ekspresi aritmetika sederhana memakai kunci kolom lain, mis. "p*V" atau "1/V". */
  hitung?: string;
}

export interface BlokTabelIsian {
  tipe: "tabel-isian";
  id: string;
  judul?: string;
  instruksi?: string;
  kolom: KolomTabelIsian[];
  jumlahBaris: number;
  /** Isi awal yang terkunci, per baris lalu per kolom (mis. nama proses di kolom pertama). */
  barisAwal?: string[][];
  indikatorVariabel?: string[];
}

export interface TautanSumber {
  judul: string;
  penerbit: string;
  url: string;
  kegunaan?: string;
  bahasa?: string;
}

export interface BlokTautanSumber {
  tipe: "tautan-sumber";
  judul?: string;
  daftar: TautanSumber[];
}

export interface SumberKlaim {
  id: string;
  judul: string;
  penerbit: string;
  penulis?: string | null;
  tanggal?: string;
  tanggalPembaruan?: string;
  url: string;
  jenis?: string;
  bahasa?: string;
}

export interface BlokKlaimUji {
  tipe: "klaim-uji";
  id: string;
  klaim: string;
  konteks?: string;
  sumber: SumberKlaim[];
  daftarPeriksa: { id: string; aspek: string; pertanyaan: string }[];
  pilihanPenilaian: string[];
  indikatorVariabel?: string[];
}

export interface LangkahRancangan {
  id: string;
  tahap: string;
  instruksi: string;
  format: "teks-panjang" | "tabel" | "unggah-atau-teks" | "diagram-pv";
  kolom?: string[];
  jumlahBaris?: number;
}

export interface BlokTugasRancangan {
  tipe: "tugas-rancangan";
  id: string;
  judul: string;
  masalah: string;
  kriteria: string[];
  batasan: string[];
  peranKelompok: { peran: string; tugas: string }[];
  langkah: LangkahRancangan[];
  produk?: string;
  rubrik?: string;
  indikatorVariabel?: string[];
}

export interface BlokTugasRancanganLanjutan {
  tipe: "tugas-rancangan-lanjutan";
  tugas: string;
  langkah: LangkahRancangan[];
}

export interface BlokGrafikData {
  tipe: "grafik-data";
  id: string;
  /** id blok tabel-isian yang datanya dipakai. */
  sumberData: string;
  sumbuX: string;
  sumbuY: string;
  labelX: string;
  labelY: string;
  garisTren?: "linear-melalui-nol" | string;
  instruksi?: string;
}

export interface BlokRefleksi {
  tipe: "refleksi";
  id: string;
  /** id blok isian yang jawabannya ditampilkan ulang. */
  tinjauUlang?: string;
  pengantar?: string;
  pertanyaan: string[];
  indikatorVariabel?: string[];
}

export interface BlokRubrik {
  tipe: "rubrik";
  id: string;
  judul: string;
  untuk?: string;
  skala: number[];
  kriteria: { aspek: string; indikatorVariabel?: string[]; deskriptor: Record<string, string> }[];
  jenisPenilaian?: "formatif" | "autentik";
}

export type ProsesPV = "isobarik" | "isokhorik" | "isotermal" | "adiabatik";

export interface BlokDiagramPV {
  tipe: "diagram-pv";
  id: string;
  /** jelajah: satu proses dari keadaan awal. rancang: murid menyusun siklus tertutup. */
  mode: "jelajah" | "rancang";
  untukLangkah?: string;
  sumbu: { pMin: number; pMax: number; VMin: number; VMax: number; satuanP: string; satuanV: string };
  keadaanAwal?: { p: number; V: number };
  batas?: { pMin: number; pMax: number; VMin: number; VMax: number };
  prosesTersedia: ProsesPV[];
  /** Tetapan Laplace untuk proses adiabatik (pV^gamma = konstan). Bawaan 1,4 (udara, gas diatomik). */
  gamma?: number;
  maksAlternatif?: number;
  tampilkanLuas?: boolean;
  instruksi?: string;
}

export interface RentangSuhu {
  min: number;
  max: number;
  awal: number;
  langkah: number;
  satuan: string;
}

export interface BlokWidgetCarnot {
  tipe: "widget-carnot";
  id: string;
  TH: RentangSuhu;
  TC: RentangSuhu;
  tampilkan: ("siklus-pv" | "efisiensi-carnot" | "koefisien-performansi-carnot")[];
  instruksi?: string;
}

export type Blok =
  | BlokDiagramPV
  | BlokWidgetCarnot
  | BlokGambar
  | BlokVideo
  | BlokKebutuhanInformasi
  | BlokTabelIsian
  | BlokTautanSumber
  | BlokKlaimUji
  | BlokTugasRancangan
  | BlokTugasRancanganLanjutan
  | BlokGrafikData
  | BlokRefleksi
  | BlokRubrik
  | BlokTeks
  | BlokIsian
  | BlokTabel
  | BlokCallout
  | BlokSimulasi
  | BlokRumus
  | BlokContoh
  | BlokKuis
  | BlokAnimasi;

export interface Layar {
  id: string;
  judul: string;
  /** Skema 1.x */
  peran?: string;
  /** Skema stem-ctl-2.0 */
  tahap?: string;
  stem?: string[];
  indikatorTahap?: { bk?: string[]; li?: string[] };
  peranGuru?: string;
  /** Panduan rinci untuk guru. Hanya tampil dalam mode guru (?guru=1). */
  panduanGuru?: PanduanGuru;
  blok: Blok[];
}

export interface PanduanGuru {
  kegiatan: string[];
  pertanyaanPemantik?: string[];
  antisipasi?: string[];
}

export interface TujuanPembelajaranBerkode {
  kode: string;
  teks: string;
  kajianTeori?: string[];
}

export interface Glosarium {
  istilah: string;
  arti: string;
}

export interface Rangkuman {
  judul: string;
  /** id blok isian kesimpulan di tahap refleksi; rangkuman tampil tepat setelah blok ini. */
  tampilSetelah: string;
  /** Satu poin per kode tujuan pembelajaran. */
  poin: { tp: string; teks: string }[];
  literasiInformasi: string;
  /** Nomor blok rumus di berkas yang sama, mis. ["1.1", "1.2"]. */
  rumusKunci: string[];
}

export interface Kegiatan {
  id: string;
  versi: string;
  skema?: string;
  kb?: number;
  model?: string;
  fenomena?: string[];
  simulasiUtama?: string[];
  catatanPengembang?: string[];
  revisiTerakhir: string;
  statusValidasi: string;
  judul: string;
  subJudul: string;
  bab: string;
  fase: string;
  kelas: string;
  alokasiWaktu: number | null;
  prasyarat: string[];
  tujuanPembelajaran: (string | TujuanPembelajaranBerkode)[];
  layar: Layar[];
  rangkuman?: Rangkuman;
  glosarium: Glosarium[];
  referensi: string[];
}
