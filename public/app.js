/* ========================================
   Smart Scheduler — Frontend Application
   SaaS Dashboard — Deep Blue theme
   ======================================== */

const API = '/api';
let token = sessionStorage.getItem('token');
let currentUser = JSON.parse(sessionStorage.getItem('user') || 'null');

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    checkGoogleCallback();
    renderIcons();
});

async function checkGoogleCallback() {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken) {
        // Google Login Success
        try {
            token = urlToken;
            sessionStorage.setItem('token', token);

            // Fetch user details to get role/name
            const data = await api('/me');
            if (data.success) {
                currentUser = data.data;
                sessionStorage.setItem('user', JSON.stringify(currentUser));

                // Clean URL
                window.history.replaceState({}, document.title, '/');

                toast('Logged in with Google successfully!', 'success');
                enterApp();
            }
        } catch (err) {
            console.error('Google login error:', err);
            toast('Failed to verify Google login', 'error');
            // Don't call logout() here inside the catch immediately or it clears existing session
            // Instead, just clear token locally
            token = null;
        }
    } else if (token && currentUser) {
        // Persist login
        enterApp();
    }
}

// ==================== LUCIDE INIT ====================
function renderIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==================== API HELPER ====================
async function api(path, method = 'GET', body = null) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API}${path}`, opts);
    const data = await res.json();
    if (!res.ok) {
        // Fix: Check for validation errors array
        const msg = data.message || (data.errors ? data.errors.map(e => e.msg).join(', ') : 'Request failed');
        throw new Error(msg);
    }
    return data;
}

// ==================== TOAST ====================
function toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;

    const icons = { success: 'check-circle', error: 'alert-circle', warning: 'alert-triangle', info: 'info' };
    el.innerHTML = `<i data-lucide="${icons[type] || 'info'}"></i><span>${message}</span>`;
    container.appendChild(el);
    renderIcons();
    setTimeout(() => el.remove(), 4000);
}

// ==================== AUTH ====================
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    // Set the clicked tab as active
    document.querySelectorAll('.auth-tab').forEach(b => {
        if ((tab === 'login' && b.textContent.includes('Sign In')) ||
            (tab === 'register' && b.textContent.includes('Create'))) {
            b.classList.add('active');
        }
    });
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
}

function toggleProviderFields() {
    const role = document.getElementById('regRole').value;
    document.getElementById('providerFields').classList.toggle('hidden', role !== 'provider');
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.innerHTML = '<span>Signing in...</span>';
    try {
        const data = await api('/login', 'POST', {
            email: document.getElementById('loginEmail').value,
            password: document.getElementById('loginPassword').value,
        });
        setAuth(data.data);
        toast('Welcome back, ' + currentUser.name + '!', 'success');
        enterApp();
    } catch (err) {
        toast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Sign In</span><i data-lucide="arrow-right"></i>';
        renderIcons();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.innerHTML = '<span>Creating account...</span>';
    try {
        const body = {
            name: document.getElementById('regName').value,
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            role: document.getElementById('regRole').value,
        };
        if (body.role === 'provider') {
            body.specialization = document.getElementById('regSpecialization').value;
            body.phone = document.getElementById('regPhone').value;
        }
        const data = await api('/register', 'POST', body);
        setAuth(data.data);
        toast('Account created! Welcome, ' + currentUser.name, 'success');
        enterApp();
    } catch (err) {
        toast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Create Account</span><i data-lucide="arrow-right"></i>';
        renderIcons();
    }
}

function setAuth(data) {
    token = data.token;
    currentUser = data.user;
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(currentUser));
}

function logout() {
    token = null;
    currentUser = null;
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    document.getElementById('appScreen').classList.remove('active');
    document.getElementById('appScreen').classList.add('hidden');
    document.getElementById('authScreen').classList.add('active');
    document.getElementById('authScreen').classList.remove('hidden');
    closeUserMenu();
    toast('Logged out', 'info');
}

// ==================== ENTER APP ====================
function enterApp() {
    document.getElementById('authScreen').classList.remove('active');
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('active');

    document.getElementById('navUserName').textContent = currentUser.name;
    document.getElementById('navUserRole').textContent = currentUser.role;
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('welcomeMsg').textContent = `Welcome back, ${currentUser.name}!`;

    buildSidebar();
    showView('dashboardView');
    renderIcons();
}

// ==================== USER DROPDOWN ====================
function toggleUserMenu() {
    document.getElementById('userMenu').classList.toggle('hidden');
}

function closeUserMenu() {
    document.getElementById('userMenu').classList.add('hidden');
}

// ==================== MOBILE MENU ====================
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

document.addEventListener('click', (e) => {

    if (!e.target.closest('.nav-user') && !e.target.closest('.user-menu')) {
        closeUserMenu();
    }
});

// ==================== SEARCH ====================
let searchTimeout = null;

function handleSearchInput() {
    clearTimeout(searchTimeout);
    const q = document.getElementById('globalSearch').value.trim().toLowerCase();
    const dropdown = document.getElementById('searchResults');

    if (!q) {
        dropdown.classList.add('hidden');
        return;
    }

    searchTimeout = setTimeout(() => runSearch(q), 250);
}

async function runSearch(q) {
    const dropdown = document.getElementById('searchResults');
    let html = '';

    // 1. Search sidebar navigation items
    const navItems = [
        { label: 'Dashboard', view: 'dashboardView', icon: 'layout-dashboard', color: 'blue' },
        { label: 'Book Slot', view: 'slotsView', icon: 'calendar-plus', color: 'green', roles: ['user'] },
        { label: 'My Appointments', view: 'appointmentsView', icon: 'calendar-check', color: 'blue' },
        { label: 'Waitlist', view: 'waitlistView', icon: 'list-ordered', color: 'yellow', roles: ['user'] },
        { label: 'Wait Time', view: 'waitTimeView', icon: 'clock', color: 'yellow' },
        { label: 'AI Assistant', view: 'chatView', icon: 'bot', color: 'purple' },
        { label: 'Manage Slots', view: 'manageSlotsView', icon: 'settings', color: 'blue', roles: ['provider'] },
        { label: 'Confirmations', view: 'confirmationsView', icon: 'check-circle', color: 'green', roles: ['provider'] },
        { label: 'Analytics', view: 'analyticsDashView', icon: 'bar-chart-3', color: 'purple', roles: ['provider'] },
        { label: 'Admin Panel', view: 'adminView', icon: 'shield', color: 'purple', roles: ['admin'] },
        { label: 'Profile', view: 'profileView', icon: 'user', color: 'blue' },
    ];

    const matchedNav = navItems.filter(n => {
        if (n.roles && !n.roles.includes(currentUser.role)) return false;
        return n.label.toLowerCase().includes(q);
    });

    if (matchedNav.length > 0) {
        html += `<div class="search-category">Pages</div>`;
        matchedNav.forEach(n => {
            html += searchItem(n.icon, n.color, n.label, 'Navigate to page', `showView('${n.view}'); closeSearch()`);
        });
    }

    // 2. Search appointments
    try {
        const apptData = await api('/appointments');
        const matchedAppts = (apptData.data || []).filter(a => {
            const name = (a.provider?.user?.name || '').toLowerCase();
            const date = (a.slot?.date || '').toLowerCase();
            const status = (a.status || '').toLowerCase();
            const id = String(a.id);
            return name.includes(q) || date.includes(q) || status.includes(q) || id === q;
        });

        if (matchedAppts.length > 0) {
            html += `<div class="search-category">Appointments</div>`;
            matchedAppts.slice(0, 5).forEach(a => {
                const title = `#${a.id} — ${a.provider?.user?.name || 'Provider'}`;
                const sub = `${a.slot?.date || '—'} · ${a.slot?.startTime || '—'} · ${a.status}`;
                html += searchItem('calendar-check', 'blue', title, sub, `viewTimeline(${a.id}); closeSearch()`);
            });
        }
    } catch (e) { /* ignore if unauthenticated */ }

    // 3. Search available slots
    try {
        const slotData = await api('/slots');
        const matchedSlots = (slotData.data || []).filter(s => {
            const name = (s.provider?.user?.name || '').toLowerCase();
            const date = (s.date || '').toLowerCase();
            const id = String(s.id);
            return name.includes(q) || date.includes(q) || id === q;
        });

        if (matchedSlots.length > 0) {
            html += `<div class="search-category">Available Slots</div>`;
            matchedSlots.slice(0, 5).forEach(s => {
                const title = `Slot #${s.id} — ${s.provider?.user?.name || 'Provider'}`;
                const sub = `${s.date} · ${s.startTime} – ${s.endTime}`;
                html += searchItem('calendar-plus', 'green', title, sub, `showView('slotsView'); closeSearch()`);
            });
        }
    } catch (e) { /* ignore */ }

    if (!html) {
        html = `<div class="search-empty"><i data-lucide="search-x" style="width:24px;height:24px;margin-bottom:8px;opacity:0.4;display:inline-block;"></i><br>No results for "${q}"</div>`;
    }

    dropdown.innerHTML = html;
    dropdown.classList.remove('hidden');
    renderIcons();
}

