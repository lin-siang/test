/* =============================================
   CampaignOS — Data & State Module
   _js/data.js
   ============================================= */

const CampaignData = (() => {

  /* ---------- Initial Dataset ---------- */
  let campaigns = [
    {
      id: 1,
      name: '618 夏季購物節',
      type: '🛒',
      typeName: '電商促銷',
      status: 'live',
      start: '2025-06-01',
      end: '2025-06-18',
      owner: '王小華',
      progress: 62,
      image: null,
      description: '年中最大促銷活動，全館商品最高 6 折起。'
    },
    {
      id: 2,
      name: '母親節限定優惠',
      type: '🎉',
      typeName: '節慶活動',
      status: 'live',
      start: '2025-05-08',
      end: '2025-05-12',
      owner: '陳小明',
      progress: 90,
      image: null,
      description: '感謝媽媽，精選禮品組合特惠。'
    },
    {
      id: 3,
      name: '新品上市推廣',
      type: '📱',
      typeName: '社群推廣',
      status: 'live',
      start: '2025-06-10',
      end: '2025-06-30',
      owner: '林美玲',
      progress: 35,
      image: null,
      description: '全新系列商品發布，社群首波曝光活動。'
    },
    {
      id: 4,
      name: 'VIP 會員早鳥活動',
      type: '🎯',
      typeName: '精準投放',
      status: 'live',
      start: '2025-06-05',
      end: '2025-06-15',
      owner: '張大偉',
      progress: 78,
      image: null,
      description: '針對 VIP 會員的專屬早鳥優惠活動。'
    },
    {
      id: 5,
      name: '端午節限定好禮',
      type: '🎉',
      typeName: '節慶活動',
      status: 'live',
      start: '2025-06-09',
      end: '2025-06-11',
      owner: '王小華',
      progress: 55,
      image: null,
      description: '端午粽情好禮，限時三天特賣。'
    },
    {
      id: 6,
      name: '暑假旅遊特輯',
      type: '📧',
      typeName: 'Email 行銷',
      status: 'scheduled',
      start: '2025-07-01',
      end: '2025-08-31',
      owner: '陳小明',
      progress: 0,
      image: null,
      description: '暑假旅遊主題 EDM，鎖定親子家庭族群。'
    },
    {
      id: 7,
      name: '七夕情人節活動',
      type: '🎉',
      typeName: '節慶活動',
      status: 'scheduled',
      start: '2025-08-05',
      end: '2025-08-07',
      owner: '林美玲',
      progress: 0,
      image: null,
      description: '七夕限定禮品組合與情侶優惠方案。'
    },
    {
      id: 8,
      name: '週年慶預熱',
      type: '🛒',
      typeName: '電商促銷',
      status: 'scheduled',
      start: '2025-09-01',
      end: '2025-09-10',
      owner: '張大偉',
      progress: 0,
      image: null,
      description: '週年慶前導活動，預告主打商品與折扣。'
    },
    {
      id: 9,
      name: 'Q3 品牌形象廣告',
      type: '📱',
      typeName: '社群推廣',
      status: 'draft',
      start: '',
      end: '',
      owner: '王小華',
      progress: 0,
      image: null,
      description: ''
    },
    {
      id: 10,
      name: '雙 11 預備企劃',
      type: '🛒',
      typeName: '電商促銷',
      status: 'draft',
      start: '',
      end: '',
      owner: '林美玲',
      progress: 0,
      image: null,
      description: ''
    },
    {
      id: 11,
      name: '聖誕節倒數活動',
      type: '🎉',
      typeName: '節慶活動',
      status: 'draft',
      start: '',
      end: '',
      owner: '陳小明',
      progress: 0,
      image: null,
      description: ''
    },
    {
      id: 12,
      name: '新年跨年直播',
      type: '📱',
      typeName: '社群推廣',
      status: 'draft',
      start: '',
      end: '',
      owner: '張大偉',
      progress: 0,
      image: null,
      description: ''
    }
  ];

  let nextId = 13;

  /* ---------- CRUD Methods ---------- */

  function getAll() { return [...campaigns]; }

  function getById(id) {
    return campaigns.find(c => c.id === id) || null;
  }

  function create(payload) {
    const newCampaign = {
      id: nextId++,
      name: payload.name,
      type: payload.type || '🛒',
      typeName: payload.typeName || '電商促銷',
      status: 'draft',
      start: payload.start || '',
      end: payload.end || '',
      owner: payload.owner || '未知',
      progress: 0,
      image: payload.image || null,
      description: payload.description || ''
    };
    campaigns.unshift(newCampaign);
    return newCampaign;
  }

  function update(id, payload) {
    const idx = campaigns.findIndex(c => c.id === id);
    if (idx === -1) return null;
    campaigns[idx] = { ...campaigns[idx], ...payload };
    return campaigns[idx];
  }

  function remove(id) {
    const idx = campaigns.findIndex(c => c.id === id);
    if (idx === -1) return false;
    campaigns.splice(idx, 1);
    return true;
  }

  function publish(id) {
    return update(id, { status: 'live', progress: Math.max(5, getById(id)?.progress || 5) });
  }

  function unpublish(id) {
    return update(id, { status: 'ended' });
  }

  /* ---------- Stats ---------- */
  function getStats() {
    const all = getAll();
    return {
      live:      all.filter(c => c.status === 'live').length,
      scheduled: all.filter(c => c.status === 'scheduled').length,
      draft:     all.filter(c => c.status === 'draft').length,
      ended:     all.filter(c => c.status === 'ended').length,
      total:     all.length
    };
  }

  /* ---------- Filter + Search ---------- */
  function query({ filter = 'all', search = '' }) {
    return campaigns.filter(c => {
      const matchFilter = filter === 'all' || c.status === filter;
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.owner.includes(search) ||
        c.typeName.includes(search);
      return matchFilter && matchSearch;
    });
  }

  return { getAll, getById, create, update, remove, publish, unpublish, getStats, query };

})();
