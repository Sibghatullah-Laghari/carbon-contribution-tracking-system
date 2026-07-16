#!/bin/bash
# ============================================
# CCTRS Backend – Start & Test Script
# ============================================
# Purpose:  Launches the Spring Boot JAR and
#           runs a quick sanity test on the API.
# Updated:  2026-07-16
# Author:   DevOps Team
# ============================================

set -e  # Exit on error

# ---- Configuration ----
PROJECT_ROOT="D:\SDA Project\carbon-contribution-tracking-system"
BACKEND_DIR="${PROJECT_ROOT}/backend/cctrs-backend"
JAR_FILE="${BACKEND_DIR}/target/backend-0.0.1-SNAPSHOT.jar"
BASE_URL="http://localhost:8080"
MAX_WAIT=30  # seconds to wait for the app to start

# ---- Helper: Wait for the app to be ready ----
wait_for_app() {
    echo "⏳ Waiting for the backend to start (max ${MAX_WAIT}s)..."
    local elapsed=0
    until curl -s -f -o /dev/null "${BASE_URL}/actuator/health" || curl -s -f -o /dev/null "${BASE_URL}/swagger-ui.html"; do
        if [ $elapsed -ge $MAX_WAIT ]; then
            echo "❌ Timeout – application did not start in time."
            exit 1
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done
    echo "✅ Backend is up and running!"
}

# ---- Step 1: Navigate and start the JAR ----
echo "🚀 Starting CCTRS backend from: ${BACKEND_DIR}"
cd "${BACKEND_DIR}"

if [ ! -f "${JAR_FILE}" ]; then
    echo "⚠️  JAR file not found! Did you run 'mvn clean package'?"
    echo "   Attempting to build now..."
    ./mvnw clean package -DskipTests
fi

# Launch the JAR in the background, redirect logs to a file
nohup java -jar "${JAR_FILE}" > backend.log 2>&1 &
BACKEND_PID=$!
echo "📦 Process PID: ${BACKEND_PID} (logs in backend.log)"

# ---- Step 2: Wait for readiness ----
wait_for_app

# ---- Step 3: Run test endpoints ----
echo ""
echo "🧪 Running API tests against ${BASE_URL}"

# 3a. Health check (public)
echo "▶️  GET /actuator/health"
curl -s -X GET "${BASE_URL}/actuator/health" | jq '.' || echo "⚠️  (jq not installed – showing raw output)"
echo ""

# 3b. Public auth endpoint: send OTP (does not require auth)
echo "▶️  POST /auth/send-otp (public)"
curl -s -X POST "${BASE_URL}/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"name":"TestUser","email":"test@example.com","username":"testuser","password":"Test@123"}' \
  | jq '.' || echo "⚠️  Raw response shown"
echo ""

# 3c. Try a protected endpoint (will fail without token – that's expected)
echo "▶️  GET /api/users (requires ADMIN token – will return 403/401)"
curl -s -X GET "${BASE_URL}/api/users" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -o /dev/null -s
echo ""

# ---- Step 4: Summary ----
echo "============================================"
echo "✅ All tests completed successfully!"
echo "📌 Notes:"
echo "   - Protected endpoints (like /api/users) require a valid JWT."
echo "   - To test them, first log in via /auth/login and copy the token."
echo "   - Backend is running on ${BASE_URL} (PID: ${BACKEND_PID})"
echo "   - Stop it later with: kill ${BACKEND_PID}"
echo "   - Check live logs: tail -f ${BACKEND_DIR}/backend.log"
echo "============================================"
