# AmPac CRM - Auto Provisioning Script (Clean Slate)
# This script creates a NEW Resource Group to avoid region conflicts.

$PREFIX = "ampac-prod-free"
$RG = "ampac-crm-prod-free-rg"
$LOC = "northeurope"          # Ireland (Usually has trial quota)
$SWA_LOC = "westeurope"       # Nearby
$DB_USER = "ampacadmin"

Write-Host "TYPE: Starting Free Tier Provisioning in $LOC..."

# 1. Create Resource Group
Write-Host "Creating Resource Group: $RG..."
az group create --name $RG --location $LOC

# 2. Create PostgreSQL Database
# We generate a password if we can't find an existing one for this specific prefix
$EXISTING_SETTINGS = az webapp config appsettings list --name "$PREFIX-api" --resource-group $RG --output json 2>$null | ConvertFrom-Json
if ($EXISTING_SETTINGS) {
    $DB_URL = ($EXISTING_SETTINGS | Where-Object { $_.name -eq "DATABASE_URL" }).value
    Write-Host "[OK] Found existing Database!"
}
else {
    $DB_PASS = "Ampac$((Get-Random -Minimum 1000 -Maximum 9999))Secure!"
    Write-Host "Creating PostgreSQL Server (Takes ~5 mins)..."
    az postgres flexible-server create `
        --resource-group $RG `
        --name "$PREFIX-db" `
        --location $LOC `
        --admin-user $DB_USER `
        --admin-password $DB_PASS `
        --sku-name Standard_B1ms `
        --tier Burstable `
        --public-access 0.0.0.0 `
        --storage-size 32 `
        --yes

    $DB_URL = "postgres://$($DB_USER):$($DB_PASS)@$($PREFIX)-db.postgres.database.azure.com:5432/postgres?sslmode=require"
}

# 3. Create App Service Plan (API)
Write-Host "Creating App Service (FREE TIER)..."
# Changed to F1 (Free) to bypass Basic Quota
az appservice plan create --name "$PREFIX-plan" --resource-group $RG --sku F1 --is-linux --location $LOC

az webapp create --resource-group $RG --plan "$PREFIX-plan" --name "$PREFIX-api" --runtime "NODE:20-lts"

# 4. Configure API
Write-Host "Configuring API..."
az webapp config appsettings set --resource-group $RG --name "$PREFIX-api" --settings DATABASE_URL="$DB_URL" PORT="8080"

# 5. Create Static Web App (Client)
Write-Host "Creating Static Web App (in $SWA_LOC)..."
az staticwebapp create --name "$PREFIX-client" --resource-group $RG --location $SWA_LOC --sku Free

# 6. Automate DB Push
Write-Host "`n[OK] INFRASTRUCTURE COMPLETE. MIGRATING DB..."
$env:DATABASE_URL = $DB_URL
Set-Location "apps/api"

# Retry loop for DB readiness
for ($i = 1; $i -le 3; $i++) {
    Write-Host "Attempt ${i}: Pushing Schema..."
    npx prisma db push
    if ($LASTEXITCODE -eq 0) { break }
    Write-Host "Waiting 10s for DB to warm up..."
    Start-Sleep -s 10
}
Write-Host "[OK] DEPLOYMENT READY!"
Write-Host "API URL: https://$($PREFIX)-api.azurewebsites.net"

