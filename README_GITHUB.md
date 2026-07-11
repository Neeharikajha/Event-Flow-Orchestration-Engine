# eventFlow: Distributed Event-Driven Orchestration Engine

Welcome to **eventFlow** (published on NPM as `@neeharikaa/event-stormer`)! This is an open-source event-driven orchestration system built on Node.js, Redis, and BullMQ, featuring a glowing dark-themed dashboard.

---

## 🚀 Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/Neeharikajha/Event-Flow-Orchestration-Engine.git
cd Event-Flow-Orchestration-Engine
```

### 2. Install dependencies
```bash
npm install
npm run install:all # Installs both root and frontend dependencies
```

### 3. Start Redis Server
Ensure you have a Redis server running on `localhost:6379`.

### 4. Build and run
To compile the dashboard frontend assets and start the server:
```bash
npm run frontend:build
node server.js
```
Open **`http://localhost:3000`** in your browser.

---

## 📦 How to use this package in your own Project

To install the published engine package in any external Node.js project:

```bash
npm install @neeharikaa/event-stormer
```

Ensure Redis is running, then initialize and run it:
```javascript
import eventFlow from '@neeharikaa/event-stormer';

// Start engine
await eventFlow.initAsync({ useQueue: true });
```

---

## 🛠️ GitHub Use Cases: Production-Grade Operations

Here are three different developer automation use cases commonly executed in daily engineering tasks:

### Use Case 1: Automated CI/CD Release Pipeline
* **What it does**: Simulates running unit tests, compiling the production bundle, uploading to hosting (e.g. AWS S3/Vercel), and notifying Slack of successful deployment.
```yaml
name: "Automated CI/CD Pipeline"
description: "Executes linting, unit tests, compiles bundle, and dispatches release alert"
tasks:
  run_linter:
    description: "Analyzing code syntax and lint warnings"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/testHandler.js"
    parameters:
      delay: 500
  run_unit_tests:
    description: "Running Jest unit test suites"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/testHandler.js"
    parameters:
      delay: 1000
      error: false
  deploy_assets:
    description: "Uploading static bundles to Cloudflare Pages CDN"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/fileHandler.js"
    parameters:
      file:
        name: "./deployment_receipt.json"
        contents: {
          project: "eventflow-dashboard",
          commit: "504b2f3",
          url: "https://eventflow-dashboard.pages.dev",
          status: "SUCCESSFUL"
        }
  slack_notification:
    description: "Notifying DevOps Slack Channel of new release"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/logHandler.js"
    parameters:
      level: "info"
      log: "🚀 [CI/CD] Deployment complete for commit 504b2f3. URL: https://eventflow-dashboard.pages.dev"
```

### Use Case 2: Automated Billing & PDF Invoice Compiler
* **What it does**: Aggregates charge data, writes a local PDF invoice receipt summary, and logs a billing audit confirmation.
```yaml
name: "Automated Billing Pipeline"
description: "Verifies subscription payment status and compiles invoice receipt details"
tasks:
  verify_payment_intent:
    description: "Checking Stripe payment authorization webhook status"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/testHandler.js"
    parameters:
      delay: 800
  generate_pdf_invoice:
    description: "Writing billing receipt to local manifest logs"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/fileHandler.js"
    parameters:
      file:
        name: "./stripe_invoice.json"
        contents: {
          customer: "CUST-98218",
          invoice: "INV-2026-001",
          subtotal: 49.00,
          status: "PAID"
        }
  log_audit_trail:
    description: "Pushes record of payment transaction to logging system"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/logHandler.js"
    parameters:
      level: "info"
      log: "💰 [BILLING-AUDIT] Invoice INV-2026-001 for customer CUST-98218 has been logged."
```

### Use Case 3: Server Telemetry Health Checks
* **What it does**: Checks host system diagnostics, saves memory logs, and generates alerts on disk.
```yaml
name: "Telemetry Health Check Pipeline"
description: "Verifies CPU load metrics and saves resource diagnostics data"
tasks:
  check_cpu_metrics:
    description: "Running diagnostic host checks"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/testHandler.js"
    parameters:
      delay: 500
  write_resource_log:
    description: "Writing telemetry usage stats to disk"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/fileHandler.js"
    parameters:
      file:
        name: "./telemetry_usage.json"
        contents: {
          cpu_load_pct: 34.2,
          free_memory_mb: 8192,
          disk_usage_pct: 61.8,
          status: "NORMAL"
        }
  report_normal_state:
    description: "Logs confirmation of safe host operating metrics"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/logHandler.js"
    parameters:
      level: "info"
      log: "🟢 [TELEMETRY] Host operating metrics normal. CPU load: 34.2%. Disk free: 38.2%."
```
