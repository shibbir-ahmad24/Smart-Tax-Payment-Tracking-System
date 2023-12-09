function showUpdateModal(recordId, company, amount, paymentDate, status, dueDate) {
    // Fill the modal with existing data
    $('#updateIdInput').val(recordId);
    $('#updateCompanyInput').val(company);
    $('#updateAmountInput').val(amount);
    $('#updateStatusInput').val(status);
    $('#updatePaymentDateInput').val(paymentDate);
    $('#updateDueDateSelect').val(dueDate);

    $('#updateForm').attr('action', '/update/' + recordId);
    $('#updateModal').modal('show');
}

// Function to submit the updated data
function submitUpdate() {
    var actionUrl = '/update/' + $('#updateIdInput').val();
    $('#updateForm').attr('action', actionUrl);
    $('#updateForm').submit();
}

// Function to delete a record
function confirmDelete(tId) {
    if (confirm("Do you want to delete this existing record?")) {
        var actionUrl = '/delete/' + tId;
        $('#updateForm').attr('action', actionUrl);
        $('#updateForm').submit();
    } else {
        return false;
    }
}

// Function to display the dropdown menu for due date
function dueDateDropdownMenu(dropdownmenuID, includeAllOption = false) {
    var dropdown = document.getElementById(dropdownmenuID);
    var years = [2023, 2024, 2025];

    // Clear existing options
    dropdown.innerHTML = '';

    // Add 'All' option to select a due date from dropdown menu
    if (includeAllOption) {
        var allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All';
        dropdown.appendChild(allOption);
    }

    // Store new options in the dropdown menu
    years.forEach(function (year) {
        [0, 3, 5, 8].forEach(function (monthOffset) {
            var dueDate = new Date(year, monthOffset, 15);
            var option = document.createElement('option');
            option.value = dueDate.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
            option.textContent = getFormattedDate(dueDate);
            dropdown.appendChild(option);
        });
    });
}

// Function to format the date as 'MMMM DD, YYYY'
function getFormattedDate(date) {
    var options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

function updateDataTable() {
    let dateText = $('#selectDueDate option:selected').val();
    
    if (dateText === 'all') {
        $.ajax({
            type: "GET",
            url: "/fetchTaxRecords/all",
            success: function (result) {
                updateTable(result);
            }
        });
    } else {
        $.ajax({
            type: "GET",
            url: "/fetchTaxRecords/" + dateText,
            success: function (result) {
                updateTable(result);
            }
        });
    }
}

function updateTable(tableData) {
    const tableBody = document.getElementById('recordsTableBody');
    let tableContent = '';
    tableData.forEach((row) => {
        tableContent += `<tr>
                            <td>${row.company_name}</td>
                            <td name="record-amount">${row.amount_no}</td>
                            <td>${row.status}</td>
                            <td>${formatDate(row.payment_date)}</td>
                            <td>${formatDate(row.due_date)}</td>
                            <td>
                                <button type="button" class="btn btn-primary" onclick="showUpdateModal('${row.t_id}', '${row.company_name}', '${row.amount_no}', '${row.status}', '${formatDate(row.payment_date)}', '${formatDate(row.due_date)}')">Update</button>
                                <button type="button" class="btn btn-danger" onclick="confirmDelete('${row.t_id}')">Delete</button>    
                            </td>
                        </tr>`;
    });
    tableBody.innerHTML = tableContent;

    updateTaxTable();
}

function formatDate(dateStr) {
    if (dateStr !== null && dateStr !== undefined) {
        return new Date(dateStr).toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
    }
    else {
        return "N/A"
    }
}

function updateTaxTable() {
    // Update total amount
    let elements = document.getElementsByName('record-amount');

    if (elements.length === 0) {
        document.getElementById("taxContainer").style.display = 'none';
    } else {
        let sum = 0;
        for (const e of elements) {
            sum += parseFloat(e.textContent);
        }
        document.getElementById("totalAmountSpan").innerHTML = "$" + sum;
        document.getElementById("taxContainer").style.display = 'block';
    }

    calculateTaxDue();
}

function calculateTaxDue() {
    let totalAmount = parseFloat(document.getElementById("totalAmountSpan").innerHTML.replace("$", ""));
    let taxRate = parseFloat(document.getElementById("taxRateInput").value);

    if (!isNaN(totalAmount) && !isNaN(taxRate)) {
        let taxAmount = totalAmount * taxRate;
        taxAmount = (Math.round(taxAmount * 100) / 100).toFixed(2); // round to two decimal
        document.getElementById("taxDueSpan").innerHTML = "$" + taxAmount;
    }
}

// Event listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    dueDateDropdownMenu('dueDate');
    dueDateDropdownMenu('selectDueDate', true);
    dueDateDropdownMenu('updateDueDateSelect');

    updateTaxTable();
});