function searchItem(icon, color, title, sub, onclick) {
    return `<div class="search-item" onclick="${onclick}">
        <div class="search-item-icon ${color}"><i data-lucide="${icon}"></i></div>
        <div class="search-item-text">
            <div class="search-item-title">${title}</div>
            <div class="search-item-sub">${sub}</div>
        </div>
    </div>`;
}

function closeSearch() {
    document.getElementById('searchResults').classList.add('hidden');
    document.getElementById('globalSearch').value = '';
}

// Close search dropdown on click outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-search')) {
        document.getElementById('searchResults')?.classList.add('hidden');
    }
});

// ==================== SIDEBAR ====================
function buildSidebar() {
    const nav = document.getElementById('sidebarNav');
    const role = currentUser.role;
    let html = '';

    html += `<div class="sidebar-label">Main</div>`;
    html += sidebarItem('layout-dashboard', 'Dashboard', 'dashboardView');

    if (role === 'user') {
        html += sidebarItem('calendar-plus', 'Book Slot', 'slotsView');
        html += sidebarItem('calendar-check', 'My Appointments', 'appointmentsView');
        html += sidebarItem('list-ordered', 'Waitlist', 'waitlistView');
        html += `<div class="sidebar-label">Tools</div>`;
        html += sidebarItem('clock', 'Wait Time', 'waitTimeView');
        html += sidebarItem('bot', 'AI Assistant', 'chatView');
    } else if (role === 'provider') {
        html += sidebarItem('calendar-check', 'My Appointments', 'appointmentsView');
        html += `<div class="sidebar-label">Management</div>`;
        html += sidebarItem('settings', 'Manage Slots', 'manageSlotsView');
        html += sidebarItem('check-circle', 'Confirmations', 'confirmationsView');
        html += sidebarItem('bar-chart-3', 'Analytics', 'analyticsDashView');
    } else if (role === 'admin') {
        html += sidebarItem('calendar-check', 'My Appointments', 'appointmentsView');
        html += `<div class="sidebar-label">Administration</div>`;
        html += sidebarItem('shield', 'Admin Panel', 'adminView');
        html += `<div class="sidebar-label">Tools</div>`;
        html += sidebarItem('clock', 'Wait Time', 'waitTimeView');
        html += sidebarItem('bot', 'AI Assistant', 'chatView');
    }

    html += sidebarItem('user', 'Profile', 'profileView');

    nav.innerHTML = html;
    renderIcons();

    // Set dashboard active
    const first = nav.querySelector('.sidebar-item');
    if (first) first.classList.add('active');
}

