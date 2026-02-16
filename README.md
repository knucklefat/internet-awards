# 🏆 The Internet Awards

One product, **two Reddit Devvit apps** for community-driven awards: nominations, then voting.

| App | Phase | Purpose |
|-----|--------|---------|
| **fetchy-mcfetch** | 1 – Nominations | Users nominate; mods export CSV; Layer 3/4 analysis; staff pick finalists. |
| **ballot-box** | 2 – Voting | One post per award; mod-defined finalists (name + hero image); 2×3 grid; users vote. |

Both apps install on the **same subreddit**; different menu entries (e.g. “The Internet Awards – Nominations” vs “The Internet Awards – Vote”).

---

## Repo layout

```
internet-awards/
├── fetchy-mcfetch/     # Phase 1 app (nominations)
├── ballot-box/         # Phase 2 app (voting)
├── picky-mcpick/       # (archived)
├── LEARNINGS/          # Shared platform & session docs
├── NOMINATION_LINK_FREE_PLAN.md   # Phase 1 product/design
├── PICKY_PICK_APP_APPROACH.md     # Phase 2 product/design
└── README.md           # This file
```

---

## Quick start

**Phase 1 (nominations)**  
```bash
cd fetchy-mcfetch && npm install && npm run dev
devvit install <subreddit> fetchy-mcfetch
```

**Phase 2 (voting)**  
```bash
cd ballot-box && npm install && npm run dev
devvit install <subreddit> ballot-box
```

---

## Docs

- **Agent handoff:** [LEARNINGS/AGENT_HANDOFF_INTERNET_AWARDS.md](LEARNINGS/AGENT_HANDOFF_INTERNET_AWARDS.md) – current state summary for next agent  
- **fetchy-mcfetch:** [fetchy-mcfetch/README.md](fetchy-mcfetch/README.md) – API, Redis, troubleshooting, changelog  
- **ballot-box:** [ballot-box/README.md](ballot-box/README.md) – APIs, Redis, flow  
- **Product/design:** [NOMINATION_LINK_FREE_PLAN.md](NOMINATION_LINK_FREE_PLAN.md), [PICKY_PICK_APP_APPROACH.md](PICKY_PICK_APP_APPROACH.md)  
- **Shared learnings:** [LEARNINGS/](LEARNINGS/)

---

**Glass House Productions** · Reddit Devvit
