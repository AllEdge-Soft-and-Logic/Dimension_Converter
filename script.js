// 🔹 Unit conversion map
const conversions = {
    cm: { cm: 1, mm: 10, m: 0.01, in: 0.393701, ft: 0.0328084 },
    mm: { cm: 0.1, mm: 1, m: 0.001, in: 0.0393701, ft: 0.00328084 },
    m: { cm: 100, mm: 1000, m: 1, in: 39.3701, ft: 3.28084 },
    in: { cm: 2.54, mm: 25.4, m: 0.0254, in: 1, ft: 0.0833333 },
    ft: { cm: 30.48, mm: 304.8, m: 0.3048, in: 12, ft: 1 }
};

// 🔹 Cached elements
const el = {
    length: document.getElementById('length'),
    width: document.getElementById('width'),
    height: document.getElementById('height'),
    weight: document.getElementById('weight'),
    noOfBox: document.getElementById('noOfBox'),
    cft: document.getElementById('cft'),
    origUnit: document.getElementById('originalUnitType'),
    convUnit: document.getElementById('convertUnitType'),
    tableBody: document.querySelector('#combinedTable tbody'),
    version: document.getElementById('version'),
    totalBoxes: document.getElementById('totalBoxes'),
    totalActual: document.getElementById('totalActualWeight'),
    totalVolumetric: document.getElementById('totalVolumetric'),
    totalChargeable: document.getElementById('totalChargeable')
};

const combinedData = [];

// 🔹 Helpers
const convertUnit = (val, from, to) => val * conversions[from][to];
const precise = (v) => Number(v).toFixed(2);

// 🔹 Add new row
function addData() {
    const vals = {
        length: parseFloat(el.length.value),
        width: parseFloat(el.width.value),
        height: parseFloat(el.height.value),
        noOfBox: parseFloat(el.noOfBox.value),
        weight: parseFloat(el.weight.value),
        cft: parseFloat(el.cft.value)
    };

    if (Object.values(vals).some(isNaN)) {
        return alert('Please enter valid numbers for all fields.');
    }

    const { length, width, height, noOfBox, weight, cft } = vals;

    // Convert to cm for volumetric calc
    const [lCm, wCm, hCm] = [length, width, height].map(v => convertUnit(v, el.origUnit.value, 'cm'));

    const actualWeight = noOfBox * weight;
    const volumetricWeight = (((lCm * wCm * hCm) / 27000) * cft) * noOfBox;
    const chargeableWeight = Math.max(volumetricWeight, actualWeight);

    const convertPrecise = (v) => precise(convertUnit(v, el.origUnit.value, el.convUnit.value));

    const rowData = [
        `${precise(length)} ${el.origUnit.value}`,
        `${precise(width)} ${el.origUnit.value}`,
        `${precise(height)} ${el.origUnit.value}`,
        precise(noOfBox),
        precise(actualWeight),
        `${convertPrecise(length)} ${el.convUnit.value}`,
        `${convertPrecise(width)} ${el.convUnit.value}`,
        `${convertPrecise(height)} ${el.convUnit.value}`,
        precise(volumetricWeight),
        precise(chargeableWeight)
    ];

    combinedData.push(rowData);
    addRowToTable(rowData);
    updateTotals();
}

// 🔹 Render row in table
function addRowToTable(rowData) {
    const newRow = el.tableBody.insertRow();
    rowData.forEach(text => newRow.insertCell().textContent = text);

    const deleteCell = newRow.insertCell();
    deleteCell.innerHTML = `<button class="btn btn-sm btn-danger">Delete</button>`;
    deleteCell.firstChild.onclick = () => {
        const idx = newRow.rowIndex - 1;
        combinedData.splice(idx, 1);
        newRow.remove();
        updateTotals();
    };
}

// 🔹 Reset form + table
function resetData() {
    combinedData.length = 0;
    el.tableBody.innerHTML = '';
    ['length', 'width', 'height', 'weight', 'noOfBox', 'cft'].forEach(id => el[id].value = '');
    el.origUnit.value = el.convUnit.value = 'cm';
    updateTotals();
}

// 🔹 Export data as CSV
function exportToExcel() {
    if (!combinedData.length) return alert('No data to export.');

    const headers = [
        'Original Length', 'Original Width', 'Original Height', 'No of Box',
        'Actual Weight', 'Converted Length', 'Converted Width', 'Converted Height',
        'Volumetric Weight', 'Chargeable Weight'
    ];

    const csvContent = [headers, ...combinedData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob),
        download: 'dimension_converter_data.csv'
    });
    link.click();
    URL.revokeObjectURL(link.href);
}

// 🔹 Update Totals Row
function updateTotals() {
    const totals = combinedData.reduce((acc, row) => {
        acc.boxes += parseFloat(row[3]) || 0;
        acc.actual += parseFloat(row[4]) || 0;
        acc.volumetric += parseFloat(row[8]) || 0;
        acc.chargeable += parseFloat(row[9]) || 0;
        return acc;
    }, { boxes: 0, actual: 0, volumetric: 0, chargeable: 0 });

    el.totalBoxes.textContent = precise(totals.boxes);
    el.totalActual.textContent = precise(totals.actual);
    el.totalVolumetric.textContent = precise(totals.volumetric);
    el.totalChargeable.textContent = precise(totals.chargeable);
}

// 🔹 Service Worker handler
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(reg => {
            if (reg.waiting) updateServiceWorker(reg);
            reg.addEventListener('updatefound', () => {
                reg.installing?.addEventListener('statechange', e => {
                    if (e.target.state === 'installed' && navigator.serviceWorker.controller) {
                        updateServiceWorker(reg);
                    }
                });
            });
        }).catch(console.error);
    });

    navigator.serviceWorker.ready.then(reg => reg.active?.postMessage({ action: 'getCacheName' }));

    navigator.serviceWorker.addEventListener('message', e => {
        if (e.data?.cacheName && el.version) el.version.textContent = `Version: ${e.data.cacheName}`;
    });
}

function updateServiceWorker(reg) {
    if (confirm('A new version is available. Update now?')) {
        reg.waiting.postMessage({ action: 'skipWaiting' });
        reg.waiting.addEventListener('statechange', e => {
            if (e.target.state === 'activated') location.reload();
        });
    }
}
