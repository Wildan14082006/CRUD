const STORAGE_KEY = 'crud_app_data_v1';
const q = (s, el = document) => el.querySelector(s);    
const qs = (s, el = document) => Array.from(el.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Save data to localStorage
function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving data to localStorage', e);
    }
}

// Seed initial data
function seedData() {
    const s = [
        { id: uid(), name: 'Manto', email: 'manto123@gmail.com', role: 'Rektor', notes: 'lorem ipsum', createdAt: Date.now() },
        { id: uid(), name: 'Ramtzy', email: 'ramtzy123@gmail.com', role: 'Wakil Rektor', notes: 'lorem ipsum', createdAt: Date.now() }
    ];
    saveData(s);
    return s;
}

// Load data from localStorage
function loadData() {   
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : seedData();
    } catch (e) {
        console.error('Error loading data from localStorage', e);
        return seedData();
    }
}

const Views = {
    dashboard: renderDashboard,
    home: renderHome,
    add: renderAdd,
    edit: renderEdit,
    settings: renderSettings,
    about: renderAbout,
};

// ---------- Navigation ----------
function setActive(routeHash) {
    qs('#main-nav a').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === routeHash);
    });
}

// ---------- Router ----------
function router() {
    const hash = location.hash || '#/dashboard';
    const base = hash.startsWith('#/edit/') ? '#/edit' : hash.split('?')[0].split('/').slice(0, 2).join('/');
    setActive(base);
    if (hash.startsWith('#/edit/')) {
        Views.edit(hash.split('/')[2]);
        return;
    }
    const path = hash.slice(2).split('/')[0];
    const viewFn = Views[path] || Views.dashboard;
    viewFn();
}

// ---------- Render functions ----------
function renderDashboard() {
    const data = loadData();
    const root = q('#view-root');
    root.innerHTML = `
    <header class="hdr">
    <h2>Dashboard</h2>
    <div class="muted">Ringkasan</div></header>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
      <div class="card">
      <div class="muted">Total items</div>
      <div style="font-size:28px;font-weight:700">${data.length}</div>
      </div>
      <div class="card">
      <div class="muted">Admin</div>
      <div style="font-size:22px;font-weight:700">${data.filter(d => d.role === 'Admin').length}</div>
      </div>
      <div class="card">
      <div class="muted">User</div>
      <div style="font-size:22px;font-weight:700">${data.filter(d => d.role === 'User').length}</div>
      </div>
    </div>
    <div style="margin-top:16px" class="card">
      <div style="font-weight:600;margin-bottom:8px">Recent entries</div>
      ${data.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5).map(d => `
        <div style="padding:8px 0;border-bottom:1px solid #f1f5f9">
          <div style="display:flex;justify-content:space-between">
            <div><strong>${escapeHtml(d.name)}</strong> <span class="muted">(${d.role})</span></div>
            <div class="muted">${new Date(d.createdAt || Date.now()).toLocaleString()}</div>
          </div>
          <div class="muted" style="font-size:13px">${escapeHtml(d.email)} — ${escapeHtml(d.notes)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// Home / List view
function renderHome() {
    const data = loadData();
    const root = q('#view-root');
    root.innerHTML = `
    <header class="hdr"><h2>Home — Tabel</h2>
      <div>
        <input id="search" placeholder="Cari nama atau email..." style="padding:8px;border-radius:8px;border:1px solid #e6e9f2;margin-right:8px">
        <button class="btn" id="btn-add">➕ Tambah</button>
      </div>
    </header>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="muted">Tabel data sekarang</div>
        <div class="muted">Total: <strong>${data.length}</strong></div>
      </div>
      <table id="table-main">
        <thead><tr>
        <th>#</th>
        <th>Nama</th>
        <th>Email</th>
        <th>Role</th>
        <th>Catatan</th>
        <th>Aksi</th>
        </tr>
        </thead>
        <tbody>${data.map((d, i) => `
          <tr data-id="${d.id}">
            <td>${i + 1}</td>
            <td>${escapeHtml(d.name)}</td>
            <td>${escapeHtml(d.email)}</td>
            <td>${escapeHtml(d.role)}</td>
            <td>${escapeHtml(d.notes)}</td>
            <td>
              <button class="btn ghost btn-edit" data-id="${d.id}">Edit</button>
              <button class="btn danger btn-delete small" data-id="${d.id}">Hapus</button>
            </td>
          </tr>
        `).join('')}</tbody>
      </table>
    </div>
  `;

    // Event bindings and handlers
    q('#btn-add').addEventListener('click', () => location.hash = '#/add');
    q('#search').addEventListener('input', (e) => {
        const qstr = e.target.value.toLowerCase();
        qs('#table-main tbody tr').forEach(tr => {
            const name = tr.children[1].textContent.toLowerCase();
            const email = tr.children[2].textContent.toLowerCase();
            tr.style.display = (name.includes(qstr) || email.includes(qstr)) ? '' : 'none';
        });
    });
    qs('.btn-edit').forEach(b => b.addEventListener('click', e => {
        const id = e.currentTarget.getAttribute('data-id');
        location.hash = '#/edit/' + id;
    }));
    qs('.btn-delete').forEach(b => b.addEventListener('click', e => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Yakin ingin menghapus data ini?')) {
            let arr = loadData();
            arr = arr.filter(x => x.id !== id);
            saveData(arr);
            renderHome();
        }
    }));
}

