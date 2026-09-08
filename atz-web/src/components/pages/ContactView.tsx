import { getDictionary, type Lang } from "@/dictionaries";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import { WA_URL, EMAIL, PHONE_DISPLAY } from "@/lib/site";
import JsonLd from "@/components/layout/JsonLd";
import ConsultationCta from "@/components/ConsultationCta";

const ICONS = {
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  mail: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  ),
  pin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
};

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-navy/10 rounded-md border bg-white p-8 shadow-sm">
      <div className="bg-navy-deep/5 mb-4 flex h-14 w-14 items-center justify-center rounded-full">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gold h-7 w-7"
          aria-hidden="true"
        >
          {icon}
        </svg>
      </div>
      <h2 className="font-display text-navy text-lg font-extrabold">{title}</h2>
      <div className="text-slate-ink mt-2">{children}</div>
    </div>
  );
}

export default function ContactView({ lang }: { lang: Lang }) {
  const dict = getDictionary(lang);
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd(lang, [
          { name: "ATZ", route: "/" },
          { name: dict.footer.contact, route: "/contact" },
        ])}
      />
      <div className="min-h-screen bg-[#F3F4F7] py-20 md:py-[120px]">
        <div className="mx-auto max-w-[1180px] px-5 md:px-8">
          <div className="mx-auto max-w-[700px] text-center">
            <span className="eyebrow-chip justify-center">{dict.contact.eyebrow}</span>
            <h1 className="font-display text-navy mt-3.5 text-3xl font-extrabold md:text-[2.7rem]">
              {dict.cta.h2}
            </h1>
            <p className="text-slate-ink mt-4">{dict.cta.p}</p>
          </div>

          <div className="mx-auto mt-14 grid max-w-[900px] gap-6 md:grid-cols-2">
            <Card icon={ICONS.phone} title={dict.contact.callWa}>
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-ink hover:text-navy transition"
              >
                {PHONE_DISPLAY}
              </a>
            </Card>
            <Card icon={ICONS.mail} title={dict.contact.email}>
              <a
                href={`mailto:${EMAIL}`}
                className="text-gold-ink hover:text-navy break-all transition"
              >
                {EMAIL}
              </a>
            </Card>
            <Card icon={ICONS.pin} title={dict.contact.location}>
              {dict.contact.locationValue}
            </Card>
            <Card icon={ICONS.clock} title={dict.contact.response}>
              {dict.contact.responseValue}
            </Card>
          </div>

          <div className="mx-auto mt-14 max-w-[600px] text-center">
            <ConsultationCta
              label={dict.nav.cta}
              className="bg-gold font-display text-navy-deep inline-flex items-center gap-2.5 rounded-sm px-8 py-4 text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-lg"
            />
          </div>
        </div>
      </div>
    </>
  );
}
