import { Link } from 'react-router-dom';
import { BookOpen, ClipboardCheck, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-6xl mx-auto px-6 py-16">
        <header className="text-center mb-14">
          <p className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-semibold">
            <BookOpen size={16} /> DocenTrack
          </p>
          <h1 className="mt-4 text-5xl font-extrabold text-slate-900 tracking-tight">
            Evaluacion docente simple y clara
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
            DocenTrack ayuda a alumnado y profesorado a gestionar clases, encuestas y resultados para mejorar la calidad docente.
          </p>
          <div className="mt-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700"
            >
              Acceder al login
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <Users className="text-indigo-600 mb-3" />
            <h2 className="font-bold text-slate-900 mb-2">Para estudiantes</h2>
            <p className="text-slate-600">Consulta clases, responde encuestas y retoma respuestas en curso.</p>
          </article>
          <article className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <ClipboardCheck className="text-indigo-600 mb-3" />
            <h2 className="font-bold text-slate-900 mb-2">Para profesorado</h2>
            <p className="text-slate-600">Crea clases y encuestas, y revisa resultados de forma organizada.</p>
          </article>
          <article className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <BookOpen className="text-indigo-600 mb-3" />
            <h2 className="font-bold text-slate-900 mb-2">Objetivo</h2>
            <p className="text-slate-600">Facilitar una evaluacion continua y util para mejorar la docencia.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
