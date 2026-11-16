# Phase 4: 방침 혼합 비율(?mix)별로 자동 진행해 의석 쏠림·대통령 배출·방침 분포를 비교
# 실행: .venv/Scripts/python balance.py [판 수] [판당 햇수] [mix...]   예) balance.py 3 8 0 0.6
import sys, collections
from playwright.sync_api import sync_playwright
from collect import ROOT, STEP

SNAP = "() => ({ d: S.day, seats: Object.fromEntries(['A','B','C','D'].map(i => [i, seatTotal(i)])), pres: S.president.party })"


def run(browser, mix, years, g):
    page = browser.new_context().new_page()
    page.goto((ROOT / 'index.html').as_uri() + f'?dev&mix={mix}')
    page.fill('#ng [name=name]', f'비교{g}당'); page.fill('#ng [name=leader]', '홍길동'); page.click('#ng button[type=submit]')
    page.evaluate('() => { checkGameOver = () => {}; }')
    start = last = page.evaluate('() => S.day'); snaps = []; wk = start
    while last < start + 365 * years:
        last = page.evaluate(STEP)
        if last >= wk + 7: snaps.append(page.evaluate(SNAP)); wk = last
        page.wait_for_timeout(20)
    ks = [r['k'] for r in page.evaluate('() => JLOG')]
    page.context.close()
    return snaps, ks


def main():
    a = sys.argv[1:]
    games, years, mixes = int(a[0]), float(a[1]), a[2:] or ['0', '0.6']
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge')
        for mix in mixes:
            S, K = [], collections.Counter()
            for g in range(games):
                s, ks = run(browser, mix, years, g); S += s; K.update(ks)
            top = [max(x['seats'].values()) for x in S]
            pres = collections.Counter(x['pres'] for x in S)
            n = sum(K.values()) or 1
            print(f"mix={mix}: 최다 당 평균 {sum(top) / len(top):.0f}석, 200석 이상 {sum(t >= 200 for t in top) / len(top):.0%} 주, "
                  f"대통령 배출 {dict(pres)}, 방침 {({k: f'{v / n:.0%}' for k, v in K.most_common()})}", flush=True)


if __name__ == '__main__':
    main()
