const form = document.getElementById('transaction-form');
const typeSelect = document.getElementById('type');
const incomeTypeSelect = document.getElementById('income-type');
const fixVarTypeSelect = document.getElementById('fix-var-type');
const recurringSelect = document.getElementById('recurring');
const recurringDayContainer = document.getElementById('recurring-day-container');
const transactionList = document.getElementById('transaction-list');

const totalSavingsEl = document.getElementById('total-savings');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const totalBalanceEl = document.getElementById('total-balance');
const balanceCard = document.getElementById('balance-card');
const warningMessage = document.getElementById('warning-message');

const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

let transactions = []; 
let editId = null; 
let duesChecked = false; 

function parseAmount(value) {
    if (!value) return 0;
    let str = String(value).trim().replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(str) || 0;
}

function formatTL(amount) {
    return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

typeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'gider') {
        incomeTypeSelect.classList.add('hidden');
    } else {
        incomeTypeSelect.classList.remove('hidden');
    }
});

recurringSelect.addEventListener('change', (e) => {
    if (e.target.value === 'duzenli') {
        recurringDayContainer.classList.remove('hidden');
        recurringDayContainer.classList.replace('hidden', 'flex');
    } else {
        recurringDayContainer.classList.replace('flex', 'hidden');
        document.getElementById('recurring-day').value = '';
    }
});

async function fetchTransactions() {
    try {
        const response = await fetch('/api/transactions');
        if (!response.ok) throw new Error("Sunucu hata döndürdü.");
        transactions = await response.json();
        warningMessage.classList.add('hidden'); 
        updateUI();
    } catch (error) {
        console.error("Veriler sunucudan alınamadı:", error);
        warningMessage.classList.remove('hidden');
        warningMessage.className = "mb-3 py-1.5 px-3 rounded text-xs font-bold text-center bg-red-600 text-white animate-pulse";
        warningMessage.innerText = "⚠️ BAĞLANTI HATASI: Sunucuya ulaşılamıyor! Lütfen terminalde sunucunun açık olduğunu doğrulayın.";
    }
}

