// API Configuration
const API_BASE = 'http://localhost:8000/api/v1';

// State
let currentPage = 0;
const pageSize = 20;
let totalStudents = 0;

// DOM Elements
const apiStatus = document.getElementById('api-status');
const totalStudentsEl = document.getElementById('total-students');
const atRiskCountEl = document.getElementById('at-risk-count');
const safeCountEl = document.getElementById('safe-count');
const riskPercentageEl = document.getElementById('risk-percentage');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initForms();
    initStudentTable();
    initModal();
    initLlmToggle();
    initChat();
    initDataUpload();
    checkApiStatus();
    loadDashboardStats();
    checkLlmStatus();
    loadDataStatus();
});

// LLM Toggle
function initLlmToggle() {
    const toggle = document.getElementById('use_llm');
    const status = document.getElementById('llm-status');

    if (toggle && status) {
        toggle.addEventListener('change', () => {
            if (toggle.checked) {
                status.textContent = 'ON';
                status.classList.remove('off');
            } else {
                status.textContent = 'OFF';
                status.classList.add('off');
            }
        });
    }
}

// Tab Navigation
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // Update buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// API Status Check
async function checkApiStatus() {
    try {
        const response = await fetch(`${API_BASE.replace('/api/v1', '')}/health`);
        if (response.ok) {
            apiStatus.textContent = 'Connected';
            apiStatus.className = 'status-badge status-connected';
        } else {
            throw new Error('API not healthy');
        }
    } catch (error) {
        apiStatus.textContent = 'Disconnected';
        apiStatus.className = 'status-badge status-error';
    }
}

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE}/dashboard/stats`);
        if (!response.ok) throw new Error('Failed to load stats');

        const data = await response.json();

        totalStudentsEl.textContent = data.overview.total_students.toLocaleString();
        atRiskCountEl.textContent = data.overview.at_risk_count.toLocaleString();
        safeCountEl.textContent = data.overview.not_at_risk_count.toLocaleString();
        riskPercentageEl.textContent = `${data.overview.risk_percentage}%`;

        totalStudents = data.overview.total_students;
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
}

// Forms
function initForms() {
    // Prediction Form
    const predictForm = document.getElementById('predict-form');
    predictForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handlePrediction();
    });

    // Intervention Form
    const interventionForm = document.getElementById('intervention-form');
    interventionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleIntervention();
    });
}

// Handle Prediction
async function handlePrediction() {
    const form = document.getElementById('predict-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    const resultPanel = document.getElementById('prediction-result');

    // Get form data
    const moduleSelect = document.getElementById('module_select').value;
    const data = {
        avg_score: parseFloat(form.avg_score.value),
        completion_rate: parseFloat(form.completion_rate.value),
        total_clicks: parseInt(form.total_clicks.value),
        studied_credits: parseInt(form.studied_credits.value),
        num_of_prev_attempts: parseInt(form.num_of_prev_attempts.value),
        module_BBB: moduleSelect === 'BBB',
        module_CCC: moduleSelect === 'CCC',
        module_DDD: moduleSelect === 'DDD',
        module_EEE: moduleSelect === 'EEE',
        module_FFF: moduleSelect === 'FFF',
        module_GGG: moduleSelect === 'GGG',
    };

    // Show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Predicting...';

    try {
        const response = await fetch(`${API_BASE}/predict/explain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Prediction failed');

        const result = await response.json();
        displayPredictionResult(result);
        resultPanel.classList.remove('hidden');

    } catch (error) {
        alert('Prediction failed: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Predict Risk';
    }
}

