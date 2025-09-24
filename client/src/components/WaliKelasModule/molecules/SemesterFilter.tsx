import { useLocation, useNavigate } from 'react-router-dom';

export function SemesterFilter() {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const current = params.get('semester') || 'Ganjil';

  const onChange = (val: string) => {
    const next = new URLSearchParams(location.search);
    next.set('semester', val);
    navigate({ pathname: location.pathname, search: next.toString() }, { replace: true });
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Semester</label>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      >
        <option value="Ganjil">Ganjil</option>
        <option value="Genap">Genap</option>
      </select>
    </div>
  );
}




