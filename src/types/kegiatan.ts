export interface KeteranganSimbol {
  simbol: string;
  arti: string;
  satuan: string;
}

export interface BlokGambar {
  tipe: "gambar";
  src: string;
  alt: string;
  rasio?: string;
  caption?: string;
  sumber?: string;
}

export interface BlokTeks {
  tipe: "teks";
  isi: string;
}

export interface BlokIsian {
  tipe: "isian";
  id: string;
  format: "teks-panjang" | "angka";
  inputmode?: string;
  pertanyaan: string;
  petunjuk?: string;
  baris?: number;
  satuan?: string;
  toleransi?: number;
  jawabanRujukan?: number;
  indikatorVariabel?: string[];
}

export interface BlokTabel {
  tipe: "tabel";
  judul?: string;
  mobile?: "kartu" | string;
  kolom: string[];
  baris: string[][];
}

export interface BlokCallout {
  tipe: "callout";
  gaya: "hati-hati" | "ingat" | "tahukah" | string;
  judul?: string;
  isi: string;
}

export interface BlokSimulasi {
  tipe: "simulasi";
  penyedia: string;
  src: string;
  judul?: string;
  rasio?: string;
  instruksi?: string;
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

export type Blok =
  | BlokGambar
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
  peran: string;
  blok: Blok[];
}

export interface Glosarium {
  istilah: string;
  arti: string;
}

export interface Kegiatan {
  id: string;
  versi: string;
  revisiTerakhir: string;
  statusValidasi: string;
  judul: string;
  subJudul: string;
  bab: string;
  fase: string;
  kelas: string;
  alokasiWaktu: number;
  prasyarat: string[];
  tujuanPembelajaran: string[];
  layar: Layar[];
  glosarium: Glosarium[];
  referensi: string[];
}
