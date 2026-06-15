const rates = { USD: 1.0, INR: 83.5, EUR: 0.92, GBP: 0.79 };
const symbols = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };
const chartColors = {
    light: { green: '#15803d', red: '#b91c1c', text: '#14532d' },
    dark:  { green: '#4ade80', red: '#f87171', text: '#f0fdf4' }
};
const state = { salary: 0, expenses: [], currency: 'INR' };
let chart = null;

function $(id) { return document.getElementById(id); }

const themeToggle      = $('theme-toggle');
const sunIcon          = $('sun-icon');
const moonIcon         = $('moon-icon');
const currencySelector = $('currency-selector');
const alertBanner      = $('alert-banner');
const salaryForm       = $('salary-form');
const salaryInput      = $('salary-input');
const salaryError      = $('salary-error');
const salarySymbol     = $('salary-symbol');
const expenseForm      = $('expense-form');
const expenseName      = $('expense-name-input');
const expenseAmount    = $('expense-amount-input');
const expenseNameErr   = $('expense-name-error');
const expenseAmountErr = $('expense-amount-error');
const expenseSymbol    = $('expense-symbol');
const valIncome        = $('val-income');
const valExpenses      = $('val-expenses');
const valBalance       = $('val-balance');
const expenseList      = $('expense-list');
const noExpenses       = $('no-expenses');
const downloadReport   = $('download-report');
const clearSalary      = $('clear-salary-btn');
const clearExpenses    = $('clear-expenses-btn');

function initTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        document.body.classList.remove('dark');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    }
}

themeToggle.addEventListener('click', function() {
    const isDark = document.body.classList.contains('dark');
    if (isDark) {
        document.body.classList.remove('dark');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    } else {
        document.body.classList.add('dark');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
    if (chart) {
        const theme = !isDark ? 'dark' : 'light';
        chart.data.datasets[0].backgroundColor = [chartColors[theme].green, chartColors[theme].red];
        chart.options.plugins.legend.labels.color = chartColors[theme].text;
        chart.update();
    }
});

function loadState() {
    state.salary   = parseFloat(localStorage.getItem('salary')) || 0;
    state.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    state.currency = localStorage.getItem('currency') || 'INR';
    salaryInput.value = state.salary || '';
    currencySelector.value = state.currency;
    salarySymbol.textContent = expenseSymbol.textContent = symbols[state.currency];
}

function saveState() {
    localStorage.setItem('salary', state.salary);
    localStorage.setItem('expenses', JSON.stringify(state.expenses));
    localStorage.setItem('currency', state.currency);
}

function format(num) {
    return symbols[state.currency] + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateUI() {
    let total = 0;
    for (let i = 0; i < state.expenses.length; i++) {
        total += state.expenses[i].amount;
    }
    const bal  = state.salary - total;
    const warn = state.salary > 0 && bal < (state.salary * 0.1);

    valIncome.textContent   = format(state.salary);
    valExpenses.textContent = format(total);
    valBalance.textContent  = format(bal);
    valBalance.className    = warn ? 'stat-value text-red' : 'stat-value text-green';
    alertBanner.style.display = warn ? 'flex' : 'none';

    expenseList.innerHTML = '';
    noExpenses.style.display = state.expenses.length > 0 ? 'none' : 'block';

    for (let i = 0; i < state.expenses.length; i++) {
        const item = state.expenses[i];
        const li   = document.createElement('li');
        li.className = 'expense-item';
        li.innerHTML = `<div class="expense-info"><span class="expense-name">${item.name}</span><span class="expense-time">${item.time}</span></div><div class="expense-right"><span class="expense-value text-red">-${format(item.amount)}</span><button class="trash-btn" onclick="deleteExpense('${item.id}')"><i class="fa-solid fa-trash"></i></button></div>`;
        expenseList.appendChild(li);
    }

    if (chart) {
        chart.data.datasets[0].data = [bal > 0 ? bal : 0, total];
        chart.update();
    }
}

window.deleteExpense = function(id) {
    const newExpenses = [];
    for (let i = 0; i < state.expenses.length; i++) {
        if (state.expenses[i].id !== id) newExpenses.push(state.expenses[i]);
    }
    state.expenses = newExpenses;
    saveState();
    updateUI();
};

salaryForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const val = parseFloat(salaryInput.value);
    if (isNaN(val) || val < 0) {
        salaryError.textContent = 'Enter a valid positive salary.';
        return;
    }
    salaryError.textContent = '';
    state.salary = val;
    saveState();
    updateUI();
});

