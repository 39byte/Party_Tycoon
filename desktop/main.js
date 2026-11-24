// 데스크탑 앱: 웹 버전과 같은 index.html을 창 하나로 띄움(게임 코드는 루트 파일 그대로 공유)
const { app, BrowserWindow, Menu, shell, screen } = require('electron');
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');

// 개발(npm start)은 desktop/ 바깥 루트, 빌드본은 루트 파일이 main.js 옆에 복사됨
const ROOT = app.isPackaged ? __dirname : path.join(__dirname, '..');
const BOUNDS = path.join(app.getPath('userData'), 'window.json');
const INDEX = path.join(ROOT, 'index.html');

if (!app.requestSingleInstanceLock()) app.quit();

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  let b = {};
  try { b = JSON.parse(fs.readFileSync(BOUNDS, 'utf8')); } catch { }
  // 모니터 구성이 바뀌어 저장된 위치가 어느 화면과도 안 겹치면 위치는 버리고 가운데에 띄움
  const onScreen = b.x != null && screen.getAllDisplays().some(({ workArea: a }) =>
    b.x < a.x + a.width && b.x + (b.width || 0) > a.x && b.y < a.y + a.height && b.y + (b.height || 0) > a.y);
  const win = new BrowserWindow({
    width: b.width || 1440, height: b.height || 900, ...(onScreen ? { x: b.x, y: b.y } : {}),
    minWidth: 960, minHeight: 640, backgroundColor: '#0E1A33', show: false,
    icon: path.join(ROOT, 'asset', 'icon', 'icon-512.png'),
  });
  // maximize()는 숨긴 창도 바로 보여 주므로 그림이 준비된 뒤에
  win.once('ready-to-show', () => { if (b.max) win.maximize(); win.show(); });
  win.webContents.on('did-finish-load', () => win.webContents.setZoomLevel(b.zoom || 0));
  win.loadFile(INDEX);

  // 바깥 링크는 기본 브라우저로. 게임 화면 밖으로는 못 나가게(파일을 창에 끌어다 놓아도 그대로)
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => {
    if (url.split(/[?#]/)[0] === pathToFileURL(INDEX).href) return;
    e.preventDefault();
    if (/^https?:/.test(url)) shell.openExternal(url);
  });

  // 메뉴바가 없으니 단축키 직접: F11 전체화면, Ctrl+Shift+I 개발자 도구, Ctrl +/-/0 확대·축소
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    const wc = win.webContents, zoom = { '=': 0.5, '+': 0.5, '-': -0.5, '_': -0.5 }[i.key];
    if (i.key === 'F11') win.setFullScreen(!win.isFullScreen());
    else if (i.control && i.shift && i.key.toLowerCase() === 'i') return wc.toggleDevTools();
    else if (i.control && zoom) wc.setZoomLevel(Math.max(-3, Math.min(3, wc.getZoomLevel() + zoom)));
    else if (i.control && i.key === '0') wc.setZoomLevel(0);
    else return;
    e.preventDefault();
  });

  win.on('close', () => {
    try { fs.writeFileSync(BOUNDS, JSON.stringify({ ...win.getNormalBounds(), max: win.isMaximized(), zoom: win.webContents.getZoomLevel() })); } catch { }
  });
});

app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
app.on('window-all-closed', () => app.quit());