function sidebarItem(icon, label, viewId) {
    return `<div class="sidebar-item" data-view="${viewId}" onclick="showView('${viewId}', this)">
        <i data-lucide="${icon}"></i>
        <span>${label}</span>
    </div>`;
}

// ==================== VIEW SWITCH ====================
function showView(viewId, navEl) {
    closeMobileMenu();
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

    // Show target
    const view = document.getElementById(viewId);
    if (view) { view.classList.remove('hidden'); view.classList.add('active'); }

    // Sidebar active
    document.querySelectorAll('.sidebar-item').forEach(n => n.classList.remove('active'));
    if (navEl) {
        navEl.classList.add('active');
    } else {
        document.querySelectorAll('.sidebar-item').forEach(n => {
            if (n.dataset.view === viewId) n.classList.add('active');
        });
    }

    // Load data
    switch (viewId) {
        case 'dashboardView': loadDashboardOverview(); break;
        case 'slotsView': loadSlots(); break;
        case 'appointmentsView': loadMyAppointments(); break;
        case 'manageSlotsView': loadMySlots(); break;
        case 'confirmationsView': loadPendingConfirmations(); break;
        case 'analyticsDashView': loadProviderAnalytics(); break;
        case 'adminView': loadAdminPanel(); break;
        case 'waitlistView': loadMyWaitlist(); break;
        case 'waitTimeView': loadWaitTimeView(); break;
        case 'profileView': loadProfile(); break;
    }
}

// ==================== SKELETON ====================
function skeletonCards(count = 3) {
    return Array(count).fill('<div class="skeleton skeleton-card"></div>').join('');
}

function skeletonStats(count = 4) {
    return Array(count).fill('<div class="skeleton skeleton-stat"></div>').join('');
}