salaryInput.addEventListener('input',   function() { salaryError.textContent = ''; });
expenseName.addEventListener('input',   function() { expenseNameErr.textContent = ''; });
expenseAmount.addEventListener('input', function() { expenseAmountErr.textContent = ''; });

expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = expenseName.value.trim();
    const amt  = parseFloat(expenseAmount.value);
    let err = false;

    if (name === '') { expenseNameErr.textContent = 'Name is required.'; err = true; }
    else { expenseNameErr.textContent = ''; }

    if (isNaN(amt) || amt <= 0) { expenseAmountErr.textContent = 'Amount must be positive.'; err = true; }
    else { expenseAmountErr.textContent = ''; }

    if (err) return;

    const newExpenses = [{ id: Math.random().toString(36).substring(2, 9), name: name, amount: amt, time: new Date().toLocaleString() }];
    for (let i = 0; i < state.expenses.length; i++) {
        newExpenses.push(state.expenses[i]);
    }
    state.expenses = newExpenses;
    saveState();
    updateUI();
    expenseName.value  = '';
    expenseAmount.value = '';
});

currencySelector.addEventListener('change', function(e) {
    const ratio = rates[e.target.value] / rates[state.currency];
    state.salary *= ratio;
    const newExpenses = [];
    for (let i = 0; i < state.expenses.length; i++) {
        newExpenses.push({
            id:     state.expenses[i].id,
            name:   state.expenses[i].name,
            amount: state.expenses[i].amount * ratio,
            time:   state.expenses[i].time
        });
    }
    state.expenses = newExpenses;
    state.currency = e.target.value;
    salaryInput.value = state.salary > 0 ? state.salary.toFixed(2) : '';
    salarySymbol.textContent = expenseSymbol.textContent = symbols[state.currency];
    saveState();
    updateUI();
});

clearSalary.addEventListener('click', function() {
    state.salary = 0;
    salaryInput.value = '';
    salaryError.textContent = '';
    saveState();
    updateUI();
});

clearExpenses.addEventListener('click', function() {
    state.expenses = [];
    saveState();
    updateUI();
});

downloadReport.addEventListener('click', function() {
    const doc = new window.jspdf.jsPDF();
    let total = 0;
    let y = 90;
    for (let i = 0; i < state.expenses.length; i++) {
        total += state.expenses[i].amount;
    }

    function pdfFmt(val) {
        return val.toLocaleString(undefined, { minimumFractionDigits: 2 }) + ' ' + state.currency;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('CASH-FLOW REPORT', 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated: ' + new Date().toLocaleString(), 20, 27);
    doc.line(20, 32, 190, 32);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 20, 42);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Income: '      + pdfFmt(state.salary), 20, 50);
    doc.text('Total Expenses: '    + pdfFmt(total), 20, 57);
    doc.text('Remaining Balance: ' + pdfFmt(state.salary - total), 20, 64);
    doc.line(20, 70, 190, 70);
    doc.setFont('helvetica', 'bold');
    doc.text('Logged Expenses', 20, 80);
    doc.setFont('helvetica', 'normal');

    if (state.expenses.length === 0) {
        doc.text('No expenses logged.', 20, y);
    } else {
        for (let i = 0; i < state.expenses.length; i++) {
            const item = state.expenses[i];
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFont('helvetica', 'bold');
            doc.text(item.name, 20, y);
            doc.setFont('helvetica', 'normal');
            doc.text('-' + pdfFmt(item.amount), 130, y);
            doc.setFontSize(8);
            doc.text(item.time, 20, y + 5);
            doc.setFontSize(11);
            y += 15;
        }
    }
    doc.save('cashflow-report.pdf');
});

window.addEventListener('DOMContentLoaded', function() {
    initTheme();
    loadState();
    const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    chart = new Chart($('balance-chart').getContext('2d'), {
        type: 'pie',
        data: {
            labels: ['Remaining Balance', 'Total Expenses'],
            datasets: [{
                data: [0, 0],
                backgroundColor: [chartColors[theme].green, chartColors[theme].red],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { bottom: 15 } },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        color: chartColors[theme].text,
                        font: { family: 'Outfit', size: 13, weight: '600' }
                    }
                }
            }
        }
    });
    updateUI();
});
