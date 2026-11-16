# Phase 1: index.html?dev를 헤드리스 크롬으로 자동 진행하며 다른 당 방침 결정 상황(JLOG)을 data/ctx.jsonl에 모음
# 우리 당은 아무것도 안 하고(게임 오버도 끔) 모달은 첫 버튼으로 넘김. 실행: .venv/Scripts/python collect.py [판 수] [판당 햇수] [시작 판 번호]
import json, sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = pathlib.Path(__file__).parent / 'data' / 'ctx.jsonl'
STEP = """() => {
  if (modalOpen) { const b = document.querySelector('#modalRoot [data-b]'); if (b) b.click(); else closeModal(); return S.day; }
  if (!left && !turnStart) endTurn(true);
  return S.day;
}"""


def game(browser, years, g):
    page = browser.new_context().new_page()  # 판마다 저장소가 빈 새 컨텍스트(세이브가 남으면 새 게임 화면이 안 뜸)
    page.on('pageerror', lambda e: print('pageerror:', e, flush=True))
    page.goto((ROOT / 'index.html').as_uri() + '?dev')
    page.fill('#ng [name=name]', f'자동{g}당')
    page.fill('#ng [name=leader]', '홍길동')
    page.click('#ng button[type=submit]')
    page.evaluate('() => { checkGameOver = () => {}; }')
    start = page.evaluate('() => S.day')
    last = start
    while last < start + 365 * years:
        last = page.evaluate(STEP)
        page.wait_for_timeout(20)
    rows = page.evaluate('() => JLOG')
    with OUT.open('a', encoding='utf-8') as f:
        for r in rows:
            f.write(json.dumps({'g': g, **r}, ensure_ascii=False) + '\n')
    print(f'game {g}: {len(rows)} rows, {(last - start) // 7} weeks', flush=True)
    page.context.close()


def main():
    a = sys.argv[1:] + ['4', '8', '0'][len(sys.argv) - 1:]
    games, years, first = int(a[0]), float(a[1]), int(a[2])  # first: 이어 모을 때 판 번호 시작
    OUT.parent.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge')  # 윈도 기본 Edge(브라우저 따로 안 받음)
        for g in range(first, first + games):
            game(browser, years, g)


if __name__ == '__main__':
    main()
