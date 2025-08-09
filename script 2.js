// ==================== স্ল্যাশ স্ক্রিন কার্যকারিতা ====================
window.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const appContainer = document.querySelector('.app-container');
    const dropSound = document.getElementById('drop-sound');
    const subtitleEl = document.querySelector('.subtitle');
    
    if (!splashScreen || !appContainer) return;
    
    function typeWriter(element, text, speed) {
        let i = 0;
        element.innerHTML = "";
        const interval = setInterval(() => {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    element.classList.add('typing-done');
                }, 50);
            }
        }, speed);
    }
    
    setTimeout(() => splashScreen.classList.add('stage-1'), 500);
    setTimeout(() => splashScreen.classList.add('stage-2'), 1000);
    setTimeout(() => splashScreen.classList.add('stage-3'), 1500);
    setTimeout(() => splashScreen.classList.add('stage-4'), 2500);
    
    setTimeout(() => {
        const textToType = "Fusion Automation Project's ";
        typeWriter(subtitleEl, textToType, 60);
        if (dropSound) {
            const promise = dropSound.play();
            if (promise !== undefined) {
                promise.catch(error => console.info("Browser blocked audio autoplay. This is normal."));
            }
        }
    }, 2000);
    
    setTimeout(() => {
        splashScreen.classList.add('stage-5');
    }, 4000);
    
    setTimeout(() => {
        splashScreen.classList.add('hidden');
        splashScreen.addEventListener('transitionend', () => {
            appContainer.style.display = 'grid';
        }, { once: true });
    }, 5000);
});

// ==================== মূল অ্যাপের কোড এখান থেকে শুরু ====================

// ==================== ফায়ারবেস সংযোগ ও সেটআপ ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, where, 
    getDocs, doc, deleteDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// *** সুন্দর টোস্ট নোটিফিকেশনের জন্য একটি ফাংশন তৈরি করা হলো ***
const showToast = (icon, title) => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
    Toast.fire({ icon, title });
};

