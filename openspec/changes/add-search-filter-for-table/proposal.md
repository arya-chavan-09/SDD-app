## Why

As the number of employees grows, it becomes difficult to find specific individuals in the dashboard table. A search filter solves this by allowing users to quickly find employees by name, department, or role, improving usability and efficiency.

## What Changes

- Add a text input field above the employee table on the frontend for search terms.
- Implement client-side filtering on the existing table data based on the search term (matching against name, email, department, or role).
- Update the table dynamically as the user types (real-time search).

## Capabilities

### New Capabilities
- `employee-search`: Client-side search and filtering functionality for the employee table on the dashboard.

### Modified Capabilities

## Impact

- Frontend HTML (`frontend/index.html`): Addition of the search input element.
- Frontend JS (`frontend/app.js`): Addition of the search logic to filter the displayed rows in the table.
- Frontend CSS (`frontend/index.css`): Styling for the search input to match the clean dark-themed UI.
