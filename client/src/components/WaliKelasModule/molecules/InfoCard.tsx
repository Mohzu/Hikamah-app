type Props = {
  label: string;
  value: string | number;
  sublabel?: string;
};

export function WKInfoCard({ label, value, sublabel }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/70 to-white" />
      <div className="relative p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-2 text-3xl font-extrabold text-indigo-700">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
      </div>
    </div>
  );
}


