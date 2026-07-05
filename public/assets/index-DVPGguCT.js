(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})(),document.addEventListener(`DOMContentLoaded`,()=>{let e=document.getElementById(`app`);e&&(e.innerHTML=`
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
    `);let t=document.querySelectorAll(`.nav-btn`),n=document.querySelectorAll(`.tab-content`),r=document.getElementById(`btn-refresh`),i=document.getElementById(`btn-toggle-engine`),a=document.getElementById(`engine-status-dot`),o=document.getElementById(`engine-status-text`),s=document.getElementById(`last-updated`),c=document.getElementById(`stat-total`),l=document.getElementById(`stat-success`),u=document.getElementById(`stat-active`),d=document.getElementById(`stat-failed`),f=document.getElementById(`dlq-badge-count`),p=document.getElementById(`active-jobs-count`),m=document.getElementById(`active-jobs-list`),h=document.getElementById(`history-list`),g=document.getElementById(`dlq-list`),_=document.getElementById(`pipeline-editor`),v=document.getElementById(`pipeline-priority`),y=document.getElementById(`btn-trigger-pipeline`),b=document.getElementById(`format-yaml`),x=document.getElementById(`format-json`),S=document.querySelectorAll(`.template-item`),C=document.getElementById(`workflow-modal`),w=document.getElementById(`modal-title`),T=document.getElementById(`modal-body`),E=document.getElementById(`btn-close-modal`),D=document.getElementById(`toast-container`),O=document.getElementById(`history-search`),k=`dashboard`,A=`yaml`,j=!1,M=[],N={onboarding:`name: "User Onboarding Flow"
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
    args: { userId: "{{event.userId}}" }`,order:`name: "E-Commerce Purchase Flow"
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
    args: { userId: "{{event.userId}}", message: "Card charge failed." }`,demo:`name: "Basic Demo Workflow"
events:
  - id: "step_one"
    action: "demoService.step1"
    args: { data: "hello" }
    next:
      - if: "{{success}}"
        then: "step_two"
  - id: "step_two"
    action: "demoService.step2"
    args: { data: "world" }`};_&&(_.value=N.onboarding),t.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-tab`);t&&P(t)})});function P(e){k=e,t.forEach(t=>{t.getAttribute(`data-tab`)===e?t.className=`nav-btn flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition duration-150 cursor-pointer bg-[#161722] text-white border border-[#1f2231]/80`:t.className=`nav-btn flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition duration-150 cursor-pointer text-gray-400 hover:text-white hover:bg-[#161722]`}),n.forEach(t=>{t.getAttribute(`id`)===`tab-${e}`?t.classList.remove(`hidden`):t.classList.add(`hidden`)}),I()}S.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-template`);if(t&&N[t]&&_){if(A===`yaml`)_.value=N[t];else try{let e=jsyaml.load(N[t]);_.value=JSON.stringify(e,null,2)}catch{_.value=N[t]}F(`Loaded ${e.querySelector(`.font-semibold`)?.textContent} template`,`success`)}})}),b&&x&&(b.addEventListener(`click`,()=>{A=`yaml`,b.className=`px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-300 bg-[#0d0e14] border border-[#1f2231]`,x.className=`px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-500 hover:text-gray-300`}),x.addEventListener(`click`,()=>{A=`json`,x.className=`px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-300 bg-[#0d0e14] border border-[#1f2231]`,b.className=`px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-500 hover:text-gray-300`}));function F(e,t=`info`){if(!D)return;let n=document.createElement(`div`),r=`border-indigo-500`,i=`fa-circle-info text-indigo-400`;t===`success`?(r=`border-emerald-500`,i=`fa-circle-check text-emerald-400`):t===`error`&&(r=`border-rose-500`,i=`fa-triangle-exclamation text-rose-400`),n.className=`flex items-center gap-3 bg-[#0d0e14] border-l-4 ${r} text-sm px-4 py-3.5 rounded-lg shadow-xl min-w-[280px] transition-all duration-300 transform translate-y-0 opacity-100`,n.innerHTML=`
      <i class="fa-solid ${i}"></i>
      <span class="text-gray-300 font-medium">${e}</span>
    `,D.appendChild(n),setTimeout(()=>{n.style.opacity=`0`,n.style.transform=`translateY(10px)`,setTimeout(()=>n.remove(),300)},4e3)}async function I(){try{let e=await(await fetch(`/api/stats`)).json();if(e.config){let t=document.getElementById(`stat-concurrency-tasks`),n=document.getElementById(`stat-concurrency-workflows`),r=document.getElementById(`stat-redis-host`),i=document.getElementById(`stat-retry-strategy`);t&&(t.textContent=e.config.queue?.taskConcurrency||100),n&&(n.textContent=e.config.queue?.workflowConcurrency||50),r&&(r.textContent=`${e.config.redis?.host||`localhost`}:${e.config.redis?.port||6379}`),i&&(i.textContent=e.config.retry?.strategy||`exponential`)}e.queue&&(j=e.queue.isPaused,L(j)),M=await(await fetch(`/api/workflows`)).json();let t=0,n=0,r=0;M.forEach(e=>{e.status===`completed`||e.status===`succeeded`?t++:e.status===`failed`?n++:r++}),c&&(c.textContent=String(M.length)),l&&(l.textContent=String(t)),u&&(u.textContent=String(r)),d&&(d.textContent=String(n)),f&&(f.textContent=String(n)),p&&(p.textContent=`${r} running`),R(M.filter(e=>e.status!==`completed`&&e.status!==`failed`)),k===`history`?z(M):k===`dlq`&&B(M.filter(e=>e.status===`failed`)),s&&(s.textContent=`sync::${new Date().toLocaleTimeString()}`)}catch(e){console.error(`Error fetching dashboard stats:`,e)}}function L(e){!a||!o||!i||(e?(a.className=`w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]`,o.textContent=`engine::paused`,i.innerHTML=`<i class="fa-solid fa-play"></i> Resume Engine`):(a.className=`w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]`,o.textContent=`engine::active`,i.innerHTML=`<i class="fa-solid fa-pause"></i> Pause Engine`))}function R(e){if(m){if(m.innerHTML=``,e.length===0){m.innerHTML=`<tr><td colspan="5" class="py-6 px-6 text-center text-xs font-mono text-gray-500">No active runs currently executing</td></tr>`;return}e.forEach(e=>{let t=document.createElement(`tr`);t.className=`hover:bg-[#161722]/30 transition duration-150`;let n=e.events?e.events.length:1,r=e.history?e.history.length:0,i=Math.min(Math.round(r/n*100),99);t.innerHTML=`
        <td class="py-4 px-6 font-mono text-xs text-gray-500"><code>${e.id.substring(0,8)}</code></td>
        <td class="py-4 px-6 text-sm font-semibold text-gray-300">${e.name||`Unnamed Pipeline`}</td>
        <td class="py-4 px-6 text-xs">
          <div class="flex items-center gap-3">
            <div class="w-24 bg-[#1f2231] h-1.5 rounded-full overflow-hidden">
              <div class="bg-indigo-500 h-full" style="width:${i}%"></div>
            </div>
            <span class="font-mono text-gray-400">${i}%</span>
          </div>
        </td>
        <td class="py-4 px-6"><span class="px-2 py-0.5 text-xs font-mono rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">${e.status||`running`}</span></td>
        <td class="py-4 px-6 text-right">
          <button class="btn-view-details text-xs font-mono text-gray-400 hover:text-white bg-[#161722] hover:bg-[#1f2231] border border-[#1f2231] px-2.5 py-1 rounded transition cursor-pointer" data-id="${e.id}">
            View
          </button>
        </td>
      `,m.appendChild(t)}),V()}}function z(e){if(!h)return;let t=O?O.value.toLowerCase().trim():``;h.innerHTML=``;let n=e.filter(e=>e.name.toLowerCase().includes(t)||e.id.toLowerCase().includes(t));if(n.length===0){h.innerHTML=`<tr><td colspan="6" class="py-6 px-6 text-center text-xs font-mono text-gray-500">No execution records match current search</td></tr>`;return}n.forEach(e=>{let t=document.createElement(`tr`);t.className=`hover:bg-[#161722]/30 transition duration-150`;let n=e.timestamp?new Date(e.timestamp).toLocaleString():`N/A`,r=e.history?e.history.length:0,i=`bg-amber-500/10 text-amber-400 border-amber-500/20`;e.status===`completed`||e.status===`succeeded`?i=`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`:e.status===`failed`&&(i=`bg-rose-500/10 text-rose-400 border-rose-500/20`),t.innerHTML=`
        <td class="py-4 px-6 font-mono text-xs text-gray-500"><code>${e.id.substring(0,8)}</code></td>
        <td class="py-4 px-6 text-sm font-semibold text-gray-300">${e.name}</td>
        <td class="py-4 px-6"><span class="px-2 py-0.5 text-xs font-mono rounded border ${i}">${e.status}</span></td>
        <td class="py-4 px-6 text-xs text-gray-400 font-mono">${r} steps completed</td>
        <td class="py-4 px-6 text-xs text-gray-500 font-mono">${n}</td>
        <td class="py-4 px-6 text-right">
          <button class="btn-view-details text-xs font-mono text-gray-400 hover:text-white bg-[#161722] hover:bg-[#1f2231] border border-[#1f2231] px-2.5 py-1 rounded transition cursor-pointer" data-id="${e.id}">
            Audit
          </button>
        </td>
      `,h.appendChild(t)}),V()}function B(e){if(!g)return;g.innerHTML=``;let t=document.getElementById(`dlq-count`);if(t&&(t.textContent=`${e.length} failures`),e.length===0){g.innerHTML=`<tr><td colspan="6" class="py-6 px-6 text-center text-xs font-mono text-gray-500">Dead-Letter Queue is currently clean.</td></tr>`;return}e.forEach(e=>{let t=document.createElement(`tr`);t.className=`hover:bg-[#161722]/30 transition duration-150`;let n=e.timestamp?new Date(e.timestamp).toLocaleString():`N/A`,r=`Unknown`,i=e.error||`Execution timeout or process aborted`;if(e.history&&e.history.length>0){let t=e.history[e.history.length-1];t.status===`failed`&&(r=t.id,i=t.error||i)}t.innerHTML=`
        <td class="py-4 px-6 font-mono text-xs text-gray-500"><code>${e.id.substring(0,8)}</code></td>
        <td class="py-4 px-6 text-sm font-semibold text-gray-300">${e.name}</td>
        <td class="py-4 px-6"><span class="px-2 py-0.5 text-xs font-mono rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">${r}</span></td>
        <td class="py-4 px-6 text-xs text-rose-400/85 max-w-[200px] truncate" title="${i}">${i}</td>
        <td class="py-4 px-6 text-xs text-gray-500 font-mono">${n}</td>
        <td class="py-4 px-6 text-right">
          <div class="flex justify-end gap-2">
            <button class="btn-view-details text-xs font-mono text-gray-400 hover:text-white bg-[#161722] hover:bg-[#1f2231] border border-[#1f2231] px-2.5 py-1 rounded transition cursor-pointer" data-id="${e.id}">
              Audit
            </button>
            <button class="btn-retry-job text-xs font-mono text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded transition cursor-pointer" data-id="${e.id}">
              Retry
            </button>
          </div>
        </td>
      `,g.appendChild(t)}),V(),H()}function V(){document.querySelectorAll(`.btn-view-details`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(t)try{U(await(await fetch(`/api/workflows/${t}/status`)).json())}catch{F(`Failed to load workflow details`,`error`)}})})}function H(){document.querySelectorAll(`.btn-retry-job`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(t)try{e.innerHTML=`<i class="fa-solid fa-spinner spinner"></i>`,e.disabled=!0;let n=await(await fetch(`/api/dlq/${t}/retry`,{method:`POST`})).json();n.success?(F(`Workflow enqueued successfully for retry!`,`success`),I()):(F(n.error||`Retry submission failed`,`error`),e.innerHTML=`Retry`,e.disabled=!1)}catch{F(`Network error triggers retry failed`,`error`),e.innerHTML=`Retry`,e.disabled=!1}})})}y&&y.addEventListener(`click`,async()=>{if(!_)return;let e=_.value.trim();if(!e){F(`Please enter a valid pipeline configuration`,`error`);return}try{y.innerHTML=`<i class="fa-solid fa-spinner spinner"></i> Executing...`,y.disabled=!0;let t={},n=e;A===`yaml`?t[`Content-Type`]=`application/yaml`:(t[`Content-Type`]=`application/json`,JSON.parse(e));let r=v?parseInt(v.value,10):0,i=await(await fetch(`/api/workflows/run`,{method:`POST`,headers:t,body:JSON.stringify({yamlString:A===`yaml`?n:void 0,jsonObj:A===`json`?JSON.parse(n):void 0,priority:r})})).json();i.success?(F(`Pipeline enqueued successfully! Job ID: ${i.jobId.substring(0,8)}`,`success`),P(`dashboard`)):F(i.error||`Pipeline execution failed`,`error`)}catch(e){F(e.message||`Error occurred during pipeline trigger`,`error`)}finally{y.innerHTML=`<i class="fa-solid fa-bolt"></i> Execute Pipeline`,y.disabled=!1}}),i&&i.addEventListener(`click`,async()=>{let e=j?`/api/engine/resume`:`/api/engine/pause`;try{let t=await(await fetch(e,{method:`POST`})).json();t.success&&(j=!j,L(j),F(t.message,`success`))}catch{F(`Failed to update engine processing state`,`error`)}});function U(e){if(!w||!T||!C)return;w.textContent=`${e.name} Audit Logs`;let t=`<div class="space-y-5 border-l border-[#1f2231] ml-2 pl-6 relative">`;e.history&&e.history.length>0?e.history.forEach((e,n)=>{let r=e.status||`completed`,i=r===`completed`;t+=`
          <div class="relative group">
            <span class="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full ${i?`bg-emerald-500`:`bg-rose-500`}"></span>
            <div class="bg-[#161722]/50 border ${i?`border-emerald-500/20`:`border-rose-500/20`} rounded-lg p-4">
              <h4 class="text-xs font-mono font-semibold text-gray-300">Step ${n+1}: ${e.id}</h4>
              <p class="text-xs text-gray-500 font-mono mt-1">action::${e.action||`default`}</p>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded ${i?`bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`:`bg-rose-500/10 text-rose-400 border border-rose-500/20`}">${r}</span>
              </div>
              ${e.error?`<pre class="mt-3 text-xs bg-rose-500/5 text-rose-400 p-3 rounded font-mono border border-rose-500/10 whitespace-pre-wrap">${e.error}</pre>`:``}
            </div>
          </div>
        `}):t+=`<p class="text-xs text-gray-500 font-mono">No steps executed yet</p>`,t+=`</div>`;let n=e.status===`completed`?`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`:e.status===`failed`?`bg-rose-500/10 text-rose-400 border-rose-500/20`:`bg-amber-500/10 text-amber-400 border-amber-500/20`;T.innerHTML=`
      <div class="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-[#1f2231]">
        <div>
          <span class="block text-xs text-gray-500 font-mono mb-1">RUN_INSTANCE_ID</span>
          <code class="text-xs text-gray-300 font-mono bg-[#161722] border border-[#1f2231] px-2 py-1 rounded">${e.id}</code>
        </div>
        <div>
          <span class="block text-xs text-gray-500 font-mono mb-1.5">OVERALL_STATE</span>
          <span class="px-2.5 py-0.5 text-xs font-mono rounded border ${n}">${e.status}</span>
        </div>
      </div>
      <div>
        <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono mb-4">Pipeline Steps Run</h3>
        ${t}
      </div>
    `,C.classList.remove(`hidden`)}E&&E.addEventListener(`click`,()=>{C.classList.add(`hidden`)}),window.addEventListener(`click`,e=>{e.target===C&&C.classList.add(`hidden`)}),r&&r.addEventListener(`click`,()=>{I(),F(`Data synced`,`success`)}),O&&O.addEventListener(`input`,()=>{z(M)}),I(),setInterval(I,4e3)});