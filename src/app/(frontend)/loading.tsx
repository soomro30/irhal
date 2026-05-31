export default function Loading() {
  return (
    <main className="min-h-[70vh] bg-paper">
      <div className="h-1 bg-irhal-red" />
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="h-4 w-40 rounded bg-ink/10" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="h-[320px] rounded-md bg-ink/10" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 rounded bg-ink/10" />
            <div className="h-4 w-full rounded bg-ink/10" />
            <div className="h-4 w-5/6 rounded bg-ink/10" />
            <div className="h-4 w-2/3 rounded bg-ink/10" />
            <div className="grid grid-cols-3 gap-3 pt-4">
              <div className="h-16 rounded-md bg-ink/10" />
              <div className="h-16 rounded-md bg-ink/10" />
              <div className="h-16 rounded-md bg-ink/10" />
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div className="h-24 rounded-md bg-ink/10" key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
