// Fonctions JS login page

// ==================== FORM NAVIGATION ====================
function showSection(sectionId) {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    clearErrors();
}

// ==================== ROLE SELECTION ====================
let selectedRole = 'citoyen';
function selectRole(btn, role) {
    selectedRole = role;
    document.querySelectorAll('.role-btn').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');
}

// ==================== PASSWORD TOGGLE ====================
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ==================== ERROR HANDLING ====================
function showError(inputId, show = true) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(inputId + '-error');
    if (show) {
        input.classList.add('error');
        error.classList.add('show');
    } else {
        input.classList.remove('error');
        error.classList.remove('show');
    }
}
function clearErrors() {
    document.querySelectorAll('.form-input').forEach(input => {
        input.classList.remove('error');
    });
    document.querySelectorAll('.error-message').forEach(error => {
        error.classList.remove('show');
    });
}

// ==================== FORM VALIDATION ====================
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePassword(password) {
    return password.length >= 8;
}
function validateUsername(username) {
    return username.length >= 3;
}

// ==================== LOGIN HANDLER ====================
async function handleLogin(event) {
    event.preventDefault();
    clearErrors();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    let hasError = false;
    if (!validateEmail(email)) {
        showError('login-email');
        hasError = true;
    }
    if (password.length < 6) {
        showError('login-password');
        hasError = true;
    }
    if (hasError) return;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role: selectedRole })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('ecotrack_token', data.token);
            localStorage.setItem('ecotrack_user', JSON.stringify(data.user));
            localStorage.setItem('ecotrack_role', selectedRole);
            redirectBasedOnRole(selectedRole);
        } else {
            throw new Error(data.message || 'Erreur de connexion');
        }
    } catch (error) {
        btn.disabled = false;
        btn.innerHTML = '<span>Se connecter</span>';
        alert(error.message || 'Erreur de connexion. Veuillez réessayer.');
    }
}

// ==================== REGISTER HANDLER ====================
async function handleRegister(event) {
    event.preventDefault();
    clearErrors();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    const btn = document.getElementById('register-btn');
    let hasError = false;
    if (!validateUsername(username)) {
        showError('register-username');
        hasError = true;
    }
    if (!validateEmail(email)) {
        showError('register-email');
        hasError = true;
    }
    if (!validatePassword(password)) {
        showError('register-password');
        hasError = true;
    }
    if (password !== passwordConfirm) {
        showError('register-password-confirm');
        hasError = true;
    }
    if (hasError) return;
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role: 'citoyen' })
        });
        const data = await response.json();
        if (response.ok) {
            showSection('success-section');
        } else {
            throw new Error(data.message || 'Erreur lors de l\'inscription');
        }
    } catch (error) {
        btn.disabled = false;
        btn.innerHTML = '<span>Créer mon compte</span>';
        alert(error.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
    }
}

// ==================== FORGOT PASSWORD HANDLER ====================
async function handleForgotPassword(event) {
    event.preventDefault();
    clearErrors();
    const email = document.getElementById('forgot-email').value;
    const btn = document.getElementById('forgot-btn');
    if (!validateEmail(email)) {
        showError('forgot-email');
        return;
    }
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div><span>Envoi...</span>';
    try {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Un email de réinitialisation a été envoyé à ' + email);
            showSection('login-section');
        } else {
            throw new Error(data.message || 'Erreur lors de l\'envoi');
        }
    } catch (error) {
        alert(error.message || 'Erreur. Veuillez réessayer.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i><span>Envoyer le lien</span>';
    }
}

// ==================== REDIRECT BASED ON ROLE ====================
function redirectBasedOnRole(role) {
    const routes = {
        'citoyen': '/dashboard/citoyen',
        'agent': '/dashboard/agent',
        'gestionnaire': '/dashboard/gestionnaire',
        'admin': '/dashboard/admin'
    };
    window.location.href = routes[role] || '/';
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('ecotrack_token');
    const role = localStorage.getItem('ecotrack_role');
    if (token && role) {
        redirectBasedOnRole(role);
    }
});
