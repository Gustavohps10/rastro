import '@/renderer/index.css'

import type { EnvironmentInfo } from '@rastrokit/application'
import { AddonThemeBridge, AddonToastBridge } from '@rastrokit/ui/components'
import { queryClient } from '@rastrokit/ui/lib'
import {
  EnvironmentProvider,
  HostBridgeProvider,
  SidebarProvider,
  ThemeProvider,
  TooltipProvider,
} from '@rastrokit/ui/providers'
import { Toaster } from '@rastrokit/ui/sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6'
import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'

import { ipcClient } from '@/renderer/ipcClient'
import { router } from '@/renderer/routes'

const defaultEnvironment: EnvironmentInfo = {
  isDevelopment: Boolean(import.meta.env.DEV),
  platform:
    typeof window !== 'undefined' && window.electron?.process?.platform
      ? window.electron.process.platform
      : 'web',
  isTest: Boolean(import.meta.env.MODE === 'test'),
}

export function AppDesktop() {
  const [environment, setEnvironment] = useState(defaultEnvironment)

  useEffect(() => {
    ipcClient.system
      .getEnvironment()
      .then(setEnvironment)
      .catch(() => setEnvironment(defaultEnvironment))
  }, [])

  return (
    <HostBridgeProvider bridge={ipcClient}>
      <AddonToastBridge />
      <EnvironmentProvider environment={environment}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <TooltipProvider>
            <SidebarProvider>
              <QueryClientProvider client={queryClient}>
                <NuqsAdapter>
                  <AddonThemeBridge />
                  <RouterProvider router={router} />
                  <Toaster richColors position="bottom-right" />
                </NuqsAdapter>
              </QueryClientProvider>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </EnvironmentProvider>
    </HostBridgeProvider>
  )
}
