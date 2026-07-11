# @neeharikaa/event-stormer

A production-ready, distributed event-driven orchestration engine built on **Node.js**, **Redis**, and **BullMQ**. Define execution pipelines in YAML/JSON, automatically track state persistence (in local JSON database or MongoDB), and isolate faults with automatic retries and dead-letter queues (DLQ).

---

## 🛑 The Problem Statement

In modern backend architectures, event-driven processes (like user signups, multi-step reports, image uploads, and billing syncs) require coordinating multiple actions sequentially or in parallel. 

Without an orchestration engine, developers fall into the trap of:
* **Callback/Promise Hell**: Deeply nested, fragile asynchronous code.
* **State Loss**: If the server crashes mid-process, there is no automatic state recovery.
* **Lack of Isolation**: A failure in one minor task (e.g. sending a Slack notification) crashes the entire transaction.
* **Lack of Visibility**: Zero visual debugging to see which steps succeeded or failed.

**eventFlow** solves this by providing a lightweight framework that structures your operations as clean pipelines with built-in retries, persistence, and a live web dashboard.

---

## ⚙️ Installation

Install `@neeharikaa/event-stormer` in your project:
```bash
npm install @neeharikaa/event-stormer
```

Make sure you have a **Redis** instance running on `localhost:6379`.

---

## 🚀 Quick Start

### 1. Run the Dashboard
You can view and trigger your pipelines using our built-in web dashboard:
```bash
npx event-stormer-dashboard
```
Open **`http://localhost:3000`** in your browser.

### 2. Run from JavaScript
Initialize the engine and queue a workflow:
```javascript
import eventFlow from '@neeharikaa/event-stormer';

// Initialize engine (defaults to file-based store)
await eventFlow.initAsync({ useQueue: true });

// Define your pipeline
const pipelineYaml = `
name: "Media Optimization Flow"
description: "Compresses uploaded images and saves CDN metadata"
tasks:
  compress_image:
    description: "Resizing uploaded media"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/testHandler.js"
    parameters:
      delay: 800
      error: false
  write_cdn_log:
    description: "Saving image metadata to disk"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/fileHandler.js"
    parameters:
      file:
        name: "./cdn_assets.json"
        contents: {
          assetId: "IMG-991823",
          compressed: true,
          sizeKb: 284
        }
`;

// Queue the workflow
const result = await eventFlow.queueWorkflowAsync(pipelineYaml);
console.log(`Pipeline enqueued successfully! Job ID: ${result.jobId}`);
```

---

## 🛠️ Daily Developer Use Cases

Here are three real-world pipelines that developers run on a daily basis:

### Use Case 1: E-Commerce Order Fulfillment
* **What it does**: Process order details, verifies inventory, writes shipping details to local logs, and prints confirmation alerts.
```yaml
name: "Order Processing Pipeline"
description: "Verifies stock, saves confirmation invoice, and notifies warehouse"
tasks:
  verify_inventory:
    description: "Checking stock allocation in warehouse"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/testHandler.js"
    parameters:
      delay: 500
      error: false
  save_invoice:
    description: "Writing sales receipt to disk"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/fileHandler.js"
    parameters:
      file:
        name: "./invoice_receipt.json"
        contents: {
          orderId: "ORD-99182",
          amount: 249.99,
          status: "PAID"
        }
  alert_shipping:
    description: "Logging dispatch notification details"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/logHandler.js"
    parameters:
      level: "info"
      log: "🚚 Order ORD-99182 successfully dispatched to shipping queue."
```

### Use Case 2: Multi-Region Backup Verification & Recovery Sync
* **What it does**: Simulates checking the health of database replicas, syncing local backups to backup storage, and logging results with built-in retries.
```yaml
name: "Backup Sync & Verification"
description: "Syncs primary backup logs to cold storage with automatic retries"
tasks:
  check_database_health:
    description: "Verifying primary DB replica status"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/testHandler.js"
    parameters:
      delay: 600
  sync_logs:
    description: "Uploading database logs to recovery storage"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/testHandler.js"
    parameters:
      delay: 1200
      error: false
      attempts: 3
      backoff: 1000
  write_sync_report:
    description: "Writes local sync checksum manifest"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/fileHandler.js"
    parameters:
      file:
        name: "./sync_report.json"
        contents: {
          nodes_synced: 3,
          checksum: "sha256-4cfb82...",
          status: "ACTIVE_BACKUP"
        }
```

### Use Case 3: User Verification & Platform Onboarding
* **What it does**: Verifies user profile setup, registers their access permissions, and logs system warnings if their profile details are incomplete.
```yaml
name: "User Platform Onboarding"
description: "Verifies user profiles and grants dashboard system access"
tasks:
  verify_user_account:
    description: "Validating user account credentials"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/testHandler.js"
    parameters:
      delay: 400
  log_activation:
    description: "Logging profile activation confirmation details"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/logHandler.js"
    parameters:
      level: "info"
      log: "👤 User Account verified. Granting console permissions..."
  save_profile_data:
    description: "Writes user setup metadata payload locally"
    blocking: true
    handler: "../node_modules/@neeharikaa/event-stormer/taskHandlers/fileHandler.js"
    parameters:
      file:
        name: "./user_profile_manifest.json"
        contents: {
          role: "Developer",
          enabled: true,
          plan: "Pro"
        }
```