// Add view and form
function renderAdd() {
    const root = q('#view-root');
    root.innerHTML = `
    <header class="hdr">
    <h2>Tambah Data</h2>
    <div class="muted">Isi form di bawah</div>
    </header>
    <div class="card">
      <form id="form-add" class="row">
        <div><label>Nama</label>
        <input type="text" id="f-name" required /></div>
        <div>
        <label>Email</label><input type="text" id="f-email" />
        </div>
        <div>
        <label>Role</label>
        <select id="f-role">
        <option>Admin</option>
        <option selected>User</option>
        </select>
        </div>
        <div>
        <label>Umur (optional)</label>
        <input type="number" id="f-age" />
        </div>
        <div class="full">
        <label>Catatan</label><textarea id="f-notes" rows="3"></textarea>
        </div>
        <div class="controls full">
          <button class="btn" type="submit">Simpan</button>
          <button class="btn ghost" id="cancel-add" type="button">Batal</button>
        </div>
      </form>
    </div>`;
    q('#cancel-add').addEventListener('click', () => location.hash = '#/home');
    q('#form-add').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const name = q('#f-name').value.trim();
        const email = q('#f-email').value.trim();
        const role = q('#f-role').value;
        const notes = q('#f-notes').value.trim();
        const item = { id: uid(), name, email, role, notes, createdAt: Date.now() };
        const arr = loadData();
        arr.push(item);
        saveData(arr);
        location.hash = '#/home';
    });
}

// Edit view with delete
function renderEdit(id) {
    const arr = loadData();
    const item = arr.find(x => x.id === id);
    const root = q('#view-root');
    if (!item) {
        root.innerHTML = `<div class="muted">Data tidak ditemukan. <button class="btn" onclick="location.hash='#/home'">Kembali</button></div>`;
        return;
    }
    root.innerHTML = `
    <header class="hdr">
    <h2>Edit Data</h2>
    <div class="muted">Mengubah: <strong>${escapeHtml(item.name)}</strong>
    </div>
    </header>
    <div class="card">
      <form id="form-edit" class="row">
        <div><label>Nama</label><input type="text" id="f-name" value="${escapeAttr(item.name)}" required />
        </div>
        <div>
        <label>Email</label>
        <input type="text" id="f-email" value="${escapeAttr(item.email)}" />
        </div>
        <div>
        <label>Role</label>
        <select id="f-role"><option ${item.role === 'Admin' ? 'selected' : ''}>Admin</option><option ${item.role === 'User' ? 'selected' : ''}>User</option>
        </select>
        </div>
        <div>
        <label>Umur (optional)</label>
        <input type="number" id="f-age" />
        </div>
        <div class="full">
        <label>Catatan</label>
        <textarea id="f-notes" rows="3">${escapeAttr(item.notes)}</textarea>
        </div>
        <div class="controls full">
          <button class="btn" type="submit">Update</button>
          <button class="btn ghost" id="cancel-edit" type="button">Batal</button>
          <button class="btn danger" id="btn-delete" type="button">Hapus</button>
        </div>
      </form>
    </div>
  `;
    q('#cancel-edit').addEventListener('click', () => location.hash = '#/home');
    q('#form-edit').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const name = q('#f-name').value.trim();
        const email = q('#f-email').value.trim();
        const role = q('#f-role').value;
        const notes = q('#f-notes').value.trim();
        const idx = arr.findIndex(x => x.id === id);
        if (idx > -1) {
            arr[idx] = { ...arr[idx], name, email, role, notes };
            saveData(arr);
            location.hash = '#/home';
        }
    });
    q('#btn-delete').addEventListener('click', () => {
        if (confirm('Hapus data ini permanen?')) {
            const newArr = arr.filter(x => x.id !== id);
            saveData(newArr);
            location.hash = '#/home';
        }
    });
}

