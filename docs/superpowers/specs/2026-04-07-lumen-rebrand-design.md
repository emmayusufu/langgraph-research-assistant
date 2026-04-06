# Lumen Rebrand — Design Spec

## Goal

Rename the app from "Research Assistant" to **Lumen** and redesign the auth pages (login + signup) to a clean, minimal centered-card style. Full rebrand pass: auth pages, app Header, page metadata, README.

---

## 1. Name & Brand

| Token | Value |
|-------|-------|
| Name | Lumen |
| Tagline | Write clearly. Think deeply. |
| Icon | `AutoAwesomeIcon` (MUI) — replaces `TravelExploreIcon` everywhere |
| Color | Existing blue palette unchanged (`#1e3a8a` primary) |
| Tab title | `Lumen` |
| Metadata description | `AI-powered writing and research` |

---

## 2. Login Page (`/login`)

**File:** `apps/web/src/app/(auth)/login/page.tsx`

**Layout:** Centered card, max-width 420px, subtle border/shadow, no side panel.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              ✦ Lumen                                │
│                                                     │
│         Welcome back                                │
│         Sign in to continue                         │
│                                                     │
│         [ Sign In  → ]                              │
│                                                     │
│         ─────────────────────────────               │
│         Don't have an account?  Create one          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Changes:**
- Remove left brand panel entirely
- Center card on full-height page (`display: flex, alignItems: center, justifyContent: center`)
- Logo: `AutoAwesomeIcon` + `"Lumen"` wordmark
- Heading: `"Welcome back"`, subtext: `"Sign in to continue"`
- Single full-width **Sign In** button (triggers Zitadel flow, no change to `onClick`)
- Footer: `"Don't have an account?"` → link to `/signup`
- Light/dark aware: `bgcolor: "background.default"`

---

## 3. Signup Page (`/signup`)

**File:** `apps/web/src/app/(auth)/signup/page.tsx`

**Layout:** Same centered card shell as login.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              ✦ Lumen                                │
│                                                     │
│         Create your workspace                       │
│         Get started in seconds                      │
│                                                     │
│         [ Organisation name        ]                │
│         [ First name ] [ Last name ]                │
│         [ Work email               ]                │
│         [ Password                 ]                │
│                                                     │
│         [ Create workspace  → ]                     │
│                                                     │
│         ─────────────────────────────               │
│         Already have an account?  Sign in           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Changes:**
- Remove right-side marketing panel
- Center card, same shell as login
- Logo: `AutoAwesomeIcon` + `"Lumen"` wordmark
- Heading: `"Create your workspace"`, subtext: `"Get started in seconds"`
- Form fields unchanged: org name, first name, last name, work email, password
- Submit button: `"Create workspace"` (no change to form logic or API call)
- Footer: `"Already have an account?"` → link to `/login`

---

## 4. App Header

**File:** `apps/web/src/components/layout/Header.tsx`

**Changes:**
- `TravelExploreIcon` → `AutoAwesomeIcon`
- Label `"Research"` → `"Lumen"`
- Everything else unchanged (Docs nav, agent chip, history toggle, theme toggle, sign-out)

---

## 5. Page Metadata

**File:** `apps/web/src/app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: "Lumen",
  description: "AI-powered writing and research",
};
```

---

## 6. Auth Layout

**File:** `apps/web/src/app/auth/layout.tsx`

Replace any "Research" text with "Lumen". Replace `TravelExploreIcon` with `AutoAwesomeIcon`.

---

## 7. README

**File:** `README.md`

- Title: `# Lumen`
- Opening description: `AI-powered writing and research tool...`
- Everything else (setup, ports, config, API table) unchanged

---

## Files Touched

| File | Change |
|------|--------|
| `apps/web/src/app/layout.tsx` | title + description metadata |
| `apps/web/src/app/(auth)/login/page.tsx` | full redesign — centered card |
| `apps/web/src/app/(auth)/signup/page.tsx` | full redesign — centered card |
| `apps/web/src/components/layout/Header.tsx` | icon + label rename |
| `apps/web/src/app/auth/layout.tsx` | icon + text rename |
| `README.md` | title + description |

---

## Out of Scope

- Auth logic (Zitadel flow unchanged)
- Main chat UI, Sidebar, Docs pages
- Color palette (no changes)
- Backend, API, database