const firebaseConfig = {
    apiKey: "AIzaSyCuawA1koYBq4XLOeAyM9GFP1mLpVhZUpE",
    authDomain: "constractionhisab.firebaseapp.com",
    projectId: "constractionhisab",
    storageBucket: "constractionhisab.firebasestorage.app",
    messagingSenderId: "787474529372",
    appId: "1:787474529372:web:58f31c347153ae5d583a99"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("Firebase সফলভাবে সংযুক্ত হয়েছে!");
const expensesCol = collection(db, 'expenses');
const investorsCol = collection(db, 'investors');
const depositsCol = collection(db, 'deposits');

// ==================== DOM এলিমেন্ট ও গ্লোবাল ভ্যারিয়েবল ====================
const sidebar = document.querySelector('.sidebar');
const menuBtn = document.querySelector('#menu-btn');
const closeBtn = document.querySelector('#close-btn');
const menuItems = document.querySelectorAll('.sidebar-menu a');
const pages = document.querySelectorAll('.page-content');
const backButtons = document.querySelectorAll('.back-btn');
const themeToggler = document.querySelector('.theme-toggler');
const balanceEl = document.getElementById('balance-el');
const totalDepositEl = document.getElementById('total-deposit-el');
const totalExpenseEl = document.getElementById('total-expense-el');
const recentActivitiesList = document.getElementById('recent-activities-list');
const expenseModal = document.querySelector('#expense-modal');
const newExpenseBtnDashboard = document.getElementById('add-expense-btn');
const sidebarAddExpenseBtn = document.getElementById('sidebar-add-expense');
const sidebarAddDepositBtn = document.getElementById('sidebar-add-deposit');
const closeModalBtn = document.querySelector('.modal-close-btn');
const expenseForm = document.getElementById('expense-form');
const expenseDateInput = document.getElementById('expense-date');
const qtyInput = document.getElementById('expense-qty');
const rateInput = document.getElementById('expense-rate');
const totalAmountInput = document.getElementById('total-amount');
const categorySelect = document.getElementById('expense-category');
const otherExpenseInput = document.getElementById('other-expense-name');
const allExpensesTbody = document.getElementById('all-expenses-tbody');
const generateReportBtn = document.getElementById('generate-report-btn');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const expenseReportArea = document.getElementById('expense-report-area');
const depositReportArea = document.getElementById('deposit-report-area');
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const expenseReportBtn = document.getElementById('expense-report-btn');
const depositReportBtn = document.getElementById('deposit-report-btn');
const pieChartCanvas = document.getElementById('expense-pie-chart');
const barChartCanvas = document.getElementById('top-expenses-bar-chart');
const investorForm = document.getElementById('investor-form');
const investorNameInput = document.getElementById('investor-name');
const yearlyAmountInput = document.getElementById('yearly-amount');
const monthlyAmountInput = document.getElementById('monthly-amount');
const investorRemarksInput = document.getElementById('investor-remarks');
const investorsListTbody = document.getElementById('investors-list-tbody');
const paymentForm = document.getElementById('payment-form');
const paymentInvestorSelect = document.getElementById('payment-investor');
const paymentMonthlyAmountInput = document.getElementById('payment-monthly-amount');
const paymentMonthInput = document.getElementById('payment-month');
const paidAmountInput = document.getElementById('paid-amount');
const paymentNoteInput = document.getElementById('payment-note');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
 
let expensePieChart, expenseBarChart;
let allExpensesData = [], allInvestors = [];

// ==================== অ্যানালাইসিস পেজের চার্ট ====================
function updateAnalysisCharts(expenses) {
    if (!pieChartCanvas || !barChartCanvas) return;
    const expensesByCategory = expenses.reduce((acc, expense) => {
        const category = expense.name; const total = expense.total;
        if (!acc[category]) { acc[category] = 0; }
        acc[category] += total;
        return acc;
    }, {});

    const pieChartLabels = Object.keys(expensesByCategory);
    const pieChartData = Object.values(expensesByCategory);
    const sortedExpenses = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a).slice(0, 5);
    const barChartLabels = sortedExpenses.map(item => item[0]);
    const barChartData = sortedExpenses.map(item => item[1]);
    const textColor = document.body.classList.contains('dark-theme') ? '#dce1eb' : '#333';
    const gridColor = document.body.classList.contains('dark-theme') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    if (expensePieChart) expensePieChart.destroy();
    expensePieChart = new Chart(pieChartCanvas, {
        type: 'doughnut', data: { labels: pieChartLabels, datasets: [{ data: pieChartData, backgroundColor: ['#7380ec','#ff7782','#41f1b6','#ffbb55','#e262f0','#7d8da1', '#a482d3'], borderColor: document.body.classList.contains('dark-theme') ? '#181a1e' : '#f0f2f5', borderWidth: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Noto Sans Bengali', size: 14 } } } } }
    });

    if (expenseBarChart) expenseBarChart.destroy();
    expenseBarChart = new Chart(barChartCanvas, {
        type: 'bar', data: { labels: barChartLabels, datasets: [{ label: 'মোট খরচ', data: barChartData, backgroundColor: document.body.classList.contains('dark-theme') ? '#41f1b6' : '#00c853', borderRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `৳ ${new Intl.NumberFormat('bn-BD').format(c.parsed.y)}` } } },
            scales: { 
                y: { ticks: { color: textColor, font: { size: 12 }, callback: (v) => (v/1000)+'k' }, grid: { color: gridColor } }, 
                x: { ticks: { color: textColor, font: { family: 'Noto Sans Bengali', size: 14 } }, grid: { display: false } } 
            }
        }
    });
}
function loadAnalysisData() { if (allExpensesData.length > 0) updateAnalysisCharts(allExpensesData); }

// ==================== পেজ নেভিগেশন ও সাধারণ ফাংশন ====================
function calculateTotal() { const quantity = parseFloat(qtyInput.value) || 0; const rate = parseFloat(rateInput.value) || 0; totalAmountInput.value = (quantity * rate).toFixed(2); }

menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        const isActionItem = item.id && (item.id.includes('sidebar-add'));
        if (isActionItem) {
            e.preventDefault(); 
            if (item.id === 'sidebar-add-expense') {
                openExpenseModal();
                return;
            }
        }
        
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const targetPageId = item.getAttribute('href')?.substring(1);
        if(targetPageId && targetPageId !== "#"){
            pages.forEach(page => { if(page) page.style.display = 'none' });
            const targetPage = document.getElementById(targetPageId);
            if (targetPage) {
                targetPage.style.display = 'block';
                if (targetPageId === 'report-page') {
                    const today = new Date();
                    const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                    const endDate = today.toISOString().split('T')[0];
                    if (startDateInput) startDateInput.value = startDate;
                    if (endDateInput) endDateInput.value = endDate;
                    generateExpenseReport(startDate, endDate);
                }
                if (targetPageId === 'analysis-page') loadAnalysisData();
            }
        }
        if (window.innerWidth < 768) sidebar.classList.remove('show');
    });
});

