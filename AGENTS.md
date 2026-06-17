# edge-onedrive Agents Guide

## Goal

This project provides a lightweight OneDrive directory listing service.

Core goals:

- Support multiple environments with minimal conditional code
- Keep the API small, predictable, and easy to deploy
- Focus on directory listing and related read-only metadata first

## Scope

Current priority:

- List directories from OneDrive
- Normalize output across environments
- Keep the UI as a minimal verification shell, not a full product

Out of scope for now:

- Heavy UI features
- Large framework abstractions
- Write operations unless clearly needed later

## Structure

- `api`: Hono service, adapters, environment handling
- `ui`: SolidJS UI
- Root workspace: shared tooling, scripts, and TypeScript config

## Implementation Rules

- Prefer small modules and explicit boundaries
- Keep environment-specific logic behind thin adapters
- Favor platform-agnostic TypeScript in core logic
- Return stable JSON shapes from the API
- Handle auth, network, and upstream API failures explicitly
- Default to read-only behavior

## Environment Strategy

Target portability:

- Node.js for local development
- Edge-friendly runtime support when practical

Guidelines:

- Avoid unnecessary Node-only APIs in shared logic
- Isolate runtime differences near the entry layer
- Use configuration over branching where possible

## Code Style

- Run `pnpm fix`
- Prefer clarity over cleverness
- Add comments only when logic is not obvious from code

## Delivery Standard

Before considering work done:

- The API behavior is clear and minimal
- New code fits the lightweight, multi-environment goal
