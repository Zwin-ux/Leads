# GitHub Actions Deployment Setup

This document explains how to configure GitHub Actions for automated deployment to Azure.

## Required Secrets

You need to add the following secrets to your GitHub repository:

### 1. `AZURE_API_PUBLISH_PROFILE`
This is the publish profile for the API App Service.

**How to get it:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **App Services** > `leads-api-ampac-prod`
3. Click **Download publish profile** (in the top toolbar)
4. Open the downloaded file and copy its entire contents
5. In GitHub, go to **Settings** > **Secrets and variables** > **Actions**
6. Click **New repository secret**
7. Name: `AZURE_API_PUBLISH_PROFILE`
8. Value: Paste the entire contents of the publish profile file

### 2. `AZURE_STATIC_WEB_APPS_API_TOKEN`
This is the deployment token for Azure Static Web Apps (Client).

**How to get it:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Static Web Apps** > your app (e.g., `black-smoke-...`)
3. Go to **Manage deployment token** (in Overview or Settings)
4. Copy the token
5. In GitHub, go to **Settings** > **Secrets and variables** > **Actions**
6. Click **New repository secret**
7. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
8. Value: Paste the token

## Workflow: `azure-deploy.yml`

This is a consolidated workflow that deploys both the Client and API.

### Triggers
- **Automatic**: Push to `main` branch
- **Manual**: Click "Run workflow" in GitHub Actions

### Jobs

#### 1. `deploy_client` (Static Web Apps)
1. Installs all dependencies
2. Builds the shared package
3. Builds the client with production environment variables
4. Deploys to Azure Static Web Apps

#### 2. `deploy_api` (App Service)
1. Installs all dependencies
2. Builds and packs the shared package as a tarball
3. Updates `package.json` to use the local tarball
4. Installs production API dependencies
5. Compiles TypeScript
6. Bundles everything (including `node_modules`) for deployment
7. Deploys to Azure App Service

## Environment Variables

The following environment variables are baked into the client build:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://leads-api-ampac-prod.azurewebsites.net` |
| `VITE_AZURE_CLIENT_ID` | `695a1a76-a38e-4a7b-a88d-81ca61dc4c40` |
| `VITE_AZURE_TENANT_ID` | `common` |

If you need to change these, update the `azure-deploy.yml` workflow file.

## Manual Deployment

1. Go to **Actions** tab in GitHub
2. Select **Azure Deploy**
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

## Troubleshooting

### Deployment fails with "publish profile not found"
- Make sure the secret is named exactly `AZURE_API_PUBLISH_PROFILE`
- Re-download and re-upload the publish profile (they can expire)

### API returns 503 after deployment
- Check the Azure Portal **Log Stream** for startup errors
- Ensure all required environment variables are set in Azure App Service Configuration

### CORS errors
- The API has CORS configured to allow all origins
- If you see CORS errors, the API might be returning 503 (not running)

### Static Web App token issues
- Re-generate the deployment token in Azure Portal
- Make sure you're using the correct Static Web App

## Quick Start

1. **Add secrets** to GitHub (see above)
2. **Push to main** or **trigger manually** in GitHub Actions
3. **Wait** for the workflow to complete (~5 minutes)
4. **Test** your deployed application