if (menuBtn) menuBtn.addEventListener('click', () => sidebar.classList.add('show'));
if (closeBtn) closeBtn.addEventListener('click', () => sidebar.classList.remove('show'));

backButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const dashboardPage = document.getElementById('dashboard-page');
        const dashboardMenuItem = document.querySelector('a[href="#dashboard-page"]');
        pages.forEach(page => page.style.display = 'none');
        if(dashboardPage) dashboardPage.style.display = 'block';
        menuItems.forEach(i => i.classList.remove('active'));
        if(dashboardMenuItem) dashboardMenuItem.classList.add('active');
    });
});

// ==================== মডেল ও খরচ ফর্মের কার্যকারিতা ====================
function openExpenseModal() {
    expenseForm.reset(); 
    otherExpenseInput.style.display = 'none';
    const today = new Date();
    expenseDateInput.value = today.toISOString().split('T')[0];
    expenseModal.classList.add('show');
}

if (newExpenseBtnDashboard) newExpenseBtnDashboard.addEventListener('click', openExpenseModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', () => expenseModal.classList.remove('show'));
window.addEventListener('click', (e) => { if (e.target === expenseModal) { expenseModal.classList.remove('show'); } });
if (categorySelect) categorySelect.addEventListener('change', () => { if (categorySelect.value === 'অন্যান্য') { otherExpenseInput.style.display = 'block'; otherExpenseInput.required = true; } else { otherExpenseInput.style.display = 'none'; otherExpenseInput.required = false; otherExpenseInput.value = ''; } });
if (qtyInput) qtyInput.addEventListener('input', calculateTotal);
if (rateInput) rateInput.addEventListener('input', calculateTotal);

if (expenseForm) {
    let isSubmitting = false;
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault(); if (isSubmitting) return; isSubmitting = true;
        const selectedCategory = categorySelect.value;
        let expenseName = (selectedCategory === 'অন্যান্য') ? otherExpenseInput.value.trim() : selectedCategory;
        if (!expenseName) { 
            showToast('error', 'অনুগ্রহ করে খরচের খাত লিখুন');
            isSubmitting = false; 
            return; 
        }
        const expenseData = { date: expenseDateInput.value, name: expenseName, quantity: parseFloat(qtyInput.value), rate: parseFloat(rateInput.value), total: parseFloat(totalAmountInput.value), createdAt: new Date() };
        try { 
            await addDoc(expensesCol, expenseData); 
            showToast('success', 'খরচ সফলভাবে যোগ হয়েছে');
        } catch (error) { 
            console.error("ডেটা যোগ করতে সমস্যা হয়েছে: ", error); 
            showToast('error', 'একটি সমস্যা হয়েছে');
        }
        expenseForm.reset(); otherExpenseInput.style.display = 'none'; expenseModal.classList.remove('show'); isSubmitting = false;
    });
}

