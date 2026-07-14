# Game Matchmaking Platform — Project Documentation

## 1. Overview

This platform connects gamers with compatible teammates through an automated matchmaking engine, and lets users create or browse lobbies to organize matches. The system covers the full lifecycle: authentication, profile setup, matchmaking, lobby management, live match tracking, statistics, social features (friends), and platform administration.

This document describes the architecture defined by the mentor's diagram and translates it into functional modules for implementation planning.

---

## 2. High-Level User Flow

```
User Opens Website
      │
      ▼
  Logged In? ──No──▶ Register / Login ──▶ Create Gaming Profile ──┐
      │                                                            │
     Yes                                                           │
      └───────────────────────────────────────────────────────────▶│
                                                                    ▼
                                                              Dashboard
```

The Dashboard is the central hub. From it, a user can branch into five areas:

- Find Players (matchmaking)
- Create Lobby
- Browse Lobbies
- View Statistics
- Friends
- Admin (conditional, admin-only)

---

## 3. Core Modules

### 3.1 Authentication & Profile
| Step | Description |
|---|---|
| Register / Login | Standard credential-based auth (email/username + password, or OAuth if extended later) |
| Create Gaming Profile | Captures game(s) played, rank/skill tier, preferred region, and preferred role — this profile data is the primary input to the matchmaking engine |

**Implementation note:** Profile fields (game, rank, region, role) should be modeled as first-class, queryable attributes since the matchmaking engine filters directly on them.

### 3.2 Matchmaking Engine
This is the core differentiator of the platform.

```
Find Players
      │
      ▼
Basic Matchmaking Engine
      │
      ├──▶ Match by Game
      ├──▶ Match by Rank
      ├──▶ Match by Region
      └──▶ Match by Role
                  │
                  ▼
          Compatibility Score
                  │
                  ▼
          Suggested Players
                  │
                  ▼
             Send Invite
```

**How it works:**
1. When a user requests matchmaking, the engine filters the player pool on four independent criteria: game, rank, region, and role.
2. Each candidate is reduced to a single **Compatibility Score**, likely a weighted sum across the four criteria (e.g., exact game match = mandatory filter, rank proximity = weighted distance, region = mandatory or weighted, role = complementary-role bonus).
3. The engine returns a ranked list of **Suggested Players**.
4. The user selects a suggestion and **Sends an Invite**, which feeds into the Lobby Invite flow (Section 3.3).

**Implementation note:** Treat "Match by Game/Rank/Region/Role" as independent scoring functions that combine into one weighted compatibility score, rather than four separate hard filters — this keeps the algorithm extensible if new criteria are added later (e.g., playstyle, language).

### 3.3 Lobby System
There are two entry paths into a lobby: **creating** one or **joining** one (via invite or public browsing).

**Path A — Create Lobby**
```
Create Lobby → Enter Lobby Details → Lobby Created → Enter Lobby Room
```

**Path B — Browse & Join Public Lobby**
```
Browse Lobbies → Public Lobby List → Request to Join → Leader Accepts? 
      ├─ Yes → Enter Lobby Room
      └─ No  → Request Rejected
```

**Path C — Join via Invite (from Matchmaking)**
```
Send Invite → Accept Invite?
      ├─ Yes → Enter Lobby Room
      └─ No  → Invite Closed
```

All three paths converge on the **Lobby Room**, which is the shared real-time space for the match. This is a useful architectural insight: the Lobby Room component should be built once and reused regardless of entry path.

### 3.4 Lobby Room
Inside the Lobby Room:

| Feature | Description |
|---|---|
| View Members | List of joined players |
| Real-Time Text Chat | Live chat over Socket.IO |
| Ready Button | Each member marks themselves ready |

**Ready-check loop:**
```
Ready → All Ready? 
   ├─ No  → back to Chat (loop until everyone is ready)
   └─ Yes → Match Started
```

### 3.5 Match Lifecycle & Statistics
```
Match Started → Submit Match Result → Update Player Statistics → View Statistics (Dashboard)
```

Match results feed directly into player statistics, which likely also feed back into rank (and therefore future matchmaking accuracy) — this creates a natural feedback loop between play outcomes and matchmaking quality worth designing for early, even if v1 doesn't auto-update rank.

**Implementation note:** "Match Started" and ready-state changes are good candidates for Socket.IO events (e.g., `ready:update`, `match:started`) broadcast to everyone in the same Lobby Room, so all clients update instantly without polling.

### 3.6 Friends System
```
Friends → Search User → Send Friend Request → Accepted?
     ├─ Yes → Friend List Updated
     └─ No  → Request Closed
```

Straightforward request/accept social graph, independent of the matchmaking engine but shares the same user/profile data.

### 3.7 Admin Panel
```
Dashboard → Admin? 
   ├─ No  → stays on Dashboard
   └─ Yes → Admin Dashboard
                ├── Manage Users
                ├── Manage Lobbies
                └── View Reports
```

Gated by a role check on the Dashboard. Admin actions are separate from the main player-facing flows and should sit behind proper authorization checks (not just a UI toggle).

---

## 4. Suggested Data Entities

Based on the flow, the minimum entity set is:

- **User** — credentials, role (player/admin)
- **Profile** — linked to User; game(s), rank, region, role
- **Lobby** — owner (leader), members, status (open/full/in-progress)
- **LobbyMembership** — join requests, accepted members
- **Invite** — sender, receiver, lobby reference, status
- **Match** — lobby reference, participants, result, timestamp
- **PlayerStats** — aggregated from Match results
- **FriendRequest** — sender, receiver, status
- **Report** (admin) — flagged users/lobbies for moderation

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React | Team's chosen stack |
| Backend/API | Node.js + Express | JS end-to-end with the React frontend; fast to scaffold REST routes |
| Real-time (chat, ready-check, lobby state) | Socket.IO | Handles live chat and ready-status sync in the Lobby Room; pairs natively with Express and has built-in room support, which maps cleanly onto individual Lobby Rooms |
| Database | PostgreSQL or SQLite (for prototype scale) | Relational fits the entity relationships above (Users, Lobbies, Matches) |
| Auth | JWT-based session auth |

---

## 6. Build Order

1. Auth + Profile creation (REST via Express)
2. Dashboard shell (static routes to each feature)
3. Lobby creation + Lobby Room, with Socket.IO wired in early for join/leave, chat, and ready-state events — since real-time is central to this feature, it's worth setting up the Socket.IO server alongside Express from the start rather than retrofitting it later
4. Basic matchmaking (start with simple filter-based matching; compatibility scoring can be a stretch goal)
5. Match submission + stats
6. Friends system
7. Admin panel (lowest priority — only needed if time remains)
