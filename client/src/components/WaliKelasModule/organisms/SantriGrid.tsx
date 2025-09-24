import { Link } from 'react-router-dom';

export type SantriItem = {
  id: number;
  nama_lengkap: string;
  nisn: string;
  foto_profil?: string | null;
  nama_jenjang: string;
  nama_kelas: string;
};

type Props = {
  items: SantriItem[];
};

export function SantriGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map(item => (
        <Link key={item.id} to={`/guru/santri/${item.id}`} state={{ santri: item }} className="group block">
          <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-indigo-50 group-hover:bg-indigo-100 transition-colors" />
            <div className="relative p-5 flex items-center gap-4">
              <img src={item.foto_profil || '/placeholder.png'} alt={item.nama_lengkap} className="w-14 h-14 rounded-xl object-cover ring-2 ring-indigo-100" />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{item.nama_lengkap}</p>
                <p className="text-xs text-gray-500">NISN: {item.nisn}</p>
                <p className="text-xs text-gray-400 mt-1">{item.nama_jenjang} • {item.nama_kelas}</p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}


