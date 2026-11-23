// 데스크탑 앱: 웹 버전과 같은 index.html을 창 하나로 띄움(게임 코드는 루트 파일 그대로 공유)
const { app, BrowserWindow, Menu, shell } = require('electron');
const fs = require('fs'), path = require('path');

// 개발(npm start)은 desktop/ 바깥 루트, 빌드본은 루트 파일이 main.js 옆에 복사됨
const ROOT = app.isPackaged ? __dirname : path.join(__dirname, '..');
const BOUNDS = path.join(app.getPath('userData'), 'window.json');

if (!app.requestSingleInstanceLock()) app.quit();

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  let b = {};
  try { b = JSON.parse(fs.readFileSync(BOUNDS, 'utf8')); } catch { }
  const win = new BrowserWindow({
    width: b.width || 1440, height: b.height || 900, x: b.x, y: b.y,
    minWidth: 960, minHeight: 640, backgroundColor: '#0E1A33', show: false,
    icon: path.join(ROOT, 'asset', 'icon', 'icon-512.png'),
  });
  if (b.max) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(ROOT, 'index.html'));

  // 바깥 링크는 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (/^https?:/.test(url)) { e.preventDefault(); shell.openExternal(url); } });

  // 메뉴바가 없으니 단축키 직접: F11 전체화면, Ctrl+Shift+I 개발자 도구
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    if (i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (i.control && i.shift && i.key.toLowerCase() === 'i') win.webContents.toggleDevTools();
  });

  win.on('close', () => {
    try { fs.writeFileSync(BOUNDS, JSON.stringify({ ...win.getNormalBounds(), max: win.isMaximized() })); } catch { }
  });
});

app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
app.on('window-all-closed', () => app.quit());
