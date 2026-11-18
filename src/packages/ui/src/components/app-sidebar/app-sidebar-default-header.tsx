import { useQuery } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { z } from 'zod'

import logo from '@/assets/logo.svg'
import logoDark from '@/assets/logo-dark.svg'
import logoIcon from '@/assets/logo-icon.svg'
import { AppSidebarQuickActions } from '@/components/app-sidebar/app-sidebar-quick-actions'
import { ModeToggle } from '@/components/mode-toggle'
import { SidebarHeader, useSidebar } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const starsCacheDuration = 60 * 60 * 1000
const repositoryStarsResponse = z.object({
  stars: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable(),
})

async function fetchRepositoryStars(
  signal: AbortSignal,
): Promise<number | null> {
  const response = await fetch('https://www.mistertick.com/api/github-stars', {
    headers: { Accept: 'application/json' },
    signal,
  }).catch(() => null)
  if (!response?.ok) return null

  const count = repositoryStarsResponse.safeParse(
    await response.json().catch(() => null),
  )
  if (!count.success) return null
  return count.data.stars
}

export function AppSidebarDefaultHeader() {
  const { open } = useSidebar()
  const { data: stars } = useQuery({
    queryKey: ['rastro', 'repository-stars'],
    queryFn: ({ signal }) => fetchRepositoryStars(signal),
    enabled: open,
    staleTime: starsCacheDuration,
    gcTime: starsCacheDuration,
    retry: false,
  })

  if (!open) {
    return (
      <SidebarHeader className="z-40 gap-1.5 p-1 pb-1">
        <div className="flex w-full items-center justify-center py-1">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hover:bg-muted/60 flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors">
                  <img
                    src={logoIcon}
                    className="size-6 object-contain"
                    alt="Rastro"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Rastro Kit
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <AppSidebarQuickActions />
      </SidebarHeader>
    )
  }

  return (
    <SidebarHeader className="z-40 gap-1.5 pb-1">
      <div className="hover:bg-muted/40 relative flex items-center justify-between gap-3 rounded-lg p-2 transition-colors select-none">
        {/* Lado Esquerdo: Identidade Visual */}
        <div className="flex min-w-0 items-center">
          <div className="flex min-w-0 flex-col">
            <img
              src={logo}
              className="h-auto w-28 max-w-full self-start dark:hidden"
              alt="Rastro Kit"
            />
            <img
              src={logoDark}
              className="hidden h-auto w-28 max-w-full self-start dark:block"
              alt="Rastro Kit"
            />

            <a
              href="https://github.com/gustavohps10/rastro"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground mt-0.5 flex min-w-0 items-center gap-1.5 font-mono text-[10px] leading-none"
            >
              <span className="truncate">gustavohps10/rastro</span>
              {stars != null && (
                <span className="flex shrink-0 items-center gap-0.5 tabular-nums">
                  <Star
                    className="size-2.5 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                  {stars}
                  <span className="sr-only"> estrelas no GitHub</span>
                </span>
              )}
            </a>
          </div>
        </div>

        {/* Lado Direito: Ação Global */}
        <div className="shrink-0 self-start">
          <ModeToggle className="text-muted-foreground hover:text-foreground hover:bg-muted/70 shrink-0 cursor-pointer rounded-md border-transparent bg-transparent p-1.5 transition-colors" />
        </div>
      </div>

      {/* Barra de Ações Rápidas (Busca, Addons, Configs) */}
      <AppSidebarQuickActions />
    </SidebarHeader>
  )
}
