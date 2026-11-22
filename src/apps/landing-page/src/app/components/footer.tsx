'use client'

import { Separator } from '@rastrokit/ui/separator'
import { Github, Linkedin, Twitter } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

export function Footer() {
  const t = useTranslations('footer')

  const FOOTER_SECTIONS = [
    {
      title: t('product'),
      links: [
        { label: t('whyRastro'), href: '/#positioning' },
        { label: t('integrationsSdk'), href: '/#integrations' },
        { label: t('architecture'), href: '/#offline' },
        { label: 'Rastro Plus', href: '/license' },
      ],
    },
    {
      title: t('resourcesDocs'),
      links: [
        { label: t('documentation'), href: '/docs' },
        { label: t('quickstartGuide'), href: '/docs/quickstart' },
        { label: t('addonSdk'), href: '/docs/apis/vault-and-events' },
        {
          label: t('recoverLicense'),
          href: '/license?action=recover',
        },
        {
          label: t('githubRepository'),
          href: 'https://github.com/gustavohps10/rastro',
          external: true,
        },
        {
          label: t('reportAnIssue'),
          href: 'https://github.com/gustavohps10/rastro/issues',
          external: true,
        },
      ],
    },
    {
      title: t('legalPrivacy'),
      links: [
        {
          label: t('mitLicenseOpenSource'),
          href: 'https://github.com/gustavohps10/rastro/blob/main/LICENSE',
          external: true,
        },
        { label: t('termsOfService'), href: '#' },
        { label: t('privacyPolicy'), href: '#' },
        { label: t('localFirstSecurity'), href: '/#offline' },
      ],
    },
  ]
  return (
    <footer className="border-border/60 bg-card/60 relative border-t pt-16 pb-12">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.svg"
                alt="Rastro Kit"
                width={963}
                height={222}
                className="h-auto w-40 object-contain dark:hidden"
              />
              <Image
                src="/logo-dark.svg"
                alt="Rastro Kit"
                width={963}
                height={222}
                className="hidden h-auto w-40 object-contain dark:block"
              />
            </Link>

            <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
              {t('theLocalFirstWorkflowObservabilityToolkit')}
            </p>

            {/* Social Links */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://github.com/gustavohps10/rastro"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="border-border/60 bg-background hover:text-foreground text-muted-foreground hover:border-border flex size-9 items-center justify-center rounded-lg border transition-all"
              >
                <Github className="size-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="border-border/60 bg-background hover:text-foreground text-muted-foreground hover:border-border flex size-9 items-center justify-center rounded-lg border transition-all"
              >
                <Twitter className="size-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="border-border/60 bg-background hover:text-foreground text-muted-foreground hover:border-border flex size-9 items-center justify-center rounded-lg border transition-all"
              >
                <Linkedin className="size-4" />
              </a>
            </div>
          </div>

          {/* Nav Columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-foreground font-mono text-xs font-bold tracking-wider uppercase">
                {section.title}
              </h4>
              <ul className="mt-4 space-y-2.5 text-xs">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.external && (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                    {!link.external && (
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="border-border/40 mt-12 mb-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-muted-foreground font-mono text-xs">
            {t('2026RastroReleasedUnderThe')}
          </p>

          <div className="flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-lg bg-emerald-500" />
            <span className="text-muted-foreground font-mono text-xs">
              {t('allSystemsOperationalLocalFirst')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
