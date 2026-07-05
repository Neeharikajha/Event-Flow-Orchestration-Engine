// src/main.ts
// Frontend Application logic in type-safe TypeScript

import './style.css';

// Declare external CDN library jsyaml
declare const jsyaml: any;

interface WorkflowInstance {
  id: string;
  name: string;
  status: string;
  timestamp?: number;
  events?: any[];
  history?: any[];
  error?: string;
}

interface StatsResponse {
  initialized: boolean;
  config?: any;
  retry?: any;
  queue?: {
    isPaused: boolean;
    activeCount: number;
    waitingCount: number;
    [key: string]: any;
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.innerHTML = `
      <div class="flex w-full min-h-screen">
        <!-- Sidebar / Navigation -->
        <aside class="w-64 bg-[#0d0e14] border-r border-[#1f2231] flex flex-col p-6 shrink-0">
          <div class="flex items-center gap-3 font-semibold text-lg tracking-tight mb-8">
            <i class="fa-solid fa-square-terminal text-indigo-400"></i>
            <span>eventflow_</span>
          </div>
          
          <nav class="flex flex-col gap-1.5 flex-grow">
            <button class="nav-btn active flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition duration-150 cursor-pointer bg-[#161722] text-white border border-[#1f2231]/80" data-tab="dashboard">
              <i class="fa-solid fa-chart-pie w-4"></i> Dashboard
            </button>
            <button class="nav-btn flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition duration-150 cursor-pointer text-gray-400 hover:text-white hover:bg-[#161722]" data-tab="run">
              <i class="fa-solid fa-terminal w-4"></i> Trigger Pipeline
            </button>
            <button class="nav-btn flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition duration-150 cursor-pointer text-gray-400 hover:text-white hover:bg-[#161722]" data-tab="history">
              <i class="fa-solid fa-clock-rotate-left w-4"></i> Execution Audit
            </button>
            <button class="nav-btn flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition duration-150 cursor-pointer text-gray-400 hover:text-white hover:bg-[#161722]" data-tab="dlq">
              <div class="flex items-center gap-3">
                <i class="fa-solid fa-triangle-exclamation w-4 text-rose-400"></i> DLQ Manager
              </div>
              <span class="bg-rose-500/10 text-rose-400 text-xs px-2 py-0.5 rounded-full border border-rose-500/20 font-mono" id="dlq-badge-count">0</span>
            </button>
          </nav>

          <!-- Engine Status & Control -->
          <div class="pt-6 border-t border-[#1f2231] flex flex-col gap-4">
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" id="engine-status-dot"></span>
                <span id="engine-status-text" class="font-mono">engine::active</span>
              </span>
            </div>
            <button id="btn-toggle-engine" class="w-full text-xs font-semibold py-2 px-3 bg-[#161722] hover:bg-[#1f2231] border border-[#1f2231] rounded-md transition duration-150 cursor-pointer flex items-center justify-center gap-2">
              <i class="fa-solid fa-pause"></i> Pause Engine
            </button>
          </div>
        </aside>

        <!-- Main Workspace -->
        <main class="flex-grow flex flex-col min-w-0">
          <!-- Top header bar -->
          <header class="h-16 border-b border-[#1f2231] px-10 flex items-center justify-between bg-[#0b0c12]">
            <h1 class="text-sm font-semibold tracking-wide text-gray-300 font-mono">workflow_orchestrator v2.0.0</h1>
            <div class="flex items-center gap-4">
              <span class="text-xs text-gray-400 font-mono" id="last-updated">syncing...</span>
              <button id="btn-refresh" class="text-gray-400 hover:text-white transition duration-150 p-1.5 hover:bg-[#161722] rounded-md cursor-pointer"><i class="fa-solid fa-rotate w-4 h-4 flex items-center justify-center"></i></button>
            </div>
          </header>

          <!-- Viewport area -->
          <div class="flex-grow p-10 overflow-y-auto max-w-7xl w-full mx-auto">
            
            <!-- Dashboard Tab -->
            <section id="tab-dashboard" class="tab-content">
              <!-- Overview Cards -->
              <div class="grid grid-cols-4 gap-5 mb-8">
                <div class="bg-[#0d0e14] border border-[#1f2231] rounded-xl p-6">
                  <div class="text-xs text-gray-400 font-mono mb-2 uppercase tracking-wider">Total Runs</div>
                  <div class="text-3xl font-bold font-mono text-gray-100" id="stat-total">0</div>
                </div>
                <div class="bg-[#0d0e14] border border-[#1f2231] rounded-xl p-6">
                  <div class="text-xs text-emerald-400/80 font-mono mb-2 uppercase tracking-wider">Completed</div>
                  <div class="text-3xl font-bold font-mono text-emerald-400" id="stat-success">0</div>
                </div>
                <div class="bg-[#0d0e14] border border-[#1f2231] rounded-xl p-6">
                  <div class="text-xs text-amber-400/80 font-mono mb-2 uppercase tracking-wider">Processing</div>
                  <div class="text-3xl font-bold font-mono text-amber-400" id="stat-active">0</div>
                </div>
                <div class="bg-[#0d0e14] border border-[#1f2231] rounded-xl p-6">
                  <div class="text-xs text-rose-400/80 font-mono mb-2 uppercase tracking-wider">Failed (DLQ)</div>
                  <div class="text-3xl font-bold font-mono text-rose-400" id="stat-failed">0</div>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-8">
                <!-- Active Jobs list -->
                <div class="col-span-2 bg-[#0d0e14] border border-[#1f2231] rounded-xl overflow-hidden">
                  <div class="px-6 py-5 border-b border-[#1f2231] flex items-center justify-between">
                    <h2 class="text-sm font-semibold tracking-wider uppercase text-gray-400 font-mono">Running Pipelines</h2>
                    <span class="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20" id="active-jobs-count">0 running</span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                      <thead>
                        <tr class="border-b border-[#1f2231]/50 bg-[#0b0c12]">
                          <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">Run ID</th>
                          <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">Pipeline Name</th>
                          <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">Progress</th>
                          <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">Status</th>
                          <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody id="active-jobs-list" class="divide-y divide-[#1f2231]/40">
                        <!-- Loaded dynamically -->
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Queue settings configuration -->
                <div class="bg-[#0d0e14] border border-[#1f2231] rounded-xl p-6 h-fit">
                  <h2 class="text-sm font-semibold tracking-wider uppercase text-gray-400 font-mono mb-6">Queue Configuration</h2>
                  <div class="flex flex-col gap-4 text-sm">
                    <div class="flex justify-between border-b border-[#1f2231]/50 pb-3">
                      <span class="text-gray-500">Concurrency (Tasks)</span>
                      <span class="font-mono text-gray-300" id="stat-concurrency-tasks">100</span>
                    </div>
                    <div class="flex justify-between border-b border-[#1f2231]/50 pb-3">
                      <span class="text-gray-500">Concurrency (Flows)</span>
                      <span class="font-mono text-gray-300" id="stat-concurrency-workflows">50</span>
                    </div>
                    <div class="flex justify-between border-b border-[#1f2231]/50 pb-3">
                      <span class="text-gray-500">Redis Host</span>
                      <span class="font-mono text-gray-300" id="stat-redis-host">localhost</span>
                    </div>
                    <div class="flex justify-between pb-1">
                      <span class="text-gray-500">Backoff Strategy</span>
                      <span class="font-mono text-gray-300" id="stat-retry-strategy">exponential</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Run Pipeline Tab -->
            <section id="tab-run" class="tab-content hidden">
              <div class="grid grid-cols-3 gap-8">
                <!-- Pipeline trigger block -->
                <div class="col-span-2 bg-[#0d0e14] border border-[#1f2231] rounded-xl overflow-hidden flex flex-col h-[560px]">
                  <div class="px-6 py-4 border-b border-[#1f2231] flex items-center justify-between bg-[#0b0c12]">
                    <h2 class="text-sm font-semibold tracking-wider uppercase text-gray-400 font-mono">Editor</h2>
                    <div class="bg-[#161722] border border-[#1f2231] rounded p-0.5 flex gap-1">
                      <button class="px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-300 bg-[#0d0e14] border border-[#1f2231]" id="format-yaml">YAML</button>
                      <button class="px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-500 hover:text-gray-300" id="format-json">JSON</button>
                    </div>
                  </div>
                  <div class="flex-grow relative">
                    <textarea id="pipeline-editor" class="w-full h-full bg-[#07080c] text-gray-300 font-mono text-sm p-6 outline-none resize-none border-none border-[#1f2231]/50 focus:ring-0" placeholder="Paste your pipeline configuration here..."></textarea>
                  </div>
                  <div class="px-6 py-4 border-t border-[#1f2231] bg-[#0b0c12] flex justify-between items-center">
                    <div class="flex items-center gap-3">
                      <span class="text-xs text-gray-500 font-mono">Priority level:</span>
                      <select id="pipeline-priority" class="bg-[#161722] border border-[#1f2231] text-xs font-mono text-gray-300 rounded px-2.5 py-1.5 focus:outline-none">
                        <option value="0">High (0)</option>
                        <option value="1">Medium (1)</option>
                        <option value="2">Low (2)</option>
                      </select>
                    </div>
                    <button id="btn-trigger-pipeline" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold font-mono py-2.5 px-4 rounded-md transition duration-150 cursor-pointer flex items-center gap-2">
                      <i class="fa-solid fa-bolt"></i> Execute Pipeline
                    </button>
                  </div>
                </div>

                <!-- Templates sidebar -->
                <div class="bg-[#0d0e14] border border-[#1f2231] rounded-xl p-6 h-fit">
                  <h2 class="text-sm font-semibold tracking-wider uppercase text-gray-400 font-mono mb-6">Templates</h2>
                  <div class="flex flex-col gap-3">
                    <button class="template-item w-full text-left p-4 rounded-lg bg-[#161722]/50 hover:bg-[#161722] border border-[#1f2231] hover:border-indigo-500/50 transition cursor-pointer" data-template="onboarding">
                      <span class="block text-xs font-mono font-semibold text-indigo-400 mb-1">User Onboarding Flow</span>
                      <span class="block text-xs text-gray-500 leading-relaxed">Runs identity verification checks and sets up dashboard permissions.</span>
                    </button>
                    <button class="template-item w-full text-left p-4 rounded-lg bg-[#161722]/50 hover:bg-[#161722] border border-[#1f2231] hover:border-indigo-500/50 transition cursor-pointer" data-template="order">
                      <span class="block text-xs font-mono font-semibold text-indigo-400 mb-1">Payment Processing</span>
                      <span class="block text-xs text-gray-500 leading-relaxed">Charges credit card, checks stock levels, and issues credit on failure.</span>
                    </button>
                    <button class="template-item w-full text-left p-4 rounded-lg bg-[#161722]/50 hover:bg-[#161722] border border-[#1f2231] hover:border-indigo-500/50 transition cursor-pointer" data-template="demo">
                      <span class="block text-xs font-mono font-semibold text-indigo-400 mb-1">Success Branch Demo</span>
                      <span class="block text-xs text-gray-500 leading-relaxed">A simple testing pipeline that demonstrates sequential branching.</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- Execution Audit History Tab -->
            <section id="tab-history" class="tab-content hidden">
              <div class="bg-[#0d0e14] border border-[#1f2231] rounded-xl overflow-hidden">
                <div class="px-6 py-5 border-b border-[#1f2231] flex items-center justify-between bg-[#0b0c12]">
                  <h2 class="text-sm font-semibold tracking-wider uppercase text-gray-400 font-mono">Execution Logs</h2>
                  <div class="flex items-center bg-[#161722] border border-[#1f2231] rounded px-3 py-1.5 w-72 gap-2.5">
                    <i class="fa-solid fa-magnifying-glass text-xs text-gray-500"></i>
                    <input type="text" id="history-search" class="bg-transparent border-none outline-none text-xs text-gray-300 w-full placeholder-gray-600 focus:ring-0" placeholder="Search by name or ID...">
                  </div>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="border-b border-[#1f2231]/50 bg-[#0b0c12]">
                        <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">Instance ID</th>
                        <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">Pipeline Name</th>
                        <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">State</th>
                        <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">Progress</th>
                        <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">Executed On</th>
                        <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody id="history-list" class="divide-y divide-[#1f2231]/40">
                      <!-- Loaded dynamically -->
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <!-- DLQ Manager Tab -->
            <section id="tab-dlq" class="tab-content hidden">
              <div class="bg-[#0d0e14] border border-rose-500/20 rounded-xl overflow-hidden">
                <div class="px-6 py-5 border-b border-rose-500/20 flex items-center justify-between bg-[#0b0c12]">
                  <h2 class="text-sm font-semibold tracking-wider uppercase text-rose-400 font-mono">Dead-Letter Queue (DLQ) Logs</h2>
                  <span class="text-xs font-mono text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20" id="dlq-count">0 failures</span>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="border-b border-[#1f2231]/50 bg-[#0b0c12]">
                        <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">Instance ID</th>
                        <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">Pipeline Name</th>
                        <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">Faulty Step</th>
                        <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">Error Details</th>
                        <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase">Timestamp</th>
                        <th class="py-3.5 px-6 text-xs font-mono text-gray-500 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody id="dlq-list" class="divide-y divide-[#1f2231]/40">
                      <!-- Loaded dynamically -->
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>

      <!-- Detail Modal -->
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center hidden" id="workflow-modal">
        <div class="bg-[#0d0e14] border border-[#1f2231] rounded-xl w-[600px] max-h-[80vh] overflow-y-auto shadow-2xl flex flex-col">
          <div class="px-6 py-5 border-b border-[#1f2231] flex justify-between items-center bg-[#0b0c12]">
            <h2 id="modal-title" class="text-sm font-semibold tracking-wide text-gray-300 font-mono">Workflow Status</h2>
            <button class="text-gray-500 hover:text-white text-xl leading-none cursor-pointer p-1" id="btn-close-modal">&times;</button>
          </div>
          <div class="p-6 overflow-y-auto" id="modal-body">
            <!-- Rendered dynamically -->
          </div>
        </div>
      </div>

      <!-- Toast Notification System -->
      <div id="toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2.5 z-50"></div>
    `;
  }

