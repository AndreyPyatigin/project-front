let totalAccounts = 0;
let currentPage = 1;
let itemsPerPage = 5; // Default value

const races = [
    'HUMAN',
    'DWARF',
    'ELF',
    'GIANT',
    'ORC',
    'TROLL',
    'HOBBIT'
];
const professions = [
    'WARRIOR',
    'ROGUE',
    'SORCERER',
    'CLERIC',
    'PALADIN',
    'NAZGUL',
    'WARLOCK',
    'DRUID'
];

function fetchTotalAccounts() {
    $.get("/rest/players/count", function(data) {
        totalAccounts = data;
        updatePagination();
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error("Ошибка при получении общего количества аккаунтов:", textStatus, errorThrown);
    });
}

function updatePagination() {
    const totalPages = Math.ceil(totalAccounts / itemsPerPage);
    $('#currentPage').text(currentPage);
    $('#prevPage').prop('disabled', currentPage === 1);
    $('#nextPage').prop('disabled', currentPage === totalPages);
    loadAccounts(currentPage, itemsPerPage);
    displayPageNumbers(totalPages);
}

function deleteAccount(id) {
    if (confirm("Are you sure you want to delete this account?")) {
        $.ajax({
            url: `/rest/players/${id}`,
            type: 'DELETE',
            success: function(result) {
                loadAccounts(currentPage, itemsPerPage);
            },
            error: function(xhr, status, error) {
                alert("Failed to delete the account. Please try again later.");
            }
        });
    }
}

function editAccount(id, row) {
    const cells = row.find('td');
    const isEditing = row.hasClass('editing');

    if (isEditing) {
        saveAccount(id, cells);
        // Показать иконку удаления после завершения редактирования
        row.find('.delete-icon').show();
    } else {
        cells.each(function(index) {
            const cell = $(this);
            if (index === 3) { // Race
                const select = $('<select></select>');
                races.forEach(race => {
                    select.append(`<option value="${race}" ${race === cell.text() ? 'selected' : ''}>${race}</option>`);
                });
                cell.html(select);
            } else if (index === 4) { // Profession
                const select = $('<select></select>');
                professions.forEach(profession => {
                    select.append(`<option value="${profession}" ${profession === cell.text() ? 'selected' : ''}>${profession}</option>`);
                });
                cell.html(select);
            } else if ((index > 0 && index < 5) || index === 7) { // Индексы для редактирования
                if (index === 7) { // Чекбокс
                    const checkbox = $('<input type="checkbox">').prop('checked', cell.find('input').prop('checked'));
                    cell.html(checkbox);
                } else {
                    const input = $('<input>').val(cell.text()).prop('disabled', false);
                    cell.html(input);
                }
            }
        });
        row.addClass('editing');
        row.find('.edit-icon').attr('src', '/img/save.png');
        // Скрыть иконку удаления во время редактирования
        row.find('.delete-icon').hide();
    }
}

function saveAccount(id, cells) {
    const updatedAccount = {
        name: cells[1].querySelector('input').value,
        title: cells[2].querySelector('input').value,
        race: cells[3].querySelector('select').value, // Получаем значение из select
        profession: cells[4].querySelector('select').value, // Получаем значение из select
        banned: cells[7].querySelector('input').checked
    };

    $.ajax({
        url: `/rest/players/${id}`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(updatedAccount),
        success: function(result) {
            loadAccounts(currentPage, itemsPerPage);
        },
        error: function(xhr, status, error) {
            alert("Не удалось обновить аккаунт. Попробуйте позже.");
        }
    });
}

function loadAccounts(pageNumber, pageSize) {
    $.get(`/rest/players?pageNumber=${pageNumber}&pageSize=${pageSize}`, function(data) {
        const tbody = $('#myTable tbody');
        tbody.empty();
        data.forEach(account => {
            const birthday = new Date(account.birthday).toLocaleDateString('ru-RU'); // Преобразование даты
            tbody.append(`<tr>
                <td>${account.id}</td>
                <td>${account.name}</td>
                <td>${account.title}</td>
                <td>${account.race}</td>
                <td>${account.profession}</td>
                <td>${account.level}</td>
                <td>${birthday}</td> <!-- Отображение преобразованной даты -->
                <td><input type="checkbox" ${account.banned ? 'checked' : ''} disabled></td>
                <td>
                    <img src="/img/edit.png" alt="Edit" class="edit-icon" data-id="${account.id}" />
                </td>
                <td>
                    <img src="/img/delete.png" alt="Delete" class="delete-icon" data-id="${account.id}" />
                </td>
            </tr>`);
        });

        $('.edit-icon').click(function() {
            const id = $(this).data('id');
            const row = $(this).closest('tr');
            editAccount(id, row);
        });

        $('.delete-icon').click(function() {
            const id = $(this).data('id');
            deleteAccount(id);
        });
    }).fail(function() {
        console.error("Ошибка при загрузке аккаунтов");
    });
}

function displayPageNumbers(totalPages) {
    const pageNumbersDiv = $('#pageNumbers');
    pageNumbersDiv.empty();
    for (let i = 1; i <= totalPages; i++) {
        const pageLink = $(`<span class="page-number" data-page="${i}">${i}</span>`);
        pageLink.click(function() {
            currentPage = i;
            updatePagination();
        });
        pageNumbersDiv.append(pageLink).append(" ");
    }
}

$(document).ready(function() {
    fetchTotalAccounts();

    $('#itemsPerPage').change(function() {
        itemsPerPage = parseInt($(this).val());
        currentPage = 1;
        fetchTotalAccounts();
    });

    $('#prevPage').click(function() {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
        }
    });

    $('#nextPage').click(function() {
        const totalPages = Math.ceil(totalAccounts / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
        }
    });

    // Загрузка рас и профессий в выпадающие списки
    function loadRacesAndProfessions() {
        races.forEach(race => {
            $('#race').append(`<option value="${race}">${race}</option>`);
        });
        professions.forEach(profession => {
            $('#profession').append(`<option value="${profession}">${profession}</option>`);
        });
    }


    loadRacesAndProfessions();


    $('#createAccountButton').click(function() {
        const newAccount = {
            name: $('#name').val(),
            title: $('#title').val(),
            race: $('#race').val(),
            profession: $('#profession').val(),
            level: $('#level').val(),
            birthday: new Date($('#birthday').val()).getTime(),
            banned: $('#banned').is(':checked')
        };

        $.ajax({
            url: '/rest/players',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(newAccount),
            success: function(result) {

                $('#createAccountForm input').val('');
                $('#createAccountForm select').prop('selectedIndex', 0);

                loadAccounts(currentPage, itemsPerPage);
            },
            error: function(xhr, status, error) {
                alert("Не удалось создать аккаунт. Попробуйте позже.");
            }
        });
    });
});