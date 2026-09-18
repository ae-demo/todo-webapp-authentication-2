# Todo Webapp — PRD

## Problem Statement

People juggle their day-to-day tasks across sticky notes, chat messages, and memory, which means tasks get forgotten or duplicated. They need a single, personal place to write tasks down, track what's done, and trust that their list is private and persists across sessions and devices.

## Solution

A web application where each person signs in with their own account and manages a personal todo list: adding tasks, marking them complete, editing them, and removing them. Every todo is stored durably in a database and is visible only to the person who created it.

## Actors

- **User** — signs in to the app and manages their own private list of todos: create, view, edit, complete, and delete. Cannot see or affect any other user's todos.

## User Stories

1. As a User, I want to sign in to the app, so that my todos are private to me and available whenever I return.
2. As a User, I want to add a new todo with a title, so that I can capture a task I need to do.
3. As a User, I want to see all of my todos in one list, so that I can review what I still need to do.
4. As a User, I want to mark a todo as complete (and reopen it if needed), so that I can track my progress.
5. As a User, I want to edit a todo's title, so that I can fix a mistake or update the task.
6. As a User, I want to delete a todo, so that my list only shows tasks that still matter.
7. As a User, I want to sign out, so that my todos aren't left open on a shared device.

## Product Decisions

- **Sign-in**: every user authenticates via SSO through Thunder, the platform IDP (org default).
- **Todo scope**: each todo is private to the user who created it; there is no sharing or team list at launch.
- **Todo attributes**: a todo carries only a title and a completion status at launch — no due dates, priority, or categories.
- **Notifications**: none at launch — no email or push notifications are part of this product.

## Out of Scope

- Sharing todos or lists between users, teams, or assignment of todos to others.
- Due dates, reminders, priorities, categories, tags, or search/filtering.
- Any notification channel (email, push, SMS).
- Offline support or native mobile apps.

## Open Questions

None at this time.

