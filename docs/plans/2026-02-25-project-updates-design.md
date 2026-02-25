# Project Updates Design

## Problem

Ping (and potentially other projects) needs a way to publish development updates — full articles about direction, progress, and technical decisions. These should be separate from blog posts, ordered by date, and surfaced on both the homepage and a dedicated project page.

## Design

### New content collection: `projectUpdates`

Location: `src/content/project-updates/<project-slug>/`

Example: `src/content/project-updates/ping/setting-up-the-infra.md`

Frontmatter schema:

```yaml
title: string          # Update title
description: string    # Short summary
project: string        # Project slug (e.g., "ping")
date: date             # Publish date, used for sorting (newest first)
tags: string[]         # Optional tech/topic tags
draft: boolean         # Default false, drafts excluded from builds
```

### Routing

| Route | Page | Purpose |
|-------|------|---------|
| `/projects/ping` | `src/pages/projects/[project].astro` | Dedicated project page: project details + all updates listed chronologically |
| `/projects/ping/updates/setting-up-the-infra` | `src/pages/projects/[project]/updates/[slug].astro` | Individual update article (full page, similar to blog post layout) |

### Homepage changes

Existing project card on the timeline gains a small section beneath the description:

> **3 updates** · Latest: *Setting Up the Infrastructure* → [View all →](/projects/ping)

Only shown for projects that have updates.

### What stays the same

- Blog collection is untouched — updates never appear in the blog feed
- Existing project schema is unchanged — no new fields on project frontmatter
- The link between updates and projects is through the `project` field in update frontmatter, matched against the project's content collection ID

### Content structure

```
src/content/project-updates/
  ping/
    setting-up-the-infra.md
    real-time-chat-architecture.md
  centabit/
    ...
```

### Constraints

- Date-based ordering (newest first on project page)
- Updates are entirely separate from blog posts
- Each update is a full article with its own URL
- Homepage shows update count, latest update link, and "view all" link per project