// Settings view
function renderSettings() {
    const root = q('#view-root');
    root.innerHTML = `
    <header class="hdr">
    <h2>Settings</h2>
    <div class="muted">Import / Export</div>
    </header>
    <div class="card">
      <div style="margin-bottom:12px">
      <div class="muted">Reset data</div>
      <div class="small">Hapus semua data dan kembalikan ke sample default.</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn danger" id="btn-reset">Reset Data</button>
        <button class="btn ghost" id="btn-export-csv">Export CSV</button>
        <button class="btn ghost" id="btn-export-json">Export JSON</button>
        <button class="btn" id="btn-import-csv">Import CSV</button>
        <button class="btn ghost" id="btn-import-json">Import JSON</button>
      </div>
      <input type="file" id="csvFileInput" accept=".csv" style="display:none">
      <div id="import-area" style="margin-top:12px;display:none">
        <textarea id="import-json" rows="6" style="width:100%;padding:8px;border-radius:8px;border:1px solid #e6e9f2"></textarea>
        <div style="margin-top:8px">
          <button class="btn" id="do-import-json">Lakukan Import JSON</button>
          <button class="btn ghost" id="cancel-import-json">Batal</button>
        </div>
      </div>
    </div>
  `;
    q('#btn-reset').addEventListener('click', () => {       
        if (confirm('Yakin ingin menghapus semua data dan kembalikan ke default?')) {
            localStorage.removeItem(STORAGE_KEY);
            seedData();
            alert('Data telah direset.');
            router();
        }
    });

    q('#btn-export-json').addEventListener('click', () => {
        const data = loadData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'crud-data-export.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    q('#btn-export-csv').addEventListener('click', () => {
        const data = loadData();
        const csv = arrayToCsv(data, ['id', 'name', 'email', 'role', 'notes', 'createdAt']);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'crud-data-export.csv';
        a.click();
        URL.revokeObjectURL(url);
    });

    // CSV import processing
    const csvInput = q('#csvFileInput');
    q('#btn-import-csv').addEventListener('click', () => csvInput.click());
    csvInput.addEventListener('change', (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const arr = csvToArray(text);
                let parsed = [];
                if (arr.length === 0) {
                    alert('CSV kosong');
                    return;
                }
                if (typeof arr[0] === 'object' && !Array.isArray(arr[0])) {
                    parsed = arr.map(r => {
                        return {
                            id: r.id ? String(r.id) : uid(),
                            name: r.name || r.nama || '',
                            email: r.email || '',
                            role: r.role || '',
                            notes: r.notes || r.catatan || '',
                            createdAt: r.createdAt || r.createdat || r.created_at ? Number(r.createdAt || r.createdat || r.created_at) : Date.now()
                        };
                    });
                } else {
                    parsed = arr.map(cols => {
                        if (cols.length >= 6) {
                            return {
                                id: cols[0] || uid(),
                                name: cols[1] || '',
                                email: cols[2] || '',
                                role: cols[3] || '',
                                notes: cols[4] || '',
                                createdAt: cols[5] ? Number(cols[5]) : Date.now()
                            };
                        } else {
                            return {
                                id: uid(),
                                name: cols[0] || '',
                                email: cols[1] || '',
                                role: cols[2] || '',
                                notes: cols[3] || '',
                                createdAt: Date.now()
                            };
                        }
                    });
                }

                // Merge with existing data
                const existing = loadData();
                const merged = existing.concat(parsed);
                saveData(merged);
                alert('Import CSV sukses. Baris ditambahkan: ' + parsed.length);
                csvInput.value = '';
                router();
            } catch (err) {
                alert('Gagal mengimport CSV: ' + err.message);
            }
        };
        reader.readAsText(file, 'utf8');
    });

    // JSON import
    q('#btn-import-json').addEventListener('click', () => {
        q('#import-area').style.display = 'block';
    });
    q('#cancel-import-json').addEventListener('click', () => {
        q('#import-area').style.display = 'none';
    });
    q('#do-import-json').addEventListener('click', () => {
        const raw = q('#import-json').value.trim();
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                saveData(parsed);
                alert('Import JSON sukses!');
                q('#import-area').style.display = 'none';
                router();
            } else {
                alert('Format JSON harus berupa array.');
            }
        } catch (e) {
            alert('JSON tidak valid.');
        }
    });
}

