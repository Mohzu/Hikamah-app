import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function TahunAjaranFilter() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const current = params.get('tahun_ajaran');

  const options = useMemo(() => {
    const now = new Date();
    const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const arr: string[] = [];
    for (let i = 0; i < 4; i++) {
      const y = startYear - i;
      arr.push(`${y}/${y + 1}`);
    }
    return arr;
  }, []);

  const value = current || options[0];

  const onChange = (val: string) => {
    const next = new URLSearchParams(location.search);
    next.set('tahun_ajaran', val);
    navigate({ pathname: location.pathname, search: next.toString() }, { replace: true });
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Tahun Ajaran</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}


