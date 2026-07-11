# eventFlow: Distributed Event-Driven Orchestration Engine

Welcome to eventFlow (published on NPM as @neeharikaa/event-stormer). This is an open-source event-driven orchestration system built on Node.js, Redis, and BullMQ, featuring a clean dark-themed dashboard.

---

## Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/Neeharikajha/Event-Flow-Orchestration-Engine.git
cd Event-Flow-Orchestration-Engine
```

### 2. Install dependencies
```bash
npm install
npm run install:all
```

### 3. Start Redis Server
Ensure you have a Redis server running on localhost:6379.

### 4. Build and run
To compile the dashboard frontend assets and start the server:
```bash
npm run frontend:build
node server.js
```
Open http://localhost:3000 in your browser.

---

## How to use this package in your own Project

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

## daily Developer Use Cases

Here are three real-world pipelines that developers run on a daily basis:

### Use Case 1: AWS Database S3 Backup Sync
* What it does: Uploads database assets to S3 and writes a local JSON receipt file.
```yaml
name: "AWS S3 Auto-Backup Flow"
description: "Pushes local assets to S3 and registers the transaction"
tasks:
  upload_to_s3:
    description: "Uploading files to S3 bucket: eventflow-backups-us-east-1"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/testHandler.js"
    parameters:
      delay: 1200
      error: false
  register_backup_db:
    description: "Saves S3 transaction metadata locally"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/fileHandler.js"
    parameters:
      file:
        name: "./s3_backup_receipt.json"
        contents: {
          s3_url: "s3://eventflow-backups-us-east-1/backups/db-backup.tar.gz",
          bytes_uploaded: 45291880,
          region: "us-east-1",
          status: "SUCCESSFUL"
        }
  alert_completion:
    description: "Notifies team channels of successful backup"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/logHandler.js"
    parameters:
      level: "info"
      log: "[AWS-S3] Backup successfully verified. Object URL: s3://eventflow-backups-us-east-1/backups/db-backup.tar.gz"
```

### Use Case 2: DevOps Database Migration Rollback Checker
* What it does: Verifies active migration logs, executes a rollback task on failure, and stores a rollback manifest.
```yaml
name: "Database Migration Rollback Flow"
description: "Checks migration status and triggers database rollback on warning thresholds"
tasks:
  verify_migration_status:
    description: "Checking migration error status logs"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/testHandler.js"
    parameters:
      delay: 500
      error: false
  trigger_rollback:
    description: "Executing rollback script for database recovery"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/testHandler.js"
    parameters:
      delay: 1500
      error: false
  write_rollback_receipt:
    description: "Saving rollback action log locally"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/fileHandler.js"
    parameters:
      file:
        name: "./db_rollback_manifest.json"
        contents: {
          status: "ROLLED_BACK",
          version: "V1.0.4",
          timestamp: "2026-07-12T00:50:00Z"
        }
  notify_admin:
    description: "Logs rollback operation details"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/logHandler.js"
    parameters:
      level: "warn"
      log: "[DEVOPS] Rollback executed successfully for version V1.0.4"
```

### Use Case 3: API Rate Limit Monitoring & Webhook Alerting
* What it does: Monitors request telemetry logs, writes an alert payload file, and prints warning alerts to console logs.
```yaml
name: "API Rate Limit Monitoring"
description: "Monitors client traffic telemetry logs and dispatches system warnings"
tasks:
  analyze_rate_limits:
    description: "Scanning host connection rate telemetry"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/testHandler.js"
    parameters:
      delay: 600
  write_incident_report:
    description: "Writing rate limit alert info locally"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/fileHandler.js"
    parameters:
      file:
        name: "./api_alert_report.json"
        contents: {
          ip_blocked: "192.168.1.45",
          attempts: 120,
          limit: 60,
          status: "ALERT_TRIGGERED"
        }
  log_incident:
    description: "Prints incident log details to warning logs"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/logHandler.js"
    parameters:
      level: "warn"
      log: "[TRAFFIC-MONITOR] IP 192.168.1.45 blocked due to exceeding rate limit of 60 req/min"
```
