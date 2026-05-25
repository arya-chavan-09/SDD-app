## Context

The employee dashboard currently lists all employees without any filtering capabilities. As the employee list grows, finding specific people is tedious.

## Goals / Non-Goals

**Goals:**
- Provide a simple text search filter for the employee table.
- Filter rows dynamically on the client side without making additional API calls.
- Match against all visible text columns (Name, Email, Department, Role).

**Non-Goals:**
- Server-side filtering or pagination.
- Advanced filters (e.g., complex query builders, specific dropdowns per column).

## Decisions

- **Client-side filtering vs Server-side**: We chose client-side filtering because the number of employees is relatively small and already loaded entirely by the `/api/employees` endpoint. Client-side filtering is much faster and requires no backend modifications.
- **Search matching logic**: Match against the row's text content, case-insensitively. This is simple to implement and covers Name, Email, Department, and Role without needing column-specific logic.

## Risks / Trade-offs

- **Performance with many rows** -> **Mitigation**: Simple DOM-based filtering should handle a few thousand rows well. If it becomes an issue, we can debounce the input or move to server-side search later.
