# AMPAC CRM

AMPAC CRM is a follow-up engine for AmPac BDOs, integrating Excel, Outlook, and Teams.

## Structure

- **apps/client**: React application (Vite) for Excel Task Pane and Teams Tab.
- **apps/api**: Azure Functions (Node.js) for backend logic and Graph integration.
- **packages/shared**: Shared TypeScript types and utilities.

## Getting Started

1.  **Client**: `cd apps/client` && `npm install` && `npm run dev`
2.  **API**: `cd apps/api` && `npm install` && `npm start`