// About view
function renderAbout() {
    const root = q('#view-root');
    root.innerHTML = `
    <header class="hdr"><h2>About</h2><div class="muted">Tentang aplikasi</div></header>
    <div class="card">
      <p>CRUD sederhana menggunakan <strong>HTML/CSS/JS</strong> tanpa backend. Data disimpan di localStorage.</p>
      <p class="muted">CSV import akan membaca header jika ada. Header yang dikenali: id, name, nama, email, role, notes, catatan, createdAt, created_at</p>
    </div>
  `;
}

// ---------- CSV helpers ----------
function escapeCsvField(str) {
    if (str === null || str === undefined) return '';
    str = String(str);
    if (str.includes('"')) str = str.replaceAll('"', '""');
    if (str.includes(',') || str.includes('\n') || str.includes('"')) return `"${str}"`;
    return str;
}

// Converts array of objects to CSV string
function arrayToCsv(arr, keys) {
    const header = keys.join(',');
    const lines = arr.map(item => keys.map(k => escapeCsvField(item[k] ?? '')).join(','));
    return [header].concat(lines).join('\n');
}

// Parses CSV string into array of objects (if header detected) or array of arrays
function csvToArray(str) {
    const rows = [];
    let cur = '';
    let row = [];
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === '"') {
            if (inQuotes && str[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (ch === ',' && !inQuotes) {
            row.push(cur);
            cur = '';
            continue;
        }
        if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && str[i + 1] === '\n') { /* windows newline */ }
            if (cur !== '' || row.length > 0) {
                row.push(cur);
                rows.push(row);
                row = [];
                cur = '';
            }
            if (ch === '\r' && str[i + 1] === '\n') i++;
            continue;
        }
        cur += ch;
    }
    if (cur !== '' || row.length > 0) {
        row.push(cur);
        rows.push(row);
    }
    if (rows.length > 0 && rows[0][0] && rows[0][0].charCodeAt(0) === 0xFEFF) {
        rows[0][0] = rows[0][0].slice(1);
    }

    if (rows.length === 0) return [];
    const first = rows[0].map(c => c.trim().toLowerCase());
    const commonHeaders = ['id', 'name', 'nama', 'email', 'role', 'notes', 'catatan', 'createdat', 'created_at'];
    const headerDetected = first.some(h => commonHeaders.includes(h));
    if (headerDetected) {
        const headers = rows[0].map(h => h.trim());
        const objs = [];
        for (let r = 1; r < rows.length; r++) {
            const cols = rows[r];
            if (cols.length === 1 && cols[0] === '') continue;
            const obj = {};
            for (let c = 0; c < headers.length; c++) {
                obj[headers[c]] = (cols[c] !== undefined) ? cols[c] : '';
            }
            objs.push(obj);
        }
        return objs;
    } else {
        return rows;
    }
}

// ---------- helpers ----------
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function escapeAttr(str) {
    return str ? str.replaceAll('"', '&quot;') : '';
}

// ---------- Init ----------
window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
    if (!localStorage.getItem(STORAGE_KEY)) seedData();
    router();
});