// ==================== DASHBOARD OVERVIEW ====================
async function loadDashboardOverview() {
    const statsRow = document.getElementById('statsRow');
    const list = document.getElementById('recentAppointments');

    statsRow.innerHTML = skeletonStats(4);

    try {
        // Load appointments for stats
        const data = await api('/appointments');
        const appts = data.data || [];

        const pending = appts.filter(a => a.status === 'pending').length;
        const confirmed = appts.filter(a => a.status === 'confirmed').length;
        const completed = appts.filter(a => a.status === 'completed').length;

        statsRow.innerHTML = `
            ${statCard('calendar', 'blue', appts.length, 'Total Bookings')}
            ${statCard('clock', 'yellow', pending, 'Pending')}
            ${statCard('check-circle', 'green', confirmed, 'Confirmed')}
            ${statCard('award', 'purple', completed, 'Completed')}
        `;
        renderIcons();

        // Recent appointments
        if (appts.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="calendar-x"></i>
                    <h3>No appointments yet</h3>
                    <p>Book your first appointment to get started</p>
                </div>
            `;
            renderIcons();
            return;
        }

        list.innerHTML = appts.slice(0, 5).map(a => apptCard(a)).join('');
        renderIcons();

        // Load directory
        loadDirectory();
    } catch (err) {
        statsRow.innerHTML = '';
        list.innerHTML = `<p style="color: var(--text-muted);">Could not load dashboard data</p>`;
    }
}

async function loadDirectory() {
    const container = document.getElementById('directoryList');
    const title = document.getElementById('directoryTitle');
    container.innerHTML = skeletonCards(3);

    const colors = ['#3B82F6,#8B5CF6', '#10B981,#06B6D4', '#F59E0B,#EF4444', '#8B5CF6,#EC4899', '#06B6D4,#3B82F6'];

    try {
        if (currentUser.role === 'provider') {
            title.textContent = 'Registered Patients';
            const data = await api('/directory/patients');
            if (data.data.length === 0) {
                container.innerHTML = '<div class="empty-state"><i data-lucide="users"></i><h3>No patients yet</h3><p>Patients will appear here once they register</p></div>';
                renderIcons();
                return;
            }
            container.innerHTML = data.data.map((p, i) => {
                const c = colors[i % colors.length];
                const initial = p.name.charAt(0).toUpperCase();
                return `<div class="slot-card" style="animation-delay: ${i * 0.05}s">
                    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
                        <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,${c});display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.3);flex-shrink:0;">${initial}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:16px;font-weight:700;letter-spacing:-0.2px;">${p.name}</div>
                            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${p.email}</div>
                        </div>
                        <span class="badge badge-confirmed">Patient</span>
                    </div>
                    <div class="slot-details" style="margin-bottom:0;">
                        <div class="slot-row"><i data-lucide="calendar"></i> Joined ${new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>`;
            }).join('');
        } else {
            title.textContent = 'Our Doctors';
            const data = await api('/directory/providers');
            if (data.data.length === 0) {
                container.innerHTML = '<div class="empty-state"><i data-lucide="stethoscope"></i><h3>No doctors yet</h3><p>Doctors will appear here once they register</p></div>';
                renderIcons();
                return;
            }
            container.innerHTML = data.data.map((d, i) => {
                const c = colors[i % colors.length];
                const initial = d.name.charAt(0).toUpperCase();
                return `<div class="slot-card" style="animation-delay: ${i * 0.05}s">
                    <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
                        <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,${c});display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.3);flex-shrink:0;">${initial}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:16px;font-weight:700;letter-spacing:-0.2px;">${d.name}</div>
                            <div style="font-size:12px;color:var(--primary-light);font-weight:600;margin-top:2px;">${d.specialization || 'General'}</div>
                        </div>
                        <span class="badge badge-available">Doctor</span>
                    </div>
                    <div class="slot-details" style="margin-bottom:0;">
                        <div class="slot-row"><i data-lucide="mail"></i> ${d.email}</div>
                        ${d.phone ? `<div class="slot-row"><i data-lucide="phone"></i> ${d.phone}</div>` : ''}
                    </div>
                </div>`;
            }).join('');
        }
        renderIcons();
    } catch (err) {
        container.innerHTML = '';
    }
}

function statCard(icon, color, value, label) {
    return `
        <div class="stat-card">
            <div class="stat-icon ${color}"><i data-lucide="${icon}"></i></div>
            <div class="stat-value">${value}</div>
            <div class="stat-label">${label}</div>
        </div>
    `;
}

// ==================== AVAILABLE SLOTS ====================
async function loadSlots() {
    const container = document.getElementById('slotsList');
    const empty = document.getElementById('noSlots');
    container.innerHTML = skeletonCards(6);
    empty.classList.add('hidden');

    try {
        const date = document.getElementById('filterDate').value;
        const q = date ? `?date=${date}` : '';
        const data = await api(`/slots${q}`);

        if (data.data.length === 0) {
            container.innerHTML = '';
            empty.classList.remove('hidden');
            renderIcons();
            return;
        }

        container.innerHTML = data.data.map((slot, i) => `
            <div class="slot-card" style="animation-delay: ${i * 0.04}s">
                <div class="slot-header">
                    <span class="slot-provider">${slot.provider?.user?.name || 'Provider'}</span>
                    <span class="badge badge-available">Available</span>
                </div>
                <div class="slot-details">
                    <div class="slot-row"><i data-lucide="calendar"></i> ${slot.date}</div>
                    <div class="slot-row"><i data-lucide="clock"></i> ${slot.startTime} — ${slot.endTime}</div>
                    <div class="slot-row"><i data-lucide="hash"></i> Slot #${slot.id}</div>
                </div>
                ${currentUser.role === 'user' ? `
                    <button class="btn btn-primary btn-full btn-sm" onclick="bookSlot(${slot.id})">
                        <i data-lucide="calendar-plus"></i> Book This Slot
                    </button>` : ''}
            </div>
        `).join('');
        renderIcons();
    } catch (err) {
        container.innerHTML = '';
        toast(err.message, 'error');
    }
}

function clearFilter() {
    document.getElementById('filterDate').value = '';
    loadSlots();
}

async function bookSlot(slotId) {
    try {
        const data = await api('/appointments', 'POST', { slotId });
        toast(data.message, 'success');
        loadSlots();
    } catch (err) {
        if (err.message.includes('already booked')) {
            if (confirm('Slot is taken. Join the waitlist?')) joinWaitlist(slotId);
        } else {
            toast(err.message, 'error');
        }
    }
}

async function joinWaitlist(slotId) {
    try {
        const data = await api('/waitlist', 'POST', { slotId });
        toast(data.message, 'success');
        // Refresh waitlist view if active, or just load slots
        if (document.getElementById('waitlistView').classList.contains('active')) {
            loadMyWaitlist();
        }
    } catch (err) {
        toast(err.message, 'error');
    }
}

// ==================== MY APPOINTMENTS ====================
async function loadMyAppointments() {
    const container = document.getElementById('appointmentsList');
    const empty = document.getElementById('noAppointments');
    container.innerHTML = skeletonCards(3);
    empty.classList.add('hidden');

    try {
        const data = await api('/appointments');
        if (data.data.length === 0) {
            container.innerHTML = '';
            empty.classList.remove('hidden');
            renderIcons();
            return;
        }

        container.innerHTML = data.data.map(a => apptCard(a)).join('');
        renderIcons();
    } catch (err) {
        container.innerHTML = '';
        toast(err.message, 'error');
    }
}

function apptCard(a) {
    const actions = a.status !== 'cancelled' && a.status !== 'completed' ? `
        <button class="btn btn-ghost btn-sm" onclick="openRescheduleModal(${a.id})"><i data-lucide="refresh-cw"></i> Reschedule</button>
        <button class="btn btn-danger btn-sm" onclick="cancelAppointment(${a.id})"><i data-lucide="x"></i> Cancel</button>
    ` : '';

    return `
        <div class="appt-card">
            <div class="appt-icon"><i data-lucide="stethoscope"></i></div>
            <div class="appt-info">
                <div class="appt-title">Dr. ${a.provider?.user?.name || 'Unknown'}</div>
                <div class="appt-meta" style="margin-top:4px; margin-bottom:8px;">
                    <span class="appt-detail" style="color:var(--text-secondary);"><i data-lucide="user"></i> Patient: ${a.user?.name || 'Unknown'}</span>
                </div>
                <div class="appt-meta">
                    <span class="appt-detail"><i data-lucide="calendar"></i> ${a.slot?.date || '—'}</span>
                    <span class="appt-detail"><i data-lucide="clock"></i> ${a.slot?.startTime || '—'} – ${a.slot?.endTime || '—'}</span>
                    <span class="badge badge-${a.status}">${a.status}</span>
                </div>
            </div>
            <div class="appt-actions">
                <button class="btn btn-ghost btn-sm" onclick="viewTimeline(${a.id})"><i data-lucide="history"></i> Timeline</button>
                ${actions}
            </div>
        </div>
    `;
}

async function cancelAppointment(id) {
    if (!confirm('Cancel this appointment?')) return;
    try {
        const data = await api(`/appointments/${id}`, 'DELETE');
        toast(data.message, 'success');
        loadMyAppointments();
    } catch (err) { toast(err.message, 'error'); }
}

function openRescheduleModal(apptId) {
    openModal('Reschedule Appointment', `
        <p style="color: var(--text-secondary); font-size: 13px;">Enter the new slot ID:</p>
        <div class="input-group">
            <label>New Slot ID</label>
            <div class="input-wrapper">
                <i data-lucide="hash"></i>
                <input type="number" id="newSlotId" placeholder="e.g. 5" min="1">
            </div>
        </div>
        <button class="btn btn-primary btn-full" onclick="rescheduleAppointment(${apptId})">
            <i data-lucide="check"></i> Confirm Reschedule
        </button>
    `);
    renderIcons();
}

async function rescheduleAppointment(id) {
    const val = document.getElementById('newSlotId').value;
    if (!val) { toast('Enter a slot ID', 'warning'); return; }
    try {
        const data = await api(`/appointments/${id}`, 'PUT', { newSlotId: parseInt(val) });
        toast(data.message, 'success');
        closeModal();
        loadMyAppointments();
    } catch (err) { toast(err.message, 'error'); }
}

// ==================== TIMELINE ====================
async function viewTimeline(id) {
    showView('timelineView');
    const container = document.getElementById('timelineContent');
    container.innerHTML = '<div class="skeleton skeleton-card"></div>';

    try {
        const data = await api(`/appointments/${id}/timeline`);
        const a = data.data.appointment;
        const tl = data.data.timeline;

        let html = `
            <div class="tl-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
                    <span style="font-weight:700; font-size: 16px;">Appointment #${a.id}</span>
                    <span class="badge badge-${a.status}">${a.status}</span>
                </div>
                <div class="slot-details">
                    <div class="slot-row"><i data-lucide="user"></i> ${a.provider?.user?.name || '—'}</div>
                    <div class="slot-row"><i data-lucide="calendar"></i> ${a.slot?.date || '—'}</div>
                    <div class="slot-row"><i data-lucide="clock"></i> ${a.slot?.startTime || '—'} – ${a.slot?.endTime || '—'}</div>
                </div>
            </div>
            <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 16px; color: var(--text-secondary);">Status History</h3>
        `;

        if (!tl || tl.length === 0) {
            html += '<p style="color: var(--text-muted);">No history recorded yet.</p>';
        } else {
            html += tl.map(t => `
                <div class="tl-item">
                    <div class="tl-dot"></div>
                    <div class="tl-time">${new Date(t.createdAt).toLocaleString()}</div>
                    <div class="tl-label">
                        ${t.fromStatus ? `<span class="badge badge-${t.fromStatus}" style="font-size:10px">${t.fromStatus}</span> → ` : ''}
                        <span class="badge badge-${t.toStatus}" style="font-size:10px">${t.toStatus}</span>
                    </div>
                    <div class="tl-meta">by ${t.changedBy}${t.reason ? ` — ${t.reason}` : ''}</div>
                </div>
            `).join('');
        }

        container.innerHTML = html;
        renderIcons();
    } catch (err) {
        container.innerHTML = `<p style="color: var(--red);">${err.message}</p>`;
    }
}

// ==================== PROVIDER: MANAGE SLOTS ====================
async function loadMySlots() {
    const container = document.getElementById('mySlotsList');
    container.innerHTML = skeletonCards(4);

    try {
        const data = await api('/slots?all=true');
        if (data.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="settings"></i>
                    <h3>No slots created</h3>
                    <p>Create your first time slot for patients to book</p>
                </div>
            `;
            renderIcons();
            return;
        }

        container.innerHTML = data.data.map((s, i) => `
            <div class="slot-card" style="animation-delay: ${i * 0.04}s">
                <div class="slot-header">
                    <span class="slot-provider">Slot #${s.id}</span>
                    <span class="badge ${s.isAvailable ? 'badge-available' : 'badge-booked'}">
                        ${s.isAvailable ? 'Available' : 'Booked'}
                    </span>
                </div>
                <div class="slot-details">
                    <div class="slot-row"><i data-lucide="calendar"></i> ${s.date}</div>
                    <div class="slot-row"><i data-lucide="clock"></i> ${s.startTime} — ${s.endTime}</div>
                </div>
                <button class="btn btn-danger btn-sm btn-full" onclick="deleteSlot(${s.id})">
                    <i data-lucide="trash-2"></i> Delete
                </button>
            </div>
        `).join('');
        renderIcons();
    } catch (err) { toast(err.message, 'error'); }
}

