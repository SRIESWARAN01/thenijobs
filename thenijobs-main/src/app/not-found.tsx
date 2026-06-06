import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0a0a1a] px-4 py-20 text-white">
      <section className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Page not found
        </p>
        <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
          This page is not available
        </h1>
        <p className="mt-4 text-base text-white/70 sm:text-lg">
          The link may be outdated, moved, or no longer available on THENIJOBS.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Back to home
        </Link>
      </section>
    </main>
  );
}
