/* =============================================
   CampaignOS — UI Controller
   _js/ui.js
   ============================================= */

const CampaignUI = (() => {

  /* ---- State ---- */
  let currentFilter = 'all';
  let currentSearch = '';
  let editingId     = null;
  let uploadedImage = null; // base64 data URL

  /* ---- DOM refs ---- */
  const sidebar      = () => document.getElementById('sidebar');
  const mainContent  = () => document.getElementById('main-content');
  const tableBody    = () => document.getElementById('campaignTable');
  const countEl      = () => document.getElementById('campaignCount');
  const toastCont    = () => document.getElementById('toastContainer');
  const modal        = () => document.getElementById('campaignModal');
  const modalTitle   = () => document.getElementById('modalTitle');

  /* ============================================================
     SIDEBAR
  ============================================================ */

  function initSidebar() {
    const btn = document.getElementById('sidebarToggle');
    if (!btn) return;
    btn.addEventListener('click', toggleSidebar);

    // Mobile overlay close
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeMobileSidebar);
  }

  function toggleSidebar() {
    const sb = sidebar();
    const mc = mainContent();
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      sb.classList.toggle('mobile-open');
      document.getElementById('sidebarOverlay')?.classList.toggle('hidden');
    } else {
      sb.classList.toggle('collapsed');
      mc.classList.toggle('sidebar-collapsed');
      // Save preference
      localStorage.setItem('sidebar-collapsed', sb.classList.contains('collapsed'));
    }
  }

  function closeMobileSidebar() {
    sidebar().classList.remove('mobile-open');
    document.getElementById('sidebarOverlay')?.classList.add('hidden');
  }

  function restoreSidebarState() {
    if (window.innerWidth >= 768) {
      const collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
      if (collapsed) {
        sidebar().classList.add('collapsed');
        mainContent().classList.add('sidebar-collapsed');
      }
    }
  }

  /* ============================================================
     STATS
  ============================================================ */

  function refreshStats() {
    const s = CampaignData.getStats();
    setEl('stat-live',      s.live);
    setEl('stat-scheduled', s.scheduled);
    setEl('stat-draft',     s.draft);
    setEl('stat-total',     s.total);
  }

  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ============================================================
     TABLE
  ============================================================ */

  function renderTable() {
    const rows = CampaignData.query({ filter: currentFilter, search: currentSearch });
    if (countEl()) countEl().textContent = rows.length;

    if (!rows.length) {
      tableBody().innerHTML = `
        <tr>
          <td colspan="8">
            <div class="flex flex-col items-center justify-center py-16 gap-3">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style="opacity:.25">
                <rect x="4" y="8" width="32" height="24" rx="4" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 20h16M12 15h10M12 25h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span style="color:var(--text3);font-size:13px">找不到符合條件的活動</span>
            </div>
          </td>
        </tr>`;
      return;
    }

    tableBody().innerHTML = rows.map(c => buildRow(c)).join('');
  }

  function buildRow(c) {
    const thumbHtml = c.image
      ? `<img src="${c.image}" class="campaign-thumb-img" alt="${c.name}">`
      : `<div class="campaign-thumb-placeholder">${c.type}</div>`;

    const progressHtml = c.progress > 0
      ? `<div class="progress-bar-track w-24">
           <div class="progress-bar-fill" style="width:${c.progress}%;background:${progressColor(c.progress)}"></div>
         </div>
         <span style="font-size:11px;color:var(--text3);margin-top:2px">${c.progress}%</span>`
      : `<span style="color:var(--text3);font-size:12px">—</span>`;

    const canPublish   = c.status === 'draft' || c.status === 'scheduled';
    const canUnpublish = c.status === 'live';

    const toggleHtml = (canPublish || canUnpublish)
      ? `<button class="toggle-btn ${c.status === 'live' ? 'on' : 'off'}"
                 title="${c.status === 'live' ? '下架' : '上架'}"
                 onclick="CampaignUI.handleToggle(${c.id}, event)"></button>`
      : `<span class="inline-block" style="width:38px"></span>`;

    return `
    <tr style="border-bottom:1px solid var(--border);transition:background .12s;cursor:pointer"
        onmouseenter="this.style.background='var(--bg3)'"
        onmouseleave="this.style.background=''">
      <td style="padding:14px 20px">
        <div class="flex items-center gap-3">
          ${thumbHtml}
          <div>
            <div style="font-size:13.5px;font-weight:500;color:var(--text)">${c.name}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:1px">${c.typeName}</div>
          </div>
        </div>
      </td>
      <td style="padding:14px 20px">${badgeHtml(c.status)}</td>
      <td style="padding:14px 20px;font-size:12px;color:var(--text3)">${c.start || '—'}</td>
      <td style="padding:14px 20px;font-size:12px;color:var(--text3)">${c.end   || '—'}</td>
      <td style="padding:14px 20px">
        <div class="flex flex-col gap-1">${progressHtml}</div>
      </td>
      <td style="padding:14px 20px;font-size:12.5px;color:var(--text2)">${c.owner}</td>
      <td style="padding:14px 20px">
        <div class="row-actions items-center gap-2">
          ${toggleHtml}
          <button class="action-btn" title="編輯" onclick="CampaignUI.openEditModal(${c.id})">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M10 3l3 3L5 14H2v-3L10 3z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="none"/>
            </svg>
          </button>
          <button class="action-btn" title="預覽圖片" onclick="CampaignUI.previewCampaign(${c.id})">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M1.5 8C3.5 4.5 12.5 4.5 14.5 8C12.5 11.5 3.5 11.5 1.5 8Z" stroke="currentColor" stroke-width="1.3" fill="none"/>
              <circle cx="8" cy="8" r="2" fill="currentColor"/>
            </svg>
          </button>
          <button class="action-btn" title="刪除" onclick="CampaignUI.handleDelete(${c.id})">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 5h10M6 5V3h4v2M4 5l1 8h6l1-8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>`;
  }

  function badgeHtml(status) {
    const map = {
      live:      ['badge-live',  '上架中'],
      draft:     ['badge-draft', '草稿'],
      scheduled: ['badge-sched', '排程中'],
      ended:     ['badge-ended', '已下架'],
    };
    const [cls, label] = map[status] || ['badge-draft', status];
    return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
  }

  function progressColor(p) {
    if (p >= 70) return 'var(--green)';
    if (p >= 30) return 'var(--amber)';
    return 'var(--blue)';
  }

  /* ============================================================
     FILTER & SEARCH
  ============================================================ */

  function setFilter(type, btn) {
    currentFilter = type;
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTable();
  }

  function setSearch(val) {
    currentSearch = val;
    renderTable();
  }

  /* ============================================================
     ACTIONS
  ============================================================ */

  function handleToggle(id, e) {
    e.stopPropagation();
    const c = CampaignData.getById(id);
    if (!c) return;

    if (c.status === 'live') {
      CampaignData.unpublish(id);
      showToast(`已下架：${c.name}`, 'warning');
    } else {
      CampaignData.publish(id);
      showToast(`已上架：${c.name}`, 'success');
    }
    refreshStats();
    renderTable();
  }

  function handleDelete(id) {
    const c = CampaignData.getById(id);
    if (!c) return;
    if (c.status === 'live') {
      showToast('請先下架活動再刪除', 'warning');
      return;
    }
    if (confirm(`確定要刪除「${c.name}」？此操作無法復原。`)) {
      CampaignData.remove(id);
      showToast(`已刪除：${c.name}`, 'success');
      refreshStats();
      renderTable();
    }
  }

  function previewCampaign(id) {
    const c = CampaignData.getById(id);
    if (!c) return;

    const overlay = document.getElementById('previewModal');
    const img     = document.getElementById('previewImg');
    const noImg   = document.getElementById('previewNoImg');
    const nameEl  = document.getElementById('previewName');
    const descEl  = document.getElementById('previewDesc');
    const statEl  = document.getElementById('previewStatus');

    nameEl.textContent = c.name;
    descEl.textContent = c.description || '（無描述）';
    statEl.innerHTML   = badgeHtml(c.status);

    if (c.image) {
      img.src = c.image;
      img.classList.remove('hidden');
      noImg.classList.add('hidden');
    } else {
      img.classList.add('hidden');
      noImg.classList.remove('hidden');
    }

    overlay.classList.add('visible');
  }

  /* ============================================================
     MODAL — Create / Edit
  ============================================================ */

  function openCreateModal() {
    editingId     = null;
    uploadedImage = null;
    modalTitle().textContent = '建立新活動';
    document.getElementById('submitBtn').textContent = '建立草稿';
    resetForm();
    modal().classList.add('visible');
  }

  function openEditModal(id) {
    const c = CampaignData.getById(id);
    if (!c) return;
    editingId     = id;
    uploadedImage = c.image;
    modalTitle().textContent = '編輯活動';
    document.getElementById('submitBtn').textContent = '儲存變更';
    populateForm(c);
    modal().classList.add('visible');
  }

  function closeModal(modalId = 'campaignModal') {
    document.getElementById(modalId)?.classList.remove('visible');
  }

  function resetForm() {
    ['fName','fOwner','fStart','fEnd','fDesc'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('fType').value = '🛒';
    clearImagePreview();
  }

  function populateForm(c) {
    document.getElementById('fName').value  = c.name;
    document.getElementById('fOwner').value = c.owner;
    document.getElementById('fStart').value = c.start || '';
    document.getElementById('fEnd').value   = c.end   || '';
    document.getElementById('fDesc').value  = c.description || '';
    document.getElementById('fType').value  = c.type || '🛒';

    if (c.image) {
      showImagePreview(c.image);
    } else {
      clearImagePreview();
    }
  }

  function submitForm() {
    const name = document.getElementById('fName').value.trim();
    if (!name) { showToast('請輸入活動名稱', 'warning'); return; }

    const typeEl  = document.getElementById('fType');
    const typeOpt = typeEl.options[typeEl.selectedIndex];
    const payload = {
      name,
      type:        typeEl.value,
      typeName:    typeOpt.dataset.name || '電商促銷',
      start:       document.getElementById('fStart').value,
      end:         document.getElementById('fEnd').value,
      owner:       document.getElementById('fOwner').value.trim() || '未知',
      description: document.getElementById('fDesc').value.trim(),
      image:       uploadedImage
    };

    if (editingId) {
      CampaignData.update(editingId, payload);
      showToast(`已更新：${name}`, 'success');
    } else {
      CampaignData.create(payload);
      showToast(`草稿已建立：${name}`, 'success');
    }

    closeModal();
    refreshStats();
    renderTable();
  }

  /* ============================================================
     IMAGE UPLOAD
  ============================================================ */

  function initUploadZone() {
    const zone   = document.getElementById('uploadZone');
    const input  = document.getElementById('imageInput');
    if (!zone || !input) return;

    zone.addEventListener('click',     () => input.click());
    zone.addEventListener('dragover',  e  => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop',      e  => {
      e.preventDefault();
      zone.classList.remove('dragover');
      handleFile(e.dataTransfer.files[0]);
    });

    input.addEventListener('change', () => handleFile(input.files[0]));
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('請上傳圖片檔案（JPG / PNG / WebP）', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('圖片大小請勿超過 5MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      uploadedImage = e.target.result;
      showImagePreview(uploadedImage);
    };
    reader.readAsDataURL(file);
  }

  function showImagePreview(src) {
    const zone    = document.getElementById('uploadZone');
    const preview = document.getElementById('imgPreview');
    const hint    = document.getElementById('uploadHint');
    const removeBtn = document.getElementById('removeImgBtn');

    if (!zone) return;
    zone.classList.add('has-image');
    preview.src = src;
    preview.classList.remove('hidden');
    hint.classList.add('hidden');
    removeBtn.classList.remove('hidden');
  }

  function clearImagePreview() {
    uploadedImage = null;
    const zone    = document.getElementById('uploadZone');
    const preview = document.getElementById('imgPreview');
    const hint    = document.getElementById('uploadHint');
    const removeBtn = document.getElementById('removeImgBtn');
    const input   = document.getElementById('imageInput');

    if (!zone) return;
    zone.classList.remove('has-image');
    preview.src = '';
    preview.classList.add('hidden');
    hint.classList.remove('hidden');
    removeBtn.classList.add('hidden');
    if (input) input.value = '';
  }

  /* ============================================================
     TOAST
  ============================================================ */

  function showToast(msg, type = 'success') {
    const container = toastCont();
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconSvg = type === 'success'
      ? `<svg width="10" height="10" viewBox="0 0 12 12" fill="none">
           <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
         </svg>`
      : `<svg width="10" height="10" viewBox="0 0 12 12" fill="none">
           <path d="M6 3v4M6 9v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
         </svg>`;

    const iconBg = type === 'success'
      ? 'background:var(--green-dim);color:var(--green)'
      : 'background:var(--amber-dim);color:var(--amber)';

    toast.innerHTML = `
      <span style="width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;${iconBg}">
        ${iconSvg}
      </span>
      <span>${msg}</span>`;

    container.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }

  /* ============================================================
     INIT
  ============================================================ */

  function init() {
    initSidebar();
    restoreSidebarState();
    refreshStats();
    renderTable();

    // Search
    document.getElementById('searchInput')?.addEventListener('input', e => setSearch(e.target.value));

    // Modal close on overlay click
    modal()?.addEventListener('click', e => {
      if (e.target === modal()) closeModal();
    });
    document.getElementById('previewModal')?.addEventListener('click', e => {
      if (e.target.id === 'previewModal') closeModal('previewModal');
    });

    // Upload zone (init deferred until modal is opened)
    document.addEventListener('modalOpened', initUploadZone);
  }

  return {
    init,
    renderTable,
    refreshStats,
    setFilter,
    setSearch,
    handleToggle,
    handleDelete,
    previewCampaign,
    openCreateModal,
    openEditModal,
    closeModal,
    submitForm,
    clearImagePreview,
    showToast
  };

})();