// Display Prediction Result
function displayPredictionResult(result) {
    const scoreEl = document.getElementById('risk-score');
    const scoreCircle = document.getElementById('score-circle');
    const riskBadge = document.getElementById('risk-badge');
    const factorsContainer = document.getElementById('factors-container');

    // Update score
    scoreEl.textContent = result.risk_score;

    // Update circle color
    scoreCircle.className = `score-circle risk-${result.risk_level}`;

    // Update badge
    riskBadge.textContent = result.risk_level;
    riskBadge.className = `risk-badge risk-${result.risk_level}`;

    // Display SHAP factors
    if (result.top_factors && result.top_factors.length > 0) {
        const maxImpact = Math.max(...result.top_factors.map(f => Math.abs(f.impact)));

        factorsContainer.innerHTML = result.top_factors.map(factor => {
            const barWidth = (Math.abs(factor.impact) / maxImpact) * 100;
            const isPositive = factor.impact > 0;
            const direction = isPositive ? 'Increases risk' : 'Decreases risk';

            return `
                <div class="factor-item">
                    <span class="factor-name">${formatFeatureName(factor.feature)}</span>
                    <div class="factor-bar">
                        <div class="factor-bar-fill ${isPositive ? 'positive' : 'negative'}"
                             style="width: ${barWidth}%"></div>
                    </div>
                    <span class="factor-value">${factor.impact > 0 ? '+' : ''}${factor.impact.toFixed(2)}</span>
                </div>
            `;
        }).join('');
    }
}

