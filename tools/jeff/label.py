# Phase 2: data/ctx.jsonl 상황을 영어 문장으로 바꿔 Jeff(jeff.routing.tools)에 묻고 방침 확률을 data/labels.jsonl에 씀
# 끊겨도 이어서 함(이미 한 줄 번호는 건너뜀). 실행: .venv/Scripts/python label.py [최대 줄 수]
import json, random, sys, pathlib
from jeff import Jeff, Call
from probe import AGENT, LABELS

D = pathlib.Path(__file__).parent / 'data'
IDEO = {-1: 'conservative', -0.6: 'centre-right', 0.5: 'centre-left', 1: 'progressive'}
ELEC = {'nat': 'General election', 'gov': 'Local elections', 'pres': 'Presidential election', 'bye': 'By-elections'}


def text(c):
    s = c['seats']
    size = 'major' if s >= 100 else 'mid-sized' if s >= 20 else 'small'
    out = [f"We are a {size} {IDEO.get(c['ideo'], 'centrist')} party with {s} of 300 seats."]
    out.append(f"We hold the presidency (approval {c['appr']:.0f}%)." if c['pres'] else "We are in opposition.")
    t = c['trend']
    out.append(f"National support {c['sup']:.0f}%, " + (f"{'up' if t > 0 else 'down'} {abs(t):.1f} pts over 4 weeks." if abs(t) >= 0.5 else "flat over 4 weeks."))
    g = c['gap']
    out.append(f"We lead the next party by {g:.0f} pts." if g > 0.5 else f"We trail the leading party by {-g:.0f} pts." if g < -0.5 else "We are tied with the leading party.")
    wk = round(c['wk'])
    if c['type']:
        out.append(f"{ELEC.get(c['type'], 'An election')} in {wk} week{'s' if wk != 1 else ''}." if wk < 52 else "No election for a year.")
    if c['camp']:
        out.append("The official campaign period is under way.")
    if c['hit'] <= 4:
        out.append(f"We were hit by a scandal or gaffe {round(c['hit'])} weeks ago.")
    return ' '.join(out)


def main():
    cap = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    rows = [json.loads(l) for l in (D / 'ctx.jsonl').open(encoding='utf-8')]
    idx = list(range(len(rows)))
    random.Random(0).shuffle(idx)  # 고르게 뽑으려고 섞음(같은 시드라 이어 하기 안전)
    idx = idx[:cap]
    out = D / 'labels.jsonl'
    done = {json.loads(l)['i'] for l in out.open(encoding='utf-8')} if out.exists() else set()
    todo = [i for i in idx if i not in done]
    print(f'{len(done)} done, {len(todo)} to go', flush=True)
    jeff = Jeff.local(["jeff.routing.tools"])
    ctx = {"agent": AGENT, "conversation": []}
    for b in range(0, len(todo), 32):
        part = todo[b:b + 32]
        ds = jeff.decide([Call("jeff.routing.tools", text(rows[i]), ctx, LABELS) for i in part])
        with out.open('a', encoding='utf-8') as f:
            for i, d in zip(part, ds):
                p = {k: d.probabilities.get(k, 0) for k in LABELS}
                f.write(json.dumps({'i': i, 'f': rows[i]['f'], 'p': p, 'conf': d.confidence, 'text': text(rows[i])}) + '\n')
        print(f'{len(done) + b + len(part)}/{len(idx)}', flush=True)


if __name__ == '__main__':
    main()
