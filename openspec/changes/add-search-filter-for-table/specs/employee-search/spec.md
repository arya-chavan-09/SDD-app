## ADDED Requirements

### Requirement: Search filter input
The UI SHALL display a text input field above the employee table to act as a search filter.

#### Scenario: Displaying the search input
- **WHEN** the dashboard page loads
- **THEN** a text input with placeholder "Search employees..." is visible above the table

### Requirement: Client-side table filtering
The system SHALL filter the employee table rows based on the text entered in the search filter input. The filter SHALL be case-insensitive and match against any text column in the table (Name, Email, Department, Role).

#### Scenario: Filtering by exact name
- **WHEN** the user types an exact employee name in the search input
- **THEN** the table ONLY displays the row(s) containing that name

#### Scenario: Filtering by partial text
- **WHEN** the user types a partial string (e.g., "Eng" for "Engineering")
- **THEN** the table displays all rows where any column contains "Eng" (case-insensitive)

#### Scenario: Clearing the search
- **WHEN** the user clears the search input
- **THEN** the table displays all employee rows again
