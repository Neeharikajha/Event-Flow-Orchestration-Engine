(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})(),document.addEventListener(`DOMContentLoaded`,()=>{let e=document.getElementById(`app`);e&&(e.innerHTML=`
      <div class="w-full min-h-screen bg-[#07080c] relative overflow-hidden flex flex-col select-none">
        
        <!-- Top Navbar -->
        <nav class="h-16 border-b border-[#1f2231]/50 px-8 flex items-center justify-between bg-[#0b0c12]/80 backdrop-blur-md z-50 sticky top-0 shrink-0">
          <div class="flex items-center gap-3 font-semibold text-lg tracking-tight cursor-pointer" id="logo-home">
            <i class="fa-solid fa-square-terminal text-indigo-400"></i>
            <span>eventFlow</span>
          </div>
          <div class="flex items-center gap-6">
            <a href="https://github.com/Neeharikajha/Event-Flow-Orchestration-Engine" target="_blank" class="text-sm font-medium text-gray-400 hover:text-white transition duration-150 flex items-center gap-2">
              <i class="fa-brands fa-github"></i> Docs
            </a>
            <button id="nav-goto-dashboard" class="text-xs font-semibold py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-150 cursor-pointer shadow-lg shadow-indigo-500/20">
              Dashboard
            </button>
          </div>
        </nav>

        <!-- Viewport Screens -->
        <div class="flex-grow flex relative min-h-0">
          
          <!-- SCREEN 1: HOMEPAGE -->
          <div id="tab-home" class="tab-content w-full flex-grow flex flex-col items-center justify-center relative min-h-[calc(100vh-4rem)] p-6 z-10">
            <!-- Aceternity Grid background -->
            <div class="absolute inset-0 z-0 h-full w-full bg-[#07080c] bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-55 pointer-events-none"></div>
            <div class="absolute inset-0 z-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 blur-[120px] pointer-events-none"></div>

            <!-- Hero Section -->
            <div class="relative z-10 text-center px-4 max-w-2xl flex flex-col items-center">
              <span class="px-3.5 py-1 text-[10px] font-semibold tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full font-mono mb-6 uppercase">
                orchestration engine
              </span>
              <h1 class="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-400 leading-[1.1] mb-6 tracking-tight">
                Orchestrate event flows with absolute control
              </h1>
              <p class="text-sm sm:text-base text-gray-400 mb-10 max-w-lg leading-relaxed">
                A distributed event-driven orchestration system built on Node.js, Redis, and BullMQ. Define pipelines in YAML, track execution state, and recover with dead-letter queue isolation.
              </p>
              
              <!-- CTA Actions -->
              <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
                <a href="https://www.npmjs.com" target="_blank" class="w-full sm:w-auto px-7 py-3 bg-[#11121a] hover:bg-[#161722] border border-[#1f2231] text-gray-300 font-semibold text-xs font-mono rounded-lg transition duration-150 shadow-md flex items-center justify-center gap-2">
                  <i class="fa-brands fa-npm text-[#cb3837] text-xl"></i> npm i event-stormer
                </a>
                <button id="btn-goto-dashboard" class="w-full sm:w-auto px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition duration-150 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer">
                  Go to Dashboard <i class="fa-solid fa-chevron-right text-[10px]"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- SCREEN 2: DASHBOARD APP (Hidden by default) -->
          <div id="tab-dashboard-view" class="tab-content hidden w-full flex-grow flex min-h-0">
            <!-- Sidebar -->
            <aside class="w-64 bg-[#0d0e14] border-r border-[#1f2231] flex flex-col p-6 shrink-0 h-full overflow-y-auto">
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

              <!-- Engine Control -->
              <div class="pt-6 border-t border-[#1f2231] flex flex-col gap-4 shrink-0">
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

            <!-- Workspace Panel -->
            <main class="flex-grow flex flex-col min-w-0 h-full">
              <!-- Top Dashboard Header -->
              <header class="h-16 border-b border-[#1f2231] px-10 flex items-center justify-between bg-[#0b0c12] shrink-0">
                <h1 class="text-sm font-semibold tracking-wide text-gray-300 font-mono">eventFlow v2.0.0</h1>
                <div class="flex items-center gap-4">
                  <span class="text-xs text-gray-400 font-mono" id="last-updated">syncing...</span>
                  <button id="btn-refresh" class="text-gray-400 hover:text-white transition duration-150 p-1.5 hover:bg-[#161722] rounded-md cursor-pointer" title="Refresh Dashboard"><i class="fa-solid fa-rotate w-4 h-4 flex items-center justify-center"></i></button>
                  <button id="btn-reset" class="text-rose-400 hover:text-rose-300 transition duration-150 p-1.5 hover:bg-[#161722] rounded-md cursor-pointer" title="Clear/Reset All Workflows"><i class="fa-solid fa-trash-can w-4 h-4 flex items-center justify-center"></i></button>
                </div>
              </header>

              <!-- Viewport Workspace -->
              <div class="flex-grow p-10 overflow-y-auto max-w-7xl w-full mx-auto">
                
                <!-- Dashboard Subtab -->
                <section id="tab-dashboard" class="tab-content">
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
                    <!-- Active List -->
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
                            <!-- Dynamically loaded -->
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <!-- Config Card -->
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

                <!-- Run Pipeline Subtab -->
                <section id="tab-run" class="tab-content hidden">
                  <div class="grid grid-cols-3 gap-8">
                    <!-- Editor -->
                    <div class="col-span-2 bg-[#0d0e14] border border-[#1f2231] rounded-xl overflow-hidden flex flex-col h-[560px]">
                      <div class="px-6 py-4 border-b border-[#1f2231] flex items-center justify-between bg-[#0b0c12]">
                        <h2 class="text-sm font-semibold tracking-wider uppercase text-gray-400 font-mono">Editor</h2>
                        <div class="bg-[#161722] border border-[#1f2231] rounded p-0.5 flex gap-1">
                          <button class="px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-300 bg-[#0d0e14] border border-[#1f2231]" id="format-yaml">YAML</button>
                          <button class="px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-500 hover:text-gray-300" id="format-json">JSON</button>
                        </div>
                      </div>
                      <div class="flex-grow relative">
                        <textarea id="pipeline-editor" class="w-full h-full bg-[#07080c] text-gray-300 font-mono text-sm p-6 outline-none resize-none border-none focus:ring-0" placeholder="Paste pipeline configurations..."></textarea>
                      </div>
                      <div class="px-6 py-4 border-t border-[#1f2231] bg-[#0b0c12] flex justify-between items-center bg-[#0b0c12]">
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

                    <!-- Templates -->
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

                <!-- History Subtab -->
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
                          <!-- Dynamically loaded -->
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                <!-- DLQ Subtab -->
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
                          <!-- Dynamically loaded -->
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

              </div>
            </main>
          </div>

        </div>
      </div>

      <!-- Detail Modal -->
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center hidden" id="workflow-modal">
        <div class="bg-[#0d0e14] border border-[#1f2231] rounded-xl w-[600px] max-h-[80vh] overflow-y-auto shadow-2xl flex flex-col">
          <div class="px-6 py-5 border-b border-[#1f2231] flex justify-between items-center bg-[#0b0c12]">
            <h2 id="modal-title" class="text-sm font-semibold tracking-wide text-gray-300 font-mono">Workflow Status</h2>
            <button class="text-gray-500 hover:text-white text-xl leading-none cursor-pointer p-1" id="btn-close-modal">&times;</button>
          </div>
          <div class="p-6 overflow-y-auto" id="modal-body">
            <!-- Dynamically populated -->
          </div>
        </div>
      </div>

      <!-- Toast Notification System -->
      <div id="toast-container" class="fixed bottom-6 right-6 flex flex-col gap-2.5 z-50"></div>
    `);let t=document.querySelectorAll(`.nav-btn`),n=document.querySelectorAll(`.tab-content`),r=document.getElementById(`btn-refresh`),i=document.getElementById(`btn-reset`),a=document.getElementById(`btn-toggle-engine`),o=document.getElementById(`engine-status-dot`),s=document.getElementById(`engine-status-text`),c=document.getElementById(`last-updated`),l=document.getElementById(`stat-total`),u=document.getElementById(`stat-success`),d=document.getElementById(`stat-active`),f=document.getElementById(`stat-failed`),p=document.getElementById(`dlq-badge-count`),m=document.getElementById(`active-jobs-count`),h=document.getElementById(`active-jobs-list`),g=document.getElementById(`history-list`),_=document.getElementById(`dlq-list`),v=document.getElementById(`pipeline-editor`),y=document.getElementById(`pipeline-priority`),b=document.getElementById(`btn-trigger-pipeline`),x=document.getElementById(`format-yaml`),S=document.getElementById(`format-json`),C=document.querySelectorAll(`.template-item`),w=document.getElementById(`workflow-modal`),T=document.getElementById(`modal-title`),E=document.getElementById(`modal-body`),D=document.getElementById(`btn-close-modal`),O=document.getElementById(`toast-container`),k=document.getElementById(`history-search`),A=document.getElementById(`logo-home`),j=document.getElementById(`nav-goto-dashboard`),M=document.getElementById(`btn-goto-dashboard`),N=`home`,P=`yaml`,F=!1,I=[],L={onboarding:`name: "User Onboarding Flow"
description: "Checks verification, registers access, and allocates user data"
tasks:
  verify_user:
    description: "Checks if user exists and is verified"
    blocking: true
    handler: "../taskHandlers/testHandler.js"
    parameters:
      delay: 1000
      error: false
  grant_access:
    description: "Grants access to system dashboard"
    blocking: true
    handler: "../taskHandlers/logHandler.js"
    parameters:
      level: "info"
      log: "Access granted to user dashboard."
  save_profile:
    description: "Saves user profile metadata locally"
    blocking: true
    handler: "../taskHandlers/fileHandler.js"
    parameters:
      file:
        name: "./user_profile.json"
        contents: {
          verified: true,
          role: "user",
          onboardedAt: "2026-07-08T21:00:00Z"
        }
`,order:`name: "E-Commerce Purchase Flow"
description: "Charges card, verifies inventory, and prints shipping logs"
tasks:
  charge_card:
    description: "Charges the customer's payment card"
    blocking: true
    handler: "../taskHandlers/testHandler.js"
    parameters:
      delay: 800
      error: false
  check_inventory:
    description: "Checks item availability in stock"
    blocking: true
    handler: "../taskHandlers/testHandler.js"
    parameters:
      delay: 500
      error: false
  log_shipping:
    description: "Queues order shipment in warehouse"
    blocking: true
    handler: "../taskHandlers/logHandler.js"
    parameters:
      level: "info"
      log: "Order payment confirmed. Shipping label generated."
`,demo:`name: "Basic Demo Workflow"
description: "A simple sequential test workflow"
tasks:
  step_one:
    description: "First step executing"
    blocking: true
    handler: "../taskHandlers/testHandler.js"
    parameters:
      delay: 600
      error: false
  step_two:
    description: "Second step executing"
    blocking: true
    handler: "../taskHandlers/testHandler.js"
    parameters:
      delay: 600
      error: false
  step_three:
    description: "Third step executing"
    blocking: true
    handler: "../taskHandlers/testHandler.js"
    parameters:
      delay: 600
      error: false
`};v&&(v.value=L.onboarding),t.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-tab`);t&&R(t)})}),A&&A.addEventListener(`click`,()=>{R(`home`)}),j&&j.addEventListener(`click`,()=>{R(`dashboard`)}),M&&M.addEventListener(`click`,()=>{R(`dashboard`)});function R(e){N=e;let r=document.getElementById(`tab-home`),i=document.getElementById(`tab-dashboard-view`);e===`home`?(r&&r.classList.remove(`hidden`),i&&i.classList.add(`hidden`)):(r&&r.classList.add(`hidden`),i&&i.classList.remove(`hidden`),n.forEach(t=>{let n=t.getAttribute(`id`);n===`tab-${e}`?t.classList.remove(`hidden`):n!==`tab-home`&&n!==`tab-dashboard-view`&&t.classList.add(`hidden`)}),t.forEach(t=>{t.getAttribute(`data-tab`)===e?t.className=`nav-btn flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition duration-150 cursor-pointer bg-[#161722] text-white border border-[#1f2231]/80`:t.className=`nav-btn flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition duration-150 cursor-pointer text-gray-400 hover:text-white hover:bg-[#161722]`}),B())}C.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-template`);if(t&&L[t]&&v){if(P===`yaml`)v.value=L[t];else try{let e=jsyaml.load(L[t]);v.value=JSON.stringify(e,null,2)}catch{v.value=L[t]}z(`Loaded ${e.querySelector(`.font-semibold`)?.textContent} template`,`success`)}})}),x&&S&&(x.addEventListener(`click`,()=>{P=`yaml`,x.className=`px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-300 bg-[#0d0e14] border border-[#1f2231]`,S.className=`px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-500 hover:text-gray-300`}),S.addEventListener(`click`,()=>{P=`json`,S.className=`px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-300 bg-[#0d0e14] border border-[#1f2231]`,x.className=`px-3 py-1 text-xs font-mono rounded cursor-pointer transition text-gray-500 hover:text-gray-300`}));function z(e,t=`info`){if(!O)return;let n=document.createElement(`div`),r=`border-indigo-500`,i=`fa-circle-info text-indigo-400`;t===`success`?(r=`border-emerald-500`,i=`fa-circle-check text-emerald-400`):t===`error`&&(r=`border-rose-500`,i=`fa-triangle-exclamation text-rose-400`),n.className=`flex items-center gap-3 bg-[#0d0e14] border-l-4 ${r} text-sm px-4 py-3.5 rounded-lg shadow-xl min-w-[280px] transition-all duration-300 transform translate-y-0 opacity-100`,n.innerHTML=`
      <i class="fa-solid ${i}"></i>
      <span class="text-gray-300 font-medium">${e}</span>
    `,O.appendChild(n),setTimeout(()=>{n.style.opacity=`0`,n.style.transform=`translateY(10px)`,setTimeout(()=>n.remove(),300)},4e3)}async function B(){try{let e=await(await fetch(`/api/stats`)).json();if(e.config){let t=document.getElementById(`stat-concurrency-tasks`),n=document.getElementById(`stat-concurrency-workflows`),r=document.getElementById(`stat-redis-host`),i=document.getElementById(`stat-retry-strategy`);t&&(t.textContent=e.config.queue?.taskConcurrency||100),n&&(n.textContent=e.config.queue?.workflowConcurrency||50),r&&(r.textContent=`${e.config.redis?.host||`localhost`}:${e.config.redis?.port||6379}`),i&&(i.textContent=e.config.retry?.strategy||`exponential`)}e.queue&&(F=e.queue.isPaused,V(F)),I=await(await fetch(`/api/workflows`)).json();let t=0,n=0,r=0;I.forEach(e=>{e.status===`completed`||e.status===`succeeded`?t++:e.status===`failed`?n++:r++}),l&&(l.textContent=String(I.length)),u&&(u.textContent=String(t)),d&&(d.textContent=String(r)),f&&(f.textContent=String(n)),p&&(p.textContent=String(n)),m&&(m.textContent=`${r} running`),H(I.filter(e=>e.status!==`completed`&&e.status!==`failed`)),N===`history`?U(I):N===`dlq`&&W(I.filter(e=>e.status===`failed`)),c&&(c.textContent=`sync::${new Date().toLocaleTimeString()}`)}catch(e){console.error(`Error fetching dashboard stats:`,e)}}function V(e){!o||!s||!a||(e?(o.className=`w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]`,s.textContent=`engine::paused`,a.innerHTML=`<i class="fa-solid fa-play"></i> Resume Engine`):(o.className=`w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]`,s.textContent=`engine::active`,a.innerHTML=`<i class="fa-solid fa-pause"></i> Pause Engine`))}function H(e){if(h){if(h.innerHTML=``,e.length===0){h.innerHTML=`<tr><td colspan="5" class="py-6 px-6 text-center text-xs font-mono text-gray-500">No active runs currently executing</td></tr>`;return}e.forEach(e=>{let t=document.createElement(`tr`);t.className=`hover:bg-[#161722]/30 transition duration-150`;let n=e.tasks?Object.keys(e.tasks).length:1,r=e.tasks?Object.keys(e.tasks).filter(t=>e.tasks[t].status===`completed`).length:0,i=n>0?Math.min(Math.round(r/n*100),100):0;t.innerHTML=`
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
          <div class="flex justify-end gap-2 font-mono text-xs">
            <button class="btn-view-details text-gray-400 hover:text-white bg-[#161722] hover:bg-[#1f2231] border border-[#1f2231] px-2.5 py-1 rounded transition cursor-pointer" data-id="${e.id}">
              View
            </button>
            <button class="btn-delete-job text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded transition cursor-pointer" data-id="${e.id}">
              Delete
            </button>
          </div>
        </td>
      `,h.appendChild(t)}),G(),J()}}function U(e){if(!g)return;let t=k?k.value.toLowerCase().trim():``;g.innerHTML=``;let n=e.filter(e=>e.name.toLowerCase().includes(t)||e.id.toLowerCase().includes(t));if(n.length===0){g.innerHTML=`<tr><td colspan="6" class="py-6 px-6 text-center text-xs font-mono text-gray-500">No execution records match current search</td></tr>`;return}n.forEach(e=>{let t=document.createElement(`tr`);t.className=`hover:bg-[#161722]/30 transition duration-150`;let n=e.timestamp?new Date(e.timestamp).toLocaleString():`N/A`,r=e.tasks?Object.keys(e.tasks).length:0,i=e.tasks?Object.keys(e.tasks).filter(t=>e.tasks[t].status===`completed`).length:0,a=`bg-amber-500/10 text-amber-400 border-amber-500/20`;e.status===`completed`||e.status===`succeeded`?a=`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`:e.status===`failed`&&(a=`bg-rose-500/10 text-rose-400 border-rose-500/20`),t.innerHTML=`
        <td class="py-4 px-6 font-mono text-xs text-gray-500"><code>${e.id.substring(0,8)}</code></td>
        <td class="py-4 px-6 text-sm font-semibold text-gray-300">${e.name}</td>
        <td class="py-4 px-6"><span class="px-2 py-0.5 text-xs font-mono rounded border ${a}">${e.status}</span></td>
        <td class="py-4 px-6 text-xs text-gray-400 font-mono">${i}/${r} tasks completed</td>
        <td class="py-4 px-6 text-xs text-gray-500 font-mono">${n}</td>
        <td class="py-4 px-6 text-right">
          <div class="flex justify-end gap-2 font-mono text-xs">
            <button class="btn-view-details text-gray-400 hover:text-white bg-[#161722] hover:bg-[#1f2231] border border-[#1f2231] px-2.5 py-1 rounded transition cursor-pointer" data-id="${e.id}">
              Audit
            </button>
            <button class="btn-delete-job text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded transition cursor-pointer" data-id="${e.id}">
              Delete
            </button>
          </div>
        </td>
      `,g.appendChild(t)}),G(),J()}function W(e){if(!_)return;_.innerHTML=``;let t=document.getElementById(`dlq-count`);if(t&&(t.textContent=`${e.length} failures`),e.length===0){_.innerHTML=`<tr><td colspan="6" class="py-6 px-6 text-center text-xs font-mono text-gray-500">Dead-Letter Queue is currently clean.</td></tr>`;return}e.forEach(e=>{let t=document.createElement(`tr`);t.className=`hover:bg-[#161722]/30 transition duration-150`;let n=e.timestamp?new Date(e.timestamp).toLocaleString():`N/A`,r=`Unknown`,i=e.error||`Execution timeout or process aborted`;if(e.history&&e.history.length>0){let t=e.history[e.history.length-1];t.status===`failed`&&(r=t.id,i=t.error||i)}t.innerHTML=`
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
            <button class="btn-delete-job text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded transition cursor-pointer" data-id="${e.id}">
              Delete
            </button>
          </div>
        </td>
      `,_.appendChild(t)}),G(),K(),J()}function G(){document.querySelectorAll(`.btn-view-details`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(t)try{q(await(await fetch(`/api/workflows/${t}/status`)).json())}catch{z(`Failed to load workflow details`,`error`)}})})}function K(){document.querySelectorAll(`.btn-retry-job`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(t)try{e.innerHTML=`<i class="fa-solid fa-spinner spinner"></i>`,e.disabled=!0;let n=await(await fetch(`/api/dlq/${t}/retry`,{method:`POST`})).json();n.success?(z(`Workflow enqueued successfully for retry!`,`success`),B()):(z(n.error||`Retry submission failed`,`error`),e.innerHTML=`Retry`,e.disabled=!1)}catch{z(`Network error triggers retry failed`,`error`),e.innerHTML=`Retry`,e.disabled=!1}})})}b&&b.addEventListener(`click`,async()=>{if(!v)return;let e=v.value.trim();if(!e){z(`Please enter a valid pipeline configuration`,`error`);return}try{b.innerHTML=`<i class="fa-solid fa-spinner spinner"></i> Executing...`,b.disabled=!0;let t={"Content-Type":`application/json`},n=e;P===`json`&&JSON.parse(e);let r=y?parseInt(y.value,10):0,i=await(await fetch(`/api/workflows/run`,{method:`POST`,headers:t,body:JSON.stringify({yamlString:P===`yaml`?n:void 0,jsonObj:P===`json`?JSON.parse(n):void 0,priority:r})})).json();i.success?(z(`Pipeline enqueued successfully! Job ID: ${i.jobId.substring(0,8)}`,`success`),R(`dashboard`)):z(i.error||`Pipeline execution failed`,`error`)}catch(e){z(e.message||`Error occurred during pipeline trigger`,`error`)}finally{b.innerHTML=`<i class="fa-solid fa-bolt"></i> Execute Pipeline`,b.disabled=!1}}),a&&a.addEventListener(`click`,async()=>{let e=F?`/api/engine/resume`:`/api/engine/pause`;try{let t=await(await fetch(e,{method:`POST`})).json();t.success&&(F=!F,V(F),z(t.message,`success`))}catch{z(`Failed to update engine processing state`,`error`)}});function q(e){if(!T||!E||!w)return;T.textContent=`${e.name} Audit Logs`;let t=`<div class="space-y-5 border-l border-[#1f2231] ml-2 pl-6 relative">`,n=e.tasks?Object.keys(e.tasks):[];n.length>0?n.forEach((n,r)=>{let i=e.tasks[n],a=i.status||`pending`,o=a===`completed`,s=a===`failed`;t+=`
          <div class="relative group">
            <span class="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full ${o?`bg-emerald-500`:s?`bg-rose-500`:`bg-amber-500`}"></span>
            <div class="bg-[#161722]/50 border ${o?`border-emerald-500/20`:s?`border-rose-500/20`:`border-amber-500/20`} rounded-lg p-4">
              <h4 class="text-xs font-mono font-semibold text-gray-300">Step ${r+1}: ${n}</h4>
              <p class="text-xs text-gray-500 font-mono mt-1">action::${i.handler||`default`}</p>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-[10px] uppercase font-mono px-2 py-0.5 rounded ${o?`bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`:s?`bg-rose-500/10 text-rose-400 border border-rose-500/20`:`bg-amber-500/10 text-amber-400 border border-amber-500/20`}">${a}</span>
              </div>
              ${i.error?`<pre class="mt-3 text-xs bg-rose-500/5 text-rose-400 p-3 rounded font-mono border border-rose-500/10 whitespace-pre-wrap">${i.error}</pre>`:``}
            </div>
          </div>
        `}):t+=`<p class="text-xs text-gray-500 font-mono">No steps executed yet</p>`,t+=`</div>`;let r=e.status===`completed`?`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`:e.status===`failed`?`bg-rose-500/10 text-rose-400 border-rose-500/20`:`bg-amber-500/10 text-amber-400 border-amber-500/20`;E.innerHTML=`
      <div class="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-[#1f2231]">
        <div>
          <span class="block text-xs text-gray-500 font-mono mb-1">RUN_INSTANCE_ID</span>
          <code class="text-xs text-gray-300 font-mono bg-[#161722] border border-[#1f2231] px-2 py-1 rounded">${e.id}</code>
        </div>
        <div>
          <span class="block text-xs text-gray-500 font-mono mb-1.5">OVERALL_STATE</span>
          <span class="px-2.5 py-0.5 text-xs font-mono rounded border ${r}">${e.status}</span>
        </div>
      </div>
      <div>
        <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono mb-4">Pipeline Steps Run</h3>
        ${t}
      </div>
    `,w.classList.remove(`hidden`)}D&&D.addEventListener(`click`,()=>{w.classList.add(`hidden`)}),window.addEventListener(`click`,e=>{e.target===w&&w.classList.add(`hidden`)}),r&&r.addEventListener(`click`,()=>{B(),z(`Data synced`,`success`)}),i&&i.addEventListener(`click`,async()=>{if(confirm(`Are you sure you want to clear/delete ALL workflows from the system? This cannot be undone.`))try{let e=await(await fetch(`/api/workflows`,{method:`DELETE`})).json();e.success?(z(`All workflows deleted successfully`,`success`),B()):z(e.error||`Failed to clear workflows`,`error`)}catch{z(`Network error during reset`,`error`)}}),k&&k.addEventListener(`input`,()=>{U(I)});function J(){document.querySelectorAll(`.btn-delete-job`).forEach(e=>{let t=e.cloneNode(!0);e.parentNode?.replaceChild(t,e),t.addEventListener(`click`,async e=>{e.stopPropagation();let n=t.getAttribute(`data-id`);if(n&&confirm(`Are you sure you want to delete workflow run ${n.substring(0,8)}?`))try{let e=await(await fetch(`/api/workflows/${n}`,{method:`DELETE`})).json();e.success?(z(`Workflow run deleted successfully`,`success`),B()):z(e.error||`Failed to delete workflow run`,`error`)}catch{z(`Network error during deletion`,`error`)}})})}B(),setInterval(B,4e3)});