  // --- DOM Elements ---
  const navButtons = document.querySelectorAll<HTMLButtonElement>('.nav-btn');
  const tabContents = document.querySelectorAll<HTMLElement>('.tab-content');
  const btnRefresh = document.getElementById('btn-refresh') as HTMLButtonElement;
  const btnToggleEngine = document.getElementById('btn-toggle-engine') as HTMLButtonElement;
  const engineStatusDot = document.getElementById('engine-status-dot') as HTMLSpanElement;
  const engineStatusText = document.getElementById('engine-status-text') as HTMLSpanElement;
  const lastUpdatedText = document.getElementById('last-updated') as HTMLSpanElement;

  // Stats Card Numbers
  const statTotal = document.getElementById('stat-total') as HTMLDivElement;
  const statSuccess = document.getElementById('stat-success') as HTMLDivElement;
  const statActive = document.getElementById('stat-active') as HTMLDivElement;
  const statFailed = document.getElementById('stat-failed') as HTMLDivElement;
  const dlqBadge = document.getElementById('dlq-badge-count') as HTMLSpanElement;
  const activeJobsCount = document.getElementById('active-jobs-count') as HTMLSpanElement;

  // Lists and Tables
  const activeJobsList = document.getElementById('active-jobs-list') as HTMLTableSectionElement;
  const historyList = document.getElementById('history-list') as HTMLTableSectionElement;
  const dlqList = document.getElementById('dlq-list') as HTMLTableSectionElement;

