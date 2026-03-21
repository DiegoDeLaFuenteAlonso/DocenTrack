import { ExternalLink } from 'lucide-react';

export default function AdminHomePage() {
  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
        Administración
      </h1>
      <p className="text-slate-600 text-lg mb-8">
        Tu rol es administrador. Gestiona usuarios y datos desde el panel de Django o continúa
        usando la API directamente.
      </p>
      <a
        href="http://localhost:8000/admin/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
      >
        Abrir Django Admin
        <ExternalLink size={18} />
      </a>
    </div>
  );
}
