import { loginAction, signupAction } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    success?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] bg-ink px-8 py-10 text-white shadow-soft">
          <p className="mb-3 text-sm uppercase tracking-[0.24em] text-emerald-200">Control Financiero</p>
          <h1 className="text-4xl font-semibold tracking-tight">Acceso seguro por usuario y workspace.</h1>
          <p className="mt-4 text-slate-300">
            Inicia sesion para trabajar con tus workspaces y dejar que Supabase RLS limite el acceso a tus propios datos.
          </p>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-soft ring-1 ring-slate-200/70 sm:p-8">
          {searchParams?.error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.error}</div>
          ) : null}
          {searchParams?.success ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{searchParams.success}</div>
          ) : null}

          <div className="space-y-8">
            <form action={loginAction} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Iniciar sesion</h2>
                <p className="mt-1 text-sm text-slate-500">Usa tu usuario actual para entrar a la app.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Correo</label>
                <input name="email" type="email" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Contrasena</label>
                <input name="password" type="password" required />
              </div>
              <button type="submit" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
                Entrar
              </button>
            </form>

            <form action={signupAction} className="space-y-4 border-t border-slate-200 pt-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Crear cuenta</h2>
                <p className="mt-1 text-sm text-slate-500">Crea un usuario nuevo para probar aislamiento real entre usuarios.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Correo</label>
                <input name="email" type="email" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Contrasena</label>
                <input name="password" type="password" minLength={6} required />
              </div>
              <button type="submit" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                Crear cuenta
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
