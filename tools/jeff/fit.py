# Phase 3: data/labels.jsonl(특징 f → Jeff 방침 확률)로 softmax 회귀를 배워 logic.js의 RIV_W에 써 넣음
# 실행: .venv/Scripts/python fit.py
import json, re, pathlib
import numpy as np

HERE = pathlib.Path(__file__).parent
LOGIC = HERE.parents[1] / 'logic.js'
POSTURES = ['campaign', 'policy', 'attack', 'coalition', 'lowkey']  # logic.js L.POSTURES와 같은 순서


def main():
    rows = [json.loads(l) for l in (HERE / 'data' / 'labels.jsonl').open(encoding='utf-8')]
    X = np.array([r['f'] for r in rows], float)
    Y = np.array([[r['p'][k] for k in POSTURES] for r in rows], float)
    Y /= Y.sum(1, keepdims=True)  # Jeff가 덧붙이는 answer_directly·ask_user 몫은 빼고 다시 나눔
    n = len(X); cut = int(n * 0.8)
    perm = np.random.default_rng(0).permutation(n); tr, te = perm[:cut], perm[cut:]
    W = np.zeros((len(POSTURES), X.shape[1]))
    for _ in range(4000):  # 교차 엔트로피 + L2, 경사 하강
        Z = X[tr] @ W.T; Z -= Z.max(1, keepdims=True); P = np.exp(Z); P /= P.sum(1, keepdims=True)
        W -= 0.5 * ((P - Y[tr]).T @ X[tr] / len(tr) + 1e-3 * W)
    Z = X[te] @ W.T; P = np.exp(Z - Z.max(1, keepdims=True)); P /= P.sum(1, keepdims=True)
    agree = (P.argmax(1) == Y[te].argmax(1)).mean()
    print(f'{n}건, 검증 {len(te)}건에서 Jeff와 1순위 일치 {agree:.0%}')
    print('Jeff 1순위 분포', dict(zip(POSTURES, np.bincount(Y.argmax(1), minlength=5))))
    print('학습 1순위 분포', dict(zip(POSTURES, np.bincount((X @ W.T).argmax(1), minlength=5))))
    w = json.dumps([[round(x, 3) for x in r] for r in W.tolist()], separators=(',', ':'))
    src = LOGIC.read_text(encoding='utf-8')
    LOGIC.write_text(re.sub(r'const RIV_W = .*', f'const RIV_W = {w}; // fit.py: {n}건, 검증 일치 {agree:.0%}', src, count=1), encoding='utf-8')
    return agree


if __name__ == '__main__':
    main()
