import { ARTISAN_CATEGORIES, ARTISANS_DATA, NIGERIAN_CITIES } from "./artisans-data.js";
import { initQrCardGenerator } from "./qr-generator.js";

document.addEventListener("DOMContentLoaded", () => {
  let artisansList = [...ARTISANS_DATA];
  let selectedCity = "Uyo"; // Default active city
  let selectedCategoryObj = ARTISAN_CATEGORIES[0];
  let chatStep = 1; // 1: Awaiting City, 2: Awaiting Service

  // DOM Elements
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

  // Initialize Application
  function init() {
    renderSidebarCategoryList();
    renderBottomCategoryChips();
    populateOnboardingCategoryOptions();
    initQrCardGenerator();
    setupEventListeners();

    // Start Conversational AI Flow
    startAiGreetingFlow();

    // Default hire date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (hireDate) hireDate.value = tomorrow.toISOString().split("T")[0];
  }

  // EXACT AI AGENT GREETING FLOW
  function startAiGreetingFlow() {
    chatMessagesFeed.innerHTML = "";
    chatStep = 1;

    // STEP 1: Greet - "Hello, which City are you in?"
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
      // STEP 2: "I'm your Local Artisan Agent in [cityname]" + "What service do you need today?"
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
      // Find multiple contacts
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

  // Render ALL MULTIPLE Artisan Contacts directly in Chat Feed
  function renderChatArtisanCards(catName, cityName) {
    let filtered = artisansList.filter(a => {
      const matchCat = a.category === catName;
      const matchCity = cityName === "All Cities (Nigeria)" || a.city === cityName;
      return matchCat && matchCity;
    });

    // If city has zero, fallback to nationwide listings for that category
    if (filtered.length === 0) {
      filtered = artisansList.filter(a => a.category === catName);
    }

    const gridWrapper = document.createElement("div");
    gridWrapper.className = "chat-artisans-grid";

    gridWrapper.innerHTML = filtered.map((artisan, idx) => `
      <div class="artisan-card" id="card-${artisan.id}">
        <div class="artisan-card-img-wrapper">
          <!-- Category-Matched Visual Picture -->
          <img src="${artisan.image}" alt="${artisan.name}" class="artisan-card-img" />
          <div class="badge-tag-group">
            <span class="badge-tag verified">Contact #${idx + 1}</span>
          </div>
          <span class="city-badge-tag">📍 ${artisan.city}</span>
        </div>

        <div class="artisan-card-body">
          <span class="artisan-category-pill">${artisan.categoryIcon || '🛠️'} ${artisan.category}</span>
          <h3 class="artisan-title">${artisan.name}</h3>

          <!-- Real Phone & WhatsApp Contact Badge -->
          <div class="artisan-phone-badge">
            <span>📞</span>
            <a href="tel:+${artisan.phone}" style="color: inherit; font-weight: 800;">+${artisan.phone}</a>
          </div>

          <div style="font-size: 0.75rem; color: var(--slate-500); margin-bottom: 8px;">
            <span>📍 ${artisan.location}</span>
          </div>

          <div class="availability-badge">
            <span>🕒</span>
            <span>Availability: <strong>${artisan.availabilityTime}</strong></span>
          </div>

          <div class="price-row-display">
            <span class="price-label">Starts at:</span>
            <span class="price-value">${artisan.currency}${artisan.priceStarting.toLocaleString()} <small style="font-size:0.72rem; font-weight:normal;">/ job</small></span>
          </div>

          <div class="artisan-card-actions">
            <button class="btn btn-outline btn-detail" data-id="${artisan.id}">Details</button>
            <button class="btn btn-primary btn-hire" data-id="${artisan.id}">Call / WhatsApp</button>
          </div>
        </div>
      </div>
    `).join("");

    chatMessagesFeed.appendChild(gridWrapper);
    scrollToBottom();

    // Attach listeners
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

  // Render Bottom Fixed Clickable 25 Category Chips
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

  // Render Left Sidebar Category Titles Menu (Auto Hides on Click!)
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

    // Clicking Menu Item Automatically Hides the Menu Bar!
    sidebarCategoryList.querySelectorAll(".cat-title-item").forEach(item => {
      item.addEventListener("click", (e) => {
        const catName = e.currentTarget.dataset.name;
        
        // HIDE MENU BAR AUTOMATICALLY
        if (sidebarMenu) sidebarMenu.classList.remove("active");

        handleServiceRequest(catName);
      });
    });
  }

  // Populate Onboarding Category Options
  function populateOnboardingCategoryOptions() {
    if (regCategorySelect) {
      regCategorySelect.innerHTML = ARTISAN_CATEGORIES.map(cat => `
        <option value="${cat.name}">${cat.icon} ${cat.name}</option>
      `).join("");
    }
  }

  // Open Detail Modal
  function openArtisanDetailModal(artisanId) {
    const artisan = artisansList.find(a => a.id === artisanId);
    if (!artisan || !artisanDetailModal || !artisanDetailBody) return;

    artisanDetailBody.innerHTML = `
      <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px; flex-wrap: wrap;">
        <img src="${artisan.image}" style="width: 130px; height: 130px; border-radius: 16px; object-fit: cover;" />
        <div>
          <span style="color: var(--primary-orange); font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">${artisan.categoryIcon || '🛠️'} ${artisan.category}</span>
          <h2 style="font-family: var(--font-serif); font-size: 1.8rem; color: var(--dark-navy); line-height: 1.2;">${artisan.name}</h2>
          <p style="font-size: 0.88rem; color: var(--slate-500); margin-top: 4px;">📍 ${artisan.location}, ${artisan.city}</p>
          
          <div class="artisan-phone-badge" style="margin-top: 8px;">
            <span>📞 Verified Contact:</span>
            <a href="tel:+${artisan.phone}" style="color: inherit; font-weight: 800;">+${artisan.phone}</a>
          </div>
        </div>
      </div>

      <div class="availability-badge" style="margin-bottom: 20px;">
        <span>🕒</span>
        <span>Operational Hours: <strong>${artisan.availabilityTime}</strong></span>
      </div>

      <h4 style="font-size: 1rem; color: var(--dark-navy); margin-bottom: 8px;">Specialized Skills & Services</h4>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">
        ${artisan.specialties.map(s => `<span class="spec-chip" style="font-size: 0.85rem; padding: 6px 12px; background: #FFF7ED; color: var(--primary-orange); border: 1px solid #FFEDD5;">✔️ ${s}</span>`).join('')}
      </div>

      <h4 style="font-size: 1rem; color: var(--dark-navy); margin-bottom: 8px;">About the Artisan</h4>
      <p style="font-size: 0.92rem; color: var(--slate-700); line-height: 1.6; margin-bottom: 20px;">${artisan.bio}</p>

      <div style="display: flex; gap: 12px;">
        <a href="tel:+${artisan.phone}" class="btn btn-outline" style="flex:1; text-align:center; justify-content:center;">📞 Call Normal Line</a>
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
      hirePackageSelect.innerHTML = artisan.packages.map(p => `
        <option value="${p.price}">${p.name} (${artisan.currency}${p.price.toLocaleString()})</option>
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

  // Setup Event Listeners
  function setupEventListeners() {
    // Menu Toggle & Auto Hide
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

    // Geolocation Detection
    if (detectLocationBtn) {
      detectLocationBtn.addEventListener("click", detectUserLocation);
    }

    // Chat User Input Send
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

    // Hire Form Calculation & WhatsApp Dispatch
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

        const message = `Hi ${artisan.name}, I would like to hire your services (${artisan.category}) in ${artisan.city} via Artisan AI Agent:
📅 Date: ${dateVal}
🕒 Preferred Time: ${timeVal}
🔨 Service Job Quantity: ${quantityVal}
💰 Estimated Total: ${totalVal}
📝 Work Description & Address: ${notesVal}`;

        const encodedMsg = encodeURIComponent(message);
        const targetPhone = artisan.phone || "2347030602943";
        const whatsappUrl = `https://api.whatsapp.com/send/?phone=${targetPhone}&text=${encodedMsg}`;

        window.open(whatsappUrl, "_blank");
        hireModal.classList.remove("active");
      });
    }

    // Join Artisan Form Submission
    if (joinArtisanForm) {
      joinArtisanForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("regName")?.value;
        const categoryName = regCategorySelect?.value;
        const cityVal = document.getElementById("regCity")?.value || "Uyo";
        const rawSpecialties = document.getElementById("regSpecialties")?.value || "";
        const phone = document.getElementById("regPhone")?.value;
        const price = parseInt(document.getElementById("regPrice")?.value || 5000, 10);
        const availabilityTime = document.getElementById("regAvailability")?.value || "8:00 AM – 8:00 PM";
        const location = document.getElementById("regLocation")?.value;

        const catObj = ARTISAN_CATEGORIES.find(c => c.name === categoryName) || ARTISAN_CATEGORIES[0];
        const specialtiesArray = rawSpecialties.split(",").map(s => s.trim()).filter(Boolean);

        const newArtisan = {
          id: `artisan-${Date.now()}`,
          name: name,
          category: categoryName,
          categoryIcon: catObj.icon,
          rating: 5.0,
          reviewsCount: 1,
          phone: phone.replace(/[^0-9]/g, ''),
          priceStarting: price,
          currency: "₦",
          location: location,
          city: cityVal,
          availabilityTime: availabilityTime,
          isOpenNow: true,
          isVerified: true,
          isPrioritized: true,
          bio: `${name} is a newly registered ${categoryName} based in ${location}, ${cityVal}.`,
          image: "./assets/images/dish1.png",
          specialties: specialtiesArray.length > 0 ? specialtiesArray : [categoryName],
          workingDays: "Daily",
          availableSlots: ["09:00 AM", "01:00 PM", "05:00 PM"],
          packages: [
            { name: `Standard Package`, price: price, desc: `Complete execution of service` }
          ],
          reviews: [
            { id: 1, name: "Marketplace Admin", rating: 5, comment: `Newly verified artisan ready for bookings!`, date: "Today" }
          ]
        };

        artisansList.unshift(newArtisan);
        joinArtisanModal.classList.remove("active");
        joinArtisanForm.reset();

        handleServiceRequest(categoryName);
        alert(`🎉 Congratulations ${name}! Your artisan listing in ${categoryName} (${cityVal}) is now live.`);
      });
    }

    // Modal Close Triggers
    if (closeDetailModalBtn && artisanDetailModal) closeDetailModalBtn.addEventListener("click", () => artisanDetailModal.classList.remove("active"));
    if (closeHireModalBtn && hireModal) closeHireModalBtn.addEventListener("click", () => hireModal.classList.remove("active"));
    if (openQrModalBtn && qrModal) openQrModalBtn.addEventListener("click", () => qrModal.classList.add("active"));
    if (closeQrModalBtn && qrModal) closeQrModalBtn.addEventListener("click", () => qrModal.classList.remove("active"));
    if (openJoinArtisanBtn && joinArtisanModal) openJoinArtisanBtn.addEventListener("click", () => joinArtisanModal.classList.add("active"));
    if (closeJoinArtisanModalBtn && joinArtisanModal) closeJoinArtisanModalBtn.addEventListener("click", () => joinArtisanModal.classList.remove("active"));
  }

  init();
});
