type Row = {
  mata_pelajaran: string;
  nilai_tugas: number | null;
  nilai_uts: number | null;
  nilai_uas: number | null;
  nilai_akhir: number | null;
};

type Props = {
  grouped: Record<string, Row[]>;
};

export function NilaiTable({ grouped }: Props) {
  const periods = Object.keys(grouped);
  if (periods.length === 0) return <p className="text-gray-500">Belum ada data nilai.</p>;

  return (
    <div className="space-y-6">
      {periods.map(period => (
        <div key={period} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-indigo-50 text-indigo-700 font-semibold">{period}</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="px-5 py-3">Mata Pelajaran</th>
                  <th className="px-5 py-3">Tugas</th>
                  <th className="px-5 py-3">UTS</th>
                  <th className="px-5 py-3">UAS</th>
                  <th className="px-5 py-3">Akhir</th>
                </tr>
              </thead>
              <tbody>
                {grouped[period].map((r, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="px-5 py-3 text-gray-900">{r.mata_pelajaran}</td>
                    <td className="px-5 py-3">{r.nilai_tugas ?? '-'}</td>
                    <td className="px-5 py-3">{r.nilai_uts ?? '-'}</td>
                    <td className="px-5 py-3">{r.nilai_uas ?? '-'}</td>
                    <td className="px-5 py-3 font-semibold">{r.nilai_akhir ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}




