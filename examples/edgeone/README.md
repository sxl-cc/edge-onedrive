# EdgeOne Deployment Example

This example deploys edge-onedrive to Tencent EdgeOne Pages. It builds the API as an EdgeOne cloud function and copies the UI build output into the deployment directory.

> Important: do not connect this project to Git in the EdgeOne console. Deploy it with the CLI or CI instead, otherwise the API build output may be missing.

## Prerequisites

- Node.js and pnpm installed
- An EdgeOne account with access to EdgeOne Pages
- A configured Microsoft Entra app for OneDrive access
- A KV database created in the EdgeOne console

## Deploy

1. Install the EdgeOne CLI globally:

   ```sh
   npm install -g edgeone
   ```

2. Log in to EdgeOne:

   ```sh
   edgeone login
   ```

3. Go to this example directory:

   ```sh
   cd examples/edgeone
   ```

4. Deploy the project:

   ```sh
   pnpm deploy-edge -n <project-name>
   ```

5. Open the EdgeOne web console for the deployed project. Copy the variables from the repository root `.env.example` file and configure them as project environment variables.

6. In the EdgeOne web console, bind your KV database to the project. Set the binding variable name to `KV`.

## Runtime Notes

- `edgeone.json` configures a scheduled task named `token-check`.
- The scheduled task calls `/api/v1/health`, which checks the Microsoft Graph token state and refreshes tokens when needed.
- Environment variables are configured in the EdgeOne web console, not committed to this example.
