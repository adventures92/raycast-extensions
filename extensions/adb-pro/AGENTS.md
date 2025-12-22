# AGENTS.md - Development Protocol for AI Entities

Welcome, Agent. You are operating on **ADB Pro**, a high-performance Raycast extension designed to modernize Android development workflows. This protocol defines your operational constraints, architectural understanding, and quality benchmarks.

---

## Global Context
**ADB Pro** is built for developers who demand speed and elegance. It abstracts complex ADB terminal commands into a fluid, keyboard-driven UI. Your goal is to maintain the "Zero-Config" promise: **If it can be automated, automate it.**

## Architectural Blueprints

### 1. The Service Registry (`src/services/`)
This is the "Brain" of the extension. UI components must remain "dumb" and delegated.
- **`AdbService` (`adb.ts`)**: 
  - Centralized singleton for all `adb` binary interactions.
  - **Pattern**: `adb.exec("-s {id} shell {cmd}")` for synchronous tasks.
  - **Streaming**: `adb.spawnLogcat({id})` returns a `ChildProcess` for live data.
- **`EnvironmentService` (`environment.ts`)**:
  - Handles the complex logic of finding ADB across macOS/Windows/Linux.
  - Manages `raycast/storage` for persisting the ADB path.
- **`AppService` (`apps.ts`)**:
  - Encapsulates domain logic for Android packages (parsing `pm`, `dumpsys`).

### 2. The Interaction Layer (`src/`)
Each file is a **Standalone Command**. 
- **Rule**: Avoid deep nesting. Every action should be searchable in the Raycast Root.
- **Components**: Shared UI resides in `src/components/`. Use `DevicePicker` or `AppPicker` to maintain consistency during selection flows.

### 3. State & Persistence
- **Transient State**: Use `useState` for local UI interactions.
- **Persistent State**: Use `@raycast/utils` `useCachedState` or `@raycast/api` `LocalStorage`.
- **Async Operations**: Always use `usePromise` for fetching data to handle loading states automatically.

### 4. Core Entities (`src/types/index.ts`)
Standardize on these primitives:
- **`Device`**: Unified representation of physical and virtual hardware.
- **`App`**: Package-specific metadata (Name, Bundle ID, Version).
- **`AdbResult`**: Standard return type for service methods.

---

## Development Standards (The "Gold" Standard)

### 1. ADB Best Practices
- **Escaping**: Always escape user inputs passed to `shell`. (See `AdbService.inputText` for reference).
- **Concurrency**: ADB can be flaky. Implement simple retries or clear error messages for "Device Unauthorized" or "Offline".
- **Pathing**: Never assume `adb` is in the `$PATH`. Always verify via `EnvironmentService`.

### 2. UI/UX Excellence
- **Feedback**: Every button click that triggers a side effect **MUST** show a `showToast`.
- **Speed**: Use Action `Style.Primary` for the most common action in a view.
- **Shortcuts**: Assign semantic shortcuts (e.g., `Cmd + R` for Refresh/Restart).

### 3. TypeScript & Clean Code
- **Defensive Programming**: Check for `null` devices or apps before executing actions.
- **Type Definitions**: Extend `src/types/index.ts` for any new data structures.
- **Logging**: Use `console.error` for system failures but keep `console.log` out of production.

---

## Operational Workflow for Agents

### Feature Implementation Checklist
1.  [ ] **Metadata**: Update `package.json` with the new command.
2.  [ ] **Logic**: Implement the required ADB command in `src/services/adb.ts`.
3.  [ ] **View**: Create the corresponding `.tsx` file in `src/`.
4.  [ ] **Error States**: Handle "Device not connected" or "Package not found" gracefully.
5.  [ ] **Validation**: Run `npm run lint` and ensure the UI matches Raycast's premium aesthetic.

### Interaction Patterns
- **Proactivity**: If you find a bug in a service while adding a feature, fix it immediately.
- **Documentation**: Keep `AGENTS.md` and `GEMINI.md` updated as the architecture evolves.
- **User Safety**: Avoid commands that could lead to data loss without a `confirmBeforeExecution` toggle.

---

**Protocol Note**: You are not just a coder; you are the architect of a premium developer tool. Make decisions that favor **reliability** over **novelty**.
