import { join } from 'node:path'

import { app, BrowserWindow, Menu, nativeImage, screen, Tray } from 'electron'

function getTrayIcon(status: TrayTimerStatus) {
  const iconName = status === 'idle' ? 'icon.png' : `tray-${status}.png`
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, iconName)
    : join(__dirname, '../../resources', iconName)
  return nativeImage.createFromPath(iconPath).resize({ width: 32, height: 32 })
}

let tray: Tray | null = null
let tooltipWindow: BrowserWindow | null = null

export type TrayTimerStatus = 'running' | 'paused' | 'idle'

export interface TrayTimerInfo {
  taskName?: string
  activityName?: string
  elapsedText: string // já formatado, ex: "00:12:34"
  status: TrayTimerStatus
}

let lastInfo: TrayTimerInfo = {
  elapsedText: '00:00:00',
  status: 'idle',
}

export function formatTrayTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return [hours, minutes, seconds]
    .map((n) => n.toString().padStart(2, '0'))
    .join(':')
}

export async function updateTrayTimer(info: TrayTimerInfo): Promise<void> {
  lastInfo = info

  if (!tray || tray.isDestroyed()) return

  tray.setImage(getTrayIcon(info.status))
  if (info.status === 'idle') {
    tray.setToolTip('Rastro')
    updateTooltipContent(info)
    return
  }

  tray.setToolTip(
    `Rastro — ${info.taskName ?? 'Sem tarefa'} · ${info.elapsedText}`,
  )
  updateTooltipContent(info)
}

// --- TOOLTIP CUSTOMIZADO (card ao passar o mouse, estilo FanControl) ---

const TOOLTIP_WIDTH = 260
const TOOLTIP_HEIGHT = 132

function getTooltipHtml(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            background: transparent;
            overflow: hidden;
            font-family: 'Segoe UI', Arial, sans-serif;
            -webkit-user-select: none;
            user-select: none;
          }
          .card {
            width: ${TOOLTIP_WIDTH - 16}px;
            margin: 8px;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(0, 0, 0, 0.08);
            padding: 12px 14px;
            color: #1a1a1a;
          }
          .header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
          }
          .header .dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            flex-shrink: 0;
          }
          .divider {
            height: 1px;
            background: rgba(0, 0, 0, 0.08);
            margin: 8px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            font-size: 12px;
            line-height: 1.7;
            color: #4b5563;
          }
          .row b {
            color: #1a1a1a;
            font-weight: 600;
          }
          .task-name {
            font-size: 12px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <span class="dot" id="status-dot"></span>
            <span>Rastro</span>
          </div>
          <div class="divider"></div>
          <div class="task-name" id="task-name">Sem tarefa</div>
          <div class="row"><span>Tempo</span><b id="elapsed">00:00:00</b></div>
          <div class="row"><span>Status</span><b id="status-label">Parado</b></div>
        </div>
        <script>
          window.__setTooltipInfo = (info) => {
            document.getElementById('task-name').textContent =
              info.taskName || info.activityName || 'Sem tarefa';
            document.getElementById('elapsed').textContent = info.elapsedText;

            const dot = document.getElementById('status-dot');
            const label = document.getElementById('status-label');
            const colors = { running: '#22c55e', paused: '#f59e0b', idle: '#9ca3af' };
            const labels = { running: 'Rodando', paused: 'Pausado', idle: 'Parado' };
            dot.style.background = colors[info.status] || colors.idle;
            label.textContent = labels[info.status] || labels.idle;
          };
        </script>
      </body>
    </html>
  `
}

function ensureTooltipWindow(): BrowserWindow {
  if (tooltipWindow && !tooltipWindow.isDestroyed()) return tooltipWindow

  tooltipWindow = new BrowserWindow({
    width: TOOLTIP_WIDTH,
    height: TOOLTIP_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false, // não rouba foco da janela ativa ao aparecer
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  tooltipWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  tooltipWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(getTooltipHtml())}`,
  )

  return tooltipWindow
}

function updateTooltipContent(info: TrayTimerInfo) {
  if (!tooltipWindow || tooltipWindow.isDestroyed()) return
  tooltipWindow.webContents
    .executeJavaScript(`window.__setTooltipInfo(${JSON.stringify(info)})`)
    .catch(() => {})
}