  // Editor and Template controls
  const pipelineEditor = document.getElementById('pipeline-editor') as HTMLTextAreaElement;
  const pipelinePriority = document.getElementById('pipeline-priority') as HTMLSelectElement;
  const btnTriggerPipeline = document.getElementById('btn-trigger-pipeline') as HTMLButtonElement;
  const formatYamlBtn = document.getElementById('format-yaml') as HTMLButtonElement;
  const formatJsonBtn = document.getElementById('format-json') as HTMLButtonElement;
  const templateButtons = document.querySelectorAll<HTMLButtonElement>('.template-item');

  // Modal elements
  const modal = document.getElementById('workflow-modal') as HTMLDivElement;
  const modalTitle = document.getElementById('modal-title') as HTMLHeadingElement;
  const modalBody = document.getElementById('modal-body') as HTMLDivElement;
  const btnCloseModal = document.getElementById('btn-close-modal') as HTMLButtonElement;

  // Toast Container
  const toastContainer = document.getElementById('toast-container') as HTMLDivElement;

  // Search box
  const historySearchInput = document.getElementById('history-search') as HTMLInputElement;

  // State
  let activeTab = 'dashboard';
  let editorFormat: 'yaml' | 'json' = 'yaml';
  let isEnginePaused = false;
  let allWorkflows: WorkflowInstance[] = [];

