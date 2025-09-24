import { WKButton } from '../atoms/Button';
import { CheckCircle2, AlertTriangle, MoreHorizontal } from 'lucide-react';

export type CatatanPerilaku = {
  id: number;
  tahun_ajaran: string;
  semester: 'Ganjil' | 'Genap';
  tanggal_catatan: string;
  kategori: 'Positif' | 'Negatif' | 'Lainnya';
  deskripsi: string;
};

type Props = {
  items: CatatanPerilaku[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
};

function Badge({ kategori }: { kategori: CatatanPerilaku['kategori'] }) {
  const styles: Record<CatatanPerilaku['kategori'], string> = {
    'Positif': 'bg-green-50 text-green-700 ring-green-200',
    'Negatif': 'bg-red-50 text-red-700 ring-red-200',
    'Lainnya': 'bg-gray-50 text-gray-700 ring-gray-200',
  };
  const Icon = kategori === 'Positif' ? CheckCircle2 : kategori === 'Negatif' ? AlertTriangle : MoreHorizontal;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ring-1 ${styles[kategori]}`}>
      <Icon size={14} /> {kategori}
    </span>
  );
}

export function PerilakuList({ items, onEdit, onDelete }: Props) {
  if (items.length === 0) {
    return <p className="text-gray-500">Belum ada catatan perilaku.</p>;
  }
  const formatDate = (value: string) => {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map(c => (
        <div key={c.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge kategori={c.kategori} />
                <span className="text-xs text-gray-500">{formatDate(c.tanggal_catatan)} • {c.semester}</span>
              </div>
              <p className="mt-2 text-gray-800 text-sm leading-relaxed">{c.deskripsi}</p>
            </div>
            <div className="flex gap-2">
              <WKButton variant="secondary" onClick={() => onEdit(c.id)}>Edit</WKButton>
              <WKButton variant="danger" onClick={() => onDelete(c.id)}>Hapus</WKButton>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}