form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const type = typeSelect.value;
    const incomeType = type === 'gelir' ? incomeTypeSelect.value : null;
    const fixVarType = fixVarTypeSelect.value; 
    const amount = parseAmount(document.getElementById('amount').value); 

    if (amount <= 0) {
        alert("Lütfen geçerli bir tutar giriniz.");
        return;
    }

    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value; 
    const isRecurring = recurringSelect.value === 'duzenli';
    
    let recurringDay = isRecurring ? document.getElementById('recurring-day').value : null;
    if (isRecurring && !recurringDay) {
        recurringDay = "-"; 
    }

    const transactionData = { type, incomeType, fixVarType, amount, category, description, isRecurring, recurringDay };

    if (editId) {
        try {
            await fetch(`/api/transactions/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });
            exitEditMode();
        } catch (error) {
            console.error("Güncelleme hatası:", error);
        }
    } else {
        try {
            transactionData.id = Date.now();
            await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });
        } catch (error) {
            console.error("Ekleme hatası:", error);
        }
    }

    form.reset();
    resetDynamicFields();
    await fetchTransactions(); 
});

function resetDynamicFields() {
    incomeTypeSelect.classList.remove('hidden');
    recurringDayContainer.classList.replace('flex', 'hidden');
    fixVarTypeSelect.value = 'sabit'; 
}

function editTransaction(id) {
    const t = transactions.find(item => item.id === id);
    if (!t) return;

    editId = id;
    typeSelect.value = t.type;
    typeSelect.dispatchEvent(new Event('change'));

    if(t.type === 'gelir') incomeTypeSelect.value = t.incomeType;
    
    fixVarTypeSelect.value = t.fixVarType || 'sabit'; 
    document.getElementById('amount').value = t.amount.toString().replace('.', ',');
    document.getElementById('category').value = t.category;
    document.getElementById('description').value = t.description || '';
    
    recurringSelect.value = t.isRecurring ? 'duzenli' : 'tek';
    recurringSelect.dispatchEvent(new Event('change'));

    if(t.isRecurring) document.getElementById('recurring-day').value = t.recurringDay === "-" ? "" : t.recurringDay;

    submitBtn.textContent = 'GÜNCELLE';
    submitBtn.classList.replace('bg-indigo-600', 'bg-green-600');
    submitBtn.classList.replace('hover:bg-indigo-700', 'hover:bg-green-700');
    cancelBtn.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Düzenleye basınca yukarı yumuşak kaydır
}

cancelBtn.addEventListener('click', () => {
    exitEditMode();
    form.reset();
    resetDynamicFields();
});

function exitEditMode() {
    editId = null;
    submitBtn.textContent = 'EKLE';
    submitBtn.classList.replace('bg-green-600', 'bg-indigo-600');
    submitBtn.classList.replace('hover:bg-green-700', 'hover:bg-indigo-700');
    cancelBtn.classList.add('hidden');
}

async function deleteTransaction(id) {
    if (editId === id) exitEditMode();
    try {
        await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        await fetchTransactions();
    } catch (error) {
        console.error("Silme hatası:", error);
    }
}

function updateUI() {
    transactionList.innerHTML = '';
    
    let savings = 0;
    let monthlyIncome = 0;
    let expense = 0;

    if (transactions.length === 0) {
        transactionList.innerHTML = `<tr class="block md:table-row"><td colspan="6" class="block md:table-cell py-8 text-center text-gray-400 font-medium bg-gray-50 md:bg-transparent rounded-lg border md:border-none">Henüz hiçbir gelir veya gider kaydı bulunmuyor.</td></tr>`;
    } else {
        transactions.sort((a, b) => {
            const getTypeWeight = (t) => {
                if (t.type === 'gelir' && t.incomeType === 'birikim') return 1;
                if (t.type === 'gelir' && t.incomeType === 'aylik') return 2;
                return 3;
            };

            const getTimeWeight = (t) => {
                if (!t.isRecurring) return 0;
                let day = parseInt(t.recurringDay);
                return isNaN(day) ? 32 : day; 
            };

            let weightA_Type = getTypeWeight(a);
            let weightB_Type = getTypeWeight(b);

            if (weightA_Type !== weightB_Type) return weightA_Type - weightB_Type;
            else return getTimeWeight(a) - getTimeWeight(b);
        });

        transactions.forEach(t => {
            if (t.type === 'gelir' && t.incomeType === 'birikim') savings += t.amount;
            else if (t.type === 'gelir' && t.incomeType === 'aylik') monthlyIncome += t.amount;
            else if (t.type === 'gider') expense += t.amount;

            const tr = document.createElement('tr');
            // 📱 MOBİLDE KART (BLOCK DÜZENİ), PC'DE KILASİK SATIR (TABLE-ROW)
            tr.className = "border md:border-b border-gray-200 md:border-gray-100 hover:bg-gray-50 transition-colors block md:table-row p-3 mb-3 md:mb-0 rounded-lg bg-gray-50 md:bg-transparent shadow-sm md:shadow-none";
            
            let zamanlamaMetni = t.isRecurring ? `Her Ayın ${t.recurringDay}. Günü` : 'Tek Seferlik';
            let turMetni = t.type === 'gelir' ? (t.incomeType === 'birikim' ? 'BİRİKİM' : 'GELİR') : 'GİDER';
            let turRengi = t.type === 'gider' ? 'bg-red-500' : (t.incomeType === 'birikim' ? 'bg-blue-500' : 'bg-green-500');
            let tutarRengi = t.type === 'gider' ? 'text-red-600' : 'text-green-600';
            let aciklamaMetni = t.description ? t.description : '<span class="text-gray-300">-</span>';
            
            let nitelik = t.fixVarType === 'degisken' ? 'DEĞİŞKEN' : 'SABİT';
            let nitelikRengi = t.fixVarType === 'degisken' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-600 border-gray-200';

            tr.innerHTML = `
                <td class="block md:table-cell py-1 md:py-1.5 px-0 md:px-2 text-gray-500 whitespace-nowrap">
                    <div class="flex items-center justify-between md:block">
                        <span class="md:hidden font-bold text-gray-400 text-[9px] uppercase tracking-wider">Zamanlama / Tür:</span>
                        <div class="flex items-center gap-1.5">
                            <span class="font-medium text-gray-700 md:font-normal md:text-gray-500">${zamanlamaMetni}</span>
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${turRengi}">${turMetni}</span>
                        </div>
                    </div>
                </td>
                
                <td class="block md:table-cell py-1 md:py-1.5 px-0 md:px-2 mt-1 md:mt-0">
                    <div class="flex items-center justify-between md:block">
                        <span class="md:hidden font-bold text-gray-400 text-[9px] uppercase tracking-wider">Kategori:</span>
                        <div class="flex items-center gap-1.5">
                            <span class="inline-block w-14 text-center px-1 border rounded text-[8px] font-bold ${nitelikRengi} shrink-0">${nitelik}</span>
                            <span class="font-bold md:font-medium text-gray-800 md:text-inherit">${t.category}</span>
                        </div>
                    </div>
                </td>
                
                <td class="block md:table-cell py-1 md:py-1.5 px-0 md:px-8 text-gray-600">
                    <div class="flex items-center justify-between md:block">
                        <span class="md:hidden font-bold text-gray-400 text-[9px] uppercase tracking-wider">Açıklama:</span>
                        <span class="text-right md:text-left">${aciklamaMetni}</span>
                    </div>
                </td>
                
                <td class="block md:table-cell py-1.5 md:py-1.5 px-0 md:px-2 font-bold ${tutarRengi} text-right whitespace-nowrap border-t md:border-t-0 border-gray-200/60 mt-1 md:mt-0 pt-1.5 md:pt-1.5">
                    <div class="flex items-center justify-between md:block w-full">
                        <span class="md:hidden font-bold text-gray-400 text-[9px] uppercase tracking-wider">Tutar:</span>
                        <span class="text-sm md:text-xs font-black md:font-bold">${t.type === 'gelir' ? '+' : '-'} ₺${formatTL(t.amount)}</span>
                    </div>
                </td>
                
                <td class="block md:table-cell py-2 md:py-1.5 px-0 md:px-2 text-center whitespace-nowrap">
                    <div class="flex items-center justify-end md:justify-center gap-2 w-full">
                        <button onclick="editTransaction(${t.id})" class="text-blue-600 font-bold md:font-normal text-xs md:text-inherit bg-blue-50 md:bg-transparent px-2.5 py-1 md:p-0 rounded border border-blue-200 md:border-none shadow-sm md:shadow-none">Düzenle</button>
                        <button onclick="deleteTransaction(${t.id})" class="text-red-500 font-bold md:font-normal text-xs md:text-inherit bg-red-50 md:bg-transparent px-2.5 py-1 md:p-0 rounded border border-red-200 md:border-none shadow-sm md:shadow-none">Sil</button>
                    </div>
                </td>
            `;
            transactionList.appendChild(tr);
        });
    }

    const balance = monthlyIncome - expense;

    totalSavingsEl.innerText = `₺ ${formatTL(savings)}`;
    totalIncomeEl.innerText = `₺ ${formatTL(monthlyIncome)}`;
    totalExpenseEl.innerText = `₺ ${formatTL(expense)}`;
    totalBalanceEl.innerText = `₺ ${formatTL(balance)}`;

    balanceCard.className = "p-2 rounded border transition-colors duration-300";

    if (expense > monthlyIncome && monthlyIncome > 0) {
        balanceCard.classList.add('bg-red-50', 'border-red-200', 'text-red-800');
        warningMessage.classList.remove('hidden');
        warningMessage.className = "mb-3 py-1.5 px-3 rounded text-xs font-bold text-center bg-red-500 text-white";
        warningMessage.innerText = "⚠️ DİKKAT: Aylık giderleriniz, aylık gelirinizi aştı! Birikiminizden harcıyorsunuz.";
    } else if (monthlyIncome > 0 && expense >= monthlyIncome * 0.8) {
        balanceCard.classList.add('bg-orange-50', 'border-orange-200', 'text-orange-800');
        warningMessage.classList.remove('hidden');
        warningMessage.className = "mb-3 py-1.5 px-3 rounded text-xs font-bold text-center bg-orange-400 text-white";
        warningMessage.innerText = "⚡ UYARI: Aylık gelirinizin %80'ini harcadınız. Bütçenizi sıkılaştırın.";
    } else {
        balanceCard.classList.add('bg-green-50', 'border-green-200', 'text-green-800');
    }
}

function checkDueDates() {
    if (duesChecked) return; 
    duesChecked = true;

    const today = new Date().getDate(); 
    const todayDues = transactions.filter(t => t.isRecurring && parseInt(t.recurringDay) === today);

    if (todayDues.length > 0) {
        showToasts(todayDues);   
        if ("Notification" in window && Notification.permission === "granted") {
            fireDesktopNotifications(todayDues);
        }
    }
}

function fireDesktopNotifications(dues) {
    const todayStr = new Date().toLocaleDateString();
    const lastNotified = localStorage.getItem('lastNotifiedDate');
    if (lastNotified === todayStr) return; 

    dues.forEach((t, i) => {
        setTimeout(() => {
            let isIncome = t.type === 'gelir';
            let title = isIncome ? '💸 Gelir Kontrolü' : '💳 Ödeme Zamanı';
            let body = isIncome 
                ? `${t.category} kategorisindeki ₺${formatTL(t.amount)} hesabınıza geldi mi?`
                : `${t.category} için ₺${formatTL(t.amount)} tutarındaki ödemeyi gerçekleştirmeyi unutmayın.`;
            new Notification(title, { body: body });
        }, i * 1500);
    });
    localStorage.setItem('lastNotifiedDate', todayStr);
}

function showToasts(dues) {
    const container = document.getElementById('toast-container');
    container.innerHTML = ''; 
    
    dues.forEach((t, i) => {
        setTimeout(() => {
            const toast = document.createElement('div');
            let isIncome = t.type === 'gelir';
            toast.className = `bg-white border-l-4 shadow-xl rounded p-3 w-80 transform transition-all duration-500 translate-x-full pointer-events-auto flex justify-between items-start ${isIncome ? 'border-green-500' : 'border-red-500'}`;
            let title = isIncome ? '💸 Gelir Beklentisi' : '💳 Ödeme Hatırlatıcı';
            let msg = isIncome ? `<b>${t.category}</b> için beklenen <b>₺${formatTL(t.amount)}</b> geldi mi?` : `<b>${t.category}</b> için <b>₺${formatTL(t.amount)}</b> ödemenizi unutmayın!`;
            toast.innerHTML = `<div><h4 class="text-xs font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}">${title}</h4><p class="text-[11px] text-gray-600 mt-1">${msg}</p></div><button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-600 ml-2">&times;</button>`;
            container.appendChild(toast);
            setTimeout(() => toast.classList.remove('translate-x-full'), 50);
        }, i * 600);
    });
}

fetchTransactions();

if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

setTimeout(() => checkDueDates(), 1200);