function openCreateSlotModal() {
    openModal('Create Time Slot', `
        <div class="input-group">
            <label>Date</label>
            <div class="input-wrapper"><i data-lucide="calendar"></i><input type="date" id="slotDate"></div>
        </div>
        <div class="input-group">
            <label>Start Time</label>
            <div class="input-wrapper"><i data-lucide="clock"></i><input type="time" id="slotStart"></div>
        </div>
        <div class="input-group">
            <label>End Time</label>
            <div class="input-wrapper"><i data-lucide="clock"></i><input type="time" id="slotEnd"></div>
        </div>
        <button class="btn btn-primary btn-full" onclick="createSlot()">
            <i data-lucide="plus"></i> Create Slot
        </button>
    `);
    renderIcons();
}

async function createSlot() {
    const date = document.getElementById('slotDate').value;
    const startTime = document.getElementById('slotStart').value;
    const endTime = document.getElementById('slotEnd').value;
    if (!date || !startTime || !endTime) { toast('Fill all fields', 'warning'); return; }
    try {
        const data = await api('/slots', 'POST', { date, startTime, endTime });
        toast(data.message, 'success');
        closeModal();
        loadMySlots();
    } catch (err) { toast(err.message, 'error'); }
}

async function deleteSlot(id) {
    if (!confirm('Delete this slot?')) return;
    try {
        await api(`/slots/${id}`, 'DELETE');
        toast('Slot deleted', 'success');
        loadMySlots();
    } catch (err) { toast(err.message, 'error'); }
}

