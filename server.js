// server.js
// Express REST API Server for Event Flow Orchestration Engine

import express from 'express';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';
import api from './engine/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.text({ type: 'application/yaml' }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Engine with Queue Support; fallback to Direct Execution if Redis is unavailable
api.initAsync({ useQueue: true })
  .then(() => console.log('🚀 Orchestration Engine initialized successfully with Queue support (Redis)'))
  .catch(err => {
    console.warn('⚠️ Failed to initialize engine with Queue support (Redis may not be running).');
    console.error('   Redis Connection Error Details:', err);
    console.warn('🔄 Falling back to Direct Execution mode (no Redis queue required).');
    api.initAsync({ useQueue: false })
      .then(() => console.log('🚀 Orchestration Engine initialized successfully in Direct Execution mode'))
      .catch(fallbackErr => console.error('❌ Failed to initialize engine in fallback mode:', fallbackErr));
  });

// ============================================
// REST API ENDPOINTS
// ============================================

// 1. Get Engine Stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await api.getStatsAsync();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Workflow Instances (Historical & Current)
app.get('/api/workflows', async (req, res) => {
  try {
    const workflows = await api.getWorkflowsAsync();
    res.json(workflows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Status of a specific workflow
app.get('/api/workflows/:id/status', async (req, res) => {
  try {
    const status = await api.getWorkflowStatusAsync(req.params.id);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Run/Queue a Workflow (Accepts JSON or YAML)
app.post('/api/workflows/run', async (req, res) => {
  try {
    let workflowDef;
    let priority = 0;

    // Handle YAML text body
    if (req.headers['content-type'] === 'application/yaml' || req.headers['content-type'] === 'text/yaml') {
      workflowDef = yaml.load(req.body);
    } else {
      // Handle JSON body (check if wrapped by frontend)
      if (req.body && (req.body.yamlString !== undefined || req.body.jsonObj !== undefined)) {
        priority = req.body.priority || 0;
        if (req.body.yamlString !== undefined) {
          workflowDef = yaml.load(req.body.yamlString);
        } else {
          workflowDef = req.body.jsonObj;
        }
      } else {
        workflowDef = req.body;
      }
    }

    if (!workflowDef || !workflowDef.name) {
      return res.status(400).json({ error: 'Invalid workflow definition: "name" property is required' });
    }

    // Run using queue (uses BullMQ/Redis)
    const result = await api.queueWorkflowAsync(workflowDef, {
      priority: priority,
      retry: true
    });

    res.json({
      success: true,
      message: 'Workflow submitted and enqueued',
      jobId: result.jobId,
      queueName: result.queueName,
      workflowName: result.workflowName
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Dead-Letter Queue (DLQ) - Workflows with status "failed"
app.get('/api/dlq', async (req, res) => {
  try {
    // In our model, failed workflows are stored with status = 'failed'
    const failedWorkflows = await api.getWorkflowsAsync({ status: 'failed' });
    res.json(failedWorkflows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Retry a specific failed workflow
app.post('/api/dlq/:id/retry', async (req, res) => {
  try {
    const workflowId = req.params.id;
    const wfInstance = await api.getWorkflowStatusAsync(workflowId);
    
    if (!wfInstance) {
      return res.status(404).json({ error: 'Workflow instance not found' });
    }

    // Reset status and run again
    delete wfInstance.error;
    wfInstance.status = 'pending';
    
    const result = await api.queueWorkflowAsync(wfInstance, {
      priority: 0,
      retry: true
    });

    res.json({
      success: true,
      message: 'Workflow enqueued for retry',
      jobId: result.jobId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Pause engine processing
app.post('/api/engine/pause', async (req, res) => {
  try {
    await api.pauseAsync();
    res.json({ success: true, message: 'Engine processing paused' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Resume engine processing
app.post('/api/engine/resume', async (req, res) => {
  try {
    await api.resumeAsync();
    res.json({ success: true, message: 'Engine processing resumed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Delete a specific workflow instance
app.delete('/api/workflows/:id', async (req, res) => {
  try {
    const workflowId = req.params.id;
    const store = (await import('./engine/persistence/store.js')).default;
    await new Promise((resolve, reject) => {
      store.deleteInstance(workflowId, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    res.json({ success: true, message: 'Workflow deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Reset/Clear all workflows
app.delete('/api/workflows', async (req, res) => {
  try {
    await api.cleanupAsync();
    res.json({ success: true, message: 'All workflows cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
