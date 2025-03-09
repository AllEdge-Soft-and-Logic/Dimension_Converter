const combinedData = [];
const conversions = {
    cm: { cm: 1, mm: 10, m: 0.01, in: 0.393701, ft: 0.0328084 },
    mm: { cm: 0.1, mm: 1, m: 0.001, in: 0.0393701, ft: 0.00328084 },
    m: { cm: 100, mm: 1000, m: 1, in: 39.3701, ft: 3.28084 },
    in: { cm: 2.54, mm: 25.4, m: 0.0254, in: 1, ft: 0.0833333 },
    ft: { cm: 30.48, mm: 304.8, m: 0.3048, in: 12, ft: 1 }
};

// Cache DOM elements
const lengthInput = document.getElementById('length');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const weightInput = document.getElementById('weight');
const cftInput = document.getElementById('cft');
const originalUnitType = document.getElementById('originalUnitType');
const convertUnitType = document.getElementById('convertUnitType');
const combinedTableBody = document.getElementById('combinedTable').getElementsByTagName('tbody')[0];

function addData() {
    const length = parseFloat(lengthInput.value);
    const width = parseFloat(widthInput.value);
    const height = parseFloat(heightInput.value);
    const weight = parseFloat(weightInput.value);
    const cft = parseFloat(cftInput.value);

    if ([length, width, height, weight, cft].some(isNaN)) {
        alert("Please enter valid numbers for all fields.");
        return;
    }

    const lengthCm = convertUnit(length, originalUnitType.value, 'cm');
    const widthCm = convertUnit(width, originalUnitType.value, 'cm');
    const heightCm = convertUnit(height, originalUnitType.value, 'cm');

    const volumetricWeight = ((lengthCm * widthCm * heightCm) / 27000) * cft;
    const chargeableWeight = Math.max(volumetricWeight, weight).toFixed(2);

    const lengthConverted = convertUnit(length, originalUnitType.value, convertUnitType.value).toFixed(2);
    const widthConverted = convertUnit(width, originalUnitType.value, convertUnitType.value).toFixed(2);
    const heightConverted = convertUnit(height, originalUnitType.value, convertUnitType.value).toFixed(2);

    const rowData = [
        `${length.toFixed(2)} ${originalUnitType.value}`,
        `${width.toFixed(2)} ${originalUnitType.value}`,
        `${height.toFixed(2)} ${originalUnitType.value}`,
        weight.toFixed(2),
        `${lengthConverted} ${convertUnitType.value}`,
        `${widthConverted} ${convertUnitType.value}`,
        `${heightConverted} ${convertUnitType.value}`,
        volumetricWeight.toFixed(2),
        chargeableWeight
    ];

    combinedData.push(rowData);
    addRowToTable(rowData);
}

function convertUnit(value, fromUnit, toUnit) {
    return value * conversions[fromUnit][toUnit];
}

function addRowToTable(rowData) {
    const newRow = combinedTableBody.insertRow();

    rowData.forEach(data => {
        const cell = newRow.insertCell();
        cell.textContent = data;
    });

    const deleteCell = newRow.insertCell();
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = () => deleteRow(newRow.rowIndex - 1);
    deleteCell.appendChild(deleteButton);
}

function deleteRow(rowIndex) {
    combinedTableBody.deleteRow(rowIndex);
    combinedData.splice(rowIndex, 1);
}

function resetData() {
    combinedData.length = 0;
    combinedTableBody.innerHTML = '';
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered: ', registration);

                // Check if there's a waiting service worker
                if (registration.waiting) {
                    console.log('Service Worker is waiting. Prompting for update...');
                    updateServiceWorker(registration);
                }

                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('New Service Worker found:', newWorker);

                    newWorker.addEventListener('statechange', () => {
                        console.log('Service Worker state changed:', newWorker.state);

                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New Service Worker installed. Prompting for update...');
                            updateServiceWorker(registration);
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('Service Worker registration failed: ', error);
            });
    });
}

// Function to prompt the user and update the Service Worker
function updateServiceWorker(registration) {
    if (confirm('A new version is available. Update now?')) {
        console.log('User confirmed update. Skipping waiting...');
        registration.waiting.postMessage({ action: 'skipWaiting' });

        // Force the new Service Worker to take control
        registration.waiting.addEventListener('statechange', (event) => {
            if (event.target.state === 'activated') {
                console.log('New Service Worker activated. Reloading page...');
                window.location.reload();
            }
        });
    }
}

// Fetch and display the CACHE_NAME from the Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
        registration.active.postMessage({ action: 'getCacheName' });
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.cacheName) {
            document.getElementById('version').textContent = `Version: ${event.data.cacheName}`;
        }
    });
}