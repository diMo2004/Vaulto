<#
.SYNOPSIS
Deploys the Vaulto application to AWS Free Tier services.

.DESCRIPTION
This script automatically:
1. Builds the Spring Boot backend and deploys it to AWS Elastic Beanstalk.
2. Builds the React frontend and deploys it to an AWS S3 static website bucket.

.PREREQUISITES
1. AWS CLI must be installed and configured (`aws configure`) with appropriate permissions.
2. Maven, Node.js, and npm must be installed.
#>

$ErrorActionPreference = "Stop"
$app_name = "vaulto-app"
$env_name = "vaulto-env"
$region = aws configure get region
if (-not $region) { $region = "us-east-1" }

$timestamp = (Get-Date).ToString("yyyyMMdd-HHmmss")
$bucket_suffix = (Get-Random -Minimum 10000 -Maximum 99999)
$eb_bucket = "vaulto-eb-deploy-$timestamp-$bucket_suffix"
$frontend_bucket = "vaulto-frontend-$timestamp-$bucket_suffix"
$jar_file = "vaulto-0.0.1-SNAPSHOT.jar"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Vaulto AWS Deployment ($region)" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# ---------------------------------------------------------
# Phase 1: Build & Deploy Backend (Elastic Beanstalk)
# ---------------------------------------------------------
Write-Host "`n[1/5] Building Spring Boot Backend..." -ForegroundColor Yellow
Set-Location "backend"
.\mvnw clean package -DskipTests
$jar_path = "target\$jar_file"

if (-not (Test-Path $jar_path)) {
    Write-Error "Backend build failed! $jar_path not found."
    exit
}

Write-Host "`n[2/5] Uploading Backend to AWS S3 & Creating Beanstalk App..." -ForegroundColor Yellow
aws s3 mb "s3://$eb_bucket" --region $region
aws s3 cp $jar_path "s3://$eb_bucket/$jar_file"

# Create Beanstalk App
aws elasticbeanstalk create-application --application-name $app_name > $null

# Create App Version
$version_label = "v-$timestamp"
aws elasticbeanstalk create-application-version `
    --application-name $app_name `
    --version-label $version_label `
    --source-bundle S3Bucket="$eb_bucket",S3Key="$jar_file" > $null

# Create Environment (Java 17 platform)
Write-Host "`n[3/5] Provisioning Elastic Beanstalk Environment (This takes 3-5 minutes)..." -ForegroundColor Yellow
aws elasticbeanstalk create-environment `
    --application-name $app_name `
    --environment-name $env_name `
    --version-label $version_label `
    --solution-stack-name "64bit Amazon Linux 2023 v4.3.4 running Corretto 17" `
    --option-settings Namespace=aws:autoscaling:launchconfiguration,OptionName=IamInstanceProfile,Value=aws-elasticbeanstalk-ec2-role `
    > $null

# Wait for environment URL
Write-Host "Waiting for environment to be created to retrieve URL..."
Start-Sleep -Seconds 30
$env_info = aws elasticbeanstalk describe-environments --environment-names $env_name | ConvertFrom-Json
$backend_url = $env_info.Environments[0].CNAME
Write-Host "Backend URL provisioned at: http://$backend_url" -ForegroundColor Green

Set-Location ".."

# ---------------------------------------------------------
# Phase 2: Build & Deploy Frontend (S3 Static Website)
# ---------------------------------------------------------
Write-Host "`n[4/5] Building React Frontend..." -ForegroundColor Yellow
Set-Location "vaulto"

# Update .env for production build to point to new backend
$env_file = ".env"
"REACT_APP_API_BASE=http://$backend_url" | Out-File -FilePath $env_file -Encoding utf8

npm install
npm run build

if (-not (Test-Path "build")) {
    Write-Error "Frontend build failed! 'build' folder not found."
    exit
}

Write-Host "`n[5/5] Deploying Frontend to AWS S3 Static Hosting..." -ForegroundColor Yellow
aws s3 mb "s3://$frontend_bucket" --region $region
aws s3 website "s3://$frontend_bucket" --index-document index.html --error-document index.html

# Disable block public access
aws s3api put-public-access-block --bucket $frontend_bucket --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

# Add public read bucket policy
$policy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$frontend_bucket/*"
        }
    ]
}
"@
$policy | Out-File -FilePath "policy.json" -Encoding utf8
aws s3api put-bucket-policy --bucket $frontend_bucket --policy file://policy.json
Remove-Item "policy.json"

# Sync files
aws s3 sync build/ "s3://$frontend_bucket" > $null

Set-Location ".."

Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Initiated Successfully!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Frontend URL: http://$frontend_bucket.s3-website-$region.amazonaws.com" -ForegroundColor White
Write-Host "Backend URL:  http://$backend_url" -ForegroundColor White
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Wait a few minutes for the Elastic Beanstalk backend to fully spin up."
Write-Host "2. Go to the AWS Elastic Beanstalk Console to add your Environment Variables:"
Write-Host "   (MONGO_URI, JWT_ACCESS_SECRET, GOOGLE_CLIENT_ID, etc.)"
Write-Host "3. Update your Google Cloud Console OAuth Authorized Redirect URIs to:"
Write-Host "   http://$backend_url/login/oauth2/code/google"
Write-Host "4. Add your Frontend URL to Google OAuth Authorized JavaScript Origins."