// Handle Intervention
async function handleIntervention() {
    const form = document.getElementById('intervention-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    const resultPanel = document.getElementById('intervention-result');

    const data = {
        risk_score: parseInt(form.querySelector('#int_risk_score').value),
        avg_score: parseFloat(form.querySelector('#int_avg_score').value),
        completion_rate: parseFloat(form.querySelector('#int_completion_rate').value),
        total_clicks: parseInt(form.querySelector('#int_total_clicks').value),
        student_name: form.querySelector('#student_name').value || null,
        use_llm: form.querySelector('#use_llm').checked
    };

    // Show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Generating...';

    try {
        const response = await fetch(`${API_BASE}/intervention`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to generate interventions');

        const result = await response.json();
        displayInterventionResult(result);
        resultPanel.classList.remove('hidden');

    } catch (error) {
        alert('Failed to generate interventions: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Generate Interventions';
    }
}

// Display Intervention Result
function displayInterventionResult(result) {
    const riskBadge = document.getElementById('int-risk-badge');
    const llmBadge = document.getElementById('llm-badge');
    const summaryEl = document.getElementById('intervention-summary');
    const listEl = document.getElementById('interventions-list');

    // Update badges
    riskBadge.textContent = result.risk_level;
    riskBadge.className = `risk-badge risk-${result.risk_level}`;

    if (result.llm_enhanced) {
        llmBadge.classList.remove('hidden');
    } else {
        llmBadge.classList.add('hidden');
    }

    // Update summary
    summaryEl.innerHTML = `<p>${result.summary}</p>`;

    // Update interventions list
    listEl.innerHTML = result.interventions.map(intervention => `
        <div class="intervention-card">
            <div class="intervention-card-header">
                <span class="intervention-title">${intervention.title}</span>
                <span class="priority-badge priority-${intervention.priority}">${intervention.priority}</span>
            </div>
            <p class="intervention-description">${intervention.description}</p>
            ${intervention.actions && intervention.actions.length > 0 ? `
                <ul class="intervention-actions">
                    ${intervention.actions.map(action => `<li>${action}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `).join('');
}

// Student Table
function initStudentTable() {
    document.getElementById('load-students').addEventListener('click', loadStudents);
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));
    document.getElementById('student-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchStudent(e.target.value);
        }
    });
}

async function loadStudents() {
    const tbody = document.getElementById('students-tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading-cell"><span class="loading"></span> Loading...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/students?limit=${pageSize}&offset=${currentPage * pageSize}`);
        if (!response.ok) throw new Error('Failed to load students');

        const data = await response.json();
        totalStudents = data.total;

        displayStudents(data.students);
        updatePagination();

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="loading-cell">Error: ${error.message}</td></tr>`;
    }
}

function displayStudents(students) {
    const tbody = document.getElementById('students-tbody');

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-cell">No students found</td></tr>';
        return;
    }

    tbody.innerHTML = students.map((student, index) => {
        const id = currentPage * pageSize + index;
        const atRisk = student.at_risk === 1;

        return `
            <tr>
                <td>${id}</td>
                <td>${student.avg_score?.toFixed(1) || '-'}</td>
                <td>${(student.completion_rate * 100)?.toFixed(0) || '-'}%</td>
                <td>${student.total_clicks?.toLocaleString() || '-'}</td>
                <td>
                    <span class="risk-badge risk-${atRisk ? 'high' : 'low'}">
                        ${atRisk ? 'At Risk' : 'On Track'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="viewStudent(${id})">
                        View
                    </button>
                    <button class="btn btn-small btn-primary" onclick="predictStudent(${id})">
                        Predict
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function changePage(delta) {
    const newPage = currentPage + delta;
    const maxPage = Math.ceil(totalStudents / pageSize) - 1;

    if (newPage >= 0 && newPage <= maxPage) {
        currentPage = newPage;
        loadStudents();
    }
}

function updatePagination() {
    const maxPage = Math.ceil(totalStudents / pageSize);
    document.getElementById('page-info').textContent = `Page ${currentPage + 1} of ${maxPage}`;
    document.getElementById('prev-page').disabled = currentPage === 0;
    document.getElementById('next-page').disabled = currentPage >= maxPage - 1;
}

async function searchStudent(id) {
    if (!id) return;

    try {
        const response = await fetch(`${API_BASE}/students/${id}`);
        if (!response.ok) throw new Error('Student not found');

        const data = await response.json();
        showStudentModal(id, data.student);

    } catch (error) {
        alert('Student not found: ' + error.message);
    }
}

// View Student
async function viewStudent(id) {
    try {
        const response = await fetch(`${API_BASE}/students/${id}`);
        if (!response.ok) throw new Error('Failed to load student');

        const data = await response.json();
        showStudentModal(id, data.student);

    } catch (error) {
        alert('Failed to load student: ' + error.message);
    }
}

// Predict Student
async function predictStudent(id) {
    try {
        const response = await fetch(`${API_BASE}/students/${id}/predict`);
        if (!response.ok) throw new Error('Prediction failed');

        const result = await response.json();

        // Switch to predict tab and show result
        document.querySelector('[data-tab="predict"]').click();
        displayPredictionResult(result);
        document.getElementById('prediction-result').classList.remove('hidden');

    } catch (error) {
        alert('Prediction failed: ' + error.message);
    }
}

// Modal
function initModal() {
    const modal = document.getElementById('student-modal');
    const closeBtn = modal.querySelector('.modal-close');

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

function showStudentModal(id, student) {
    const modal = document.getElementById('student-modal');
    const detailEl = document.getElementById('student-detail');

    detailEl.innerHTML = `
        <div class="student-info">
            <h4>Student #${id}</h4>
            <table style="width: 100%;">
                <tr><td><strong>Module:</strong></td><td>${student.code_module || '-'}</td></tr>
                <tr><td><strong>Region:</strong></td><td>${student.region || '-'}</td></tr>
                <tr><td><strong>Education:</strong></td><td>${student.highest_education || '-'}</td></tr>
                <tr><td><strong>Age Band:</strong></td><td>${student.age_band || '-'}</td></tr>
                <tr><td><strong>Gender:</strong></td><td>${student.gender || '-'}</td></tr>
            </table>

            <h4 style="margin-top: 1.5rem;">Performance Metrics</h4>
            <table style="width: 100%;">
                <tr><td><strong>Average Score:</strong></td><td>${student.avg_score?.toFixed(1) || '-'}%</td></tr>
                <tr><td><strong>Completion Rate:</strong></td><td>${(student.completion_rate * 100)?.toFixed(0) || '-'}%</td></tr>
                <tr><td><strong>Total Clicks:</strong></td><td>${student.total_clicks?.toLocaleString() || '-'}</td></tr>
                <tr><td><strong>Studied Credits:</strong></td><td>${student.studied_credits || '-'}</td></tr>
                <tr><td><strong>Previous Attempts:</strong></td><td>${student.num_of_prev_attempts || 0}</td></tr>
            </table>

            <div style="margin-top: 1.5rem; text-align: center;">
                <button class="btn btn-primary" onclick="predictStudent(${id}); document.getElementById('student-modal').classList.add('hidden');">
                    Predict Risk
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

// Utility Functions
function formatFeatureName(name) {
    const names = {
        'completion_rate': 'Completion Rate',
        'avg_score': 'Average Score',
        'total_clicks': 'VLE Engagement',
        'studied_credits': 'Credits Studied',
        'num_of_prev_attempts': 'Previous Attempts',
        'module_BBB': 'Module BBB',
        'module_CCC': 'Module CCC',
        'module_DDD': 'Module DDD',
        'module_EEE': 'Module EEE',
        'module_FFF': 'Module FFF',
        'module_GGG': 'Module GGG',
    };
    return names[name] || name;
}

// Chat Functions
function initChat() {
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');

    if (chatInput && chatSend) {
        // Send on button click
        chatSend.addEventListener('click', sendMessage);

        // Send on Enter key
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
}

async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const message = chatInput.value.trim();

    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user');

    // Clear input and disable while waiting
    chatInput.value = '';
    chatInput.disabled = true;
    chatSend.disabled = true;

    // Show typing indicator
    showTypingIndicator();

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        if (!response.ok) {
            throw new Error('Failed to get response');
        }

        const data = await response.json();

        // Hide typing indicator
        hideTypingIndicator();

        // Add assistant response
        addMessage(data.response, 'assistant');

        // Update LLM status indicator
        updateLlmStatusIndicator(data.llm_available);

    } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        console.error('Chat error:', error);
    } finally {
        chatInput.disabled = false;
        chatSend.disabled = false;
        chatInput.focus();
    }
}

function addMessage(text, sender) {
    const chatMessages = document.getElementById('chat-messages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Auto-scroll to latest message
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message assistant';
    typingDiv.id = 'typing-indicator';

    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function checkLlmStatus() {
    try {
        const response = await fetch(`${API_BASE}/chat/status`);
        if (response.ok) {
            const data = await response.json();
            updateLlmStatusIndicator(data.available);
        } else {
            updateLlmStatusIndicator(false);
        }
    } catch (error) {
        updateLlmStatusIndicator(false);
    }
}

function updateLlmStatusIndicator(available) {
    const indicator = document.getElementById('llm-status-indicator');
    if (indicator) {
        if (available) {
            indicator.textContent = 'AI Ready';
            indicator.className = 'llm-status-indicator status-available';
        } else {
            indicator.textContent = 'AI Unavailable';
            indicator.className = 'llm-status-indicator status-unavailable';
        }
    }
}

// Data Upload Functions
let selectedFile = null;

function initDataUpload() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');

    if (!dropzone) return;

    // Dropzone click to open file dialog
    dropzone.addEventListener('click', () => fileInput.click());

    // Drag and drop events
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Remove selected file
    const fileRemoveBtn = document.querySelector('.file-remove');
    if (fileRemoveBtn) {
        fileRemoveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearSelectedFile();
        });
    }

    // Upload button
    if (uploadBtn) {
        uploadBtn.addEventListener('click', handleUpload);
    }

    // Clear data button
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearUploadedData);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function handleFileSelect(file) {
    const validTypes = ['.csv', '.zip'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(fileExt)) {
        showUploadResult(false, 'Invalid file type. Please upload a CSV or ZIP file.');
        return;
    }

    selectedFile = file;

    // Update UI
    const selectedFileEl = document.getElementById('selected-file');
    const fileNameEl = selectedFileEl.querySelector('.file-name');
    const fileSizeEl = selectedFileEl.querySelector('.file-size');

    fileNameEl.textContent = file.name;
    if (fileSizeEl) {
        fileSizeEl.textContent = formatFileSize(file.size);
    }
    selectedFileEl.classList.remove('hidden');

    // Hide dropzone text when file selected
    const dropzone = document.getElementById('dropzone');
    dropzone.style.display = 'none';

    updateUploadButton();
}

function clearSelectedFile() {
    selectedFile = null;
    const fileInput = document.getElementById('file-input');
    const selectedFileEl = document.getElementById('selected-file');
    const dropzone = document.getElementById('dropzone');

    if (fileInput) fileInput.value = '';
    if (selectedFileEl) selectedFileEl.classList.add('hidden');
    if (dropzone) dropzone.style.display = '';

    updateUploadButton();
}

function updateUploadButton() {
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
        uploadBtn.disabled = !selectedFile;
    }
}

async function handleUpload() {
    const uploadBtn = document.getElementById('upload-btn');
    const progressEl = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    // Show progress
    progressEl.classList.remove('hidden');
    progressFill.style.width = '30%';
    progressText.textContent = 'Uploading...';
    uploadBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        progressFill.style.width = '60%';

        const response = await fetch(`${API_BASE}/upload/csv`, {
            method: 'POST',
            body: formData
        });

        progressFill.style.width = '90%';
        progressText.textContent = 'Processing...';

        if (response.ok) {
            const data = await response.json();
            progressFill.style.width = '100%';
            showUploadResult(true, `Loaded ${data.records_loaded.toLocaleString()} records`);
            loadDataStatus();
            loadDashboardStats();
        } else {
            const error = await response.json();
            showUploadResult(false, error.detail || 'Upload failed');
        }
    } catch (error) {
        showUploadResult(false, 'Upload failed: ' + error.message);
    } finally {
        progressEl.classList.add('hidden');
        progressFill.style.width = '0%';
        clearSelectedFile();
    }
}

function showUploadResult(success, message) {
    const resultEl = document.getElementById('upload-result');
    const iconEl = resultEl.querySelector('.upload-result-icon');
    const messageEl = resultEl.querySelector('.upload-result-message');

    resultEl.classList.remove('hidden', 'success', 'error');
    resultEl.classList.add(success ? 'success' : 'error');

    iconEl.innerHTML = success
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';

    messageEl.textContent = message;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        resultEl.classList.add('hidden');
    }, 5000);
}

async function loadDataStatus() {
    const sourceEl = document.getElementById('data-source');
    const countEl = document.getElementById('data-record-count');
    const statusEl = document.getElementById('data-load-status');

    try {
        const response = await fetch(`${API_BASE}/upload/status`);
        if (response.ok) {
            const data = await response.json();

            // Format source name nicely
            let sourceName = data.source || 'Default';
            if (sourceName.startsWith('uploaded:')) {
                sourceName = 'Uploaded';
            } else if (sourceName === 'student_features.csv') {
                sourceName = 'Default';
            }

            sourceEl.textContent = sourceName;
            countEl.textContent = data.record_count.toLocaleString();
            statusEl.textContent = data.is_loaded ? 'Active' : 'Not Loaded';
            statusEl.className = `data-status-badge ${data.is_loaded ? 'status-loaded' : ''}`;
        }
    } catch (error) {
        sourceEl.textContent = '-';
        countEl.textContent = '-';
        statusEl.textContent = 'Error';
        statusEl.className = 'data-status-badge status-error';
    }
}

async function clearUploadedData() {
    const clearBtn = document.getElementById('clear-data-btn');
    const originalHTML = clearBtn.innerHTML;
    clearBtn.disabled = true;
    clearBtn.innerHTML = '<span class="loading"></span> Resetting...';

    try {
        const response = await fetch(`${API_BASE}/upload/data`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const data = await response.json();
            showUploadResult(data.success, data.message);
            loadDataStatus();
            loadDashboardStats();
        } else {
            showUploadResult(false, 'Failed to reset data');
        }
    } catch (error) {
        showUploadResult(false, 'Error: ' + error.message);
    } finally {
        clearBtn.disabled = false;
        clearBtn.innerHTML = originalHTML;
    }
}
