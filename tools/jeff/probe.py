# Phase 0: jeff.routing.tools가 다른 당 주간 방침을 상식대로 고르는지 검사. 통과 기준: 일치율 70% 이상
# 실행: .venv/Scripts/python probe.py
import sys, time
from jeff import Jeff, Call

AGENT = ("A campaign strategist for a political party in a turn-based election game. "
         "Each week it picks the party's main strategy for that week from the strategies offered.")
LABELS = {
    "campaign": "Campaign hard in close, winnable regions: use when an election is a few weeks away and races are tight",
    "policy": "Do quiet policy work and build voter trust: use when no election is coming soon",
    "attack": "Launch negative attacks on a rival: use when falling behind a rival close to an election",
    "coalition": "Seek alliances with other parties: use when the party is small or needs partners to pass bills or win",
    "lowkey": "Keep a low profile and avoid risk: use when far ahead, after a scandal, or when the party is in power and doing well",
}

# (상황, 정답)
CASES = [
    ("General election in 3 weeks. We trail our main rival by 2 points in many close regions.", "campaign"),
    ("Local elections in 2 weeks. Dozens of regional races are within 3 points.", "campaign"),
    ("Presidential election in 4 weeks. Our candidate is tied in the polls.", "campaign"),
    ("General election in 5 weeks. Several swing regions are a coin flip.", "campaign"),
    ("Election campaign period has started. Races are close everywhere.", "campaign"),
    ("Local elections in 3 weeks. Our support is rising and key cities are tied.", "campaign"),
    ("The next election is 30 weeks away. Nothing urgent is happening.", "policy"),
    ("No election for 7 months. Headlines are about housing prices and jobs.", "policy"),
    ("The last election just ended. The next one is far off.", "policy"),
    ("Quiet period, no election in sight. Voters say they want concrete plans on welfare.", "policy"),
    ("The election is 25 weeks away and our support is stable.", "policy"),
    ("Mid-term, no vote soon. Our policy credibility is low in polls.", "policy"),
    ("General election in 2 weeks. A rival leads us by 6 points and is pulling away.", "attack"),
    ("Presidential election in 3 weeks. The rival candidate is ahead by 5 points and was just caught in a minor scandal.", "attack"),
    ("Local elections in 2 weeks. We dropped 4 points this month and the rival keeps gaining.", "attack"),
    ("Election in 4 weeks. Our support is falling and the main rival is overtaking us.", "attack"),
    ("General election in 1 week. We are 5 points behind the leading party.", "attack"),
    ("Final week before the presidential vote. Our candidate trails by 7 points.", "attack"),
    ("We are a small party with 6 seats and 4% support. We cannot pass any bill alone.", "coalition"),
    ("We hold 12 of 300 seats. A larger party with similar views is open to an electoral alliance.", "coalition"),
    ("Our 4% support is close to the 3% threshold for proportional seats. Two allied parties offer a joint list.", "coalition"),
    ("We have 8 seats and need 151 votes to pass our flagship bill.", "coalition"),
    ("A tiny party with 3% support, facing an election in 20 weeks, cannot win districts alone.", "coalition"),
    ("We hold 9 seats and the ruling party needs our votes for its budget.", "coalition"),
    ("We lead the nearest rival by 15 points. The election is 6 weeks away.", "lowkey"),
    ("Our leader was just caught in a corruption scandal and support fell sharply.", "lowkey"),
    ("We are the ruling party with 170 seats and a 55% approval rating.", "lowkey"),
    ("A major party official was indicted yesterday. The media is hostile to us.", "lowkey"),
    ("We are comfortably ahead by 12 points and the opponents are struggling.", "lowkey"),
    ("Our president's approval is high and our party dominates parliament.", "lowkey"),
]


def main():
    t = time.time()
    jeff = Jeff.local(["jeff.routing.tools"])
    print(f"load {time.time() - t:.1f}s", flush=True)
    calls = [Call("jeff.routing.tools", m, {"agent": AGENT, "conversation": []}, LABELS) for m, _ in CASES]
    t = time.time()
    ds = jeff.decide(calls)
    dt = time.time() - t
    hit = 0
    for (m, want), d in zip(CASES, ds):
        p = {k: v for k, v in d.probabilities.items() if k in LABELS}
        s = sum(p.values()) or 1
        got = max(p, key=p.get)
        hit += got == want
        top = ' '.join(f"{k}:{v / s:.2f}" for k, v in sorted(p.items(), key=lambda x: -x[1])[:3])
        print(f"{'O' if got == want else 'X'} want={want:9} got={got:9} [{top}] other={1 - s:.2f} | {m[:60]}")
    print(f"\n일치 {hit}/{len(CASES)} = {hit / len(CASES):.0%} · {dt / len(CASES) * 1000:.0f}ms/건")
    return hit / len(CASES)


if __name__ == "__main__":
    sys.exit(0 if main() >= 0.7 else 1)
