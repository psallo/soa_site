document.addEventListener('DOMContentLoaded', () => {
    const USERS_KEY = 'soa_estimate_users';
    const CURRENT_USER_KEY = 'soa_estimate_current_user';
    const addItemButton = document.getElementById('add-item');
    const invoiceItemsTable = document.getElementById('invoice-items').getElementsByTagName('tbody')[0];
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const authStatus = document.getElementById('auth-status');

    const supplierFields = [
        'supplier_company',
        'supplier_contact',
        'supplier_phone'
    ];

    const recipientFields = [
        'recipient_company',
        'recipient_contact',
        'recipient_phone',
        'recipient_email',
        'recipient_address'
    ];

    function loadUsers() {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function getCurrentUserEmail() {
        return localStorage.getItem(CURRENT_USER_KEY);
    }

    function setLoggedInState(isLoggedIn, email = '') {
        document.body.classList.toggle('is-logged-out', !isLoggedIn);
        logoutButton.disabled = !isLoggedIn;
        loginButton.disabled = isLoggedIn;
        loginEmail.disabled = isLoggedIn;
        loginPassword.disabled = isLoggedIn;
        authStatus.textContent = isLoggedIn ? `${email} 로그인됨` : '로그인 필요';
    }

    function getOrCreateUser(email) {
        const users = loadUsers();
        if (!users[email]) {
            users[email] = {
                profile: {
                    supplier: {},
                    recipient: {}
                },
                estimates: []
            };
            saveUsers(users);
        }
        return users[email];
    }

    function updateUser(email, updater) {
        const users = loadUsers();
        const user = users[email];
        if (!user) return;
        updater(user);
        users[email] = user;
        saveUsers(users);
    }

    function loadProfile(email) {
        const users = loadUsers();
        const user = users[email];
        if (!user) return;

        supplierFields.forEach((field) => {
            const input = document.querySelector(`[name="${field}"]`);
            input.value = user.profile.supplier[field] || '';
        });
        recipientFields.forEach((field) => {
            const input = document.querySelector(`[name="${field}"]`);
            input.value = user.profile.recipient[field] || '';
        });
    }

    function saveProfileField(email, fieldName, value) {
        updateUser(email, (user) => {
            if (supplierFields.includes(fieldName)) {
                user.profile.supplier[fieldName] = value;
            } else if (recipientFields.includes(fieldName)) {
                user.profile.recipient[fieldName] = value;
            }
        });
    }

    function ensureLoggedIn() {
        const email = getCurrentUserEmail();
        if (!email) {
            alert('로그인이 필요합니다.');
            return null;
        }
        return email;
    }

    loginButton.addEventListener('click', () => {
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();
        if (!email || !password) {
            alert('이메일과 비밀번호를 입력해주세요.');
            return;
        }

        getOrCreateUser(email);
        localStorage.setItem(CURRENT_USER_KEY, email);
        setLoggedInState(true, email);
        loadProfile(email);
    });

    loginPassword.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            loginButton.click();
        }
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem(CURRENT_USER_KEY);
        setLoggedInState(false);
        loginEmail.value = '';
        loginPassword.value = '';
        document.querySelectorAll('#invoice-form input[type="text"], #invoice-form input[type="number"], #invoice-form input[type="date"], #invoice-form textarea').forEach((input) => {
            input.value = '';
        });
        invoiceItemsTable.innerHTML = `
            <tr>
                <td><input type="text" name="item_name"></td>
                <td><input type="number" name="item_quantity" value="1"></td>
                <td><input type="number" name="item_price" value="0"></td>
                <td><span class="supply-price">0</span></td>
                <td><span class="tax">0</span></td>
                <td><input type="checkbox" name="item_tax_exempt"></td>
                <td><button type="button" class="remove-item">삭제</button></td>
            </tr>
        `;
        updateTotals();
    });

    document.querySelectorAll('input[type="text"], input[type="number"], input[type="date"], textarea').forEach((input) => {
        input.addEventListener('input', (event) => {
            const email = getCurrentUserEmail();
            if (!email) return;
            const name = event.target.name;
            if (supplierFields.includes(name) || recipientFields.includes(name)) {
                saveProfileField(email, name, event.target.value);
            }
        });
    });

    addItemButton.addEventListener('click', () => {
        const newRow = invoiceItemsTable.insertRow();
        newRow.innerHTML = `
            <td><input type="text" name="item_name"></td>
            <td><input type="number" name="item_quantity" value="1"></td>
            <td><input type="number" name="item_price" value="0"></td>
            <td><span class="supply-price">0</span></td>
            <td><span class="tax">0</span></td>
            <td><input type="checkbox" name="item_tax_exempt"></td>
            <td><button type="button" class="remove-item">삭제</button></td>
        `;
    });

    invoiceItemsTable.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-item')) {
            const row = event.target.closest('tr');
            row.remove();
            updateTotals();
        }
    });

    invoiceItemsTable.addEventListener('input', (event) => {
        const target = event.target;
        if (target.name === 'item_quantity' || target.name === 'item_price' || target.name === 'item_tax_exempt') {
            const row = target.closest('tr');
            const quantity = row.querySelector('[name="item_quantity"]').value;
            const price = row.querySelector('[name="item_price"]').value;
            const supplyPrice = quantity * price;
            const isTaxExempt = row.querySelector('[name="item_tax_exempt"]').checked;
            const tax = isTaxExempt ? 0 : supplyPrice * 0.1;

            row.querySelector('.supply-price').textContent = supplyPrice.toLocaleString();
            row.querySelector('.tax').textContent = tax.toLocaleString();
            updateTotals();
        }
    });

    function updateTotals() {
        let totalSupplyPrice = 0;
        let totalTax = 0;

        const rows = invoiceItemsTable.getElementsByTagName('tr');
        for (const row of rows) {
            const supplyPriceText = row.querySelector('.supply-price').textContent.replace(/,/g, '');
            const taxText = row.querySelector('.tax').textContent.replace(/,/g, '');
            const supplyPrice = parseInt(supplyPriceText, 10) || 0;
            const tax = parseInt(taxText, 10) || 0;

            totalSupplyPrice += supplyPrice;
            totalTax += tax;
        }

        const totalAmount = totalSupplyPrice + totalTax;

        document.getElementById('total-supply-price').textContent = totalSupplyPrice.toLocaleString();
        document.getElementById('total-tax').textContent = totalTax.toLocaleString();
        document.getElementById('total-amount').textContent = totalAmount.toLocaleString();
    }

    const generateInvoiceButton = document.getElementById('generate-invoice');
    generateInvoiceButton.addEventListener('click', () => {
        const email = getCurrentUserEmail();

        document.getElementById('preview-supplier-company').textContent = document.querySelector('[name="supplier_company"]').value;
        document.getElementById('preview-supplier-contact').textContent = document.querySelector('[name="supplier_contact"]').value;
        document.getElementById('preview-supplier-phone').textContent = document.querySelector('[name="supplier_phone"]').value;
        document.getElementById('preview-estimate-date').textContent = document.querySelector('[name="estimate_date"]').value;

        document.getElementById('preview-recipient-company').textContent = document.querySelector('[name="recipient_company"]').value;
        document.getElementById('preview-recipient-contact').textContent = document.querySelector('[name="recipient_contact"]').value;
        document.getElementById('preview-recipient-phone').textContent = document.querySelector('[name="recipient_phone"]').value;
        document.getElementById('preview-recipient-email').textContent = document.querySelector('[name="recipient_email"]').value;
        document.getElementById('preview-recipient-address').textContent = document.querySelector('[name="recipient_address"]').value;

        document.getElementById('preview-estimate-number').textContent = document.querySelector('[name="estimate_number"]').value;
        document.getElementById('preview-estimate-valid-until').textContent = document.querySelector('[name="estimate_valid_until"]').value;
        document.getElementById('preview-delivery-date').textContent = document.querySelector('[name="delivery_date"]').value;
        document.getElementById('preview-payment-terms').textContent = document.querySelector('[name="payment_terms"]').value;
        document.getElementById('preview-estimate-notes').textContent = document.querySelector('[name="estimate_notes"]').value;

        const previewInvoiceItems = document.getElementById('preview-invoice-items');
        previewInvoiceItems.innerHTML = '';
        const rows = invoiceItemsTable.getElementsByTagName('tr');
        for (const row of rows) {
            const quantityInput = row.querySelector('[name="item_quantity"]');
            const priceInput = row.querySelector('[name="item_price"]');
            if (quantityInput.value.trim() === '' || priceInput.value.trim() === '') {
                alert('수량과 단가를 입력해주세요.');
                (quantityInput.value.trim() === '' ? quantityInput : priceInput).focus();
                return;
            }
        }
        for (const row of rows) {
            const newRow = previewInvoiceItems.insertRow();
            const isTaxExempt = row.querySelector('[name="item_tax_exempt"]').checked;
            newRow.innerHTML = `
                <td>${row.querySelector('[name="item_name"]').value}</td>
                <td>${(parseInt(row.querySelector('[name="item_quantity"]').value, 10) || 0).toLocaleString()}</td>
                <td>${(parseInt(row.querySelector('[name="item_price"]').value, 10) || 0).toLocaleString()}</td>
                <td>${row.querySelector('.supply-price').textContent}</td>
                <td>${row.querySelector('.tax').textContent}</td>
                <td>${isTaxExempt ? '면세' : ''}</td>
            `;
        }

        document.getElementById('preview-total-supply-price').textContent = document.getElementById('total-supply-price').textContent;
        document.getElementById('preview-total-tax').textContent = document.getElementById('total-tax').textContent;
        document.getElementById('preview-total-amount').textContent = document.getElementById('total-amount').textContent;

        const estimateItems = [];
        for (const row of rows) {
            estimateItems.push({
                name: row.querySelector('[name="item_name"]').value,
                quantity: row.querySelector('[name="item_quantity"]').value,
                price: row.querySelector('[name="item_price"]').value,
                supplyPrice: row.querySelector('.supply-price').textContent,
                tax: row.querySelector('.tax').textContent,
                taxExempt: row.querySelector('[name="item_tax_exempt"]').checked
            });
        }

        if (email) {
            updateUser(email, (user) => {
                user.estimates.push({
                    createdAt: new Date().toISOString(),
                    supplier: { ...user.profile.supplier },
                    recipient: { ...user.profile.recipient },
                    estimateDate: document.querySelector('[name="estimate_date"]').value,
                    estimateNumber: document.querySelector('[name="estimate_number"]').value,
                    validUntil: document.querySelector('[name="estimate_valid_until"]').value,
                    deliveryDate: document.querySelector('[name="delivery_date"]').value,
                    paymentTerms: document.querySelector('[name="payment_terms"]').value,
                    notes: document.querySelector('[name="estimate_notes"]').value,
                    items: estimateItems,
                    totals: {
                        supply: document.getElementById('total-supply-price').textContent,
                        tax: document.getElementById('total-tax').textContent,
                        amount: document.getElementById('total-amount').textContent
                    }
                });
            });
        }

        const previewSection = document.getElementById('invoice-preview');
        if (previewSection) {
            previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    const printInvoiceButton = document.getElementById('print-invoice');
    printInvoiceButton.addEventListener('click', () => {
        if (!ensureLoggedIn()) return;
        window.print();
    });

    const downloadPdfButton = document.getElementById('download-pdf');
    downloadPdfButton.addEventListener('click', () => {
        if (!ensureLoggedIn()) return;
        const { jsPDF } = window.jspdf;
        const invoicePreview = document.querySelector('.invoice-preview');

        html2canvas(invoicePreview).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('견적서.pdf');
        });
    });

    const savedEmail = getCurrentUserEmail();
    if (savedEmail) {
        setLoggedInState(true, savedEmail);
        loadProfile(savedEmail);
    } else {
        setLoggedInState(false);
    }
});