// ==================== PROVIDER: CONFIRMATIONS ====================
async function loadPendingConfirmations() {
    const container = document.getElementById('pendingList');
    container.innerHTML = skeletonCards(3);

    try {
        const data = await api('/appointments');
        const pending = data.data.filter(a => a.status === 'pending');

        if (pending.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="check-circle"></i>
                    <h3>All caught up!</h3>
                    <p>No pending confirmations right now</p>
                </div>
            `;
            renderIcons();
            return;
        }

        container.innerHTML = pending.map(a => `
            <div class="appt-card">
                <div class="appt-icon"><i data-lucide="user-check"></i></div>
                <div class="appt-info">
                    <div class="appt-title">Appointment #${a.id}</div>
                    <div class="appt-meta">
                        <span class="appt-detail"><i data-lucide="user"></i> Patient #${a.userId}</span>
                        <span class="appt-detail"><i data-lucide="calendar"></i> ${a.slot?.date || '—'}</span>
                        <span class="appt-detail"><i data-lucide="clock"></i> ${a.slot?.startTime || '—'}</span>
                        <span class="badge badge-pending">Pending</span>
                    </div>
                </div>
                <div class="appt-actions">
                    <button class="btn btn-success btn-sm" onclick="confirmAppt(${a.id})"><i data-lucide="check"></i> Confirm</button>
                    <button class="btn btn-primary btn-sm" onclick="completeAppt(${a.id})"><i data-lucide="award"></i> Complete</button>
                </div>
            </div>
        `).join('');
        renderIcons();
    } catch (err) { toast(err.message, 'error'); }
}

async function confirmAppt(id) {
    try {
        const data = await api(`/appointments/${id}/confirm`, 'PATCH');
        toast(data.message, 'success');
        loadPendingConfirmations();
    } catch (err) { toast(err.message, 'error'); }
}

async function completeAppt(id) {
    try {
        const data = await api(`/appointments/${id}/complete`, 'PATCH');
        toast(data.message, 'success');
        loadPendingConfirmations();
    } catch (err) { toast(err.message, 'error'); }
}

// ==================== PROVIDER: ANALYTICS ====================
async function loadProviderAnalytics() {
    const statsEl = document.getElementById('providerStats');
    const tableEl = document.getElementById('providerUpcoming');
    statsEl.innerHTML = skeletonStats(4);

    try {
        const data = await api('/dashboard');
        const d = data.data;

        statsEl.innerHTML = `
            ${statCard('calendar', 'blue', d.todayBookings, "Today's Bookings")}
            ${statCard('clock', 'yellow', d.statusBreakdown.pending, 'Pending')}
            ${statCard('check-circle', 'green', d.statusBreakdown.confirmed, 'Confirmed')}
            ${statCard('award', 'purple', d.statusBreakdown.completed, 'Completed')}
        `;
        renderIcons();

        if (d.upcoming && d.upcoming.length > 0) {
            tableEl.innerHTML = `
                <table>
                    <thead><tr><th>ID</th><th>Patient</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
                    <tbody>${d.upcoming.map(u => `
                        <tr>
                            <td>#${u.appointmentId}</td>
                            <td>User #${u.patient}</td>
                            <td>${u.date}</td>
                            <td>${u.time}</td>
                            <td><span class="badge badge-${u.status}">${u.status}</span></td>
                        </tr>
                    `).join('')}</tbody>
                </table>
            `;
        } else {
            tableEl.innerHTML = '<p style="padding:20px; color:var(--text-muted);">No upcoming appointments</p>';
        }
    } catch (err) { toast(err.message, 'error'); }
}

// ==================== ADMIN ====================
async function loadAdminPanel() {
    const statsEl = document.getElementById('adminStats');
    const tableEl = document.getElementById('allAppointmentsList');
    statsEl.innerHTML = skeletonStats(4);

    try {
        const data = await api('/appointments/all');
        const all = data.data;

        const pending = all.filter(a => a.status === 'pending').length;
        const confirmed = all.filter(a => a.status === 'confirmed').length;
        const cancelled = all.filter(a => a.status === 'cancelled').length;

        statsEl.innerHTML = `
            ${statCard('calendar', 'blue', all.length, 'Total Appointments')}
            ${statCard('clock', 'yellow', pending, 'Pending')}
            ${statCard('check-circle', 'green', confirmed, 'Confirmed')}
            ${statCard('x-circle', 'red', cancelled, 'Cancelled')}
        `;
        renderIcons();

        if (all.length === 0) {
            tableEl.innerHTML = '<p style="padding:20px; color:var(--text-muted);">No appointments in the system</p>';
            return;
        }

        tableEl.innerHTML = `
            <table>
                <thead><tr><th>ID</th><th>Patient</th><th>Provider</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
                <tbody>${all.map(a => `
                    <tr>
                        <td>#${a.id}</td>
                        <td>${a.user?.name || '—'}</td>
                        <td>${a.provider?.user?.name || '—'}</td>
                        <td>${a.slot?.date || '—'}</td>
                        <td>${a.slot?.startTime || '—'} – ${a.slot?.endTime || '—'}</td>
                        <td><span class="badge badge-${a.status}">${a.status}</span></td>
                    </tr>
                `).join('')}</tbody>
            </table>
        `;
    } catch (err) { toast(err.message, 'error'); }
}

// ==================== WAITLIST ====================
async function loadMyWaitlist() {
    const container = document.getElementById('waitlistList');
    const empty = document.getElementById('noWaitlist');
    container.innerHTML = skeletonCards(2);
    empty.classList.add('hidden');

    try {
        const data = await api('/waitlist');
        if (data.data.length === 0) {
            container.innerHTML = '';
            empty.classList.remove('hidden');
            renderIcons();
            return;
        }

        container.innerHTML = data.data.map(w => `
            <div class="appt-card">
                <div class="appt-icon"><i data-lucide="list-ordered"></i></div>
                <div class="appt-info">
                    <div class="appt-title">Slot #${w.slotId} — ${w.slot?.provider?.user?.name || 'Provider'}</div>
                    <div class="appt-meta">
                        <span class="appt-detail"><i data-lucide="hash"></i> Position #${w.position}</span>
                        <span class="appt-detail"><i data-lucide="calendar"></i> ${w.slot?.date || '—'}</span>
                        <span class="appt-detail"><i data-lucide="clock"></i> ${w.slot?.startTime || '—'} – ${w.slot?.endTime || '—'}</span>
                        <span class="badge badge-${w.status}">${w.status}</span>
                    </div>
                    <div class="progress-bar" style="margin-top:8px">
                        <div class="progress-fill" style="width: ${Math.max(10, 100 - (w.position * 20))}%"></div>
                    </div>
                </div>
                ${w.status === 'waiting' ? `
                <div class="appt-actions">
                    <button class="btn btn-danger btn-sm" onclick="leaveWaitlist(${w.id})">
                        <i data-lucide="x"></i> Leave
                    </button>
                </div>` : ''}
            </div>
        `).join('');
        renderIcons();
    } catch (err) { toast(err.message, 'error'); }
}

async function joinWaitlist(slotId) {
    try {
        const data = await api('/waitlist', 'POST', { slotId });
        toast(data.message, 'success');
    } catch (err) { toast(err.message, 'error'); }
}

async function leaveWaitlist(id) {
    if (!confirm('Leave this waitlist?')) return;
    try {
        await api(`/waitlist/${id}`, 'DELETE');
        toast('Removed from waitlist', 'success');
        loadMyWaitlist();
    } catch (err) { toast(err.message, 'error'); }
}

// ==================== WAIT TIME ====================
function loadWaitTimeView() {
    const container = document.getElementById('waitTimeContent');
    container.innerHTML = `
        <div class="wt-search">
            <input type="number" id="wtProviderId" placeholder="Enter Provider ID (e.g. 1)" min="1">
            <button class="btn btn-primary" onclick="fetchWaitTime()"><i data-lucide="search"></i> Check</button>
        </div>
        <div id="wtResult"></div>
    `;
    renderIcons();
}

async function fetchWaitTime() {
    const pid = document.getElementById('wtProviderId').value;
    if (!pid) { toast('Enter a provider ID', 'warning'); return; }

    try {
        const data = await api(`/wait-time/${pid}`);
        const d = data.data;
        document.getElementById('wtResult').innerHTML = `
            <div class="wt-cards">
                <div class="wt-stat">
                    <div class="wt-stat-value">${d.estimatedWaitTime}</div>
                    <div class="wt-stat-label">Estimated Wait</div>
                </div>
                <div class="wt-stat">
                    <div class="wt-stat-value">${d.appointmentsAhead}</div>
                    <div class="wt-stat-label">Ahead of You</div>
                </div>
                <div class="wt-stat">
                    <div class="wt-stat-value">${d.averageAppointmentDuration}</div>
                    <div class="wt-stat-label">Avg Duration</div>
                </div>
                <div class="wt-stat">
                    <div class="wt-stat-value" style="font-size: 18px;">
                        ${typeof d.nextAvailableSlot === 'object' ? d.nextAvailableSlot.date : '—'}
                    </div>
                    <div class="wt-stat-label">
                        ${typeof d.nextAvailableSlot === 'object' ? `Next at ${d.nextAvailableSlot.time}` : d.nextAvailableSlot}
                    </div>
                </div>
            </div>
        `;
    } catch (err) { toast(err.message, 'error'); }
}

// ==================== CHATBOT ====================
async function sendChat(e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    addChat(msg, 'user');
    input.value = '';

    try {
        const data = await api('/chat', 'POST', { message: msg });
        let html = `<p>${data.reply || ''}</p>`;

        if (data.slots) {
            html += '<div style="margin-top:8px;">';
            data.slots.forEach(s => {
                html += `<div class="slot-row" style="margin:4px 0;font-size:12px;">
                    <i data-lucide="calendar" style="width:12px;height:12px;"></i>
                    <strong>${s.provider}</strong> — ${s.date} @ ${s.time} (Slot #${s.slotId})
                </div>`;
            });
            html += '</div>';
        }

        if (data.appointments) {
            data.appointments.forEach(a => {
                html += `<div class="slot-row" style="margin:4px 0;font-size:12px;">
                    <i data-lucide="clipboard" style="width:12px;height:12px;"></i>
                    #${a.id} — ${a.provider}, ${a.date} @ ${a.time}
                    <span class="badge badge-${a.status}" style="font-size:9px">${a.status}</span>
                </div>`;
            });
        }

        if (data.capabilities) {
            html += '<ul style="margin:8px 0; font-size:12px; padding-left:16px;">';
            data.capabilities.forEach(c => { html += `<li>${c}</li>`; });
            html += '</ul>';
        }

        if (data.suggestions) {
            html += '<div class="chip-row">';
            data.suggestions.forEach(s => {
                html += `<button class="chip" onclick="chatSuggestion('${s.replace(/'/g, "\\'")}')">${s}</button>`;
            });
            html += '</div>';
        }

        addChat(html, 'bot', true);
    } catch (err) {
        addChat(`Error: ${err.message}`, 'bot', true);
    }
}

