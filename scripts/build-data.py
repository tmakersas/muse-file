"""Normalize raw scraper output (public X posts) into src/data/snapshot.json.

Only public posts. Keeps the fields the analysis needs. Run: python3 scripts/build-data.py
"""
import json, re, glob, os
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "scripts", "raw")

# Clock per subject. We only use a local time zone when the subject says publicly where they live.
SUBJECTS = {
    "tibo_maker": {"name": "Tibo", "tz": "Europe/Paris", "tzLabel": "Paris time"},
    "levelsio": {"name": "Pieter Levels", "tz": "UTC", "tzLabel": "UTC"},
    "marclou": {"name": "Marc Lou", "tz": "UTC", "tzLabel": "UTC"},
    "rauchg": {"name": "Guillermo Rauch", "tz": "UTC", "tzLabel": "UTC"},
    "gregisenberg": {"name": "Greg Isenberg", "tz": "UTC", "tzLabel": "UTC"},
    "karpathy": {"name": "Andrej Karpathy", "tz": "UTC", "tzLabel": "UTC"},
}

LEAD = re.compile(r"^(?:@\w+\s+)+")
HANDLE = re.compile(r"@(\w{1,15})")


def load(path):
    d = json.load(open(path))
    if isinstance(d, dict):
        d = d.get("items", [])
    return d


out = {}
for handle, meta in SUBJECTS.items():
    seen = {}
    for f in glob.glob(os.path.join(RAW, f"{handle}_*.json")):
        for it in load(f):
            if str(it.get("author", "")).lower() != handle.lower():
                continue
            seen[it["id"]] = it
    if not seen:
        continue
    posts = []
    for it in seen.values():
        text = it.get("text", "")
        t = int(datetime.strptime(it["createdAt"], "%a %b %d %H:%M:%S %z %Y").timestamp() * 1000)
        is_rt = text.startswith("RT @")
        lead = LEAD.match(text)
        is_reply = bool(it.get("isReply")) or bool(lead)
        reply_to = None
        if is_reply:
            src = it.get("inReplyToUsername") or it.get("inReplyTo") or (HANDLE.findall(lead.group(0))[0] if lead else None)
            reply_to = src.lower() if src else None
        mentions = sorted({m.lower() for m in HANDLE.findall(text)})
        if is_rt:
            mentions = []
        q = it.get("quotedTweet") or {}
        p = {
            "t": t,
            "text": text,
            "isReply": is_reply,
            "isRT": is_rt,
            "mentions": mentions,
            "likes": int(it.get("likes") or 0),
            "views": int(it.get("views") or 0),
        }
        if reply_to:
            p["replyTo"] = reply_to
        if q.get("author"):
            p["quoted"] = q["author"].lower()
        posts.append(p)
    posts.sort(key=lambda p: p["t"])
    out[handle] = {**meta, "handle": handle, "posts": posts}
    print(handle, len(posts), "replies:", sum(p["isReply"] for p in posts))

os.makedirs(os.path.join(ROOT, "src", "data"), exist_ok=True)
json.dump(
    {"snapshot": "2026-10-07", "subjects": out},
    open(os.path.join(ROOT, "src", "data", "snapshot.json"), "w"),
    ensure_ascii=False,
)