  // --- Templates Definitions ---
  const templates: Record<string, string> = {
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
  if (pipelineEditor) {
    pipelineEditor.value = templates.onboarding;
  }

  // --- Tab Switching ---
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (targetTab) {
        switchTab(targetTab);
      }
    });
  });

  function switchTab(tabId: string) {
    activeTab = tabId;
    navButtons.forEach(b => {
      if (b.getAttribute('data-tab') === tabId) {
        b.className = "nav-btn flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition duration-150 cursor-pointer bg-[#161722] text-white border border-[#1f2231]/80";
      } else {
        b.className = "nav-btn flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition duration-150 cursor-pointer text-gray-400 hover:text-white hover:bg-[#161722]";
      }
    });

    tabContents.forEach(c => {
      if (c.getAttribute('id') === `tab-${tabId}`) {
        c.classList.remove('hidden');
      } else {
        c.classList.add('hidden');
      }
    });

    fetchData();
  }

  // --- Templates Handler ---
  templateButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const templateKey = btn.getAttribute('data-template');
      if (templateKey && templates[templateKey] && pipelineEditor) {
        if (editorFormat === 'yaml') {
          pipelineEditor.value = templates[templateKey];
        } else {
          try {
            const parsed = jsyaml.load(templates[templateKey]);
            pipelineEditor.value = JSON.stringify(parsed, null, 2);
          } catch(e) {
            pipelineEditor.value = templates[templateKey];
          }
        }
        showToast(`Loaded ${btn.querySelector('.font-semibold')?.textContent} template`, 'success');
      }
    });
  });

  // Toggle editor format
  if (formatYamlBtn && formatJsonBtn) {
    formatYamlBtn.addEventListener('click', () => {
      editorFormat = 'yaml';
      formatYamlBtn.className = "px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-300 bg-[#0d0e14] border border-[#1f2231]";
      formatJsonBtn.className = "px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-500 hover:text-gray-300";
    });

    formatJsonBtn.addEventListener('click', () => {
      editorFormat = 'json';
      formatJsonBtn.className = "px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-300 bg-[#0d0e14] border border-[#1f2231]";
      formatYamlBtn.className = "px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-500 hover:text-gray-300";
    });
  }

  // --- Toast Notifications ---
  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    let borderClass = 'border-indigo-500';
    let iconClass = 'fa-circle-info text-indigo-400';

    if (type === 'success') {
      borderClass = 'border-emerald-500';
      iconClass = 'fa-circle-check text-emerald-400';
    } else if (type === 'error') {
      borderClass = 'border-rose-500';
      iconClass = 'fa-triangle-exclamation text-rose-400';
    }

    toast.className = `flex items-center gap-3 bg-[#0d0e14] border-l-4 ${borderClass} text-sm px-4 py-3.5 rounded-lg shadow-xl min-w-[280px] transition-all duration-300 transform translate-y-0 opacity-100`;
    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span class="text-gray-300 font-medium">${message}</span>
    `;

    toastContainer.appendChild(toast);

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
      const stats: StatsResponse = await statsRes.json();
      
      if (stats.config) {
        const concurrencyTasks = document.getElementById('stat-concurrency-tasks');
        const concurrencyWorkflows = document.getElementById('stat-concurrency-workflows');
        const redisHost = document.getElementById('stat-redis-host');
        const retryStrategy = document.getElementById('stat-retry-strategy');

        if (concurrencyTasks) concurrencyTasks.textContent = stats.config.queue?.taskConcurrency || 100;
        if (concurrencyWorkflows) concurrencyWorkflows.textContent = stats.config.queue?.workflowConcurrency || 50;
        if (redisHost) redisHost.textContent = `${stats.config.redis?.host || 'localhost'}:${stats.config.redis?.port || 6379}`;
        if (retryStrategy) retryStrategy.textContent = stats.config.retry?.strategy || 'exponential';
      }

      if (stats.queue) {
        isEnginePaused = stats.queue.isPaused;
        updateEngineControlDisplay(isEnginePaused);
      }

      // 2. Fetch Workflows list
      const workflowsRes = await fetch('/api/workflows');
      allWorkflows = await workflowsRes.json();

      let succeededCount = 0;
      let failedCount = 0;
      let activeCount = 0;

      allWorkflows.forEach(wf => {
        if (wf.status === 'completed' || wf.status === 'succeeded') succeededCount++;
        else if (wf.status === 'failed') failedCount++;
        else activeCount++;
      });

      if (statTotal) statTotal.textContent = String(allWorkflows.length);
      if (statSuccess) statSuccess.textContent = String(succeededCount);
      if (statActive) statActive.textContent = String(activeCount);
      if (statFailed) statFailed.textContent = String(failedCount);
      if (dlqBadge) dlqBadge.textContent = String(failedCount);
      if (activeJobsCount) activeJobsCount.textContent = `${activeCount} running`;

      renderActiveList(allWorkflows.filter(wf => wf.status !== 'completed' && wf.status !== 'failed'));
      
      if (activeTab === 'history') {
        renderHistoryList(allWorkflows);
      } else if (activeTab === 'dlq') {
        renderDLQList(allWorkflows.filter(wf => wf.status === 'failed'));
      }

      if (lastUpdatedText) {
        lastUpdatedText.textContent = `sync::${new Date().toLocaleTimeString()}`;
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  }

  function updateEngineControlDisplay(isPaused: boolean) {
    if (!engineStatusDot || !engineStatusText || !btnToggleEngine) return;
    if (isPaused) {
      engineStatusDot.className = 'w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
      engineStatusText.textContent = 'engine::paused';
      btnToggleEngine.innerHTML = '<i class="fa-solid fa-play"></i> Resume Engine';
    } else {
      engineStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      engineStatusText.textContent = 'engine::active';
      btnToggleEngine.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Engine';
    }
  }

  // --- Render Lists ---

  function renderActiveList(jobs: WorkflowInstance[]) {
    if (!activeJobsList) return;
    activeJobsList.innerHTML = '';
    
    if (jobs.length === 0) {
      activeJobsList.innerHTML = '<tr><td colspan="5" class="py-6 px-6 text-center text-xs font-mono text-gray-500">No active runs currently executing</td></tr>';
      return;
    }

    jobs.forEach(job => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-[#161722]/30 transition duration-150";
      const totalSteps = job.events ? job.events.length : 1;
      const completedSteps = job.history ? job.history.length : 0;
      const progressPercent = Math.min(Math.round((completedSteps / totalSteps) * 100), 99);

      tr.innerHTML = `
        <td class="py-4 px-6 font-mono text-xs text-gray-500"><code>${job.id.substring(0, 8)}</code></td>
        <td class="py-4 px-6 text-sm font-semibold text-gray-300">${job.name || 'Unnamed Pipeline'}</td>
        <td class="py-4 px-6 text-xs">
          <div class="flex items-center gap-3">
            <div class="w-24 bg-[#1f2231] h-1.5 rounded-full overflow-hidden">
              <div class="bg-indigo-500 h-full" style="width:${progressPercent}%"></div>
            </div>
            <span class="font-mono text-gray-400">${progressPercent}%</span>
          </div>
        </td>
        <td class="py-4 px-6"><span class="px-2 py-0.5 text-xs font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">${job.status || 'running'}</span></td>
        <td class="py-4 px-6 text-right">
          <button class="btn-view-details text-xs font-mono text-gray-400 hover:text-white bg-[#161722] hover:bg-[#1f2231] border border-[#1f2231] px-2.5 py-1 rounded transition cursor-pointer" data-id="${job.id}">
            View
          </button>
        </td>
      `;
      activeJobsList.appendChild(tr);
    });

    attachDetailsListeners();
  }

  function renderHistoryList(workflows: WorkflowInstance[]) {
    if (!historyList) return;
    const filterText = historySearchInput ? historySearchInput.value.toLowerCase().trim() : '';
    historyList.innerHTML = '';
    
    const filtered = workflows.filter(wf => {
      return wf.name.toLowerCase().includes(filterText) || wf.id.toLowerCase().includes(filterText);
    });

    if (filtered.length === 0) {
      historyList.innerHTML = '<tr><td colspan="6" class="py-6 px-6 text-center text-xs font-mono text-gray-500">No execution records match current search</td></tr>';
      return;
    }

    filtered.forEach(wf => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-[#161722]/30 transition duration-150";
      const time = wf.timestamp ? new Date(wf.timestamp).toLocaleString() : 'N/A';
      const stepsCount = wf.history ? wf.history.length : 0;
      
      let statusClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      if (wf.status === 'completed' || wf.status === 'succeeded') {
        statusClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      } else if (wf.status === 'failed') {
        statusClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      }

      tr.innerHTML = `
        <td class="py-4 px-6 font-mono text-xs text-gray-500"><code>${wf.id.substring(0, 8)}</code></td>
        <td class="py-4 px-6 text-sm font-semibold text-gray-300">${wf.name}</td>
        <td class="py-4 px-6"><span class="px-2 py-0.5 text-xs font-mono rounded border ${statusClass}">${wf.status}</span></td>
        <td class="py-4 px-6 text-xs text-gray-400 font-mono">${stepsCount} steps completed</td>
        <td class="py-4 px-6 text-xs text-gray-500 font-mono">${time}</td>
        <td class="py-4 px-6 text-right">
          <button class="btn-view-details text-xs font-mono text-gray-400 hover:text-white bg-[#161722] hover:bg-[#1f2231] border border-[#1f2231] px-2.5 py-1 rounded transition cursor-pointer" data-id="${wf.id}">
            Audit
          </button>
        </td>
      `;
      historyList.appendChild(tr);
    });

    attachDetailsListeners();
  }

  function renderDLQList(failedWorkflows: WorkflowInstance[]) {
    if (!dlqList) return;
    dlqList.innerHTML = '';
    
    const dlqCountEl = document.getElementById('dlq-count');
    if (dlqCountEl) dlqCountEl.textContent = `${failedWorkflows.length} failures`;

    if (failedWorkflows.length === 0) {
      dlqList.innerHTML = '<tr><td colspan="6" class="py-6 px-6 text-center text-xs font-mono text-gray-500">Dead-Letter Queue is currently clean.</td></tr>';
      return;
    }

    failedWorkflows.forEach(wf => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-[#161722]/30 transition duration-150";
      const time = wf.timestamp ? new Date(wf.timestamp).toLocaleString() : 'N/A';
      
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
        <td class="py-4 px-6 font-mono text-xs text-gray-500"><code>${wf.id.substring(0, 8)}</code></td>
        <td class="py-4 px-6 text-sm font-semibold text-gray-300">${wf.name}</td>
        <td class="py-4 px-6"><span class="px-2 py-0.5 text-xs font-mono rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">${failedStep}</span></td>
        <td class="py-4 px-6 text-xs text-rose-400/85 max-w-[200px] truncate" title="${errorMsg}">${errorMsg}</td>
        <td class="py-4 px-6 text-xs text-gray-500 font-mono">${time}</td>
        <td class="py-4 px-6 text-right">
          <div class="flex justify-end gap-2">
            <button class="btn-view-details text-xs font-mono text-gray-400 hover:text-white bg-[#161722] hover:bg-[#1f2231] border border-[#1f2231] px-2.5 py-1 rounded transition cursor-pointer" data-id="${wf.id}">
              Audit
            </button>
            <button class="btn-retry-job text-xs font-mono text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded transition cursor-pointer" data-id="${wf.id}">
              Retry
            </button>
          </div>
        </td>
      `;
      dlqList.appendChild(tr);
    });

    attachDetailsListeners();
    attachRetryListeners();
  }

  function attachDetailsListeners() {
    const detailButtons = document.querySelectorAll<HTMLButtonElement>('.btn-view-details');
    detailButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const workflowId = btn.getAttribute('data-id');
        if (!workflowId) return;
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

  function attachRetryListeners() {
    const retryButtons = document.querySelectorAll<HTMLButtonElement>('.btn-retry-job');
    retryButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const workflowId = btn.getAttribute('data-id');
        if (!workflowId) return;
        try {
          btn.innerHTML = '<i class="fa-solid fa-spinner spinner"></i>';
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
            btn.innerHTML = 'Retry';
            btn.disabled = false;
          }
        } catch (err) {
          showToast('Network error triggers retry failed', 'error');
          btn.innerHTML = 'Retry';
          btn.disabled = false;
        }
      });
    });
  }

  // --- Trigger Pipeline Submission ---
  if (btnTriggerPipeline) {
    btnTriggerPipeline.addEventListener('click', async () => {
      if (!pipelineEditor) return;
      const editorContent = pipelineEditor.value.trim();
      if (!editorContent) {
        showToast('Please enter a valid pipeline configuration', 'error');
        return;
      }

      try {
        btnTriggerPipeline.innerHTML = '<i class="fa-solid fa-spinner spinner"></i> Executing...';
        btnTriggerPipeline.disabled = true;

        const headers: Record<string, string> = {};
        const bodyData = editorContent;

        if (editorFormat === 'yaml') {
          headers['Content-Type'] = 'application/yaml';
        } else {
          headers['Content-Type'] = 'application/json';
          JSON.parse(editorContent);
        }

        const priority = pipelinePriority ? parseInt(pipelinePriority.value, 10) : 0;
        
        const response = await fetch('/api/workflows/run', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            yamlString: editorFormat === 'yaml' ? bodyData : undefined,
            jsonObj: editorFormat === 'json' ? JSON.parse(bodyData) : undefined,
            priority
          })
        });

        const result = await response.json();

        if (result.success) {
          showToast(`Pipeline enqueued successfully! Job ID: ${result.jobId.substring(0, 8)}`, 'success');
          switchTab('dashboard');
        } else {
          showToast(result.error || 'Pipeline execution failed', 'error');
        }
      } catch (err: any) {
        showToast(err.message || 'Error occurred during pipeline trigger', 'error');
      } finally {
        btnTriggerPipeline.innerHTML = '<i class="fa-solid fa-bolt"></i> Execute Pipeline';
        btnTriggerPipeline.disabled = false;
      }
    });
  }

  // --- Pause/Resume Engine ---
  if (btnToggleEngine) {
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
  }

  // --- Modal Handler ---
  function openDetailModal(workflow: WorkflowInstance) {
    if (!modalTitle || !modalBody || !modal) return;
    
    modalTitle.textContent = `${workflow.name} Audit Logs`;
    
    let historyHtml = '<div class="space-y-5 border-l border-[#1f2231] ml-2 pl-6 relative">';
    if (workflow.history && workflow.history.length > 0) {
      workflow.history.forEach((step, i) => {
        const stepStatus = step.status || 'completed';
        const isSuccess = stepStatus === 'completed';
        const dotBg = isSuccess ? 'bg-emerald-500' : 'bg-rose-500';
        const borderIndicator = isSuccess ? 'border-emerald-500/20' : 'border-rose-500/20';

        historyHtml += `
          <div class="relative group">
            <span class="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full ${dotBg}"></span>
            <div class="bg-[#161722]/50 border ${borderIndicator} rounded-lg p-4">
              <h4 class="text-xs font-mono font-semibold text-gray-300">Step ${i+1}: ${step.id}</h4>
              <p class="text-xs text-gray-500 font-mono mt-1">action::${step.action || 'default'}</p>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded ${isSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}">${stepStatus}</span>
              </div>
              ${step.error ? `<pre class="mt-3 text-xs bg-rose-500/5 text-rose-400 p-3 rounded font-mono border border-rose-500/10 whitespace-pre-wrap">${step.error}</pre>` : ''}
            </div>
          </div>
        `;
      });
    } else {
      historyHtml += '<p class="text-xs text-gray-500 font-mono">No steps executed yet</p>';
    }
    historyHtml += '</div>';

    const statusPillClass = workflow.status === 'completed' 
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
      : (workflow.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20');

    modalBody.innerHTML = `
      <div class="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-[#1f2231]">
        <div>
          <span class="block text-xs text-gray-500 font-mono mb-1">RUN_INSTANCE_ID</span>
          <code class="text-xs text-gray-300 font-mono bg-[#161722] border border-[#1f2231] px-2 py-1 rounded">${workflow.id}</code>
        </div>
        <div>
          <span class="block text-xs text-gray-500 font-mono mb-1.5">OVERALL_STATE</span>
          <span class="px-2.5 py-0.5 text-xs font-mono rounded border ${statusPillClass}">${workflow.status}</span>
        </div>
      </div>
      <div>
        <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono mb-4">Pipeline Steps Run</h3>
        ${historyHtml}
      </div>
    `;
    
    modal.classList.remove('hidden');
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      fetchData();
      showToast('Data synced', 'success');
    });
  }

  if (historySearchInput) {
    historySearchInput.addEventListener('input', () => {
      renderHistoryList(allWorkflows);
    });
  }

  // --- Initial Data Load ---
  fetchData();
  setInterval(fetchData, 4000);
});
