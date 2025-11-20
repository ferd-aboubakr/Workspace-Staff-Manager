const unassignedStaffList = document.getElementById('unassignedStaffList');
const floorPlanGrid = document.getElementById('floorPlanGrid');
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
    // Gérer la fermeture de la modale de sélection d'affectation si elle est ouverte
    if (event.target.classList.contains('assignment-list-modal')) {
         closeModal(event.target);
    }
};

workerPhotoUrlInput.addEventListener('input', () => {
    const url = workerPhotoUrlInput.value;
    photoPreview.style.backgroundImage = url ? `url(${url})` : 'none';
});

// --- LOGIQUE D'EXPÉRIENCE (Gardée pour le formulaire) ---

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

// --- LOGIQUE D'AFFECTATION ET RÈGLES MÉTIER ---

function getZoneData(zoneId) {
    const zone = document.getElementById(zoneId);
    if (!zone) return null;
    
    return {
        id: zoneId,
        allowedRoles: zone.dataset.allowedRoles ? zone.dataset.allowedRoles.split(',') : [],
        blockedRoles: zone.dataset.blockedRoles ? zone.dataset.blockedRoles.split(',') : [],
        maxEmployees: parseInt(zone.dataset.maxEmployees || 5),
        currentEmployeesCount: employees.filter(e => e.location === zoneId).length
    };
}

function isEligible(employee, zoneId) {
    const zone = getZoneData(zoneId);
    if (!zone || zone.currentEmployeesCount >= zone.maxEmployees) return false;

    const role = employee.role;

    // Règle 1: Manager peut aller partout
    if (role === 'manager') {
        return true;
    }

    // Règle 2: Nettoyage (cleaning) bloqué à Archives
    if (role === 'cleaning' && zoneId === 'archives-room') {
        return false;
    }

    // Règle 3: Zones restreintes (Reception, Server, Security)
    if (zone.allowedRoles.length > 0) {
        return zone.allowedRoles.includes(role);
    }

    // Règle 4: Autres rôles (accès libre aux zones non restreintes)
    return true; 
}

function assignEmployeeToZone(employeeId, zoneId) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    // Vérification finale de l'éligibilité (double sécurité)
    if (!isEligible(employee, zoneId)) {
        alert("Assignment failed: Employee is not eligible or the zone is full.");
        return;
    }

    // Retirer l'employé de sa zone actuelle si nécessaire
    employee.location = zoneId;
    
    saveState();
    renderAll();
    
    // Fermer la modale si elle est ouverte
    const listModal = document.querySelector('.assignment-list-modal');
    if (listModal) listModal.remove(); 
}

function removeEmployeeFromZone(employeeId) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    employee.location = null; 
    saveState();
    renderAll();
}

// --- MODALE DE SÉLECTION D'EMPLOYÉ PAR ZONE ---

function showAssignmentList(zoneId) {
    const eligibleEmployees = employees.filter(e => e.location === null && isEligible(e, zoneId));
    
    const zoneTitle = document.getElementById(zoneId).querySelector('h3').textContent.trim();
    
    if (eligibleEmployees.length === 0) {
        alert(`No unassigned employees are eligible or the zone (${zoneTitle}) is full.`);
        return;
    }

    const listHtml = eligibleEmployees.map(e => 
        `<li onclick="assignEmployeeToZone(${e.id}, '${zoneId}');">
            <img src="${e.photoUrl || DEFAULT_PHOTO}" alt="${e.name}">
            <span>${e.name} (${e.role.charAt(0).toUpperCase() + e.role.slice(1)})</span>
        </li>`
    ).join('');

    // Création de la modale de sélection
    const modal = document.createElement('div');
    modal.className = 'modal assignment-list-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <span class="close-btn" onclick="this.closest('.modal').remove()">&times;</span>
            <h4>Assign to ${zoneTitle}</h4>
            <ul class="selection-list">${listHtml}</ul>
        </div>
    `;
    
    document.body.appendChild(modal);
    openModal(modal);

    // Ajoutez un style minimal pour la liste de sélection (à intégrer dans votre style.css)
    const style = document.createElement('style');
    style.innerHTML = `
        .selection-list { list-style: none; padding: 0; }
        .selection-list li {
            display: flex; align-items: center; padding: 10px; margin-bottom: 5px; 
            border-radius: 8px; background: #f9f9f9; cursor: pointer; transition: background 0.2s;
        }
        .selection-list li:hover { background: #eee; }
        .selection-list li img { width: 30px; height: 30px; border-radius: 50%; margin-right: 10px; }
        .assignment-list-modal .modal-content { animation: slideInTop 0.4s; }
    `;
    modal.appendChild(style);
}


// --- RENDERING & DELETE LOGIC ---

function deleteEmployee(employeeId) {
    if (confirm(`Are you sure you want to delete employee ID ${employeeId}?`)) {
        employees = employees.filter(e => e.id !== employeeId);
        saveState();
        renderAll();
    }
}

function renderUnassignedStaff() {
    unassignedStaffList.innerHTML = '';
    
    employees.filter(e => e.location === null).forEach(employee => {
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
        
        card.querySelector('.btn-remove').addEventListener('click', (e) => {
            e.stopPropagation(); 
            deleteEmployee(employee.id);
        });
        
        unassignedStaffList.appendChild(card);
    });
}

function renderFloorPlan() {
    document.querySelectorAll('.zone').forEach(zone => {
        const zoneId = zone.id;
        const container = zone.querySelector('.employees-container');
        container.innerHTML = ''; // Vider le container

        const employeesInZone = employees.filter(e => e.location === zoneId);

        // Mise à jour de la classe required-empty
        const isRequired = zone.dataset.required === 'true';
        if (isRequired && employeesInZone.length === 0) {
            zone.classList.add('required-empty');
        } else {
            zone.classList.remove('required-empty');
        }

        // Affichage des employés dans la zone
        employeesInZone.forEach(employee => {
            const pill = document.createElement('div');
            pill.className = 'zone-employee-pill';
            pill.setAttribute('data-employee-id', employee.id);
            
            pill.innerHTML = `
                <img src="${employee.photoUrl || DEFAULT_PHOTO}" alt="${employee.name}">
                <span>${employee.name.split(' ')[0]}</span>
                <button class="btn-remove" data-id="${employee.id}" title="Remove from zone">
                    <span class="material-icons">close</span>
                </button>
            `;
            
            // Bouton de retrait (pour le renvoyer à Unassigned)
            pill.querySelector('.btn-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                removeEmployeeFromZone(employee.id);
            });
            
            // NOTE: Le clic pour ouvrir le profil n'est pas inclus ici pour rester minimal.
            
            container.appendChild(pill);
        });

        // Ajouter le bouton '+' pour l'affectation
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-add-employee';
        addBtn.innerHTML = '<span class="material-icons">add</span>';
        addBtn.title = 'Assign Employee';
        
        // C'EST ICI QUE LE CLIC OUVRE LA LISTE DE SÉLECTION
        addBtn.onclick = () => showAssignmentList(zoneId); 
        
        container.appendChild(addBtn);
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
    renderAll();
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

function renderAll() {
    renderUnassignedStaff();
    renderFloorPlan();
}

// Initialisation
loadState();
renderAll();