import { ARTISAN_CATEGORIES, ARTISANS_DATA, NIGERIAN_CITIES } from "./artisans-data.js";
import { initQrCardGenerator } from "./qr-generator.js";

document.addEventListener("DOMContentLoaded", () => {
  // Storage Keys for Admin Onboarded & Unboarded Artisans
  const STORAGE_KEY_CUSTOM = "artisan_marketplace_custom_v3";
  const STORAGE_KEY_UNBOARDED = "artisan_marketplace_unboarded_v3";

  let customArtisans = [];
  let unboardedIds = [];
  let artisansList = [];
  let selectedCity = "Uyo"; // Default active city
  let selectedCategoryObj = ARTISAN_CATEGORIES[0];
  let chatStep = 1; // 1: Awaiting City, 2: Awaiting Service

  // DOM Elements - Navigation & Chat
  const menuToggleBtn = document.getElementById("menuToggleBtn");
  const sidebarMenu = document.getElementById("sidebarMenu");
  const closeSidebarBtn = document.getElementById("closeSidebarBtn");
  const sidebarCategoryList = document.getElementById("sidebarCategoryList");
  const sidebarCatSearch = document.getElementById("sidebarCatSearch");

  const detectLocationBtn = document.getElementById("detectLocationBtn");
  const currentLocationText = document.getElementById("currentLocationText");

  const chatMessagesFeed = document.getElementById("chatMessagesFeed");
  const chatUserInput = document.getElementById("chatUserInput");
  const sendChatBtn = document.getElementById("sendChatBtn");

  const bottomCategoryChips = document.getElementById("bottomCategoryChips");

  // Modals
  const artisanDetailModal = document.getElementById("artisanDetailModal");
  const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");
  const artisanDetailBody = document.getElementById("artisanDetailBody");

  const hireModal = document.getElementById("hireModal");
  const closeHireModalBtn = document.getElementById("closeHireModalBtn");
  const hireForm = document.getElementById("hireForm");
  const hireArtisanName = document.getElementById("hireArtisanName");
  const hireArtisanId = document.getElementById("hireArtisanId");
  const hirePackageSelect = document.getElementById("hirePackageSelect");
  const hireQuantityRange = document.getElementById("hireQuantityRange");
  const quantityDisplay = document.getElementById("quantityDisplay");
  const hireTotalPrice = document.getElementById("hireTotalPrice");
  const hireDate = document.getElementById("hireDate");

  const qrModal = document.getElementById("qrModal");
  const openQrModalBtn = document.getElementById("openQrModalBtn");
  const closeQrModalBtn = document.getElementById("closeQrModalBtn");

  const joinArtisanModal = document.getElementById("joinArtisanModal");
  const openJoinArtisanBtn = document.getElementById("openJoinArtisanBtn");
  const closeJoinArtisanModalBtn = document.getElementById("closeJoinArtisanModalBtn");
  const joinArtisanForm = document.getElementById("joinArtisanForm");
  const regCategorySelect = document.getElementById("regCategory");

  // Admin Dashboard Elements
  const adminDashboardModal = document.getElementById("adminDashboardModal");
  const openAdminDashboardBtn = document.getElementById("openAdminDashboardBtn");
  const closeAdminModalBtn = document.getElementById("closeAdminModalBtn");

  // Admin Tabs
  const tabBtnManage = document.getElementById("tabBtnManage");
  const tabBtnOnboard = document.getElementById("tabBtnOnboard");
  const tabBtnArchive = document.getElementById("tabBtnArchive");

  const viewManage = document.getElementById("viewManage");
  const viewOnboard = document.getElementById("viewOnboard");
  const viewArchive = document.getElementById("viewArchive");

  // Admin Controls & Tables
  const adminSearchInput = document.getElementById("adminSearchInput");
  const adminCityFilter = document.getElementById("adminCityFilter");
  const adminCatFilter = document.getElementById("adminCatFilter");

  const adminArtisansTableBody = document.getElementById("adminArtisansTableBody");
  const adminArchiveTableBody = document.getElementById("adminArchiveTableBody");

  const adminOnboardForm = document.getElementById("adminOnboardForm");
  const adminRegCategorySelect = document.getElementById("adminRegCategory");

  // Stats Counters
  const statTotalActive = document.getElementById("statTotalActive");
  const statTotalCategories = document.getElementById("statTotalCategories");
  const statTotalOnboarded = document.getElementById("statTotalOnboarded");
  const statTotalUnboarded = document.getElementById("statTotalUnboarded");
  const unboardedCountBadge = document.getElementById("unboardedCountBadge");

  // Temporary picture data URL for forms
  let currentAdminUploadedPic = null;
  let currentJoinUploadedPic = null;

  // GPS Coordinates for forms
  let capturedAdminGps = null;
  let capturedJoinGps = null;

  // Initialize Application
  function init() {
    loadStoredState();
    renderSidebarCategoryList();
    renderBottomCategoryChips();
    populateCategoryDropdowns();
    initQrCardGenerator();
    setupEventListeners();
    initAdminDashboard();
    setupGpsDetectors();

    // Start Conversational AI Flow
    startAiGreetingFlow();

    // Default hire date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (hireDate) hireDate.value = tomorrow.toISOString().split("T")[0];
  }

  // Load and sync state from LocalStorage
  function loadStoredState() {
    try {
      const customStr = localStorage.getItem(STORAGE_KEY_CUSTOM);
      const unboardedStr = localStorage.getItem(STORAGE_KEY_UNBOARDED);

      customArtisans = customStr ? JSON.parse(customStr) : [];
      unboardedIds = unboardedStr ? JSON.parse(unboardedStr) : [];
    } catch (e) {
      customArtisans = [];
      unboardedIds = [];
    }

    let combined = [...customArtisans, ...ARTISANS_DATA];
    artisansList = combined.filter(a => !unboardedIds.includes(a.id));
  }

  // Save state to LocalStorage
  function saveStoredState() {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customArtisans));
      localStorage.setItem(STORAGE_KEY_UNBOARDED, JSON.stringify(unboardedIds));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }

  // Helper: Sanitize & format phone numbers
  function sanitizePhone(phone) {
    if (!phone || phone.includes("2348000000000") || phone.length < 8) {
      return "2348030602943";
    }
    return phone.replace(/[^0-9]/g, '');
  }

  // Helper: Check if Category is Mobile Dispatch / Rider / Logistics
  function isDispatchCategory(artisan) {
    if (!artisan) return false;
    const cat = (artisan.category || "").toLowerCase();
    const name = (artisan.name || "").toLowerCase();
    return /dispatch|logistics|keke|rider|delivery|courier|transport/i.test(cat) || 
           /dispatch|logistics|keke|rider|delivery|courier|transport/i.test(name);
  }

  // Helper: Get Direct Google Maps URL for Mobile Location Pinning
  function getGoogleMapsUrl(artisan) {
    if (artisan.lat && artisan.lng) {
      return `https://www.google.com/maps?q=${artisan.lat},${artisan.lng}`;
    }
    const loc = artisan.location || 'Akwa Ibom';
    const city = artisan.city || 'Uyo';
    const searchQuery = `${loc}, ${city}, Nigeria`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
  }

  // Helper: Get Clean Category Picture / SVG Avatar
  function getArtisanImage(artisan) {
    if (artisan.image && 
        !artisan.image.includes("dish1.png") && 
        !artisan.image.includes("dish2.png") && 
        !artisan.image.includes("dish3.png") &&
        !(artisan.category !== "Catering & Private Chefs" && (artisan.image.includes("photo-1555396273") || artisan.image.includes("photo-1504674900247")))) {
      return artisan.image;
    }
    
    const catObj = ARTISAN_CATEGORIES.find(c => c.name === artisan.category) || { icon: "🛠️" };
    const icon = artisan.categoryIcon || catObj.icon || "🛠️";
    const initial = artisan.name ? artisan.name.charAt(0).toUpperCase() : "A";
    
    const gradients = [
      ["#FF7A00", "#D9381E"],
      ["#2563EB", "#1D4ED8"],
      ["#059669", "#047857"],
      ["#7C3AED", "#6D28D9"],
      ["#DB2777", "#BE185D"],
      ["#D97706", "#B45309"]
    ];
    const charCode = artisan.name ? artisan.name.charCodeAt(0) : 0;
    const grad = gradients[charCode % gradients.length];
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
      <rect width="300" height="300" rx="30" fill="url(#g)" />
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${grad[0]}" />
          <stop offset="100%" stop-color="${grad[1]}" />
        </linearGradient>
      </defs>
      <circle cx="150" cy="120" r="60" fill="rgba(255,255,255,0.2)" />
      <text x="150" y="145" font-family="Inter, system-ui, sans-serif" font-size="70" font-weight="900" fill="#FFFFFF" text-anchor="middle">${initial}</text>
      <rect x="30" y="205" width="240" height="52" rx="26" fill="rgba(0,0,0,0.35)" />
      <text x="150" y="239" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF" text-anchor="middle">${icon} ${artisan.category ? artisan.category.substring(0, 16) : 'Artisan'}</text>
    </svg>`;
    
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  // EXACT AI AGENT GREETING FLOW
  function startAiGreetingFlow() {
    chatMessagesFeed.innerHTML = "";
    chatStep = 1;

    addAiMessage(`Hello! 👋 Which City are you in?`, [
      { label: "📍 Uyo", value: "Uyo" },
      { label: "📍 Eket", value: "Eket" },
      { label: "📍 Calabar", value: "Calabar" },
      { label: "📍 Port Harcourt", value: "Port Harcourt" },
      { label: "📍 Lagos", value: "Lagos" },
      { label: "📍 Abuja", value: "Abuja" },
      { label: "⚡ Detect My Location", value: "DETECT" }
    ]);
  }

  // Handle City Choice
  function handleCitySelection(cityName) {
    if (cityName === "DETECT") {
      detectUserLocation();
      return;
    }

    selectedCity = cityName;
    if (currentLocationText) currentLocationText.textContent = selectedCity;

    addUserMessage(`I am in ${selectedCity}`);

    setTimeout(() => {
      addAiMessage(`I'm your Local Artisan Agent in <strong>${selectedCity}</strong>.<br>What service do you need today?`);
      chatStep = 2;
    }, 400);
  }

  // Geolocation Reading Function
  function detectUserLocation() {
    if (currentLocationText) currentLocationText.textContent = "Locating...";
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          if (lat >= 4.5 && lat <= 5.5 && lng >= 7.5 && lng <= 8.5) {
            selectedCity = "Uyo";
          } else {
            selectedCity = "Lagos";
          }

          if (currentLocationText) currentLocationText.textContent = selectedCity;
          addUserMessage(`📍 Detected Location: ${selectedCity}`);

          setTimeout(() => {
            addAiMessage(`📍 Location verified! I'm your Local Artisan Agent in <strong>${selectedCity}</strong>.<br>What service do you need today?`);
            chatStep = 2;
          }, 400);
        },
        (err) => {
          selectedCity = "Uyo";
          if (currentLocationText) currentLocationText.textContent = selectedCity;
          addUserMessage(`Selected City: ${selectedCity}`);

          setTimeout(() => {
            addAiMessage(`I'm your Local Artisan Agent in <strong>${selectedCity}</strong>.<br>What service do you need today?`);
            chatStep = 2;
          }, 400);
        }
      );
    } else {
      selectedCity = "Uyo";
      if (currentLocationText) currentLocationText.textContent = selectedCity;
      addAiMessage(`I'm your Local Artisan Agent in <strong>${selectedCity}</strong>.<br>What service do you need today?`);
      chatStep = 2;
    }
  }

  // Handle Service Request / Category Click
  function handleServiceRequest(categoryName) {
    const catObj = ARTISAN_CATEGORIES.find(c => c.name.toLowerCase() === categoryName.toLowerCase() || c.id === categoryName) || selectedCategoryObj;
    selectedCategoryObj = catObj;

    addUserMessage(`Need ${selectedCategoryObj.name} in ${selectedCity}`);

    setTimeout(() => {
      const cityMatches = artisansList.filter(a => a.category === selectedCategoryObj.name && (selectedCity === "All Cities (Nigeria)" || a.city === selectedCity));
      const totalNigeriaMatches = artisansList.filter(a => a.category === selectedCategoryObj.name).length;

      addAiMessage(`🔍 Sourcing multiple contacts: Found <strong>${cityMatches.length} verified ${selectedCategoryObj.name} contacts</strong> in <strong>${selectedCity}</strong> (${totalNigeriaMatches} available across Nigeria):`);
      
      setTimeout(() => {
        renderChatArtisanCards(selectedCategoryObj.name, selectedCity);
      }, 300);
    }, 400);
  }

  // Add AI Message to Feed
  function addAiMessage(htmlContent, quickChips = []) {
    const bubbleWrapper = document.createElement("div");
    bubbleWrapper.className = "chat-bubble ai";

    let chipsHTML = "";
    if (quickChips.length > 0) {
      chipsHTML = `
        <div class="chat-city-options">
          ${quickChips.map(c => `<button class="city-chip-btn" data-value="${c.value}">${c.label}</button>`).join("")}
        </div>
      `;
    }

    bubbleWrapper.innerHTML = `
      <div class="chat-avatar">🤖</div>
      <div class="chat-bubble-content">
        <div>${htmlContent}</div>
        ${chipsHTML}
      </div>
    `;

    chatMessagesFeed.appendChild(bubbleWrapper);
    scrollToBottom();

    bubbleWrapper.querySelectorAll(".city-chip-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const val = e.currentTarget.dataset.value;
        handleCitySelection(val);
      });
    });
  }

  // Add User Message to Feed
  function addUserMessage(text) {
    const bubbleWrapper = document.createElement("div");
    bubbleWrapper.className = "chat-bubble user";
    bubbleWrapper.innerHTML = `
      <div class="chat-avatar">👤</div>
      <div class="chat-bubble-content">${text}</div>
    `;
    chatMessagesFeed.appendChild(bubbleWrapper);
    scrollToBottom();
  }

  // Render ALL MULTIPLE Artisan Contacts directly in Chat Feed (WITH DISPATCH RIDER GOOGLE MAPS PINNING)
  function renderChatArtisanCards(catName, cityName) {
    let filtered = artisansList.filter(a => {
      const matchCat = a.category === catName;
      const matchCity = cityName === "All Cities (Nigeria)" || a.city === cityName;
      return matchCat && matchCity;
    });

    if (filtered.length === 0) {
      filtered = artisansList.filter(a => a.category === catName);
    }

    const gridWrapper = document.createElement("div");
    gridWrapper.className = "chat-artisans-grid";

    gridWrapper.innerHTML = filtered.map((artisan) => {
      const imgSrc = getArtisanImage(artisan);
      const cleanPhone = sanitizePhone(artisan.phone);
      const isMobileRider = isDispatchCategory(artisan);
      const mapsUrl = getGoogleMapsUrl(artisan);

      const badgeHTML = isMobileRider 
        ? `<span class="dispatch-badge">🛵 Mobile Dispatch Pin</span>` 
        : `<span class="badge-tag verified">✔ Verified Artisan</span>`;

      const gmapsButtonHTML = isMobileRider
        ? `<a href="${mapsUrl}" target="_blank" class="btn btn-gmaps-live">🗺️ Google Map</a>`
        : ``;

      return `
        <div class="artisan-card" id="card-${artisan.id}">
          <div class="artisan-card-img-wrapper">
            <img src="${imgSrc}" alt="${artisan.name}" class="artisan-card-img" />
            <div class="badge-tag-group">
              ${badgeHTML}
            </div>
            <span class="city-badge-tag">📍 ${artisan.city}</span>
          </div>

          <div class="artisan-card-body">
            <span class="artisan-category-pill">${artisan.categoryIcon || '🛠️'} ${artisan.category}</span>
            <h3 class="artisan-title">${artisan.name}</h3>

            <div class="artisan-phone-badge">
              <span>📞</span>
              <a href="tel:+${cleanPhone}" style="color: inherit; font-weight: 800;">+${cleanPhone}</a>
            </div>

            <div style="font-size: 0.75rem; color: var(--slate-500); margin-bottom: 8px;">
              <span>📍 ${artisan.location || artisan.city}</span>
            </div>

            <div class="availability-badge">
              <span>🕒</span>
              <span>Availability: <strong>${artisan.availabilityTime || 'Daily'}</strong></span>
            </div>

            <div class="price-row-display">
              <span class="price-label">Starts at:</span>
              <span class="price-value">${artisan.currency || '₦'}${artisan.priceStarting ? artisan.priceStarting.toLocaleString() : '5,000'} <small style="font-size:0.72rem; font-weight:normal;">/ job</small></span>
            </div>

            <div class="artisan-card-actions">
              <button class="btn btn-outline btn-detail" data-id="${artisan.id}">Details</button>
              ${gmapsButtonHTML}
              <button class="btn btn-primary btn-hire" data-id="${artisan.id}">Call / WhatsApp</button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    chatMessagesFeed.appendChild(gridWrapper);
    scrollToBottom();

    gridWrapper.querySelectorAll(".btn-detail").forEach(btn => {
      btn.addEventListener("click", () => openArtisanDetailModal(btn.dataset.id));
    });

    gridWrapper.querySelectorAll(".btn-hire").forEach(btn => {
      btn.addEventListener("click", () => openHireModal(btn.dataset.id));
    });
  }

  // Scroll Chat to Bottom
  function scrollToBottom() {
    const wrapper = document.getElementById("chatFeedWrapper");
    if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;
  }

  // Render Bottom Category Chips
  function renderBottomCategoryChips() {
    if (!bottomCategoryChips) return;
    bottomCategoryChips.innerHTML = ARTISAN_CATEGORIES.map(cat => `
      <button class="bottom-cat-chip" data-name="${cat.name}">
        <span>${cat.icon}</span>
        <span>${cat.name}</span>
      </button>
    `).join("");

    bottomCategoryChips.querySelectorAll(".bottom-cat-chip").forEach(chip => {
      chip.addEventListener("click", (e) => {
        const catName = e.currentTarget.dataset.name;
        handleServiceRequest(catName);
      });
    });
  }

  // Render Sidebar Categories
  function renderSidebarCategoryList(filterText = "") {
    if (!sidebarCategoryList) return;

    const filteredCategories = ARTISAN_CATEGORIES.filter(cat => 
      cat.name.toLowerCase().includes(filterText.toLowerCase())
    );

    sidebarCategoryList.innerHTML = filteredCategories.map(cat => {
      const count = artisansList.filter(a => a.category === cat.name).length;

      return `
        <div class="cat-title-item" data-name="${cat.name}">
          <div class="cat-title-left">
            <span class="cat-icon">${cat.icon}</span>
            <span>${cat.name}</span>
          </div>
          <span class="cat-count">${count} contacts</span>
        </div>
      `;
    }).join("");

    sidebarCategoryList.querySelectorAll(".cat-title-item").forEach(item => {
      item.addEventListener("click", (e) => {
        const catName = e.currentTarget.dataset.name;
        if (sidebarMenu) sidebarMenu.classList.remove("active");
        handleServiceRequest(catName);
      });
    });
  }

  // Populate Dropdowns
  function populateCategoryDropdowns() {
    const optionsHTML = ARTISAN_CATEGORIES.map(cat => `
      <option value="${cat.name}">${cat.icon} ${cat.name}</option>
    `).join("");

    if (regCategorySelect) regCategorySelect.innerHTML = optionsHTML;
    if (adminRegCategorySelect) adminRegCategorySelect.innerHTML = optionsHTML;

    if (adminCatFilter) {
      adminCatFilter.innerHTML = `<option value="ALL">All Categories</option>` + optionsHTML;
    }
  }

  // Setup Geolocation GPS Detectors for Onboarding Forms
  function setupGpsDetectors() {
    const regBtn = document.getElementById("regDetectGpsBtn");
    const regLocInput = document.getElementById("regLocation");
    const regStatus = document.getElementById("regGpsStatus");

    if (regBtn && regLocInput) {
      regBtn.addEventListener("click", () => {
        if (regStatus) regStatus.textContent = "⏳ Capturing real-time GPS coordinates...";
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude.toFixed(6);
              const lng = pos.coords.longitude.toFixed(6);
              capturedJoinGps = { lat, lng };
              regLocInput.value = `Mobile Station (GPS: ${lat}, ${lng})`;
              if (regStatus) regStatus.textContent = `✔ GPS Pinned: ${lat}, ${lng} (Viewable on Google Maps)`;
            },
            () => {
              if (regStatus) regStatus.textContent = "⚠️ GPS unavailable. Using City Google Map pin.";
            }
          );
        }
      });
    }

    const adminBtn = document.getElementById("adminRegDetectGpsBtn");
    const adminLocInput = document.getElementById("adminRegAddress");
    const adminStatus = document.getElementById("adminGpsStatus");

    if (adminBtn && adminLocInput) {
      adminBtn.addEventListener("click", () => {
        if (adminStatus) adminStatus.textContent = "⏳ Capturing real-time GPS coordinates...";
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude.toFixed(6);
              const lng = pos.coords.longitude.toFixed(6);
              capturedAdminGps = { lat, lng };
              adminLocInput.value = `Mobile Station (GPS: ${lat}, ${lng})`;
              if (adminStatus) adminStatus.textContent = `✔ GPS Pinned: ${lat}, ${lng} (Viewable on Google Maps)`;
            },
            () => {
              if (adminStatus) adminStatus.textContent = "⚠️ GPS unavailable. Using City Google Map pin.";
            }
          );
        }
      });
    }
  }

  // Open Detail Modal (WITH DYNAMIC GOOGLE MAPS LOCATION BOX FOR DISPATCH RIDERS)
  function openArtisanDetailModal(artisanId) {
    const artisan = artisansList.find(a => a.id === artisanId);
    if (!artisan || !artisanDetailModal || !artisanDetailBody) return;

    const imgSrc = getArtisanImage(artisan);
    const cleanPhone = sanitizePhone(artisan.phone);
    const isMobileRider = isDispatchCategory(artisan);
    const mapsUrl = getGoogleMapsUrl(artisan);

    const mapsBoxHTML = isMobileRider ? `
      <div class="dispatch-maps-box">
        <div style="font-size:0.88rem; font-weight:800; color:#38BDF8; display:flex; align-items:center; gap:6px;">
          <span>🛵 Mobile Dispatch Rider GPS Pin</span>
        </div>
        <p style="font-size:0.82rem; color:var(--slate-500); margin:0;">
          Since this dispatch rider is mobile, location is dynamically determined & tracked via Google Maps.
        </p>
        <a href="${mapsUrl}" target="_blank" class="btn btn-gmaps-live" style="margin-top:6px;">
          🗺️ Open Live Google Maps Location & Directions
        </a>
      </div>
    ` : ``;

    artisanDetailBody.innerHTML = `
      <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px; flex-wrap: wrap;">
        <img src="${imgSrc}" style="width: 130px; height: 130px; border-radius: 16px; object-fit: cover;" />
        <div>
          <span style="color: var(--primary-orange); font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">${artisan.categoryIcon || '🛠️'} ${artisan.category}</span>
          <h2 style="font-family: var(--font-serif); font-size: 1.8rem; color: var(--dark-navy); line-height: 1.2;">${artisan.name}</h2>
          <p style="font-size: 0.88rem; color: var(--slate-500); margin-top: 4px;">📍 ${artisan.location || 'Address on file'}, ${artisan.city}</p>
          
          <div class="artisan-phone-badge" style="margin-top: 8px;">
            <span>📞 Verified Contact:</span>
            <a href="tel:+${cleanPhone}" style="color: inherit; font-weight: 800;">+${cleanPhone}</a>
          </div>
        </div>
      </div>

      ${mapsBoxHTML}

      <div class="availability-badge" style="margin-bottom: 20px;">
        <span>🕒</span>
        <span>Operational Hours: <strong>${artisan.availabilityTime || 'Daily'}</strong></span>
      </div>

      <h4 style="font-size: 1rem; color: var(--dark-navy); margin-bottom: 8px;">Specialized Skills & Services</h4>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">
        ${(artisan.specialties || [artisan.category]).map(s => `<span class="spec-chip" style="font-size: 0.85rem; padding: 6px 12px; background: #FFF7ED; color: var(--primary-orange); border: 1px solid #FFEDD5;">✔️ ${s}</span>`).join('')}
      </div>

      <h4 style="font-size: 1rem; color: var(--dark-navy); margin-bottom: 8px;">About the Artisan</h4>
      <p style="font-size: 0.92rem; color: var(--slate-700); line-height: 1.6; margin-bottom: 20px;">${artisan.bio || `${artisan.name} is a verified ${artisan.category} in ${artisan.city}.`}</p>

      <div style="display: flex; gap: 12px;">
        <a href="tel:+${cleanPhone}" class="btn btn-outline" style="flex:1; text-align:center; justify-content:center;">📞 Call Normal Line</a>
        <button class="btn btn-primary" id="detailHireNowBtn" style="flex:1;">💬 WhatsApp Reservation</button>
      </div>
    `;

    artisanDetailModal.classList.add("active");

    const detailHireNowBtn = document.getElementById("detailHireNowBtn");
    if (detailHireNowBtn) {
      detailHireNowBtn.addEventListener("click", () => {
        artisanDetailModal.classList.remove("active");
        openHireModal(artisanId);
      });
    }
  }

  // Open Hire Modal
  function openHireModal(artisanId) {
    const artisan = artisansList.find(a => a.id === artisanId);
    if (!artisan || !hireModal) return;

    if (hireArtisanName) hireArtisanName.textContent = `Hire ${artisan.name} (${artisan.city})`;
    if (hireArtisanId) hireArtisanId.value = artisan.id;

    if (hirePackageSelect) {
      const pkgs = artisan.packages || [{ name: "Standard Service Job", price: artisan.priceStarting || 5000, desc: "Full service job execution" }];
      hirePackageSelect.innerHTML = pkgs.map(p => `
        <option value="${p.price}">${p.name} (${artisan.currency || '₦'}${p.price.toLocaleString()})</option>
      `).join('');
    }

    calculateTotal();
    hireModal.classList.add("active");
  }

  // Calculate Price Estimate
  function calculateTotal() {
    const artisanId = hireArtisanId?.value;
    const artisan = artisansList.find(a => a.id === artisanId);
    const quantity = parseInt(hireQuantityRange?.value || 1, 10);
    const basePrice = parseInt(hirePackageSelect?.value || (artisan ? artisan.priceStarting : 5000), 10);

    if (quantityDisplay) quantityDisplay.textContent = `${quantity} Service Job${quantity === 1 ? '' : 's'}`;

    const total = basePrice * quantity;
    if (hireTotalPrice) hireTotalPrice.textContent = `₦${total.toLocaleString()}`;
  }

  // ==========================================================================
  // ADMIN DASHBOARD CONTROLLER (ONBOARDING & UNBOARDING ARTISANS)
  // ==========================================================================

  function initAdminDashboard() {
    if (openAdminDashboardBtn && adminDashboardModal) {
      openAdminDashboardBtn.addEventListener("click", () => {
        renderAdminTables();
        adminDashboardModal.classList.add("active");
      });
    }

    if (closeAdminModalBtn && adminDashboardModal) {
      closeAdminModalBtn.addEventListener("click", () => {
        adminDashboardModal.classList.remove("active");
      });
    }

    const tabs = [
      { btn: tabBtnManage, view: viewManage, key: "manage" },
      { btn: tabBtnOnboard, view: viewOnboard, key: "onboard" },
      { btn: tabBtnArchive, view: viewArchive, key: "archive" }
    ];

    tabs.forEach(t => {
      if (t.btn) {
        t.btn.addEventListener("click", () => {
          tabs.forEach(item => {
            if (item.btn) item.btn.classList.remove("active");
            if (item.view) item.view.classList.remove("active");
          });
          t.btn.classList.add("active");
          if (t.view) t.view.classList.add("active");
          renderAdminTables();
        });
      }
    });

    if (adminSearchInput) adminSearchInput.addEventListener("input", renderAdminActiveTable);
    if (adminCityFilter) adminCityFilter.addEventListener("change", renderAdminActiveTable);
    if (adminCatFilter) adminCatFilter.addEventListener("change", renderAdminActiveTable);

    const adminPictureFile = document.getElementById("adminRegPictureFile");
    const adminPictureUrl = document.getElementById("adminRegPictureUrl");
    const adminImgPreviewBox = document.getElementById("adminImgPreviewBox");

    if (adminPictureFile) {
      adminPictureFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            currentAdminUploadedPic = event.target.result;
            if (adminImgPreviewBox) {
              adminImgPreviewBox.innerHTML = `<img src="${currentAdminUploadedPic}" alt="Preview" />`;
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (adminPictureUrl) {
      adminPictureUrl.addEventListener("input", () => {
        const url = adminPictureUrl.value.trim();
        if (url) {
          currentAdminUploadedPic = url;
          if (adminImgPreviewBox) {
            adminImgPreviewBox.innerHTML = `<img src="${url}" alt="Preview" />`;
          }
        }
      });
    }

    const regPictureFile = document.getElementById("regPictureFile");
    const regPictureUrl = document.getElementById("regPictureUrl");
    const regImgPreviewBox = document.getElementById("regImgPreviewBox");

    if (regPictureFile) {
      regPictureFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            currentJoinUploadedPic = event.target.result;
            if (regImgPreviewBox) {
              regImgPreviewBox.innerHTML = `<img src="${currentJoinUploadedPic}" alt="Preview" />`;
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (regPictureUrl) {
      regPictureUrl.addEventListener("input", () => {
        const url = regPictureUrl.value.trim();
        if (url) {
          currentJoinUploadedPic = url;
          if (regImgPreviewBox) {
            regImgPreviewBox.innerHTML = `<img src="${url}" alt="Preview" />`;
          }
        }
      });
    }

    if (adminOnboardForm) {
      adminOnboardForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("adminRegName")?.value.trim();
        const categoryName = adminRegCategorySelect?.value;
        const address = document.getElementById("adminRegAddress")?.value.trim();
        const cityVal = document.getElementById("adminRegCity")?.value || "Uyo";
        const phone = document.getElementById("adminRegPhone")?.value.trim();
        const price = parseInt(document.getElementById("adminRegPrice")?.value || 5000, 10);
        const specialtiesRaw = document.getElementById("adminRegSpecialties")?.value.trim() || "";
        const availability = document.getElementById("adminRegAvailability")?.value || "8:00 AM – 8:00 PM (Daily)";

        const catObj = ARTISAN_CATEGORIES.find(c => c.name === categoryName) || ARTISAN_CATEGORIES[0];
        const specArr = specialtiesRaw.split(",").map(s => s.trim()).filter(Boolean);

        const newArtisan = {
          id: `onboarded-artisan-${Date.now()}`,
          name: name,
          category: categoryName,
          categoryIcon: catObj.icon,
          rating: 5.0,
          reviewsCount: 1,
          phone: sanitizePhone(phone),
          priceStarting: price,
          currency: "₦",
          location: address,
          city: cityVal,
          availabilityTime: availability,
          isOpenNow: true,
          isVerified: true,
          isPrioritized: true,
          bio: `${name} is an onboarded ${categoryName} operating at ${address}, ${cityVal}.`,
          image: currentAdminUploadedPic || null,
          specialties: specArr.length > 0 ? specArr : [categoryName],
          lat: capturedAdminGps ? capturedAdminGps.lat : null,
          lng: capturedAdminGps ? capturedAdminGps.lng : null,
          packages: [
            { name: `Standard Package`, price: price, desc: `Complete execution of service` }
          ]
        };

        customArtisans.unshift(newArtisan);
        artisansList.unshift(newArtisan);
        saveStoredState();

        adminOnboardForm.reset();
        currentAdminUploadedPic = null;
        capturedAdminGps = null;
        if (adminImgPreviewBox) adminImgPreviewBox.innerHTML = `<span style="font-size:0.8rem; color:var(--slate-500);">Preview Picture</span>`;

        alert(`✅ Success! "${name}" (${categoryName}) has been onboarded and is now live on the portal.`);

        if (tabBtnManage) tabBtnManage.click();
        renderSidebarCategoryList();
      });
    }
  }

  function renderAdminTables() {
    renderAdminActiveTable();
    renderAdminArchiveTable();
    updateAdminStats();
  }

  function renderAdminActiveTable() {
    if (!adminArtisansTableBody) return;

    const query = (adminSearchInput?.value || "").toLowerCase().trim();
    const cityFilter = adminCityFilter?.value || "ALL";
    const catFilter = adminCatFilter?.value || "ALL";

    const filtered = artisansList.filter(a => {
      const matchSearch = !query || 
        (a.name && a.name.toLowerCase().includes(query)) ||
        (a.location && a.location.toLowerCase().includes(query)) ||
        (a.phone && a.phone.includes(query)) ||
        (a.city && a.city.toLowerCase().includes(query));

      const matchCity = cityFilter === "ALL" || a.city === cityFilter;
      const matchCat = catFilter === "ALL" || a.category === catFilter;

      return matchSearch && matchCity && matchCat;
    });

    if (filtered.length === 0) {
      adminArtisansTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: var(--slate-500);">
            No active artisans found matching your search criteria.
          </td>
        </tr>
      `;
      return;
    }

    adminArtisansTableBody.innerHTML = filtered.map(artisan => {
      const imgSrc = getArtisanImage(artisan);
      const cleanPhone = sanitizePhone(artisan.phone);
      const isMobileRider = isDispatchCategory(artisan);
      const mapsUrl = getGoogleMapsUrl(artisan);

      return `
        <tr id="admin-row-${artisan.id}">
          <td>
            <img src="${imgSrc}" alt="${artisan.name}" class="admin-thumb-img" />
          </td>
          <td>
            <span class="artisan-name-cell">${artisan.name}</span>
            <span class="artisan-sub-cell">${artisan.isVerified ? '✔ Verified' : 'Registered'}</span>
          </td>
          <td>
            <div>${artisan.location || 'Street address on file'}</div>
            <div class="artisan-sub-cell">
              📍 ${artisan.city} 
              ${isMobileRider ? `<a href="${mapsUrl}" target="_blank" style="color:#38BDF8; font-weight:700; margin-left:4px;">[🗺️ Google Map Pin]</a>` : ''}
            </div>
          </td>
          <td>
            <a href="tel:+${cleanPhone}" class="phone-link-cell">+${cleanPhone}</a>
          </td>
          <td>
            <span style="font-size:0.8rem; font-weight:700;">${artisan.categoryIcon || '🛠️'} ${artisan.category}</span>
          </td>
          <td>
            <strong style="color:var(--white);">${artisan.currency || '₦'}${artisan.priceStarting ? artisan.priceStarting.toLocaleString() : '5,000'}</strong>
          </td>
          <td style="text-align: right;">
            <button class="btn-unboard" data-id="${artisan.id}" data-name="${artisan.name}">
              🗑️ Unboard
            </button>
          </td>
        </tr>
      `;
    }).join("");

    adminArtisansTableBody.querySelectorAll(".btn-unboard").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        unboardArtisan(id, name);
      });
    });
  }

  function unboardArtisan(artisanId, artisanName) {
    if (confirm(`Are you sure you want to UNBOARD (remove) "${artisanName}" from the portal?`)) {
      if (!unboardedIds.includes(artisanId)) {
        unboardedIds.push(artisanId);
      }

      customArtisans = customArtisans.filter(a => a.id !== artisanId);
      artisansList = artisansList.filter(a => a.id !== artisanId);

      saveStoredState();
      renderAdminTables();
      renderSidebarCategoryList();

      alert(`🗑️ "${artisanName}" has been successfully unboarded and archived.`);
    }
  }

  function reonboardArtisan(artisanId, artisanName) {
    unboardedIds = unboardedIds.filter(id => id !== artisanId);
    
    const baseItem = ARTISANS_DATA.find(a => a.id === artisanId);
    if (baseItem && !artisansList.some(a => a.id === artisanId)) {
      artisansList.unshift(baseItem);
    }

    saveStoredState();
    loadStoredState();
    renderAdminTables();
    renderSidebarCategoryList();

    alert(`✨ "${artisanName}" has been restored to active status.`);
  }

  function renderAdminArchiveTable() {
    if (!adminArchiveTableBody) return;

    const unboardedArtisans = ARTISANS_DATA.filter(a => unboardedIds.includes(a.id));

    if (unboardedArtisans.length === 0) {
      adminArchiveTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: var(--slate-500);">
            No unboarded artisans in archive.
          </td>
        </tr>
      `;
      return;
    }

    adminArchiveTableBody.innerHTML = unboardedArtisans.map(artisan => {
      const imgSrc = getArtisanImage(artisan);
      const cleanPhone = sanitizePhone(artisan.phone);

      return `
        <tr>
          <td>
            <img src="${imgSrc}" alt="${artisan.name}" class="admin-thumb-img" />
          </td>
          <td>
            <span class="artisan-name-cell">${artisan.name}</span>
          </td>
          <td>
            <div>${artisan.location || 'Address on file'}</div>
            <div class="artisan-sub-cell">📍 ${artisan.city}</div>
          </td>
          <td>
            <a href="tel:+${cleanPhone}" class="phone-link-cell">+${cleanPhone}</a>
          </td>
          <td>
            <span>${artisan.categoryIcon || '🛠️'} ${artisan.category}</span>
          </td>
          <td>
            <span class="artisan-sub-cell">Archived</span>
          </td>
          <td style="text-align: right;">
            <button class="btn-reonboard" data-id="${artisan.id}" data-name="${artisan.name}">
              ✨ Re-onboard
            </button>
          </td>
        </tr>
      `;
    }).join("");

    adminArchiveTableBody.querySelectorAll(".btn-reonboard").forEach(btn => {
      btn.addEventListener("click", () => {
        reonboardArtisan(btn.dataset.id, btn.dataset.name);
      });
    });
  }

  function updateAdminStats() {
    if (statTotalActive) statTotalActive.textContent = artisansList.length;
    if (statTotalCategories) statTotalCategories.textContent = ARTISAN_CATEGORIES.length;
    if (statTotalOnboarded) statTotalOnboarded.textContent = customArtisans.length;
    if (statTotalUnboarded) statTotalUnboarded.textContent = unboardedIds.length;
    if (unboardedCountBadge) unboardedCountBadge.textContent = unboardedIds.length;
  }

  function setupEventListeners() {
    if (menuToggleBtn && sidebarMenu) {
      menuToggleBtn.addEventListener("click", () => {
        sidebarMenu.classList.toggle("active");
      });
    }
    if (closeSidebarBtn && sidebarMenu) {
      closeSidebarBtn.addEventListener("click", () => {
        sidebarMenu.classList.remove("active");
      });
    }

    if (detectLocationBtn) {
      detectLocationBtn.addEventListener("click", detectUserLocation);
    }

    if (sendChatBtn && chatUserInput) {
      sendChatBtn.addEventListener("click", () => {
        const txt = chatUserInput.value.trim();
        if (!txt) return;
        chatUserInput.value = "";

        if (chatStep === 1) {
          handleCitySelection(txt);
        } else {
          handleServiceRequest(txt);
        }
      });

      chatUserInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
          sendChatBtn.click();
        }
      });
    }

    if (hireQuantityRange) hireQuantityRange.addEventListener("input", calculateTotal);
    if (hirePackageSelect) hirePackageSelect.addEventListener("change", calculateTotal);

    if (hireForm) {
      hireForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const artisanId = hireArtisanId?.value;
        const artisan = artisansList.find(a => a.id === artisanId);
        if (!artisan) return;

        const dateVal = hireDate?.value || "Upcoming date";
        const timeVal = document.getElementById("hireTimeSlot")?.value || "09:00 AM";
        const quantityVal = hireQuantityRange?.value || "1";
        const notesVal = document.getElementById("hireNotes")?.value || "No extra notes";
        const totalVal = hireTotalPrice?.textContent || "";

        const cleanPhone = sanitizePhone(artisan.phone);
        const mapsUrl = getGoogleMapsUrl(artisan);
        const isMobileRider = isDispatchCategory(artisan);

        const mapsNote = isMobileRider ? `\n🗺️ Live Google Maps Location: ${mapsUrl}` : '';

        const message = `Hi ${artisan.name}, I would like to hire your services (${artisan.category}) in ${artisan.city} via Artisan AI Agent:
📅 Date: ${dateVal}
🕒 Preferred Time: ${timeVal}
🔨 Service Job Quantity: ${quantityVal}
💰 Estimated Total: ${totalVal}
📝 Work Description & Address: ${notesVal}${mapsNote}`;

        const encodedMsg = encodeURIComponent(message);
        const whatsappUrl = `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodedMsg}`;

        window.open(whatsappUrl, "_blank");
        hireModal.classList.remove("active");
      });
    }

    if (joinArtisanForm) {
      joinArtisanForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("regName")?.value.trim();
        const categoryName = regCategorySelect?.value;
        const cityVal = document.getElementById("regCity")?.value || "Uyo";
        const rawSpecialties = document.getElementById("regSpecialties")?.value || "";
        const phone = document.getElementById("regPhone")?.value.trim();
        const price = parseInt(document.getElementById("regPrice")?.value || 5000, 10);
        const availabilityTime = document.getElementById("regAvailability")?.value || "8:00 AM – 8:00 PM";
        const location = document.getElementById("regLocation")?.value.trim();

        const catObj = ARTISAN_CATEGORIES.find(c => c.name === categoryName) || ARTISAN_CATEGORIES[0];
        const specialtiesArray = rawSpecialties.split(",").map(s => s.trim()).filter(Boolean);

        const newArtisan = {
          id: `artisan-${Date.now()}`,
          name: name,
          category: categoryName,
          categoryIcon: catObj.icon,
          rating: 5.0,
          reviewsCount: 1,
          phone: sanitizePhone(phone),
          priceStarting: price,
          currency: "₦",
          location: location,
          city: cityVal,
          availabilityTime: availabilityTime,
          isOpenNow: true,
          isVerified: true,
          isPrioritized: true,
          bio: `${name} is a newly registered ${categoryName} operating at ${location}, ${cityVal}.`,
          image: currentJoinUploadedPic || null,
          specialties: specialtiesArray.length > 0 ? specialtiesArray : [categoryName],
          lat: capturedJoinGps ? capturedJoinGps.lat : null,
          lng: capturedJoinGps ? capturedJoinGps.lng : null,
          packages: [
            { name: `Standard Package`, price: price, desc: `Complete execution of service` }
          ]
        };

        customArtisans.unshift(newArtisan);
        artisansList.unshift(newArtisan);
        saveStoredState();

        joinArtisanModal.classList.remove("active");
        joinArtisanForm.reset();
        currentJoinUploadedPic = null;
        capturedJoinGps = null;

        handleServiceRequest(categoryName);
        alert(`🎉 Congratulations ${name}! Your artisan listing in ${categoryName} (${location}, ${cityVal}) is now live.`);
      });
    }

    if (closeDetailModalBtn && artisanDetailModal) closeDetailModalBtn.addEventListener("click", () => artisanDetailModal.classList.remove("active"));
    if (closeHireModalBtn && hireModal) closeHireModalBtn.addEventListener("click", () => hireModal.classList.remove("active"));
    if (openQrModalBtn && qrModal) openQrModalBtn.addEventListener("click", () => qrModal.classList.add("active"));
    if (closeQrModalBtn && qrModal) closeQrModalBtn.addEventListener("click", () => qrModal.classList.remove("active"));
    if (openJoinArtisanBtn && joinArtisanModal) openJoinArtisanBtn.addEventListener("click", () => joinArtisanModal.classList.add("active"));
    if (closeJoinArtisanModalBtn && joinArtisanModal) closeJoinArtisanModalBtn.addEventListener("click", () => joinArtisanModal.classList.remove("active"));
  }

  init();
});
