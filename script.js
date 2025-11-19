const unassignedStaffList = document.getElementById('unassignedStaffList');
const modalNewWorker = document.getElementById('modalNewWorker');
const addNewWorkerBtn = document.getElementById('addNewWorkerBtn');
const closeModalBtns = document.querySelectorAll('.close-btn');
const newWorkerForm = document.getElementById('newWorkerForm');
const experiencesContainer = document.getElementById('experiencesContainer');
const addExperienceBtn = document.getElementById('addExperienceBtn');
const workerPhotoUrlInput = document.getElementById('workerPhotoUrl');
const photoPreview = document.getElementById('photoPreview');

const DEFAULT_PHOTO = 'https://via.placeholder.com/150/000000/FFFFFF/?text=EMP'; 

let employees = [];
let nextEmployeeId = 1;

// --- UTILS & MODAL ---

function openModal(modal) {
    modal.style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

addNewWorkerBtn.onclick = () => {
    if (experiencesContainer.childElementCount === 0) {
        addExperienceField();
    }
    openModal(modalNewWorker);
};

closeModalBtns.forEach(btn => {
    btn.onclick = (e) => closeModal(e.target.closest('.modal'));
});

window.onclick = (event) => {
    if (event.target == modalNewWorker) {
        closeModal(modalNewWorker);
    }
};


workerPhotoUrlInput.addEventListener('input', () => {
    const url = workerPhotoUrlInput.value;
    photoPreview.style.backgroundImage = url ? `url(${url})` : 'none';
});



function addExperienceField(company = '', startDate = '', endDate = '') {
    const div = document.createElement('div');
    div.className = 'experience-form-group';
    div.innerHTML = `
        <input type="text" placeholder="Company Name" class="exp-company" value="${company}" required>
        <input type="date" placeholder="Start Date" class="exp-start-date" value="${startDate}" required>
        <input type="date" placeholder="End Date" class="exp-end-date" value="${endDate}" required>
        <button type="button" class="btn-remove-exp">
            <span class="material-icons">remove_circle_outline</span>
        </button>
    `;
    div.querySelector('.btn-remove-exp').onclick = () => {
        if (experiencesContainer.childElementCount > 1) {
            div.remove();
        } else {
            alert('At least one experience is required.');
        }
    };
    experiencesContainer.appendChild(div);
}

addExperienceBtn.onclick = () => addExperienceField();

// --- RENDERING & DELETE LOGIC ---

function deleteEmployee(employeeId) {
    if (confirm(`Are you sure you want to delete employee ID ${employeeId}?`)) {
        // Filtre pour exclure l'employé
        employees = employees.filter(e => e.id !== employeeId);
        saveState();
        renderUnassignedStaff();
    }
}

function renderUnassignedStaff() {
    unassignedStaffList.innerHTML = '';
    
    employees.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'employee-card';
        card.setAttribute('data-employee-id', employee.id);
        
        card.innerHTML = `
            <img src="${employee.photoUrl || DEFAULT_PHOTO}" alt="${employee.name}">
            <div class="employee-info">
                <p><strong>${employee.name}</strong></p>
                <p>${employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}</p>
            </div>
            <button class="btn-remove" data-id="${employee.id}" title="Delete worker">
                <span class="material-icons">delete</span>
            </button>
        `;
        
        // Attacher la fonction de suppression
        card.querySelector('.btn-remove').addEventListener('click', (e) => {
            e.stopPropagation(); 
            deleteEmployee(employee.id);
        });
        
        unassignedStaffList.appendChild(card);
    });
}

// --- FORM SUBMISSION (ADD WORKER) ---

newWorkerForm.onsubmit = (e) => {
    e.preventDefault();

    const name = document.getElementById('workerName').value.trim();
    const role = document.getElementById('workerRole').value;
    const photoUrl = document.getElementById('workerPhotoUrl').value.trim();
    const email = document.getElementById('workerEmail').value.trim();
    const phone = document.getElementById('workerPhone').value.trim();

    const experiences = [];
    document.querySelectorAll('.experience-form-group').forEach(group => {
        const company = group.querySelector('.exp-company').value;
        const start = group.querySelector('.exp-start-date').value;
        const end = group.querySelector('.exp-end-date').value;
        
        experiences.push({ company, start, end });
    });
    
    const newEmployee = {
        id: nextEmployeeId++,
        name,
        role,
        photoUrl: photoUrl || DEFAULT_PHOTO,
        email,
        phone,
        experiences,
        location: null
    };

    employees.push(newEmployee);
    saveState();
    renderUnassignedStaff();
    closeModal(modalNewWorker);
    newWorkerForm.reset();
    photoPreview.style.backgroundImage = 'none';
};


// --- LOCAL STORAGE & INIT ---

function saveState() {
    localStorage.setItem('employeesState', JSON.stringify(employees));
    localStorage.setItem('nextEmployeeId', nextEmployeeId);
}

function loadState() {
    const savedEmployees = localStorage.getItem('employeesState');
    const savedNextId = localStorage.getItem('nextEmployeeId');
    
    if (savedEmployees) {
        employees = JSON.parse(savedEmployees);
    }
    if (savedNextId) {
        nextEmployeeId = parseInt(savedNextId);
    }
}

// Initialisation
loadState();
renderUnassignedStaff();