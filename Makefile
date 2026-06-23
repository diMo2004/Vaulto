SHELL = cmd.exe
.SHELLFLAGS = /c

# ============================================================
# Vaulto – Project Makefile
# ============================================================
# Targets for running, building, and managing all services.
#
# Services:
#   backend              Spring Boot API         (port 8080)
#   frontend             React CRA app           (port 3000)
#   paddleocr            PaddleOCR microservice   (port 8081)
#   recommendation       Recommendation engine    (port 8000)
# ============================================================

.PHONY: all help \
        backend backend-build backend-clean \
        frontend frontend-install frontend-build frontend-clean \
        ocr ocr-docker ocr-local \
        recommend recommend-up recommend-down recommend-build \
        install dev clean stop

# -----------------------------------------------------------
# Default / Help
# -----------------------------------------------------------

help: ## Show this help message
	@echo.
	@echo   Vaulto Makefile Targets
	@echo   ======================
	@echo.
	@echo   make install           Install all dependencies
	@echo   make dev               Run backend + frontend together
	@echo   make all               Run ALL four services
	@echo   make stop              Stop background Docker services
	@echo   make clean             Clean all build artifacts
	@echo.
	@echo   -- Individual Services --
	@echo   make backend           Run Spring Boot backend (port 8080)
	@echo   make backend-build     Build backend JAR (skip tests)
	@echo   make backend-clean     Clean backend target/
	@echo.
	@echo   make frontend          Run React dev server (port 3000)
	@echo   make frontend-install  Install frontend npm packages
	@echo   make frontend-build    Build frontend production bundle
	@echo   make frontend-clean    Remove frontend build/ and node_modules/
	@echo.
	@echo   make ocr-docker        Run PaddleOCR via Docker (port 8081)
	@echo   make ocr-local         Run PaddleOCR locally with Python (port 8081)
	@echo.
	@echo   make recommend-up      Start recommendation stack (Docker Compose)
	@echo   make recommend-down    Stop recommendation stack
	@echo   make recommend-build   Rebuild recommendation Docker images
	@echo.
	@echo   make deploy            Deploy to AWS (runs deploy_aws.ps1)
	@echo.

# -----------------------------------------------------------
# Combined Targets
# -----------------------------------------------------------

install: frontend-install ## Install all project dependencies
	@echo [OK] Dependencies installed.

dev: ## Run backend + frontend (two processes)
	@echo Starting backend and frontend...
	@echo Run these in separate terminals:
	@echo   Terminal 1:  make backend
	@echo   Terminal 2:  make frontend
	@echo.
	@echo Or use: make all   (includes OCR + recommendation services)

all: ## Run all four services (use separate terminals)
	@echo ====================================================
	@echo   Run each command in a SEPARATE terminal:
	@echo ====================================================
	@echo.
	@echo   Terminal 1:  make backend
	@echo   Terminal 2:  make frontend
	@echo   Terminal 3:  make ocr-docker
	@echo   Terminal 4:  make recommend-up
	@echo.

# -----------------------------------------------------------
# Backend (Spring Boot – Java 17)
# -----------------------------------------------------------

backend: ## Run Spring Boot backend (port 8080)
	cd backend && .\mvnw.cmd spring-boot:run

backend-build: ## Build backend JAR without tests
	cd backend && .\mvnw.cmd clean package -DskipTests

backend-clean: ## Clean backend build artifacts
	cd backend && .\mvnw.cmd clean

# -----------------------------------------------------------
# Frontend (React – CRA)
# -----------------------------------------------------------

frontend: ## Run React dev server (port 3000)
	cd vaulto && npm start

frontend-install: ## Install frontend npm dependencies
	cd vaulto && npm install

frontend-build: ## Build production bundle
	cd vaulto && npm run build

frontend-clean: ## Remove build output and node_modules
	cd vaulto && if exist build rmdir /s /q build
	cd vaulto && if exist node_modules rmdir /s /q node_modules

# -----------------------------------------------------------
# PaddleOCR Service (port 8081)
# -----------------------------------------------------------

ocr-docker: ## Build and run PaddleOCR via Docker (port 8081)
	cd paddleocr-service && docker build -t vaulto-ocr .
	cd paddleocr-service && docker run --rm -p 8081:8000 --name vaulto-ocr vaulto-ocr

ocr-local: ## Run PaddleOCR locally with Python (port 8081)
	cd paddleocr-service && set PORT=8081 && python app.py

# -----------------------------------------------------------
# Recommendation Service (Docker Compose – port 8000)
# -----------------------------------------------------------

recommend-up: ## Start recommendation stack (API + PostgreSQL + Qdrant)
	cd recommendation-service && docker compose up -d

recommend-down: ## Stop recommendation stack
	cd recommendation-service && docker compose down

recommend-build: ## Rebuild recommendation Docker images
	cd recommendation-service && docker compose up -d --build

# -----------------------------------------------------------
# Deployment
# -----------------------------------------------------------

deploy: ## Deploy to AWS using the PowerShell script
	powershell -ExecutionPolicy Bypass -File .\deploy_aws.ps1

# -----------------------------------------------------------
# Cleanup
# -----------------------------------------------------------

clean: backend-clean frontend-clean ## Clean all build artifacts
	@echo [OK] All build artifacts cleaned.

stop: recommend-down ## Stop all background Docker services
	-docker stop vaulto-ocr 2>nul
	@echo [OK] Background services stopped.