function chatSuggestion(text) {
    document.getElementById('chatInput').value = text;
    document.getElementById('chatInput').focus();
}

function addChat(content, type, isHtml = false) {
    const container = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.className = `chat-msg ${type}`;

    const avatarClass = type === 'bot' ? 'bot-avatar' : 'user-chat-avatar';
    const avatarIcon = type === 'bot' ? 'bot' : 'user';

    msg.innerHTML = `
        <div class="chat-avatar ${avatarClass}"><i data-lucide="${avatarIcon}"></i></div>
        <div class="chat-content">${isHtml ? content : `<p>${content}</p>`}</div>
    `;

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    renderIcons();
}

// ==================== PROFILE ====================
function loadProfile() {
    const container = document.getElementById('profileContent');
    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
            <div class="profile-name">${currentUser.name}</div>
            <div class="profile-email">${currentUser.email}</div>
            <div class="profile-role">
                <span class="badge badge-confirmed">${currentUser.role}</span>
            </div>
        </div>
    `;
}

// ==================== MODAL ====================
function openModal(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalOverlay').classList.remove('hidden');
    renderIcons();
}

function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}

// ==================== UTILS ====================
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);

    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i data-lucide="eye-off"></i>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<i data-lucide="eye"></i>';
    }
    renderIcons();
}

// ==================== INIT ====================
(async function init() {
    renderIcons();
    if (token && currentUser) {
        try {
            // Verify the token is still valid and matches the actual user
            const data = await api('/me');
            currentUser = data.data;
            localStorage.setItem('user', JSON.stringify(currentUser));
            enterApp();
        } catch (err) {
            // Token is expired or invalid — clear and show login
            token = null;
            currentUser = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
})();