// ==================== ড্যাশবোর্ড ডেটা ম্যানেজমেন্ট ====================
onSnapshot(expensesCol, (expenseSnapshot) => {
    allExpensesData = expenseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    let totalExpense = allExpensesData.reduce((sum, expense) => sum + expense.total, 0);

    onSnapshot(depositsCol, (depositSnapshot) => {
        let totalDeposit = 0;
        depositSnapshot.forEach(doc => { totalDeposit += doc.data().amountPaid; });
        const balance = totalDeposit - totalExpense;
        if (balanceEl) balanceEl.textContent = `৳ ${balance.toLocaleString('bn-BD')}`;
        if (totalDepositEl) totalDepositEl.textContent = `৳ ${totalDeposit.toLocaleString('bn-BD')}`;
        if (totalExpenseEl) totalExpenseEl.textContent = `৳ ${totalExpense.toLocaleString('bn-BD')}`;
    });
    if (document.getElementById('analysis-page')?.style.display === 'block') updateAnalysisCharts(allExpensesData);
});
onSnapshot(query(expensesCol, orderBy("createdAt", "desc"), limit(5)), (snapshot) => { 
    if (recentActivitiesList) { 
        recentActivitiesList.innerHTML = ''; 
        if (snapshot.empty) { 
            recentActivitiesList.innerHTML = '<li>এখনো কোনো খরচ যোগ করা হয়নি।</li>'; return; 
        } 
        snapshot.docs.forEach(doc => { 
            const expense = doc.data(); 
            const date = new Date((expense.createdAt?.seconds || Date.now() / 1000) * 1000); 
            const formattedDate = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }); 
            const listItem = document.createElement('li'); 
            listItem.innerHTML = `<strong>${expense.name}</strong> (৳ ${expense.total.toLocaleString('bn-BD')}) যোগ করা হয়েছে। <small style="color: var(--color-info-dark); display: block; margin-top: 4px;">${formattedDate}</small>`; 
            recentActivitiesList.appendChild(listItem); 
        }); 
    } 
});

// ==================== খরচ তালিকা এবং ডিলিট ====================
onSnapshot(query(expensesCol, orderBy("date", "desc")), (snapshot) => {
    if (!allExpensesTbody) return;
    allExpensesTbody.innerHTML = '';
    if (snapshot.empty) { allExpensesTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">এখনো কোনো খরচ যোগ করা হয়নি।</td></tr>'; return; }
    snapshot.forEach(docSnapshot => {
        const expense = docSnapshot.data(); const expenseId = docSnapshot.id;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${new Date(expense.date).toLocaleDateString('bn-BD', { timeZone: 'UTC' })}</td><td>${expense.name}</td><td>৳ ${expense.total.toLocaleString('bn-BD')}</td><td class="action-buttons"><button class="action-btn delete" data-id="${expenseId}"><span class="material-icons-sharp">delete</span></button></td>`;
        allExpensesTbody.appendChild(tr);
    });
});
if (allExpensesTbody) {
    allExpensesTbody.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.action-btn.delete');
        if (deleteButton) {
            const expenseId = deleteButton.dataset.id;
            Swal.fire({
                title: 'আপনি কি নিশ্চিত?',
                text: "এই খরচটি মুছে ফেললে আর ফেরত আনা যাবে না!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'হ্যাঁ, মুছে ফেলুন!',
                cancelButtonText: 'না, বাতিল করুন'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try { 
                        await deleteDoc(doc(db, 'expenses', expenseId)); 
                        showToast('success', 'খরচ সফলভাবে মুছে ফেলা হয়েছে');
                    } catch (error) { 
                        console.error("মুছে ফেলার সময় সমস্যা: ", error); 
                        showToast('error', 'একটি সমস্যা হয়েছে');
                    }
                }
            });
        }
    });
}

// ==================== ইনভেস্টর ম্যানেজমেন্ট ====================
if (yearlyAmountInput) yearlyAmountInput.addEventListener('input', () => { const yearlyAmount = parseFloat(yearlyAmountInput.value) || 0; if (monthlyAmountInput) monthlyAmountInput.value = (yearlyAmount / 12).toFixed(2); });
if (investorForm) investorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const investorData = { name: investorNameInput.value.trim(), yearlyAmount: parseFloat(yearlyAmountInput.value) || 0, monthlyAmount: parseFloat(monthlyAmountInput.value) || 0, remarks: investorRemarksInput.value.trim(), createdAt: new Date() };
    if (!investorData.name) { 
        showToast('error', 'অনুগ্রহ করে ইনভেস্টরের নাম দিন');
        return; 
    }
    try { 
        await addDoc(investorsCol, investorData); 
        showToast('success', 'ইনভেস্টর সফলভাবে যোগ হয়েছে');
        investorForm.reset(); 
    } catch (error) { 
        console.error("ইনভেস্টর যোগ করতে সমস্যা: ", error); 
        showToast('error', 'একটি সমস্যা হয়েছে');
    }
});

onSnapshot(query(investorsCol, orderBy("createdAt", "desc")), (snapshot) => {
    allInvestors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (investorsListTbody) {
        investorsListTbody.innerHTML = '';
        if (snapshot.empty) { investorsListTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">কোনো ইনভেস্টর পাওয়া যায়নি।</td></tr>'; return; }
        snapshot.forEach(docSnapshot => {
            const investor = docSnapshot.data(); const investorId = docSnapshot.id;
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${investor.name}</td><td>৳ ${investor.monthlyAmount.toLocaleString('bn-BD')}</td><td>${investor.remarks || '-'}</td><td class="action-buttons"><button class="delete-investor" data-id="${investorId}"><span class="material-icons-sharp">delete</span></button></td>`;
            investorsListTbody.appendChild(tr);
        });
    }
    if (paymentInvestorSelect) {
        const selectedValue = paymentInvestorSelect.value;
        paymentInvestorSelect.innerHTML = '<option value="" disabled selected>ইনভেস্টর সিলেক্ট করুন</option>';
        allInvestors.forEach(investor => { const option = document.createElement('option'); option.value = investor.id; option.textContent = investor.name; paymentInvestorSelect.appendChild(option); });
        paymentInvestorSelect.value = selectedValue;
        if (selectedValue) paymentInvestorSelect.dispatchEvent(new Event('change'));
    }
});

