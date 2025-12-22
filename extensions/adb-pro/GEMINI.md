# ADB Pro - Raycast Extension

This document provides a high-level overview of the ADB Pro Raycast extension codebase, its structure, and conventions to guide future development.

## Project Overview

ADB Pro is a powerful Raycast extension that provides a comprehensive suite of tools for Android developers to interact with the Android Debug Bridge (ADB). It allows users to manage devices, control apps, use debugging tools, and toggle various system settings directly from Raycast.

The project is a Raycast extension built with **React** and **TypeScript**. It interacts with the `adb` command-line tool to perform its functions.

### Key Technologies

*   **Raycast API (`@raycast/api`)**: Used for creating the user interface and managing commands.
*   **React**: The UI framework for creating components.
*   **TypeScript**: For static typing and better code quality.
*   **Node.js (`child_process`)**: Used to execute `adb` commands.

### Architecture

The extension is structured into several directories:

*   **`src/`**: The main source code directory.
    *   **`components/`**: Reusable React components used across different commands (e.g., `DeviceList`, `AppList`).
    *   **`hooks/`**: Custom React hooks for managing state and side effects (e.g., `useLogcat` for streaming log data).
    *   **`services/`**: Modules that encapsulate business logic and interactions with external tools like ADB (`adb.ts`).
    *   **`types/`**: TypeScript type definitions.
    *   **`utils/`**: Utility functions.
*   **`assets/`**: Static assets like the extension icon.

The main entry points are the command files in the `src/` directory (e.g., `manage-devices.tsx`, `view-logcat.tsx`). Each command corresponds to a feature in the extension.

## Building and Running

The project uses `npm` for package management and the `ray` CLI for development.

### Key Commands

*   **Install dependencies**:
    ```bash
    npm install
    ```
*   **Development mode**:
    ```bash
    npm run dev
    ```
    This command builds the extension and watches for changes, allowing for rapid development.
*   **Build for production**:
    ```bash
    npm run build
    ```
*   **Linting**:
    ```bash
    npm run lint
    ```
*   **Publish to Raycast Store**:
    ```bash
    npm run publish
    ```

## Development Conventions

*   **UI**: The UI is built with Raycast API components. React functional components with hooks are the standard.
*   **State Management**: For simple state, `useState` and `useEffect` are used. For more complex asynchronous operations, `@raycast/utils`'s `usePromise` hook is preferred.
*   **External Commands**: All interactions with the `adb` command-line tool are centralized in the `src/services/adb.ts` service. This service uses `child_process.exec` for short-lived commands and `child_process.spawn` for long-running processes like `logcat`.
*   **Styling**: Use Raycast's built-in components and style props.
*   **Error Handling**: Errors are handled at the service level and propagated to the UI to be displayed in toasts or other UI elements.
*   **Types**: All types are defined in the `src/types/` directory.

### Example: Adding a new ADB command

1.  **Add the command to `package.json`**: Define the new command's name, title, and other properties.
2.  **Create a new command file in `src/`**: For example, `src/new-command.tsx`. This will be the entry point for the command.
3.  **Implement the UI**: Use Raycast API components to build the UI for the command.
4.  **Add the business logic to `src/services/adb.ts`**: Create a new method in the `AdbService` class to execute the required `adb` command.
5.  **Connect the UI to the service**: Call the new service method from your command's UI and handle the results.