function positionTooltipNearTray(trayBounds: Electron.Rectangle) {
  if (!tooltipWindow || tooltipWindow.isDestroyed()) return

  const display = screen.getDisplayNearestPoint({
    x: trayBounds.x,
    y: trayBounds.y,
  })
  const { workArea } = display

  const trayCenterX = trayBounds.x + trayBounds.width / 2
  // Taskbar no rodapé (Windows/Linux comum) -> tooltip sobe acima do ícone.
  // Taskbar no topo (macOS) -> tooltip desce abaixo do ícone.
  const taskbarIsAtBottom = trayBounds.y > workArea.y + workArea.height / 2

  let x = Math.round(trayCenterX - TOOLTIP_WIDTH / 2)
  let y = taskbarIsAtBottom
    ? Math.round(trayBounds.y - TOOLTIP_HEIGHT - 8)
    : Math.round(trayBounds.y + trayBounds.height + 8)

  // Não deixa vazar pras bordas da tela
  x = Math.min(
    Math.max(x, workArea.x + 4),
    workArea.x + workArea.width - TOOLTIP_WIDTH - 4,
  )
  y = Math.min(
    Math.max(y, workArea.y + 4),
    workArea.y + workArea.height - TOOLTIP_HEIGHT - 4,
  )

  tooltipWindow.setBounds({
    x,
    y,
    width: TOOLTIP_WIDTH,
    height: TOOLTIP_HEIGHT,
  })
}

function showTooltip(trayBounds: Electron.Rectangle) {
  const win = ensureTooltipWindow()
  updateTooltipContent(lastInfo)
  positionTooltipNearTray(trayBounds)
  win.showInactive() // mostra sem tirar foco da janela que o usuário está usando
}

function hideTooltip() {
  if (tooltipWindow && !tooltipWindow.isDestroyed()) {
    tooltipWindow.hide()
  }
}

// --- HOVER VIA POLLING (substitui tray.on('mouse-enter'/'mouse-leave')) ---

let hoverPollInterval: ReturnType<typeof setInterval> | null = null
let isTooltipVisible = false

function pointInRect(
  point: Electron.Point,
  rect: Electron.Rectangle,
  padding = 0,
): boolean {
  return (
    point.x >= rect.x - padding &&
    point.x <= rect.x + rect.width + padding &&
    point.y >= rect.y - padding &&
    point.y <= rect.y + rect.height + padding
  )
}

function startHoverWatcher() {
  if (hoverPollInterval) return

  hoverPollInterval = setInterval(() => {
    if (!tray || tray.isDestroyed()) return

    const cursor = screen.getCursorScreenPoint()
    const trayBounds = tray.getBounds()
    const overTray = pointInRect(cursor, trayBounds, 2)

    // Também considera o cursor "dentro" enquanto ele está sobre o próprio
    // tooltip, senão o card some assim que o mouse sai do ícone pra ir em
    // direção ao card.
    const overTooltip =
      !!tooltipWindow &&
      !tooltipWindow.isDestroyed() &&
      tooltipWindow.isVisible() &&
      pointInRect(cursor, tooltipWindow.getBounds(), 4)

    if (overTray && !isTooltipVisible) {
      isTooltipVisible = true
      showTooltip(trayBounds)
    } else if (!overTray && !overTooltip && isTooltipVisible) {
      isTooltipVisible = false
      hideTooltip()
    }
  }, 150)
}

function stopHoverWatcher() {
  if (hoverPollInterval) {
    clearInterval(hoverPollInterval)
    hoverPollInterval = null
  }
  isTooltipVisible = false
}

// Chame no 'before-quit'/'window-all-closed' do processo principal pra
// parar o polling e destruir a janela de tooltip junto com o app.
export function destroyTray() {
  stopHoverWatcher()
  if (tooltipWindow && !tooltipWindow.isDestroyed()) {
    tooltipWindow.destroy()
    tooltipWindow = null
  }
  if (tray && !tray.isDestroyed()) {
    tray.destroy()
    tray = null
  }
}

export const createTray = (
  getSecondaryWindow: () => BrowserWindow | null,
  createSecondaryWindow: () => void,
) => {
  const defaultIcon = getTrayIcon('idle')

  tray = new Tray(defaultIcon)

  const buildContextMenu = () => {
    const secWin = getSecondaryWindow()
    return Menu.buildFromTemplate([
      {
        label: secWin?.isVisible()
          ? 'Ocultar Janela Flutuante'
          : 'Habilitar Janela Flutuante',
        click: () => {
          if (!secWin || secWin.isDestroyed()) {
            createSecondaryWindow()
          } else {
            secWin.isVisible() ? secWin.hide() : secWin.show()
          }
        },
      },
      { type: 'separator' },
      { label: 'Sair', role: 'quit' },
    ])
  }

  tray.setToolTip('Rastro')

  tray.on('click', () => {
    const menu = buildContextMenu()
    tray?.popUpContextMenu(menu)
  })

  tray.on('right-click', () => {
    const menu = buildContextMenu()
    tray?.popUpContextMenu(menu)
  })

  // Hover customizado via POLLING da posição do cursor comparada com os
  // bounds do ícone, em vez de `tray.on('mouse-enter'/'mouse-leave')`.
  // Esses eventos têm suporte inconsistente entre plataformas/versões do
  // Electron (por isso o TS acusava "No overload matches this call" — os
  // typings instalados nem sequer declaram esse evento pro Tray). Polling
  // funciona igual em Windows/Linux/macOS e não depende de overload nenhum.
  startHoverWatcher()

  return tray
}
