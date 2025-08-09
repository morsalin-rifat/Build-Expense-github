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
                setTimeout(() => element.classList.add('typing-done'), 50);
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
                promise.catch(error => console.info("Browser blocked audio autoplay."));
            }
        }
    }, 2000);
    
    setTimeout(() => splashScreen.classList.add('stage-5'), 4000);
    
    setTimeout(() => {
        splashScreen.classList.add('hidden');
        splashScreen.addEventListener('transitionend', () => {
            appContainer.style.display = 'grid';
        }, { once: true });
    }, 5000);
});

// ==================== মূল অ্যাপের কোড এখান থেকে শুরু ====================
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

// ... (আপনার অন্য সব DOM ভেরিয়েবল অপরিবর্তিত থাকবে) ...
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


// ==================== মডেল ও খরচ ফর্মের কার্যকারিতা ====================
// ... (অন্যান্য ফাংশন অপরিবর্তিত) ...
if (expenseForm) {
    let isSubmitting = false;
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault(); if (isSubmitting) return; isSubmitting = true;
        const selectedCategory = categorySelect.value;
        let expenseName = (selectedCategory === 'অন্যান্য') ? otherExpenseInput.value.trim() : selectedCategory;
        if (!expenseName) { 
            showToast('error', 'অনুগ্রহ করে খরচের খাত লিখুন');
            isSubmitting = false; return; 
        }
        const expenseData = { date: expenseDateInput.value, name: expenseName, quantity: parseFloat(qtyInput.value), rate: parseFloat(rateInput.value), total: parseFloat(totalAmountInput.value), createdAt: new Date() };
        try { 
            await addDoc(expensesCol, expenseData); 
            showToast('success', 'খরচ সফলভাবে যোগ হয়েছে'); // *** পরিবর্তন এখানে ***
        } catch (error) { 
            console.error("ডেটা যোগ করতে সমস্যা হয়েছে: ", error); 
            showToast('error', 'একটি সমস্যা হয়েছে'); // *** পরিবর্তন এখানে ***
        }
        expenseForm.reset(); otherExpenseInput.style.display = 'none'; expenseModal.classList.remove('show'); isSubmitting = false;
    });
}


// ==================== খরচ তালিকা এবং ডিলিট ====================
// ...
if (allExpensesTbody) {
    allExpensesTbody.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.action-btn.delete');
        if (deleteButton) {
            const expenseId = deleteButton.dataset.id;
            
            // *** নিশ্চিতকরণ বার্তা পরিবর্তন এখানে ***
            Swal.fire({
                title: 'আপনি কি নিশ্চিত?',
                text: "এই খরচটি মুছে ফেললে আর ফেরত আনা যাবে না!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
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
// ...
if (investorForm) investorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const investorData = { name: investorNameInput.value.trim(), yearlyAmount: parseFloat(yearlyAmountInput.value) || 0, monthlyAmount: parseFloat(monthlyAmountInput.value) || 0, remarks: investorRemarksInput.value.trim(), createdAt: new Date() };
    if (!investorData.name) { 
        showToast('error', 'অনুগ্রহ করে ইনভেস্টরের নাম দিন');
        return; 
    }
    try { 
        await addDoc(investorsCol, investorData); 
        showToast('success', 'ইনভেস্টর সফলভাবে যোগ হয়েছে'); // *** পরিবর্তন এখানে ***
        investorForm.reset(); 
    } catch (error) { 
        console.error("ইনভেস্টর যোগ করতে সমস্যা: ", error); 
        showToast('error', 'একটি সমস্যা হয়েছে'); // *** পরিবর্তন এখানে ***
    }
});

// ...
if (investorsListTbody) investorsListTbody.addEventListener('click', async (e) => {
    const target = e.target.closest('.delete-investor'); 
    if (!target) return;
    const investorId = target.dataset.id;
    
    // *** নিশ্চিতকরণ বার্তা পরিবর্তন এখানে ***
    Swal.fire({
        title: 'আপনি কি নিশ্চিত?',
        text: "এই ইনভেস্টরকে মুছে ফেললে তার সব তথ্য হারিয়ে যাবে!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
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
// ...
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
        showToast('success', 'পেমেন্ট সফলভাবে সেভ হয়েছে'); // *** পরিবর্তন এখানে ***
        paymentForm.reset(); 
        paymentMonthlyAmountInput.value = ''; 
    } catch (error) { 
        console.error("পেমেন্ট সেভ করতে সমস্যা: ", error); 
        showToast('error', 'একটি সমস্যা হয়েছে'); // *** পরিবর্তন এখানে ***
    }
});

// ===== বাকি সব কোড অপরিবর্তিত থাকবে =====
// (এখানে আমি বাকি কোডগুলো আর পেস্ট করছি না, কারণ সেগুলোতে কোনো পরিবর্তন নেই)
// যেমন: অ্যানালাইসিস পেজের চার্ট, পেজ নেভিগেশন, ড্যাশবোর্ড ডেটা ম্যানেজমেন্ট, রিপোর্ট জেনারেশন ইত্যাদি সব আগের মতোই থাকবে।