if (investorsListTbody) investorsListTbody.addEventListener('click', async (e) => {
    const target = e.target.closest('.delete-investor'); 
    if (!target) return;
    const investorId = target.dataset.id;
    Swal.fire({
        title: 'আপনি কি নিশ্চিত?',
        text: "এই ইনভেস্টরকে মুছে ফেললে তার সব তথ্য হারিয়ে যাবে!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'হ্যাঁ, মুছে ফেলুন!',
        cancelButtonText: 'না, বাতিল করুন'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try { 
                await deleteDoc(doc(db, 'investors', investorId)); 
                showToast('success', 'ইনভেস্টর সফলভাবে মুছে ফেলা হয়েছে');
            } catch (error) { 
                console.error("ইনভেস্টর মুছে ফেলার সময় সমস্যা: ", error); 
                showToast('error', 'একটি সমস্যা হয়েছে');
            }
        }
    });
});

// ==================== পেমেন্ট এন্ট্রি ====================
if (paymentInvestorSelect) paymentInvestorSelect.addEventListener('change', () => {
    const selectedInvestor = allInvestors.find(inv => inv.id === paymentInvestorSelect.value);
    if (selectedInvestor) { 
        paymentMonthlyAmountInput.value = `৳ ${selectedInvestor.monthlyAmount.toLocaleString('bn-BD')}`; 
        paidAmountInput.value = selectedInvestor.monthlyAmount; 
    } else { 
        paymentMonthlyAmountInput.value = ''; 
        paidAmountInput.value = ''; 
    }
});
if (paymentForm) paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const depositData = { 
        investorId: paymentInvestorSelect.value, 
        investorName: paymentInvestorSelect.options[paymentInvestorSelect.selectedIndex].text, 
        paymentMonth: paymentMonthInput.value, 
        amountPaid: parseFloat(paidAmountInput.value) || 0, 
        note: paymentNoteInput.value.trim(), 
        paymentDate: new Date() 
    };
    if (!depositData.investorId || !depositData.paymentMonth || depositData.amountPaid < 0) { 
        showToast('error', 'অনুগ্রহ করে সমস্ত ঘর সঠিকভাবে পূরণ করুন');
        return; 
    }
    try { 
        await addDoc(depositsCol, depositData); 
        showToast('success', 'পেমেন্ট সফলভাবে সেভ হয়েছে');
        paymentForm.reset(); 
        paymentMonthlyAmountInput.value = ''; 
    } catch (error) { 
        console.error("পেমেন্ট সেভ করতে সমস্যা: ", error); 
        showToast('error', 'একটি সমস্যা হয়েছে');
    }
});

