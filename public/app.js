document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const btnRefresh = document.getElementById('btn-refresh');
  const btnToggleEngine = document.getElementById('btn-toggle-engine');
  const engineStatusDot = document.getElementById('engine-status-dot');
  const engineStatusText = document.getElementById('engine-status-text');
  const lastUpdatedText = document.getElementById('last-updated');

  // Stats Card Numbers
  const statTotal = document.getElementById('stat-total');
  const statSuccess = document.getElementById('stat-success');
  const statActive = document.getElementById('stat-active');
  const statFailed = document.getElementById('stat-failed');
  const dlqBadge = document.getElementById('dlq-badge-count');
  const activeJobsCount = document.getElementById('active-jobs-count');

  // Lists and Tables
  const activeJobsList = document.getElementById('active-jobs-list');
  const historyList = document.getElementById('history-list');
  const dlqList = document.getElementById('dlq-list');

  // Editor and Template controls
  const pipelineEditor = document.getElementById('pipeline-editor');
  const pipelinePriority = document.getElementById('pipeline-priority');
  const btnTriggerPipeline = document.getElementById('btn-trigger-pipeline');
  const formatYamlBtn = document.getElementById('format-yaml');
  const formatJsonBtn = document.getElementById('format-json');
  const templateButtons = document.querySelectorAll('.template-item');

  // Modal elements
  const modal = document.getElementById('workflow-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const btnCloseModal = document.getElementById('btn-close-modal');

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // Search box
  const historySearchInput = document.getElementById('history-search');

  // State
  let activeTab = 'dashboard';
  let editorFormat = 'yaml';
  let isEnginePaused = false;
  let allWorkflows = [];

  // --- Templates Definitions ---
  const templates = {
    onboarding: `name: "User Onboarding Flow"
events:
  - id: "check_user_verified"
    action: "authService.isVerified"
    args: { userId: "{{event.userId}}" }
    next:
      - if: "{{output.verified}}"
        then: "grant_dashboard_access"
      - if: "!{{output.verified}}"
        then: "send_verification_email"

  - id: "grant_dashboard_access"
    action: "dashboardService.grantAccess"
    args: { userId: "{{event.userId}}" }

  - id: "send_verification_email"
    action: "emailService.sendVerification"
    args: { userId: "{{event.userId}}" }`,

    order: `name: "E-Commerce Purchase Flow"
events:
  - id: "process_payment"
    action: "paymentService.chargeCard"
    args: { userId: "{{event.userId}}", amount: "{{event.amount}}" }
    next:
      - if: "{{success}}"
        then: "check_inventory"
      - if: "{{error}}"
        then: "handle_payment_failure"

  - id: "check_inventory"
    action: "warehouseService.checkStock"
    args: { items: "{{event.items}}" }
    next:
      - if: "{{output.inStock}}"
        then: "generate_shipping_label"
      - if: "!{{output.inStock}}"
        then: "trigger_refund"

  - id: "generate_shipping_label"
    action: "shippingService.createLabel"
    args: { address: "{{event.address}}" }

  - id: "trigger_refund"
    action: "paymentService.refundCard"
    args: { userId: "{{event.userId}}", amount: "{{event.amount}}" }

  - id: "handle_payment_failure"
    action: "notificationService.sendAlert"
    args: { userId: "{{event.userId}}", message: "Card charge failed." }`,

    demo: `name: "Basic Demo Workflow"
events:
  - id: "step_one"
    action: "demoService.step1"
    args: { data: "hello" }
    next:
      - if: "{{success}}"
        then: "step_two"
  - id: "step_two"
    action: "demoService.step2"
    args: { data: "world" }`
  };

  // Set default editor content
  pipelineEditor.value = templates.onboarding;

  // --- Tab Switching ---
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  function switchTab(tabId) {
    activeTab = tabId;
    navButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(`tab-${tabId}`);
    
    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.add('active');

    fetchData();
  }

  // --- Templates Handler ---
  templateButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const templateKey = btn.getAttribute('data-template');
      if (templates[templateKey]) {
        if (editorFormat === 'yaml') {
          pipelineEditor.value = templates[templateKey];
        } else {
          // Convert template string to JSON format representation
          try {
            const parsed = jsyaml.load(templates[templateKey]);
            pipelineEditor.value = JSON.stringify(parsed, null, 2);
          } catch(e) {
            // fallback text
            pipelineEditor.value = templates[templateKey];
          }
        }
        showToast(`Loaded ${btn.querySelector('.title').textContent} template`, 'success');
      }
    });
  });

  // Toggle editor format
  formatYamlBtn.addEventListener('click', () => {
    editorFormat = 'yaml';
    formatYamlBtn.classList.add('active');
    formatJsonBtn.classList.remove('active');
  });

  formatJsonBtn.addEventListener('click', () => {
    editorFormat = 'json';
    formatJsonBtn.classList.add('active');
    formatYamlBtn.classList.remove('active');
  });

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove toast after 4s
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --- Core API Calling Logic ---
  async function fetchData() {
    try {
      // 1. Fetch Stats
      const statsRes = await fetch('/api/stats');
      const stats = await statsRes.json();
      
      // Update Concurrency & connection display
      if (stats.config) {
        document.getElementById('stat-concurrency-tasks').textContent = stats.config.queue?.taskConcurrency || 100;
        document.getElementById('stat-concurrency-workflows').textContent = stats.config.queue?.workflowConcurrency || 50;
        document.getElementById('stat-redis-host').textContent = `${stats.config.redis?.host || 'localhost'}:${stats.config.redis?.port || 6379}`;
        document.getElementById('stat-retry-strategy').textContent = stats.config.retry?.strategy || 'exponential';
      }

      // Update Pause state status
      if (stats.queue) {
        isEnginePaused = stats.queue.isPaused;
        updateEngineControlDisplay(isEnginePaused);
      }

      // 2. Fetch Workflows list
      const workflowsRes = await fetch('/api/workflows');
      allWorkflows = await workflowsRes.json();

      // Parse status count numbers
      let succeededCount = 0;
      let failedCount = 0;
      let activeCount = 0;

      allWorkflows.forEach(wf => {
        if (wf.status === 'completed' || wf.status === 'succeeded') succeededCount++;
        else if (wf.status === 'failed') failedCount++;
        else activeCount++; // pending, running, active
      });

      statTotal.textContent = allWorkflows.length;
      statSuccess.textContent = succeededCount;
      statActive.textContent = activeCount;
      statFailed.textContent = failedCount;
      dlqBadge.textContent = failedCount;
      activeJobsCount.textContent = `${activeCount} Active`;

      // Update Lists depending on current tab
      renderActiveList(allWorkflows.filter(wf => wf.status !== 'completed' && wf.status !== 'failed'));
      
      if (activeTab === 'history') {
        renderHistoryList(allWorkflows);
      } else if (activeTab === 'dlq') {
        renderDLQList(allWorkflows.filter(wf => wf.status === 'failed'));
      }

      lastUpdatedText.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  }

  // Update engine control state UI
  function updateEngineControlDisplay(isPaused) {
    if (isPaused) {
      engineStatusDot.className = 'dot paused';
      engineStatusText.textContent = 'Engine: Paused';
      btnToggleEngine.innerHTML = '<i class="fa-solid fa-play"></i> Resume Engine';
      btnToggleEngine.className = 'control-btn mini-btn primary-btn';
    } else {
      engineStatusDot.className = 'dot active';
      engineStatusText.textContent = 'Engine: Running';
      btnToggleEngine.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Engine';
      btnToggleEngine.className = 'control-btn mini-btn';
    }
  }

  // --- Render Lists ---

  // Active / Running Table
  function renderActiveList(jobs) {
    activeJobsList.innerHTML = '';
    if (jobs.length === 0) {
      activeJobsList.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No active workflows currently executing</td></tr>';
      return;
    }

    jobs.forEach(job => {
      const tr = document.createElement('tr');
      // Calculate progress
      const totalSteps = job.events ? job.events.length : 1;
      const completedSteps = job.history ? job.history.length : 0;
      const progressPercent = Math.min(Math.round((completedSteps / totalSteps) * 100), 99);

      tr.innerHTML = `
        <td><code>${job.id.substring(0, 8)}...</code></td>
        <td><strong>${job.name || 'Unnamed Pipeline'}</strong></td>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="flex-grow:1; background:var(--bg-tertiary); height:8px; border-radius:4px; overflow:hidden;">
              <div style="width:${progressPercent}%; background:var(--accent-color); height:100%;"></div>
            </div>
            <span style="font-size:12px;">${progressPercent}%</span>
          </div>
        </td>
        <td><span class="status-pill pending">${job.status || 'running'}</span></td>
        <td>
          <button class="btn mini-btn btn-view-details" data-id="${job.id}">
            <i class="fa-solid fa-eye"></i> View
          </button>
        </td>
      `;
      activeJobsList.appendChild(tr);
    });

    attachDetailsListeners();
  }

  // History List
  function renderHistoryList(workflows) {
    const filterText = historySearchInput.value.toLowerCase().trim();
    historyList.innerHTML = '';
    
    const filtered = workflows.filter(wf => {
      return wf.name.toLowerCase().includes(filterText) || wf.id.toLowerCase().includes(filterText);
    });

    if (filtered.length === 0) {
      historyList.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No history records found</td></tr>';
      return;
    }

    filtered.forEach(wf => {
      const tr = document.createElement('tr');
      const time = wf.timestamp ? new Date(wf.timestamp).toLocaleString() : 'N/A';
      const stepsCount = wf.history ? wf.history.length : 0;
      const statusClass = (wf.status === 'completed' || wf.status === 'succeeded') ? 'success' : (wf.status === 'failed' ? 'failed' : 'pending');

      tr.innerHTML = `
        <td><code>${wf.id.substring(0, 8)}...</code></td>
        <td><strong>${wf.name}</strong></td>
        <td><span class="status-pill ${statusClass}">${wf.status}</span></td>
        <td>${stepsCount} steps completed</td>
        <td>${time}</td>
        <td>
          <button class="btn mini-btn btn-view-details" data-id="${wf.id}">
            <i class="fa-solid fa-eye"></i> Audit
          </button>
        </td>
      `;
      historyList.appendChild(tr);
    });

    attachDetailsListeners();
  }

  // DLQ List
  function renderDLQList(failedWorkflows) {
    dlqList.innerHTML = '';
    document.getElementById('dlq-count').textContent = `${failedWorkflows.length} Failed`;

    if (failedWorkflows.length === 0) {
      dlqList.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">DLQ is empty. No failed pipelines found!</td></tr>';
      return;
    }

    failedWorkflows.forEach(wf => {
      const tr = document.createElement('tr');
      const time = wf.timestamp ? new Date(wf.timestamp).toLocaleString() : 'N/A';
      
      // Determine what step failed
      let failedStep = 'Unknown';
      let errorMsg = wf.error || 'Execution timeout or process aborted';
      
      if (wf.history && wf.history.length > 0) {
        const lastEntry = wf.history[wf.history.length - 1];
        if (lastEntry.status === 'failed') {
          failedStep = lastEntry.id;
          errorMsg = lastEntry.error || errorMsg;
        }
      }

      tr.innerHTML = `
        <td><code>${wf.id.substring(0, 8)}...</code></td>
        <td><strong>${wf.name}</strong></td>
        <td><code class="status-pill failed">${failedStep}</code></td>
        <td style="color:var(--danger); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${errorMsg}</td>
        <td>${time}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn mini-btn btn-view-details" data-id="${wf.id}">
              <i class="fa-solid fa-eye"></i> Detail
            </button>
            <button class="btn mini-btn primary-btn btn-retry-job" data-id="${wf.id}">
              <i class="fa-solid fa-rotate-right"></i> Retry
            </button>
          </div>
        </td>
      `;
      dlqList.appendChild(tr);
    });

    attachDetailsListeners();
    attachRetryListeners();
  }

  // Attach Detail Button Click Listeners
  function attachDetailsListeners() {
    const detailButtons = document.querySelectorAll('.btn-view-details');
    detailButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const workflowId = btn.getAttribute('data-id');
        try {
          const res = await fetch(`/api/workflows/${workflowId}/status`);
          const data = await res.json();
          openDetailModal(data);
        } catch (err) {
          showToast('Failed to load workflow details', 'error');
        }
      });
    });
  }

  // Attach Retry Button Click Listeners
  function attachRetryListeners() {
    const retryButtons = document.querySelectorAll('.btn-retry-job');
    retryButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const workflowId = btn.getAttribute('data-id');
        try {
          btn.innerHTML = '<i class="fa-solid fa-spinner spinner"></i> Retrying...';
          btn.disabled = true;

          const res = await fetch(`/api/dlq/${workflowId}/retry`, {
            method: 'POST'
          });
          const result = await res.json();

          if (result.success) {
            showToast('Workflow enqueued successfully for retry!', 'success');
            fetchData();
          } else {
            showToast(result.error || 'Retry submission failed', 'error');
            btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Retry';
            btn.disabled = false;
          }
        } catch (err) {
          showToast('Network error triggers retry failed', 'error');
          btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Retry';
          btn.disabled = false;
        }
      });
    });
  }

  // --- Trigger Pipeline Submission ---
  btnTriggerPipeline.addEventListener('click', async () => {
    const editorContent = pipelineEditor.value.trim();
    if (!editorContent) {
      showToast('Please enter a valid pipeline configuration', 'error');
      return;
    }

    try {
      btnTriggerPipeline.innerHTML = '<i class="fa-solid fa-spinner spinner"></i> Executing...';
      btnTriggerPipeline.disabled = true;

      let headers = {};
      let bodyData = editorContent;

      if (editorFormat === 'yaml') {
        headers['Content-Type'] = 'application/yaml';
      } else {
        headers['Content-Type'] = 'application/json';
        // Validate JSON syntax first
        JSON.parse(editorContent);
      }

      const priority = parseInt(pipelinePriority.value, 10);
      
      const response = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: headers,
        body: bodyData
      });

      const result = await response.json();

      if (result.success) {
        showToast(`Pipeline queued successfully! Job ID: ${result.jobId.substring(0, 8)}`, 'success');
        switchTab('dashboard');
      } else {
        showToast(result.error || 'Pipeline execution failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error occurred during pipeline trigger', 'error');
    } finally {
      btnTriggerPipeline.innerHTML = '<i class="fa-solid fa-bolt"></i> Execute Pipeline';
      btnTriggerPipeline.disabled = false;
    }
  });

  // --- Pause/Resume Engine ---
  btnToggleEngine.addEventListener('click', async () => {
    const endpoint = isEnginePaused ? '/api/engine/resume' : '/api/engine/pause';
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        isEnginePaused = !isEnginePaused;
        updateEngineControlDisplay(isEnginePaused);
        showToast(data.message, 'success');
      }
    } catch(err) {
      showToast('Failed to update engine processing state', 'error');
    }
  });

  // --- Modal Handler ---
  function openDetailModal(workflow) {
    modalTitle.textContent = `${workflow.name} Audit Log`;
    
    // Format JSON presentation
    let historyHtml = '<div class="history-timeline">';
    if (workflow.history && workflow.history.length > 0) {
      workflow.history.forEach((step, i) => {
        const stepStatus = step.status || 'completed';
        const statusClass = stepStatus === 'completed' ? 'success' : 'failed';
        historyHtml += `
          <div class="timeline-item" style="border-left: 2px solid ${stepStatus === 'completed' ? 'var(--success)' : 'var(--danger)'}; padding-left: 15px; margin-bottom: 15px; position:relative;">
            <div style="position:absolute; left:-6px; top:2px; width:10px; height:10px; border-radius:50%; background:${stepStatus === 'completed' ? 'var(--success)' : 'var(--danger)'};"></div>
            <h4 style="font-size:14px; margin-bottom:4px;">Step ${i+1}: ${step.id}</h4>
            <p style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Action: <code>${step.action || 'default'}</code></p>
            <p style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Status: <span class="status-pill ${statusClass}">${stepStatus}</span></p>
            ${step.error ? `<p style="font-size:12px; color:var(--danger); font-family:monospace; background:rgba(239, 68, 68, 0.1); padding:6px; border-radius:4px; margin-top:5px;">Error: ${step.error}</p>` : ''}
          </div>
        `;
      });
    } else {
      historyHtml += '<p style="color:var(--text-muted); font-size:14px;">No steps executed yet</p>';
    }
    historyHtml += '</div>';

    modalBody.innerHTML = `
      <div style="margin-bottom:20px;">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:4px;">Workflow Instance ID:</p>
        <code style="background:var(--bg-tertiary); padding:4px 8px; border-radius:4px; font-size:13px;">${workflow.id}</code>
      </div>
      <div style="margin-bottom:20px;">
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:4px;">Overall Status:</p>
        <span class="status-pill ${workflow.status === 'completed' ? 'success' : (workflow.status === 'failed' ? 'failed' : 'pending')}">${workflow.status}</span>
      </div>
      <div>
        <h3 style="font-size:15px; font-weight:600; margin-bottom:12px;">Step Timeline</h3>
        ${historyHtml}
      </div>
    `;
    
    modal.classList.add('active');
  }

  btnCloseModal.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Close modal when clicking background
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Refresh and Search box
  btnRefresh.addEventListener('click', () => {
    fetchData();
    showToast('Data refreshed', 'success');
  });

  historySearchInput.addEventListener('input', () => {
    renderHistoryList(allWorkflows);
  });

  // --- Initial Data Load ---
  fetchData();
  // Auto-refresh stats every 4 seconds
  setInterval(fetchData, 4000);
});
