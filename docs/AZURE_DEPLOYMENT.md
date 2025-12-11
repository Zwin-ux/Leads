# Azure Deployment Guide

## Overview

This guide covers deploying Lead Sheets to Azure:
- **Client**: Azure Static Web Apps
- **API**: Azure App Service
- **Database**: Azure Cosmos DB (already configured)
- **Auth**: Microsoft Entra ID (already configured)

---

## Prerequisites

1. Azure subscription with Owner/Contributor access
2. GitHub repository connected to Azure
3. Azure CLI installed (`az --version`)

---

## Step 1: Create Azure Resources

### 1.1 Create Resource Group
```bash
az group create --name rg-leads-prod --location westus2
```

### 1.2 Create Static Web App (Client)
```bash
az staticwebapp create \
  --name leads-client \
  --resource-group rg-leads-prod \
  --source https://github.com/YOUR_ORG/leads \
  --location westus2 \
  --branch main \
  --app-location "/apps/client/dist" \
  --output-location "" \
  --login-with-github
```

After creation, get the deployment token:
```bash
az staticwebapp secrets list --name leads-client --resource-group rg-leads-prod
```

### 1.3 Create App Service (API)
```bash
# Create App Service Plan
az appservice plan create \
  --name leads-api-plan \
  --resource-group rg-leads-prod \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name leads-api \
  --resource-group rg-leads-prod \
  --plan leads-api-plan \
  --runtime "NODE:18-lts"
```

---

## Step 2: Configure Environment Variables

### 2.1 Static Web App (Client)
```bash
# These are build-time variables, set in GitHub Actions secrets:
# VITE_API_URL=https://leads-api.azurewebsites.net
# VITE_OPENAI_API_KEY=sk-...
# VITE_OC_API_KEY=...
```

### 2.2 App Service (API)
```bash
az webapp config appsettings set \
  --name leads-api \
  --resource-group rg-leads-prod \
  --settings \
    COSMOS_ENDPOINT="https://ampac134.documents.azure.com:443/" \
    COSMOS_KEY="<your-cosmos-key>" \
    COSMOS_DATABASE="leads" \
    OPENAI_API_KEY="<your-openai-key>" \
    FIRECRAWL_API_KEY="<your-firecrawl-key>" \
    AZURE_FORM_RECOGNIZER_ENDPOINT="<your-form-recognizer-endpoint>" \
    AZURE_FORM_RECOGNIZER_KEY="<your-form-recognizer-key>"
```

---

## Step 3: Configure GitHub Secrets

Add these secrets to your GitHub repository:

| Secret Name | Description |
|-------------|-------------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | From Step 1.2 |
| `AZURE_API_APP_NAME` | `leads-api` |
| `AZURE_API_PUBLISH_PROFILE` | Download from Azure Portal > App Service > Deployment Center |
| `VITE_API_URL` | `https://leads-api.azurewebsites.net` |
| `VITE_OPENAI_API_KEY` | Your OpenAI API key |
| `VITE_OC_API_KEY` | OpenCorporates API key (optional) |

---

## Step 4: Deploy

### Option A: GitHub Actions (Recommended)
Push to `main` branch - the workflow will automatically:
1. Build shared package
2. Build and deploy client to Static Web Apps
3. Build and deploy API to App Service

### Option B: Manual Deployment

**Deploy Client:**
```bash
cd apps/client
npm run build
# Then upload dist/ to Static Web Apps via Azure Portal
```

**Deploy API:**
```bash
cd apps/api
npm run build
# Create zip of dist/, package.json, web.config
az webapp deployment source config-zip \
  --name leads-api \
  --resource-group rg-leads-prod \
  --src deploy.zip
```

---

## Step 5: Configure CORS on API

```bash
az webapp cors add \
  --name leads-api \
  --resource-group rg-leads-prod \
  --allowed-origins "https://leads-client.azurestaticapps.net"
```

---

## Step 6: Update Entra ID Redirect URIs

In Azure Portal > App Registrations > Lead Sheets:

1. Go to **Authentication**
2. Add redirect URIs:
   - `https://leads-client.azurestaticapps.net`
   - `https://leads-client.azurestaticapps.net/auth/callback`
3. Save

---

## Verification Checklist

After deployment, verify:

- [ ] Client loads at `https://leads-client.azurestaticapps.net`
- [ ] Microsoft login works (redirects and returns)
- [ ] API health check: `https://leads-api.azurewebsites.net/health`
- [ ] Lead creation works
- [ ] M365 actions (meeting scheduling) work
- [ ] Dashboard role switching works

---

## Troubleshooting

### Client shows blank page
- Check browser console for CSP errors
- Verify `staticwebapp.config.json` is deployed

### API returns CORS errors
- Verify CORS is configured on App Service
- Check that client URL is in allowed origins

### Auth fails
- Verify redirect URIs in Entra ID
- Check that tenant ID matches in `authConfig.ts`

### Cosmos DB connection fails
- Verify connection string in App Service settings
- Check firewall rules in Cosmos DB

---

## Environment URLs

| Environment | Client URL | API URL |
|-------------|------------|---------|
| Production | `https://leads-client.azurestaticapps.net` | `https://leads-api.azurewebsites.net` |
| Development | `http://localhost:5173` | `http://localhost:3001` |