// ==================== রিপোর্ট ডেটা ম্যানেজমেন্ট ====================
async function generateExpenseReport(startDate, endDate) {
    if (!startDate || !endDate) return;
    if (expenseReportArea) expenseReportArea.innerHTML = '<p class="initial-message">রিপোর্ট তৈরি হচ্ছে...</p>';
    try {
        const reportQuery = query(expensesCol, where("date", ">=", startDate), where("date", "<=", endDate), orderBy("date", "asc"));
        const querySnapshot = await getDocs(reportQuery);
        if (querySnapshot.empty) {
            expenseReportArea.innerHTML = '<p class="initial-message">এই সময়সীমার মধ্যে কোনো খরচ পাওয়া যায়নি।</p>';
            downloadPdfBtn.style.display = 'none';
            return;
        }
        let grandTotal = 0;
        let tableHTML = `<div class="table-view-container"><table class="report-table"><thead><tr><th>তারিখ</th><th>বিবরণ</th><th>পরিমাণ</th><th>দর</th><th>মোট</th></tr></thead><tbody>`;
        querySnapshot.forEach(doc => { const e = doc.data(); grandTotal += e.total; tableHTML += `<tr><td>${new Date(e.date).toLocaleDateString('bn-BD', { timeZone: 'UTC' })}</td><td>${e.name}</td><td>${e.quantity}</td><td>৳ ${e.rate.toLocaleString('bn-BD')}</td><td>৳ ${e.total.toLocaleString('bn-BD')}</td></tr>`; });
        
        tableHTML += `</tbody></table></div>`;
        tableHTML += `<div class="grand-total-display">সর্বমোট খরচ: <span>৳ ${grandTotal.toLocaleString('bn-BD')}</span></div>`;
        
        expenseReportArea.innerHTML = tableHTML;
        downloadPdfBtn.style.display = 'inline-block';
    } catch (error) { console.error("খরচ রিপোর্ট তৈরিতে সমস্যা: ", error); expenseReportArea.innerHTML = '<p class="initial-message">একটি সমস্যা হয়েছে।</p>'; }
}

async function generateDepositReport(startDateStr, endDateStr) {
    if (!depositReportArea) return;
    depositReportArea.innerHTML = '<p class="initial-message">জমা রিপোর্ট তৈরি হচ্ছে...</p>';
    try {
        const startMonth = startDateStr.substring(0, 7);
        const endMonth = endDateStr.substring(0, 7);
        
        const monthQuery = query(depositsCol, where("paymentMonth", ">=", startMonth), where("paymentMonth", "<=", endMonth));
        const depositSnapshot = await getDocs(monthQuery);
        
        const paymentMap = depositSnapshot.docs.reduce((map, doc) => {
            const data = doc.data();
            map[`${data.investorId}-${data.paymentMonth}`] = data;
            return map;
        }, {});

        let grandTotalPaid = 0;
        depositSnapshot.forEach(doc => {
            grandTotalPaid += doc.data().amountPaid;
        });

        const start = new Date(startDateStr); const end = new Date(endDateStr); let monthsToDisplay = [];
        for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
            monthsToDisplay.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
        }
        if (allInvestors.length === 0) { depositReportArea.innerHTML = '<p class="initial-message">রিপোর্ট তৈরি করার জন্য কোনো ইনভেস্টর পাওয়া যায়নি।</p>'; return; }
        
        let reportHTML = `<div class="table-view-container"><table class="report-table"><thead><tr><th>ক্রমিক</th><th>মাস</th><th>নাম</th><th>মান্থলি অ্যামাউন্ট</th><th>স্ট্যাটাস</th><th>জমা</th><th>পেমেন্টের তারিখ</th><th>নোট</th></tr></thead><tbody>`;
        let serial = 1;

        monthsToDisplay.forEach(month => {
            allInvestors.forEach(investor => {
                const payment = paymentMap[`${investor.id}-${month}`];
                const amountPaid = payment ? payment.amountPaid : 0;
                const paymentDate = payment ? new Date(payment.paymentDate.seconds * 1000).toLocaleDateString('bn-BD') : '-';
                const note = payment ? payment.note : investor.remarks;
                let status = (amountPaid >= investor.monthlyAmount) ? '<span style="color: var(--color-success);">Paid</span>' : '<span style="color: var(--color-danger);">Due</span>';
                if(investor.monthlyAmount === 0 && amountPaid === 0) status = '<span style="color: var(--color-info-light);">N/A</span>';
                
                reportHTML += `<tr><td>${serial++}</td><td>${new Date(month + "-02").toLocaleDateString('bn-BD', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</td><td>${investor.name}</td><td>৳ ${investor.monthlyAmount.toLocaleString('bn-BD')}</td><td>${status}</td><td>৳ ${amountPaid.toLocaleString('bn-BD')}</td><td>${paymentDate}</td><td>${note || '-'}</td></tr>`;
            });
            if (monthsToDisplay.length > 1) reportHTML += `<tr><td colspan="8" style="background: var(--color-primary); height: 2px; padding: 0; border:0;"></td></tr>`;
        });
        
        reportHTML += `</tbody></table></div>`;
        reportHTML += `<div class="grand-total-display">সর্বমোট জমা: <span>৳ ${grandTotalPaid.toLocaleString('bn-BD')}</span></div>`;
        
        depositReportArea.innerHTML = reportHTML;
        downloadPdfBtn.style.display = 'inline-block';
    } catch (error) { console.error("জমা রিপোর্ট তৈরিতে সমস্যা: ", error); depositReportArea.innerHTML = '<p class="initial-message">একটি সমস্যা হয়েছে।</p>'; }
}


