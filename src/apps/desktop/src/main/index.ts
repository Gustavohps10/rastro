import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import {
  JSONAddonSettingsRepository,
  SQLiteAddonStorageRepository,
  SQLiteConnectionLifecycleRepository,
  SQLiteConnectionLifecycleTransactionBoundary,
  SQLiteConnectionReservationRepository,
  SqliteMetadataDiagnosticAdapter,
  SQLiteWorkspaceCredentialReferenceRegistry,
  SQLiteWorkspacesRepository,
} from '@rastrokit/adapters/data'
import {
  HardDiskStorage,
  KeytarCredentialsVault,
} from '@rastrokit/adapters/tools'
import type { IListTasksUseCase } from '@rastrokit/application'
import {
  IAddonAccessService,
  IAddonAuthenticatorRegistry,
  IAddonConnectionProfilesRegistry,
  IConnectAddonConnectionUseCase,
  IConnectionLifecycleCoordinator,
  ICoreAddonCapabilities,
  IDisconnectAddonConnectionUseCase,
  ILinkConnectionUseCase,
  IOAuthAttemptCoordinator,
  IUnlinkConnectionUseCase,
} from '@rastrokit/application'
import { IAddonsFacade, ILicensingFacade } from '@rastrokit/application'
import { ContainerBuilder, PlatformDependencies } from '@rastrokit/IoC'
import { AddonLoadFailuresSnapshot } from '@rastrokit/shared/view-models'
import {
  app,
  BrowserWindow,
  net,
  protocol,
  screen,
  shell,
  Tray,
  webContents,
} from 'electron'
import installExtension, {
  REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer'

import { AnalyticsDiagnosticAdapter } from '@/main/adapters/analytics/AnalyticsDiagnosticAdapter'
import { DuckDBAnalyticsEngine } from '@/main/adapters/analytics/DuckDBAnalyticsEngine'
import {
  DefaultElectronFetchTransport,
  ElectronHttpClientFactory,
} from '@/main/adapters/ElectronHttpClient'
import { ElectronJobEventEmitter } from '@/main/adapters/ElectronJobEventEmitter'
import { TimerRuntime } from '@/main/adapters/TimerRuntime'
import {
  forwardDevOAuthCallback,
  watchDevOAuthCallbacks,
} from '@/main/dev-oauth-handoff'
import {
  CoreHandler,
  LicensingHandler,
  TasksHandler,
  TimeEntriesHandler,
  TokenHandler,
  UpdaterHandler,
} from '@/main/handlers'
import { DiagnosticsHandler } from '@/main/handlers'
import { AddonsHandler } from '@/main/handlers/AddonsHandler'
import { AnalyticsWarehouseHandler } from '@/main/handlers/AnalyticsWarehouseHandler'
import { MetadataHandler } from '@/main/handlers/MetadataHandler'
import { WorkspacesHandler } from '@/main/handlers/WorkspacesHandler'
import {
  findRastroDeepLink,
  getOAuthCallbackProtocol,
  parseRastroDeepLink,
  RASTRO_ASSET_BASE_URL,
  RASTRO_PROTOCOL,
  type RastroDeepLink,
  resolveRastroAvatarUrl,
} from '@/main/rastro-protocol'
import { DataSourceResolver } from '@/main/resolvers/data-source-resolver'
import { openIpcRoutes } from '@/main/routes'
import { AddonLoader } from '@/main/services/addons/loader/AddonLoader'
import { DesktopCredentialRecovery } from '@/main/services/credentials/DesktopCredentialRecovery'
import { LocalRuntimeDispatcher } from '@/main/services/local-runtime/LocalRuntimeDispatcher'
import { TaskLookupService } from '@/main/services/tasks/TaskLookupService'
import { UpdaterService } from '@/main/services/updates/UpdaterService'
import { getSettings } from '@/main/settings'
import { createTray } from '@/main/tray'

import sdkPackage from '../../../sdk/package.json'
import { AnalyticsResolver } from './resolvers/analytics-resolver'
import {
  addonPackageVerificationConfiguration,
  licensingApiConfiguration,
  offlineAuthorizationVerificationConfiguration,
} from './securityConfiguration'
import { AddonCoreCapabilities } from './services/addons/core/AddonCoreCapabilities'
import { BootJournal } from './services/diagnostics/BootJournal'
import { DiagnosticEventsBuffer } from './services/diagnostics/DiagnosticEventsBuffer'
import { DiagnosticsService } from './services/diagnostics/DiagnosticsService'

const requireNative = createRequire(import.meta.url)

export interface NativeOverlay {
  applyOverlayStyles: (handle: Buffer) => boolean
  removeOverlayStyles?: (handle: Buffer) => void
  cleanupOverlay?: () => void
  isKeyboardInterceptionActive?: () => boolean
  setKeyEventListener: (
    callback: (data: { vkCode: number; key: string }) => void,
  ) => void
  startKeyboardInterception: () => void
  stopKeyboardInterception: () => void
  forceTopmost: () => void
}

export type IHandlersScope = {
  coreHandler: typeof CoreHandler
  tasksHandler: typeof TasksHandler
  timeEntriesHandler: typeof TimeEntriesHandler
  tokenHandler: typeof TokenHandler
  workspacesHandler: typeof WorkspacesHandler
  addonsHandler: typeof AddonsHandler
  analyticsWarehouseHandler: typeof AnalyticsWarehouseHandler
  licensingHandler: typeof LicensingHandler
  metadataHandler: typeof MetadataHandler
  updaterHandler: typeof UpdaterHandler
}

app.name = 'Rastro'

const testUserDataPath = process.env.RASTRO_TEST_USER_DATA_DIR

function configureUserDataPath(): void {
  if (process.env.NODE_ENV === 'test' && testUserDataPath) {
    app.setPath('userData', testUserDataPath)
    return
  }

  const directory = join(app.getPath('appData'), 'rastro')
  mkdirSync(directory, { recursive: true })
  app.setPath('userData', directory)
}

configureUserDataPath()

const userDataDir = app.getPath('userData')

const isTestMode = process.env.NODE_ENV === 'test'
// The Windows singleton message can be blocked when dev Electron runs elevated.
const useDevOAuthHandoff =
  process.platform === 'win32' && !app.isPackaged && !isTestMode
let gotTheLock = true
if (!isTestMode) {
  gotTheLock = app.requestSingleInstanceLock()
}

if (!gotTheLock) {
  if (useDevOAuthHandoff) {
    const link = findRastroDeepLink(process.argv, false)
    if (link?.kind === 'oauth') forwardDevOAuthCallback(userDataDir, link.url)
  }

  app.exit(0)
}

if (gotTheLock) {
  console.log('[Rastro Core] ✅ PRIMEIRA INSTÂNCIA EM EXECUÇÃO')

  let mainWindow: BrowserWindow | null = null
  let tray: Tray | null = null
  let secondaryWindow: BrowserWindow | null = null
  let globalAddonLoader: AddonLoader | null = null
  let globalLicensingFacade: ILicensingFacade | null = null
  let pendingActivationKey: string | null = null
  let nativeOverlay: NativeOverlay | null = null

  const iconName = process.platform === 'win32' ? 'favicon.ico' : 'icon.png'
  const appIconPath = app.isPackaged
    ? join(process.resourcesPath, iconName)
    : join(__dirname, '../../resources', iconName)

  async function processActivationDeepLinkKey(key: string): Promise<void> {
    if (!globalLicensingFacade) {
      pendingActivationKey = key
      return
    }
    const result = await globalLicensingFacade.activateLicense(key)
    const nextState = result.isSuccess() ? result.success : undefined
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('licensing:updated', nextState)
      }
    }
    if (result.isSuccess()) {
      globalAddonLoader?.showToast(
        'success',
        'Sua assinatura Rastro Plus foi ativada neste dispositivo!',
        'Rastro Plus Ativado',
      )
      return
    }
    globalAddonLoader?.showToast(
      'error',
      `Não foi possível ativar a licença: ${result.failure.messageKey}`,
      'Falha na Ativação Plus',
    )
  }

  function handleIncomingDeepLink(link: RastroDeepLink): void {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }

    if (link.kind === 'activation') {
      void processActivationDeepLinkKey(link.key)
      return
    }

    globalAddonLoader?.handleOAuthCallbackUrl(link.url.href)
  }

  if (process.platform === 'win32') {
    try {
      let binaryPath = join(
        __dirname,
        '../../native-prebuilds/window_overlay.node',
      )
      if (app.isPackaged) {
        binaryPath = join(
          process.resourcesPath,
          'native-prebuilds/window_overlay.node',
        )
      }

      nativeOverlay = requireNative(binaryPath)
      globalThis.nativeOverlayInstance = nativeOverlay
      console.log('✅ [C++ plugin] ✓ Carregado: window_overlay.node')
    } catch (err) {
      console.error(
        '❌ [@rastrokit/desktop] Erro ao carregar window_overlay.node:',
        err,
      )
    }
  }

  if (process.platform === 'win32' && nativeOverlay) {
    nativeOverlay.setKeyEventListener((data) => {
      if (secondaryWindow && !secondaryWindow.isDestroyed()) {
        secondaryWindow.webContents.send('widget:raw-key-input', data)
      }
    })
  }

  app.commandLine.appendSwitch('disable-background-timer-throttling')
  app.commandLine.appendSwitch(
    'disable-features',
    'CalculateNativeWinOcclusion',
  )

  const remoteDebugPort =
    process.env.RASTRO_REMOTE_DEBUG_PORT ||
    (process.env.RASTRO_DEBUG === '1' ? '9333' : null)
  if (remoteDebugPort) {
    app.commandLine.appendSwitch('remote-debugging-port', remoteDebugPort)
    console.log(
      `🐞 [Rastro Core] Remote debugging port ativo: http://localhost:${remoteDebugPort}`,
    )
  }

  protocol.registerSchemesAsPrivileged([
    {
      scheme: RASTRO_PROTOCOL,
      privileges: { standard: true, secure: true, supportFetchAPI: true },
    },
  ])

  const oauthCallbackProtocol = getOAuthCallbackProtocol(app.isPackaged)

  if (app.isPackaged) {
    app.setAsDefaultProtocolClient(RASTRO_PROTOCOL)
  }

  if (!app.isPackaged && !isTestMode) {
    const compiledFile = fileURLToPath(import.meta.url)
    app.setAsDefaultProtocolClient(oauthCallbackProtocol, process.execPath, [
      compiledFile,
    ])
  }

  app.on('second-instance', (event, commandLine) => {
    if (!event) return
    const link = findRastroDeepLink(commandLine, app.isPackaged)
    if (!link) return
    if (useDevOAuthHandoff && link.kind === 'oauth') return
    handleIncomingDeepLink(link)
  })

  app.on('open-url', (event, url) => {
    const link = parseRastroDeepLink(url, app.isPackaged)
    if (!link) return

    event.preventDefault()
    handleIncomingDeepLink(link)
  })

  const createWindow = () => {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      show: false,
      frame: false,
      icon: appIconPath,
      titleBarStyle: 'hidden',
      autoHideMenuBar: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false,
        contextIsolation: true,
        backgroundThrottling: false,
      },
    })
    mainWindow.windowType = 'main'

    mainWindow.on('ready-to-show', () => {
      const settings = getSettings()
      if (settings.startMinimized) {
        mainWindow?.minimize()
        return
      }
      mainWindow?.show()
    })

    mainWindow.on('maximize', () => {
      mainWindow?.webContents.send('window:maximized-change', true)
    })

    mainWindow.on('unmaximize', () => {
      mainWindow?.webContents.send('window:maximized-change', false)
    })

    let moveTimeout: NodeJS.Timeout | null = null

    mainWindow.on('will-move', () => {
      if (secondaryWindow && !secondaryWindow.isDestroyed()) {
        secondaryWindow.setIgnoreMouseEvents(true, { forward: false })

        if (moveTimeout) clearTimeout(moveTimeout)

        moveTimeout = setTimeout(() => {
          if (secondaryWindow && !secondaryWindow.isDestroyed()) {
            secondaryWindow.setIgnoreMouseEvents(true, { forward: true })
          }
        }, 150)
      }
    })

    mainWindow.on('moved', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const bounds = mainWindow.getBounds()
        mainWindow.webContents.send('window:bounds-changed', bounds)
      }
    })

    mainWindow.webContents.setWindowOpenHandler((d) => {
      shell.openExternal(d.url)
      return { action: 'deny' }
    })

    mainWindow.webContents.on('will-navigate', (event, url) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const isDevServer =
          is.dev &&
          process.env['ELECTRON_RENDERER_URL'] &&
          url.startsWith(process.env['ELECTRON_RENDERER_URL'])

        if (!isDevServer) {
          event.preventDefault()
          shell.openExternal(url)
        }
      }
    })

    mainWindow.on('closed', () => {
      mainWindow = null
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
      return
    }
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  const createSecondaryWindow = (
    activeWorkspaceId?: string,
    targetDisplayId?: number,
  ) => {
    const allDisplays = screen.getAllDisplays()
    const primaryDisplay = screen.getPrimaryDisplay()

    let targetDisplay = primaryDisplay
    const matchedDisplay = allDisplays.find((d) => d.id === targetDisplayId)
    if (matchedDisplay) {
      targetDisplay = matchedDisplay
    }
    const { x, y, width, height } = targetDisplay.workArea
    secondaryWindow = new BrowserWindow({
      width,
      height,
      x,
      y,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      hasShadow: false,
      focusable: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.mjs'),
        contextIsolation: true,
        backgroundThrottling: false,
        sandbox: false,
      },
    })
    secondaryWindow.windowType = 'widget'

    if (process.platform === 'win32' && nativeOverlay) {
      const handle = secondaryWindow.getNativeWindowHandle()
      nativeOverlay.applyOverlayStyles(handle)
    }

    secondaryWindow.on('moved', () => {
      if (secondaryWindow && !secondaryWindow.isDestroyed()) {
        const bounds = secondaryWindow.getBounds()
        secondaryWindow.webContents.send('window:bounds-changed', bounds)
        secondaryWindow.setIgnoreMouseEvents(true, { forward: true })
      }
    })

    secondaryWindow.setIgnoreMouseEvents(true, { forward: true })

    secondaryWindow.once('ready-to-show', () => {
      secondaryWindow?.show()
    })

    secondaryWindow.on('closed', () => {
      if (process.platform === 'win32' && nativeOverlay) {
        try {
          if (typeof nativeOverlay.cleanupOverlay === 'function') {
            nativeOverlay.cleanupOverlay()
          }
        } catch (err) {
          console.error('[Rastro Core] Erro ao limpar overlay nativo:', err)
        }
      }
      secondaryWindow = null
    })

    let widgetHashPath = '/widgets/timer'
    if (activeWorkspaceId) {
      widgetHashPath = `/workspaces/${activeWorkspaceId}/widgets/timer`
    }

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      secondaryWindow.loadURL(
        `${process.env['ELECTRON_RENDERER_URL']}/#${widgetHashPath}`,
      )
      return
    }
    secondaryWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: widgetHashPath,
    })
  }

  function registerAssetProtocol(): void {
    protocol.handle(RASTRO_PROTOCOL, async (request) => {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(null, { status: 405 })
      }

      const fileUrl = await resolveRastroAvatarUrl(userDataDir, request.url)
      if (!fileUrl) return new Response(null, { status: 404 })

      const asset = await net
        .fetch(fileUrl.href, { method: request.method })
        .catch(() => undefined)
      if (!asset) return new Response(null, { status: 404 })

      const headers = new Headers(asset.headers)
      headers.set('Content-Security-Policy', "default-src 'none'; sandbox")
      headers.set('X-Content-Type-Options', 'nosniff')
      return new Response(asset.body, { status: asset.status, headers })
    })
  }

  app
    .whenReady()
    .then(async () => {
      registerAssetProtocol()

      const userDataPath = app.getPath('userData')
      const sessionId = randomUUID()
      const diagnosticsDir = join(userDataPath, 'diagnostics')
      const eventsBuffer = new DiagnosticEventsBuffer(sessionId)
      const bootJournal = new BootJournal(
        diagnosticsDir,
        sessionId,
        eventsBuffer,
      )
      await bootJournal.initialize()
      bootJournal.recordPhase(
        'boot:start',
        'info',
        'Application startup initialized',
      )

      const credentialsVault = new KeytarCredentialsVault()
      const workspacesRepository = new SQLiteWorkspacesRepository(userDataPath)
      const lifecycleRepository = new SQLiteConnectionLifecycleRepository(
        workspacesRepository.db,
      )
      const credentialRegistry = new SQLiteWorkspaceCredentialReferenceRegistry(
        workspacesRepository.db,
      )
      const reservationRepository = new SQLiteConnectionReservationRepository(
        workspacesRepository.db,
      )
      const transactionBoundary =
        new SQLiteConnectionLifecycleTransactionBoundary(
          workspacesRepository.db,
        )

      const credentialRecovery = new DesktopCredentialRecovery(
        credentialRegistry,
        lifecycleRepository,
        reservationRepository,
        credentialsVault,
        workspacesRepository,
        transactionBoundary,
      )
      bootJournal.recordPhase(
        'boot:storage_init',
        'info',
        'Metadata database initialized',
      )

      const recoveryResult = await credentialRecovery.execute()
      if (recoveryResult.isFailure()) {
        console.error(
          'Credential recovery failed before desktop startup:',
          recoveryResult.failure.messageKey,
        )
        bootJournal.recordPhase(
          'boot:fatal',
          'error',
          'Credential recovery failed before desktop startup',
          recoveryResult.failure.messageKey,
        )
        await bootJournal.flush()
        app.quit()
        return
      }
      bootJournal.recordPhase(
        'boot:credentials_recovery',
        'info',
        'Credentials recovery completed',
      )
      const runtimeWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          preload: join(__dirname, '../preload/index.mjs'),
          sandbox: false,
          contextIsolation: true,
          backgroundThrottling: false,
        },
      })
      runtimeWindow.windowType = 'runtime'
      const localRuntime = new LocalRuntimeDispatcher(runtimeWindow)
      const analyticsEngine = new DuckDBAnalyticsEngine(
        join(userDataPath, 'analytics'),
      )
      const analyticsDiagnosticAdapter = new AnalyticsDiagnosticAdapter(
        analyticsEngine,
        workspacesRepository,
      )
      const metadataDiagnosticAdapter = new SqliteMetadataDiagnosticAdapter(
        workspacesRepository.db,
        userDataPath,
      )
      const diagnosticsService = new DiagnosticsService(
        localRuntime,
        metadataDiagnosticAdapter,
        analyticsDiagnosticAdapter,
        eventsBuffer,
        bootJournal,
        userDataPath,
        sessionId,
        app.getVersion(),
      )
      const diagnosticsHandler = new DiagnosticsHandler(diagnosticsService)
      const nodeFileStorage = new HardDiskStorage(
        userDataPath,
        RASTRO_ASSET_BASE_URL,
      )
      const containerBuilder = new ContainerBuilder()
        .addSecurityDependencies({
          credentialsVault,
          fileStorage: nodeFileStorage,
          licensingApiConfiguration,
          offlineAuthorizationVerificationConfiguration,
          addonPackageVerificationConfiguration,
        })
        .addInfrastructure()
        .addApplicationServices()
      const serviceProvider = containerBuilder.build()
      serviceProvider.include({
        pendingWorkGuard: localRuntime,
      })
      const addonAccessService =
        serviceProvider.resolve<IAddonAccessService>('addonAccessService')
      const oauthAttemptCoordinator =
        serviceProvider.resolve<IOAuthAttemptCoordinator>(
          'oauthAttemptCoordinator',
        )
      const electronHttpClientFactory = new ElectronHttpClientFactory(
        {},
        new DefaultElectronFetchTransport(),
      )
      const electronHttpClient = electronHttpClientFactory.createClient({})
      let addonLoader: AddonLoader
      const onLoadFailuresChanged = (snapshot: AddonLoadFailuresSnapshot) => {
        for (const webContent of webContents.getAllWebContents()) {
          try {
            if (!webContent.isDestroyed()) {
              webContent.send('addons:load-failures-changed', snapshot)
            }
          } catch (broadcastErr) {
            console.warn(
              '⚠️ [Main] Falha ao emitir addons:load-failures-changed:',
              broadcastErr,
            )
          }
        }
      }
      addonLoader = new AddonLoader(
        credentialsVault,
        localRuntime,
        sdkPackage.version,
        (addonId: string): ICoreAddonCapabilities =>
          new AddonCoreCapabilities(
            workspacesRepository,
            localRuntime,
            addonId,
            serviceProvider.resolve<IConnectionLifecycleCoordinator>(
              'connectionLifecycleCoordinator',
            ),
            serviceProvider.resolve<ILinkConnectionUseCase>(
              'linkConnectionService',
            ),
            serviceProvider.resolve<IConnectAddonConnectionUseCase>(
              'connectAddonConnectionService',
            ),
            serviceProvider.resolve<IDisconnectAddonConnectionUseCase>(
              'disconnectAddonConnectionService',
            ),
            serviceProvider.resolve<IUnlinkConnectionUseCase>(
              'unlinkConnectionService',
            ),
            serviceProvider.resolve<IAddonAuthenticatorRegistry>(
              'authenticatorRegistry',
            ),
            serviceProvider.resolve<IAddonConnectionProfilesRegistry>(
              'profilesResolver',
            ),
            oauthAttemptCoordinator,
            addonLoader.systemEventEmitter,
            serviceProvider.resolve<IListTasksUseCase>('taskLookupService'),
            `${oauthCallbackProtocol}://oauth/callback`,
          ),
        addonAccessService,
        credentialRegistry,
        new JSONAddonSettingsRepository(userDataPath),
        serviceProvider.resolve<IAddonAuthenticatorRegistry>(
          'authenticatorRegistry',
        ),
        serviceProvider.resolve<IAddonConnectionProfilesRegistry>(
          'profilesResolver',
        ),
        oauthAttemptCoordinator,
        electronHttpClientFactory,
        new SQLiteAddonStorageRepository(userDataPath),
        onLoadFailuresChanged,
      )
      globalAddonLoader = addonLoader

      if (useDevOAuthHandoff) {
        const closeOAuthHandoff = watchDevOAuthCallbacks(userDataDir, (url) => {
          handleIncomingDeepLink({ kind: 'oauth', url })
        })
        app.once('will-quit', closeOAuthHandoff)
      }

      const initialDeepLink = findRastroDeepLink(process.argv, app.isPackaged)
      if (initialDeepLink) {
        handleIncomingDeepLink(initialDeepLink)
      }

      const timerRuntime = new TimerRuntime()
      timerRuntime.init(addonLoader, (generation) =>
        localRuntime.acceptsGeneration(generation),
      )

      const eventEmitter = new ElectronJobEventEmitter(() => mainWindow)

      if (!app.isPackaged && process.env.PLAYWRIGHT_TEST === '1') {
        const { registerElectronHttpTransportTestProbe } =
          await import('@/main/testing/electron-http-transport-test-probe')
        registerElectronHttpTransportTestProbe(() => {
          if (mainWindow === null) return null
          if (mainWindow.isDestroyed()) return null
          return mainWindow.webContents
        })
      }

      const updaterService = new UpdaterService()
      if (process.env.NODE_ENV !== 'test') updaterService.init()

      const localDataSourceResolver = new DataSourceResolver(
        workspacesRepository,
        credentialsVault,
        {
          addonsBasePath: join(__dirname, '../addons/datasource'),
          isDevelopment: !app.isPackaged,
          addonLoader,
        },
        electronHttpClientFactory,
      )

      let analyticsClosing = false
      let analyticsClosed = false
      const platformDeps: PlatformDependencies = {
        analyticsEngine,
        jobEmitter: eventEmitter,
        credentialsVault,
        workspacesRepository,
        lifecycleRepository,
        reservationRepository,
        credentialRegistry,
        fileStorage: nodeFileStorage,
        dataSourceResolver: localDataSourceResolver,
        analyticsResolver: new AnalyticsResolver(
          workspacesRepository,
          credentialsVault,
          electronHttpClientFactory,
          addonLoader,
        ),
        httpClient: electronHttpClient,
        httpClientFactory: electronHttpClientFactory,
        addonReloader: addonLoader,
        transactionBoundary,
        systemEventEmitter: addonLoader.systemEventEmitter,
      }

      containerBuilder
        .addPlatformDependencies(platformDeps)
        .addScoped<IHandlersScope>({
          coreHandler: CoreHandler,
          tasksHandler: TasksHandler,
          timeEntriesHandler: TimeEntriesHandler,
          tokenHandler: TokenHandler,
          workspacesHandler: WorkspacesHandler,
          addonsHandler: AddonsHandler,
          analyticsWarehouseHandler: AnalyticsWarehouseHandler,
          licensingHandler: LicensingHandler,
          metadataHandler: MetadataHandler,
          updaterHandler: UpdaterHandler,
        })

      serviceProvider.include({
        addonLoader,
        taskLookupService: new TaskLookupService(
          serviceProvider.resolve<IListTasksUseCase>('listTasksService'),
          localRuntime,
        ),
        updaterService,
        diagnosticsHandler,
        diagnosticsService,
        localRuntime,
      })

      const licensingFacade =
        serviceProvider.resolve<ILicensingFacade>('licensingFacade')
      globalLicensingFacade = licensingFacade
      addonLoader.setLicensingFacade(licensingFacade)

      if (pendingActivationKey) {
        const keyToActivate = pendingActivationKey
        pendingActivationKey = null
        void processActivationDeepLinkKey(keyToActivate)
      }

      if (process.env.NODE_ENV !== 'test') {
        const refreshedLicense = await licensingFacade.refreshLicense()
        if (refreshedLicense.isFailure())
          console.warn(
            '[Licensing] Renovação pendente:',
            refreshedLicense.failure.messageKey,
          )
      }

      try {
        const addonsFacade =
          serviceProvider.resolve<IAddonsFacade>('addonsFacade')
        const installedResult = await addonsFacade.listInstalled()
        if (installedResult.isSuccess() && installedResult.success.length > 0) {
          await addonLoader.loadInstalledAddons(installedResult.success)
          console.log(
            `🧩 [Rastro Core] ${installedResult.success.length} addon(s) instalado(s) carregado(s) no boot.`,
          )
        }
      } catch (err) {
        console.error(
          '❌ [Rastro Core] Erro ao carregar addons instalados no boot:',
          err,
        )
      }

      openIpcRoutes(serviceProvider, nativeOverlay)

      addonLoader.systemEventEmitter.on(
        'analytics:load-progress',
        (payload) => {
          for (const win of BrowserWindow.getAllWindows())
            if (!win.isDestroyed())
              win.webContents.send('analytics:load-progress', payload)
        },
      )

      addonLoader.systemEventEmitter.on(
        'analytics:storage-error',
        (payload) => {
          void diagnosticsService.recordAnalyticsStorageError(payload)
        },
      )

      addonLoader.systemEventEmitter.on(
        'analytics:storage-reset',
        (payload) => {
          void diagnosticsService.clearAnalyticsStorageError(
            payload.workspaceId,
          )

          for (const win of BrowserWindow.getAllWindows())
            if (!win.isDestroyed())
              win.webContents.send('analytics:storage-reset', payload)
        },
      )

      addonLoader.systemEventEmitter.on(
        'connection:disconnected',
        (payload) => {
          if (payload.workspaceId && payload.connectionInstanceId)
            void analyticsEngine.revokeConnection(
              payload.workspaceId,
              payload.connectionInstanceId,
            )
        },
      )

      addonLoader.systemEventEmitter.on('connection:archived', (payload) => {
        if (payload.workspaceId && payload.connectionInstanceId)
          void analyticsEngine.revokeConnection(
            payload.workspaceId,
            payload.connectionInstanceId,
          )
      })

      addonLoader.systemEventEmitter.on('connection:removed', (payload) => {
        if (payload.workspaceId && payload.connectionInstanceId)
          void analyticsEngine.revokeConnection(
            payload.workspaceId,
            payload.connectionInstanceId,
          )
      })

      electronApp.setAppUserModelId('com.electron')

      app.on('browser-window-created', (event, browserWindow) => {
        if (!event) return
        optimizer.watchWindowShortcuts(browserWindow)

        browserWindow.webContents.setWindowOpenHandler((details) => {
          if (
            details.url.startsWith('http://') ||
            details.url.startsWith('https://')
          ) {
            shell.openExternal(details.url)
          }
          return { action: 'deny' }
        })

        browserWindow.webContents.on('will-navigate', (navEvent, url) => {
          if (url.startsWith('http://') || url.startsWith('https://')) {
            const isDevServer =
              is.dev &&
              process.env['ELECTRON_RENDERER_URL'] &&
              url.startsWith(process.env['ELECTRON_RENDERER_URL'])

            if (!isDevServer) {
              navEvent.preventDefault()
              shell.openExternal(url)
            }
          }
        })

        browserWindow.webContents.on(
          'before-input-event',
          (inputEvent, input) => {
            if (!inputEvent) return
            const f12 = input.key === 'F12'
            const ctrlShiftI =
              input.control && input.shift && input.key.toLowerCase() === 'i'
            const ctrlShiftR =
              input.control && input.shift && input.key.toLowerCase() === 'r'
            const ctrlR =
              input.control && !input.shift && input.key.toLowerCase() === 'r'
            const f5 = input.key === 'F5'

            if (input.type === 'keyDown') {
              if (f12 || ctrlShiftI) {
                browserWindow.webContents.toggleDevTools()
              }
              if (ctrlShiftR || ctrlR || f5) {
                browserWindow.webContents.reloadIgnoringCache()
              }
            }
          },
        )
      })

      if (is.dev) {
        try {
          await installExtension(REACT_DEVELOPER_TOOLS, {
            loadExtensionOptions: { allowFileAccess: true },
          })
        } catch (err) {
          console.error('❌ Erro ao instalar a extensão React DevTools:', err)
        }
      }

      const getTargetWorkspaceId = async (): Promise<string | undefined> => {
        try {
          const settings = getSettings()
          if (!settings.lastSelectedWorkspaceId) return undefined
          const workspaceResult = await workspacesRepository.getById(
            settings.lastSelectedWorkspaceId,
          )
          const workspace = workspaceResult.success
          if (!workspace || workspace.status !== 'configured') return undefined
          return workspace.id
        } catch {
          return undefined
        }
      }

      tray = createTray(
        () => secondaryWindow,
        async () => {
          const targetWsId = await getTargetWorkspaceId()
          createSecondaryWindow(targetWsId)
        },
      )
      if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        await runtimeWindow.loadURL(
          `${process.env['ELECTRON_RENDERER_URL']}#/runtime`,
        )
      }
      if (!is.dev || !process.env['ELECTRON_RENDERER_URL']) {
        await runtimeWindow.loadFile(
          join(__dirname, '../renderer/index.html'),
          {
            hash: '/runtime',
          },
        )
      }
      const runtimeReady = await localRuntime.whenReady()
      if (!runtimeReady) {
        const failure = localRuntime.getDiagnosticState().lastStartupFailure
        const stage =
          failure?.kind === 'explicit'
            ? 'boot:runtime_failed'
            : 'boot:runtime_timeout'
        const level = failure?.kind === 'explicit' ? 'error' : 'warn'
        const message =
          failure?.kind === 'explicit'
            ? `Executor failed during startup: ${failure.messageKey}`
            : 'Executor did not become ready before startup deadline'
        console.error(`[LocalRuntime] ${message}`)
        bootJournal.recordPhase(stage, level, message)
      }
      if (runtimeReady) {
        bootJournal.recordPhase(
          'boot:runtime_ready',
          'info',
          'Local runtime executor became ready',
        )
      }
      createWindow()
      if (
        process.env.NODE_ENV !== 'test' ||
        process.env.RASTRO_OPEN_WIDGET_IN_TEST === 'true'
      ) {
        const targetWsId = await getTargetWorkspaceId()
        createSecondaryWindow(targetWsId)
      }

      app.on('activate', () => {
        if (!mainWindow || mainWindow.isDestroyed()) createWindow()
      })

      app.on('before-quit', (event) => {
        if (!analyticsClosed) {
          event.preventDefault()
          if (analyticsClosing) return
          analyticsClosing = true
          void analyticsEngine.close().then(
            () => {
              analyticsClosed = true
              app.quit()
            },
            (error: Error) => {
              console.error('[Analytics] Database close failed', error.message)
              analyticsClosed = true
              app.quit()
            },
          )
          return
        }
        diagnosticsService.dispose()
        timerRuntime.dispose()
        updaterService.stopAutoCheck()
        if (process.platform === 'win32' && nativeOverlay) {
          try {
            if (typeof nativeOverlay.cleanupOverlay === 'function') {
              nativeOverlay.cleanupOverlay()
            }
          } catch (err) {
            console.error('[Rastro Core] Erro ao liberar overlay no quit:', err)
          }
        }
        if (tray) {
          tray.destroy()
          tray = null
        }
      })
    })
    .catch((err) => {
      console.error('STARTUP_ERROR_CAUGHT:', err)
    })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
