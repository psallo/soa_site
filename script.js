document.addEventListener('DOMContentLoaded', () => {
    const addItemButton = document.getElementById('add-item');
    const invoiceItemsTable = document.getElementById('invoice-items').getElementsByTagName('tbody')[0];
    const stampInput = document.getElementById('supplier-stamp');
    const stampPreview = document.getElementById('supplier-stamp-preview');
    const previewStamp = document.getElementById('preview-supplier-stamp');
    let stampDataUrl = '';

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

    stampInput.addEventListener('change', (event) => {
        const [file] = event.target.files;
        if (!file) {
            stampDataUrl = '';
            stampPreview.style.display = 'none';
            previewStamp.style.display = 'none';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            stampDataUrl = reader.result;
            stampPreview.src = stampDataUrl;
            stampPreview.style.display = 'block';
            previewStamp.src = stampDataUrl;
            previewStamp.style.display = 'block';
        };
        reader.readAsDataURL(file);
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
        //- `supplier_reg_num`
        //- `supplier_name`
        //- `supplier_owner`
        //- `supplier_address`
        //- `supplier_biz_type`
        //- `supplier_biz_item`
        //- `supplier_tel`
        document.getElementById('preview-supplier-reg-num').textContent = document.querySelector('[name="supplier_reg_num"]').value;
        document.getElementById('preview-supplier-name').textContent = document.querySelector('[name="supplier_name"]').value;
        document.getElementById('preview-supplier-owner').textContent = document.querySelector('[name="supplier_owner"]').value;
        document.getElementById('preview-supplier-address').textContent = document.querySelector('[name="supplier_address"]').value;
        document.getElementById('preview-supplier-biz-type').textContent = document.querySelector('[name="supplier_biz_type"]').value;
        document.getElementById('preview-supplier-biz-item').textContent = document.querySelector('[name="supplier_biz_item"]').value;
        document.getElementById('preview-supplier-tel').textContent = document.querySelector('[name="supplier_tel"]').value;
        document.getElementById('preview-supplier-email').textContent = document.querySelector('[name="supplier_email"]').value;

        // Recipient
        document.getElementById('preview-recipient-reg-num').textContent = document.querySelector('[name="recipient_reg_num"]').value;
        document.getElementById('preview-recipient-name').textContent = document.querySelector('[name="recipient_name"]').value;
        document.getElementById('preview-recipient-owner').textContent = document.querySelector('[name="recipient_owner"]').value;
        document.getElementById('preview-recipient-address').textContent = document.querySelector('[name="recipient_address"]').value;
        document.getElementById('preview-recipient-biz-type').textContent = document.querySelector('[name="recipient_biz_type"]').value;
        document.getElementById('preview-recipient-biz-item').textContent = document.querySelector('[name="recipient_biz_item"]').value;
        document.getElementById('preview-recipient-tel').textContent = document.querySelector('[name="recipient_tel"]').value;
        document.getElementById('preview-recipient-email').textContent = document.querySelector('[name="recipient_email"]').value;

        // Transaction Date
        document.getElementById('preview-transaction-date').textContent = document.querySelector('[name="transaction_date"]').value;
        document.getElementById('preview-transaction-terms').textContent = document.querySelector('[name="transaction_terms"]').value;

        // Items
        const previewInvoiceItems = document.getElementById('preview-invoice-items');
        previewInvoiceItems.innerHTML = '';
        const rows = invoiceItemsTable.getElementsByTagName('tr');
        for (const row of rows) {
            const newRow = previewInvoiceItems.insertRow();
            const isTaxExempt = row.querySelector('[name="item_tax_exempt"]').checked;
            newRow.innerHTML = `
                <td>${row.querySelector('[name="item_name"]').value}</td>
                <td>${parseInt(row.querySelector('[name="item_quantity"]').value, 10).toLocaleString()}</td>
                <td>${parseInt(row.querySelector('[name="item_price"]').value, 10).toLocaleString()}</td>
                <td>${row.querySelector('.supply-price').textContent}</td>
                <td>${row.querySelector('.tax').textContent}</td>
                <td>${isTaxExempt ? '비과세' : ''}</td>
            `;
        }

        // Totals
        document.getElementById('preview-total-supply-price').textContent = document.getElementById('total-supply-price').textContent;
        document.getElementById('preview-total-tax').textContent = document.getElementById('total-tax').textContent;
        document.getElementById('preview-total-amount').textContent = document.getElementById('total-amount').textContent;

        if (stampDataUrl) {
            previewStamp.src = stampDataUrl;
            previewStamp.style.display = 'block';
        } else {
            previewStamp.style.display = 'none';
        }
    });

    const printInvoiceButton = document.getElementById('print-invoice');
    printInvoiceButton.addEventListener('click', () => {
        window.print();
    });

    const downloadPdfButton = document.getElementById('download-pdf');
    downloadPdfButton.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const invoicePreview = document.querySelector('.invoice-preview');

        html2canvas(invoicePreview).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('거래명세서.pdf');
        });
    });
});
