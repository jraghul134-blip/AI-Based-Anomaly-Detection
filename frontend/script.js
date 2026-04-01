const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const statTotal = document.getElementById('stat-total');
const statThreats = document.getElementById('stat-threats');
const resetBtn = document.getElementById('reset-btn');
const serverStatus = document.getElementById('server-status');
const serverText = document.getElementById('server-text');
const threatTableBody = document.querySelector('#threat-table tbody');

let anomalyChart = null;

// API Endpoint -> Python backend
const API_URL = 'http://127.0.0.1:8000/detect_anomalies';

// Init Chart.js
function initChart() {
    const ctx = document.getElementById('anomalyChart').getContext('2d');
    
    // Set global defaults for dark theme
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
    
    anomalyChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            return `Packet ${context.raw.index}: In(${context.raw.x}) Out(${context.raw.y})`;
                        }
                    }
                },
                legend: {
                    labels: { color: '#f8fafc' }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Bytes In', color: '#94a3b8' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    title: { display: true, text: 'Bytes Out', color: '#94a3b8' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Check Backend connection simple UI
serverStatus.classList.add('connected');
serverText.innerText = 'Ready for Data';

// Event Listeners for Drag and Drop
uploadZone.addEventListener('click', () => fileInput.click());

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadZone.addEventListener(eventName, () => uploadZone.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadZone.addEventListener(eventName, () => uploadZone.classList.remove('dragover'), false);
});

uploadZone.addEventListener('drop', handleDrop, false);
fileInput.addEventListener('change', handleFiles, false);
resetBtn.addEventListener('click', resetDashboard);

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;
    handleFiles({ target: { files: files }});
}

async function handleFiles(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
        alert('Please upload a generic CSV file containing network metrics.');
        return;
    }

    serverStatus.className = 'dot processing';
    serverText.innerText = 'AI Scanning Data...';
    
    // Send to backend
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Network response was not ok');
        
        const result = await response.json();
        
        if (result.error) {
            alert('Backend Error: ' + result.error);
            resetServerStatus();
            return;
        }

        updateDashboard(result);

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to AI engine. Ensure Python FastAPI server is running on port 8000.');
        resetServerStatus();
    }
}

function updateDashboard(result) {
    serverStatus.className = 'dot connected';
    serverText.innerText = 'Analysis Complete';
    resetBtn.disabled = false;

    // Animate numbers
    animateValue(statTotal, 0, result.total_records, 1000);
    animateValue(statThreats, 0, result.anomalies_detected, 1000);

    // Plot Data
    plotData(result.data);
    
    // Update Table
    populateTable(result.data);
}

function plotData(data) {
    // Separate normal vs threats. We use 'bytes_in' or something similar.
    // To make it generic, we'll try to find any 2 numeric columns.
    const keys = Object.keys(data[0]).filter(k => k !== 'is_anomaly');
    const xKey = keys[0] || 'index';
    const yKey = keys[1] || 'value';

    const normalPoints = [];
    const threatPoints = [];

    data.forEach((row, i) => {
        const point = { 
            x: parseFloat(row[xKey]) || i, 
            y: parseFloat(row[yKey]) || parseFloat(row[xKey]) || i,
            index: i 
        };
        
        if (row.is_anomaly === true) {
            threatPoints.push(point);
        } else {
            normalPoints.push(point);
        }
    });

    anomalyChart.data.datasets = [
        {
            label: 'Normal Traffic',
            data: normalPoints,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            pointRadius: 4,
            pointHoverRadius: 6
        },
        {
            label: 'Threat Detected (Anomaly)',
            data: threatPoints,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
            pointRadius: 6,
            pointHoverRadius: 8,
            pointStyle: 'triangle' // Make threats visually distinct
        }
    ];

    // Update axis labels dynamically
    anomalyChart.options.scales.x.title.text = xKey;
    anomalyChart.options.scales.y.title.text = yKey;
    
    anomalyChart.update();
}

function populateTable(data) {
    threatTableBody.innerHTML = '';
    
    const threats = data.filter(r => r.is_anomaly === true).slice(0, 50); // Show max 50 recent
    
    if (threats.length === 0) {
        threatTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">No anomalies to display.</td></tr>`;
        return;
    }

    const keys = Object.keys(threats[0]).filter(k => k !== 'is_anomaly');
    const k1 = keys[0] || '-';
    const k2 = keys[1] || '-';

    threats.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${index + 1}</td>
            <td>${row[k1]}</td>
            <td>${row[k2]}</td>
            <td><span class="badge-threat">Critical</span></td>
        `;
        threatTableBody.appendChild(tr);
    });
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function resetDashboard() {
    statTotal.innerText = '0';
    statThreats.innerText = '0';
    threatTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">No anomalies to display.</td></tr>`;
    
    if (anomalyChart) {
        anomalyChart.data.datasets = [];
        anomalyChart.update();
    }
    
    fileInput.value = "";
    resetServerStatus();
    resetBtn.disabled = true;
}

function resetServerStatus() {
    serverStatus.className = 'dot connected';
    serverText.innerText = 'Ready for Data';
}

// Initialize
initChart();