if (generateReportBtn) generateReportBtn.addEventListener('click', () => { const startDate = startDateInput.value; const endDate = endDateInput.value; if (expenseReportBtn.classList.contains('active')) { generateExpenseReport(startDate, endDate); } else if (depositReportBtn.classList.contains('active')) { generateDepositReport(startDate, endDate); } });

if (expenseReportBtn) expenseReportBtn.addEventListener('click', () => { 
    expenseReportBtn.classList.add('active'); 
    depositReportBtn.classList.remove('active'); 
    expenseReportArea.style.display = 'block'; 
    depositReportArea.style.display = 'none'; 
    downloadPdfBtn.style.display = 'none';
    generateExpenseReport(startDateInput.value, endDateInput.value);
});

if (depositReportBtn) depositReportBtn.addEventListener('click', () => { 
    depositReportBtn.classList.add('active'); 
    expenseReportBtn.classList.remove('active'); 
    depositReportArea.style.display = 'block'; 
    expenseReportArea.style.display = 'none'; 
    downloadPdfBtn.style.display = 'none'; 
    generateDepositReport(startDateInput.value, endDateInput.value); 
});

if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', () => {
        const elementToPrint = document.getElementById(expenseReportBtn.classList.contains('active') ? 'expense-report-area' : 'deposit-report-area');
        const fileName = `Report_${startDateInput.value}_to_${endDateInput.value}.pdf`;
        const opt = {
            margin: [1.2, 0.5, 0.5, 0.5],
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        const worker = html2pdf().from(elementToPrint).set(opt);
        worker.toPdf().get('pdf').then(function (pdf) {
            const totalPages = pdf.internal.getNumberOfPages();
            const pageWidth = pdf.internal.pageSize.getWidth();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(20);
                pdf.setTextColor(40, 40, 40);
                pdf.text('Construction Management Report', pageWidth / 2, 0.6, { align: 'center' });
                
                pdf.setFontSize(12);
                pdf.setTextColor(100, 100, 100);
                const dateRangeText = `Date Range: ${new Date(startDateInput.value).toLocaleDateString('en-GB')} to ${new Date(endDateInput.value).toLocaleDateString('en-GB')}`;
                pdf.text(dateRangeText, pageWidth / 2, 0.85, { align: 'center' });
                
                pdf.setLineWidth(0.01);
                pdf.line(0.5, 1, pageWidth - 0.5, 1);
            }
        }).save();
    });
}

// ==================== লাইট/ডার্ক থিম টগলার ====================
if (themeToggler) {
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggler.querySelector('span:nth-child(1)').classList.remove('active');
            themeToggler.querySelector('span:nth-child(2)').classList.add('active');
        } else {
            document.body.classList.remove('dark-theme');
            themeToggler.querySelector('span:nth-child(1)').classList.add('active');
            themeToggler.querySelector('span:nth-child(2)').classList.remove('active');
        }
        if (document.getElementById('analysis-page')?.style.display === 'block') {
            loadAnalysisData();
        }
    };
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    themeToggler.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
}

// ==================== জমা পাতার ট্যাব পরিবর্তনের কার্যকারিতা ====================
if (tabButtons.length > 0) tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tabContents.forEach(content => { content.classList.remove('active'); content.style.display = 'none'; });
        const targetContent = document.getElementById(btn.dataset.tab);
        if (targetContent) {
            targetContent.classList.add('active');
            targetContent.style.display = 'block';
        }
    });
});
