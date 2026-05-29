import Reveal from "@/components/Reveal";

export default function Edism({ quote }: { quote: string }) {
  return (
    <section className="container-rail py-24 sm:py-32">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span
          aria-hidden
          className="font-serif text-5xl leading-none text-ink-faint"
        >
          &ldquo;
        </span>
        <p className="mt-2 font-serif text-3xl font-light leading-snug text-ink sm:text-4xl">
          {quote}
        </p>
      </Reveal>
    </section>
  );
}
