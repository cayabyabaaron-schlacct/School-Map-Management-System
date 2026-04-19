/* =========================================================
   SCHOOLMAP — app.js
   Complete client-side JavaScript application
   =========================================================
   Architecture:
     - Single-page app with hash-based routing
     - LocalStorage for user/data persistence (no server needed)
     - API calls to api.php when PHP backend is available
     - Graceful fallback to localStorage if PHP not available
   ========================================================= */

"use strict";

/* =========================================================
   CONSTANTS & DEFAULT DATA
   ========================================================= */

var APP_USERS_KEY       = "schoolmap_users";
var APP_CURRENT_KEY     = "schoolmap_current_user";
var APP_LOCATIONS_KEY   = "schoolmap_locations";
var APP_FLOORS_KEY      = "schoolmap_floors";
var APP_LEGENDS_KEY     = "schoolmap_legends";
var APP_DATA_VERSION    = "schoolmap_data_v3";

var DEFAULT_FLOORS = [
  { id: 1, name: "Ground Floor", label: "1F" },
  { id: 2, name: "2nd Floor",    label: "2F" },
  { id: 3, name: "3rd Floor",    label: "3F" }
];

var DEFAULT_LEGENDS = [
  { id: "classroom", type: "classroom", label: "Classroom",          color: "#192A57" },
  { id: "office",    type: "office",    label: "VP / Admin Office",  color: "#8F3347" },
  { id: "admin",     type: "admin",     label: "Admin / Registrar",  color: "#C24322" },
  { id: "library",   type: "library",   label: "Library",            color: "#2d5da1" },
  { id: "cafeteria", type: "cafeteria", label: "Cafeteria",          color: "#b45309" },
  { id: "gym",       type: "gym",       label: "Gymnasium",          color: "#15803d" },
  { id: "restroom",  type: "restroom",  label: "Restroom",           color: "#6b7280" },
  { id: "stairwell", type: "stairwell", label: "Stairwell",          color: "#7c3aed" },
  { id: "entrance",  type: "entrance",  label: "Entrance / Exit",    color: "#0891b2" },
  { id: "emergency", type: "emergency", label: "Emergency Exit",     color: "#dc2626" }
];

var DEFAULT_LOCATIONS = [
  // Ground Floor
  { id: "entrance-main",  name: "Main Entrance",         type: "entrance",  floor: 1, x: 50, y: 7,  description: "Main building entrance (top)" },
  { id: "entrance-left",  name: "Exit / Entrance Left",  type: "entrance",  floor: 1, x: 3,  y: 53, description: "Left side emergency exit" },
  { id: "entrance-right", name: "Exit / Entrance Right", type: "entrance",  floor: 1, x: 97, y: 53, description: "Right side emergency exit" },
  { id: "stair-left",     name: "Stairwell Left",        type: "stairwell", floor: 1, x: 27, y: 91, description: "Left stairwell to upper floors" },
  { id: "stair-right",    name: "Stairwell Right",       type: "stairwell", floor: 1, x: 73, y: 91, description: "Right stairwell to upper floors" },
  { id: "room-101",       name: "Room 101",              type: "classroom", floor: 1, x: 5,  y: 28, description: "Classroom / Office" },
  { id: "room-102",       name: "Room 102",              type: "classroom", floor: 1, x: 12, y: 28, description: "Classroom / Office" },
  { id: "room-103",       name: "Room 103",              type: "office",    floor: 1, x: 19, y: 28, description: "Faculty Office" },
  { id: "restroom-1a",    name: "Restroom (Left)",       type: "restroom",  floor: 1, x: 25, y: 28, description: "Ground floor left restroom" },
  { id: "room-104",       name: "Room 104",              type: "classroom", floor: 1, x: 31, y: 28, description: "Classroom" },
  { id: "parking-1",      name: "Parking / Storage",     type: "admin",     floor: 1, x: 38, y: 28, description: "Parking / storage area" },
  { id: "cafeteria-1",    name: "Cafeteria",             type: "cafeteria", floor: 1, x: 45, y: 28, description: "Student dining / café area" },
  { id: "lobby-1",        name: "Central Lobby",         type: "entrance",  floor: 1, x: 50, y: 55, description: "Open lobby with garden feature" },
  { id: "room-105",       name: "Room 105",              type: "office",    floor: 1, x: 58, y: 28, description: "Admin Office" },
  { id: "restroom-1b",    name: "Restroom (Right)",      type: "restroom",  floor: 1, x: 64, y: 28, description: "Ground floor right restroom" },
  { id: "room-106",       name: "Room 106",              type: "classroom", floor: 1, x: 71, y: 28, description: "Classroom" },
  { id: "library-1",      name: "Library / Hall",        type: "library",   floor: 1, x: 80, y: 28, description: "School library / function hall" },
  { id: "room-107",       name: "Room 107",              type: "classroom", floor: 1, x: 91, y: 28, description: "Classroom" },
  { id: "room-108",       name: "Room 108",              type: "classroom", floor: 1, x: 11, y: 71, description: "Classroom" },
  { id: "room-109",       name: "Room 109",              type: "admin",     floor: 1, x: 18, y: 71, description: "Admin Office" },
  { id: "room-110",       name: "Room 110",              type: "classroom", floor: 1, x: 25, y: 71, description: "Classroom" },
  { id: "room-111",       name: "Room 111",              type: "classroom", floor: 1, x: 33, y: 71, description: "Classroom" },
  { id: "room-112",       name: "Room 112",              type: "classroom", floor: 1, x: 60, y: 71, description: "Classroom" },
  { id: "room-113",       name: "Room 113",              type: "office",    floor: 1, x: 68, y: 71, description: "Office" },
  { id: "gym-1",          name: "Gymnasium",             type: "gym",       floor: 1, x: 76, y: 71, description: "Sports & physical education" },
  { id: "room-114",       name: "Room 114",              type: "classroom", floor: 1, x: 84, y: 71, description: "Classroom" },
  { id: "room-115",       name: "Room 115",              type: "cafeteria", floor: 1, x: 91, y: 71, description: "Canteen / Food area" },
  // Second Floor
  { id: "vp-room",        name: "VP Office",             type: "office",    floor: 2, x: 30, y: 30, description: "Vice President's office" },
  { id: "president-room", name: "President's Office",    type: "office",    floor: 2, x: 60, y: 25, description: "School President's office" },
  { id: "registrar",      name: "Registrar",             type: "admin",     floor: 2, x: 45, y: 55, description: "Student records & registration" },
  { id: "mis",            name: "MIS Office",            type: "admin",     floor: 2, x: 75, y: 55, description: "Management Information Systems" },
  { id: "room-201",       name: "Room 201 - English",    type: "classroom", floor: 2, x: 20, y: 70, description: "English department" },
  { id: "room-202",       name: "Room 202 - History",    type: "classroom", floor: 2, x: 50, y: 72, description: "Social studies" },
  { id: "restroom-2a",    name: "Restroom (2nd)",        type: "restroom",  floor: 2, x: 80, y: 80, description: "Second floor restroom" },
  { id: "stair-2",        name: "Stairwell A (2F)",      type: "stairwell", floor: 2, x: 15, y: 85, description: "Stairwell access" },
  // Third Floor
  { id: "room-301",       name: "Room 301 - Computer Lab", type: "classroom", floor: 3, x: 30, y: 35, description: "Computer laboratory" },
  { id: "room-302",       name: "Room 302 - Arts",          type: "classroom", floor: 3, x: 60, y: 35, description: "Arts & crafts room" },
  { id: "room-303",       name: "Room 303 - Music",         type: "classroom", floor: 3, x: 45, y: 60, description: "Music room" },
  { id: "restroom-3a",    name: "Restroom (3rd)",           type: "restroom",  floor: 3, x: 15, y: 75, description: "Third floor restroom" },
  { id: "emergency-3",    name: "Emergency Exit",           type: "emergency", floor: 3, x: 80, y: 90, description: "Emergency exit" }
];

var LOCATION_TYPES = [
  "classroom", "office", "admin", "library", "cafeteria",
  "gym", "restroom", "stairwell", "entrance", "emergency"
];

var FAQ_ITEMS = [
  { q: "How do I navigate the map?",      a: "Click 'Explore as Guest' on the home page to open the interactive map. You can zoom in/out, switch floors, and click any location pin to see its details.", color: "#192A57" },
  { q: "How do I find a specific room?",   a: "Use the search bar at the top of the map page to search by room name or number. You can also use the 'From' and 'To' dropdowns to get route directions.", color: "#8F3347" },
  { q: "What do the colored pins mean?",   a: "Each color represents a different type of location. The legend panel on the left shows all color codes: blue for classrooms, maroon for offices, etc.", color: "#C24322" },
  { q: "How do I create an account?",      a: "Click 'Sign In to Continue' on the home page, then click 'Register' to create a new account. You can register as a Student, Faculty, or Visitor.", color: "#2d5da1" },
  { q: "I'm an admin. How do I edit?",     a: "Log in with an admin account. You'll see an 'Admin Panel' option in the user menu. From there you can add floors, locations, and customize the legend.", color: "#b45309" },
  { q: "Is SchoolMap available on mobile?",a: "Yes! SchoolMap is fully responsive. You can access it from any smartphone, tablet, or desktop browser.", color: "#15803d" }
];

var RECOMMENDATIONS = [
  { id: "registrar",   reason: "Office hours: 8AM–5PM" },
  { id: "library-1",  reason: "Open now • Quiet zone" },
  { id: "cafeteria-1",reason: "Lunch break nearby" },
  { id: "room-301",   reason: "Available now" }
];

/* =========================================================
   APPLICATION STATE
   ========================================================= */

var AppState = {
  currentPage:      "landing",
  currentUser:      null,
  landingView:      "home",
  locations:        [],
  floors:           [],
  legends:          [],
  // Map state
  currentFloor:     1,
  zoom:             1,
  selectedLocation: null,
  showLabels:       true,
  showLegend:       true,
  routeFrom:        "",
  routeTo:          "",
  showRoute:        false,
  userMenuOpen:     false,
  sidebarOpen:      false,
  // Admin state
  adminTab:         "locations",
  adminLocations:   [],
  adminFloors:      [],
  adminLegends:     [],
  editingLocationId: null,
  editingFloorId:   null,
  showAddLocation:  false,
  showAddFloor:     false
};

/* =========================================================
   STORAGE HELPERS
   ========================================================= */

function storageGet(key, defaultValue) {
  try {
    var raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) {
      return (typeof defaultValue === "function") ? defaultValue() : defaultValue;
    }
    return JSON.parse(raw);
  } catch (err) {
    return (typeof defaultValue === "function") ? defaultValue() : defaultValue;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("localStorage write failed:", err);
  }
}

function migrateData() {
  var version = localStorage.getItem("schoolmap_data_version");
  if (version !== APP_DATA_VERSION) {
    localStorage.removeItem(APP_LOCATIONS_KEY);
    localStorage.setItem("schoolmap_data_version", APP_DATA_VERSION);
  }
}

function getStoredLocations() {
  migrateData();
  return storageGet(APP_LOCATIONS_KEY, DEFAULT_LOCATIONS);
}

function getStoredFloors() {
  return storageGet(APP_FLOORS_KEY, DEFAULT_FLOORS);
}

function getStoredLegends() {
  return storageGet(APP_LEGENDS_KEY, DEFAULT_LEGENDS);
}

function getStoredUsers() {
  return storageGet(APP_USERS_KEY, []);
}

function storeUsers(users) {
  storageSet(APP_USERS_KEY, users);
}

function getCurrentUser() {
  return storageGet(APP_CURRENT_KEY, null);
}

function setCurrentUser(user) {
  if (user) {
    storageSet(APP_CURRENT_KEY, user);
  } else {
    localStorage.removeItem(APP_CURRENT_KEY);
  }
}

function getColorMap() {
  var map = {};
  var legends = AppState.legends;
  for (var i = 0; i < legends.length; i++) {
    map[legends[i].type] = legends[i].color;
  }
  return map;
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

function initApp() {
  ensureAdminUser();

  AppState.currentUser  = getCurrentUser();
  AppState.locations    = getStoredLocations();
  AppState.floors       = getStoredFloors();
  AppState.legends      = getStoredLegends();
  AppState.adminLocations = deepClone(AppState.locations);
  AppState.adminFloors    = deepClone(AppState.floors);
  AppState.adminLegends   = deepClone(AppState.legends);

  buildFAQList();
  handleHashChange();
  window.addEventListener("hashchange", handleHashChange);
  document.addEventListener("click", handleGlobalClick);
}

function ensureAdminUser() {
  var users = getStoredUsers();
  var hasAdmin = users.some(function(u) { return u.role === "admin"; });
  if (!hasAdmin) {
    users.push({
      id:       "admin-1",
      fullName: "Administrator",
      email:    "admin@schoolmap.edu",
      username: "admin",
      role:     "admin",
      password: "admin123"
    });
    storeUsers(users);
  }
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* =========================================================
   ROUTING / NAVIGATION
   ========================================================= */

function handleHashChange() {
  var hash = window.location.hash.replace("#", "") || "landing";
  navigateDirect(hash);
}

function navigate(page) {
  window.location.hash = page;
}

function navigateDirect(page) {
  var pages = ["landing", "login", "register", "forgot-password", "map", "admin", "404"];

  // Hide all pages
  pages.forEach(function(p) {
    var el = document.getElementById("page-" + p);
    if (el) { el.style.display = "none"; }
  });

  AppState.currentPage = page;

  // Re-sync data from storage when entering key pages
  AppState.locations = getStoredLocations();
  AppState.floors    = getStoredFloors();
  AppState.legends   = getStoredLegends();
  AppState.currentUser = getCurrentUser();

  if (page === "landing") {
    var el = document.getElementById("page-landing");
    if (el) { el.style.display = ""; }
    showLandingView(AppState.landingView || "home");
  } else if (page === "login") {
    showPage("login");
    resetLoginForm();
  } else if (page === "register") {
    showPage("register");
    resetRegisterForm();
  } else if (page === "forgot-password") {
    showPage("forgot-password");
    resetForgotForm();
  } else if (page === "map") {
    showPage("map");
    initMapPage();
  } else if (page === "admin") {
    if (!AppState.currentUser || AppState.currentUser.role !== "admin") {
      navigate("login");
      return;
    }
    showPage("admin");
    initAdminPage();
  } else {
    showPage("404");
  }
}

function showPage(name) {
  var el = document.getElementById("page-" + name);
  if (el) {
    el.style.display = "";
    el.style.removeProperty("display");
  }
}

/* =========================================================
   LANDING PAGE
   ========================================================= */

function showLandingView(view) {
  AppState.landingView = view;
  var views = ["home", "about", "help"];
  views.forEach(function(v) {
    var el = document.getElementById("landing-" + v);
    if (el) { el.style.display = (v === view) ? "" : "none"; }
  });
}

function toggleMobileMenu() {
  var nav = document.getElementById("mobile-nav");
  var menuIcon  = document.getElementById("menu-icon");
  var closeIcon = document.getElementById("close-icon");
  if (!nav) { return; }
  var isOpen = nav.style.display !== "none";
  nav.style.display = isOpen ? "none" : "";
  if (menuIcon)  { menuIcon.style.display  = isOpen ? "" : "none"; }
  if (closeIcon) { closeIcon.style.display = isOpen ? "none" : ""; }
}

function buildFAQList() {
  var container = document.getElementById("faq-list");
  if (!container) { return; }
  var html = "";
  var bgColors = ["#ffffff", "#F8E9D8", "#ffffff", "#F8E9D8", "#fff9c4", "#ffffff"];
  for (var i = 0; i < FAQ_ITEMS.length; i++) {
    var item = FAQ_ITEMS[i];
    var rotation = (i % 3 === 0) ? "rotate-n1" : (i % 3 === 1) ? "rotate-1" : "";
    var decoration = (i % 2 === 0) ? "tack-decoration" : "tape-decoration";
    html += '<div class="faq-item ' + decoration + ' ' + rotation + '" style="background:' + bgColors[i] + '">';
    html += '<p class="faq-q" style="color:' + item.color + '">Q: ' + escHtml(item.q) + '</p>';
    html += '<p class="faq-a">✏ ' + escHtml(item.a) + '</p>';
    html += '</div>';
  }
  container.innerHTML = html;
}

/* =========================================================
   AUTH — LOGIN
   ========================================================= */

function resetLoginForm() {
  var form = document.getElementById("login-form");
  if (form) { form.reset(); }
  var err = document.getElementById("login-error");
  if (err) { err.style.display = "none"; err.textContent = ""; }
  var btn = document.getElementById("login-submit");
  if (btn) { btn.textContent = "Sign In"; btn.disabled = false; }
}

function handleLogin(event) {
  event.preventDefault();
  var identifier = document.getElementById("login-identifier").value.trim();
  var password    = document.getElementById("login-password").value;
  var errBox      = document.getElementById("login-error");
  var submitBtn   = document.getElementById("login-submit");

  errBox.style.display = "none";
  submitBtn.textContent = "Signing in...";
  submitBtn.disabled    = true;

  setTimeout(function() {
    var users = getStoredUsers();
    var user  = null;
    for (var i = 0; i < users.length; i++) {
      if ((users[i].email === identifier || users[i].username === identifier) &&
           users[i].password === password) {
        user = users[i];
        break;
      }
    }

    if (user) {
      var safeUser = {
        id:       user.id,
        fullName: user.fullName,
        email:    user.email,
        username: user.username,
        role:     user.role
      };
      AppState.currentUser = safeUser;
      setCurrentUser(safeUser);
      showToast("Welcome back, " + safeUser.fullName.split(" ")[0] + "! 👋");
      navigate("map");
    } else {
      errBox.textContent    = "Invalid email/username or password.";
      errBox.style.display  = "";
      submitBtn.textContent = "Sign In";
      submitBtn.disabled    = false;
    }
  }, 500);
}

/* =========================================================
   AUTH — REGISTER
   ========================================================= */

var selectedRole = "student";

function resetRegisterForm() {
  var form = document.getElementById("register-form");
  if (form) { form.reset(); }
  selectedRole = "student";
  var roleButtons = document.querySelectorAll(".role-btn");
  roleButtons.forEach(function(btn) {
    btn.classList.toggle("active", btn.textContent.trim() === "student");
  });
  var roleInput = document.getElementById("reg-role");
  if (roleInput) { roleInput.value = "student"; }
  ["fullname", "email", "username", "password", "confirm"].forEach(function(f) {
    var el = document.getElementById("err-" + f);
    if (el) { el.textContent = ""; }
  });
  var btn = document.getElementById("register-submit");
  if (btn) { btn.textContent = "Register"; btn.disabled = false; }
}

function selectRole(role, button) {
  selectedRole = role;
  var roleInput = document.getElementById("reg-role");
  if (roleInput) { roleInput.value = role; }
  var roleButtons = document.querySelectorAll(".role-btn");
  roleButtons.forEach(function(btn) { btn.classList.remove("active"); });
  if (button) { button.classList.add("active"); }
}

function handleRegister(event) {
  event.preventDefault();

  var fullName  = document.getElementById("reg-fullname").value.trim();
  var email     = document.getElementById("reg-email").value.trim();
  var username  = document.getElementById("reg-username").value.trim();
  var password  = document.getElementById("reg-password").value;
  var confirm   = document.getElementById("reg-confirm").value;
  var role      = document.getElementById("reg-role").value || "student";
  var submitBtn = document.getElementById("register-submit");

  var errors = {};
  if (!fullName) {
    errors.fullname = "Full name is required";
  }
  if (!email.includes("@")) {
    errors.email = "Enter a valid email address";
  }
  if (username.length < 3) {
    errors.username = "Username must be at least 3 characters";
  }
  if (password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }
  if (password !== confirm) {
    errors.confirm = "Passwords do not match";
  }

  var users = getStoredUsers();
  if (!errors.email && users.some(function(u) { return u.email === email; })) {
    errors.email = "Email already registered";
  }
  if (!errors.username && users.some(function(u) { return u.username === username; })) {
    errors.username = "Username already taken";
  }

  ["fullname", "email", "username", "password", "confirm"].forEach(function(f) {
    var el = document.getElementById("err-" + f);
    if (el) { el.textContent = errors[f] || ""; }
    var input = document.getElementById("reg-" + f);
    if (input) {
      if (errors[f]) { input.classList.add("error"); }
      else { input.classList.remove("error"); }
    }
  });

  if (Object.keys(errors).length > 0) { return; }

  submitBtn.textContent = "Creating account...";
  submitBtn.disabled    = true;

  setTimeout(function() {
    var newUser = {
      id:       "user-" + Date.now(),
      fullName: fullName,
      email:    email,
      username: username,
      role:     role,
      password: password
    };
    users.push(newUser);
    storeUsers(users);

    var safeUser = { id: newUser.id, fullName: newUser.fullName, email: newUser.email, username: newUser.username, role: newUser.role };
    AppState.currentUser = safeUser;
    setCurrentUser(safeUser);

    showToast("Account created! Welcome, " + fullName.split(" ")[0] + "! 🎉");
    navigate("map");
  }, 600);
}

/* =========================================================
   AUTH — FORGOT PASSWORD
   ========================================================= */

function resetForgotForm() {
  var formContainer = document.getElementById("forgot-form-container");
  var successBox    = document.getElementById("forgot-success");
  var form          = document.getElementById("forgot-form");
  var errEl         = document.getElementById("err-forgot-email");
  var btn           = document.getElementById("forgot-submit");

  if (formContainer) { formContainer.style.display = ""; }
  if (successBox)    { successBox.style.display    = "none"; }
  if (form)          { form.reset(); }
  if (errEl)         { errEl.textContent = ""; }
  if (btn)           { btn.disabled = false; btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Send Reset Link'; }
}

function handleForgotPassword(event) {
  event.preventDefault();
  var email  = document.getElementById("forgot-email").value.trim();
  var errEl  = document.getElementById("err-forgot-email");
  var btn    = document.getElementById("forgot-submit");

  if (errEl) { errEl.textContent = ""; }

  if (!email.includes("@")) {
    if (errEl) { errEl.textContent = "Please enter a valid email address"; }
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }

  setTimeout(function() {
    var formContainer = document.getElementById("forgot-form-container");
    var successBox    = document.getElementById("forgot-success");
    if (formContainer) { formContainer.style.display = "none"; }
    if (successBox)    { successBox.style.display    = ""; }
  }, 700);
}

/* =========================================================
   AUTH — LOGOUT
   ========================================================= */

function handleLogout() {
  AppState.currentUser = null;
  setCurrentUser(null);
  closeUserMenu();
  showToast("You have been signed out.");
  navigate("landing");
}

/* =========================================================
   PASSWORD VISIBILITY TOGGLE
   ========================================================= */

function togglePasswordVisibility(inputId, button) {
  var input = document.getElementById(inputId);
  if (!input) { return; }
  var isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  if (button) {
    button.innerHTML = isPassword
      ? '<svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
      : '<svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
  }
}

/* =========================================================
   USER MENU (MAP PAGE)
   ========================================================= */

function renderUserArea() {
  var container = document.getElementById("map-user-area");
  if (!container) { return; }
  var user = AppState.currentUser;

  if (user) {
    container.innerHTML =
      '<button class="map-user-btn" onclick="toggleUserMenu(this)">' +
      '<div class="user-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>' +
      '<span class="user-avatar-name">' + escHtml(user.fullName.split(" ")[0]) + '</span>' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
      '</button>';
  } else {
    container.innerHTML =
      '<button class="wobbly-btn wobbly-btn-secondary wobbly-btn-sm" onclick="navigate(\'login\')">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
      'Sign In</button>';
  }
}

function toggleUserMenu(button) {
  var dropdown = document.getElementById("user-dropdown");
  if (!dropdown) { return; }

  if (AppState.userMenuOpen) {
    closeUserMenu();
    return;
  }

  var user = AppState.currentUser;
  if (!user) { return; }

  document.getElementById("user-dropdown-name").textContent = user.fullName;
  document.getElementById("user-dropdown-role").textContent = user.role;

  var adminItem = document.getElementById("user-dropdown-admin");
  if (adminItem) { adminItem.style.display = user.role === "admin" ? "" : "none"; }

  if (button) {
    var rect = button.getBoundingClientRect();
    dropdown.style.top   = (rect.bottom + 4) + "px";
    dropdown.style.right = (window.innerWidth - rect.right) + "px";
    dropdown.style.left  = "auto";
  }

  dropdown.style.display = "";
  AppState.userMenuOpen  = true;
}

function closeUserMenu() {
  var dropdown = document.getElementById("user-dropdown");
  if (dropdown) { dropdown.style.display = "none"; }
  AppState.userMenuOpen = false;
}

function handleGlobalClick(event) {
  if (AppState.userMenuOpen) {
    var dropdown = document.getElementById("user-dropdown");
    var userArea = document.getElementById("map-user-area");
    if (dropdown && !dropdown.contains(event.target) &&
        userArea  && !userArea.contains(event.target)) {
      closeUserMenu();
    }
  }
}

/* =========================================================
   MAP PAGE — INITIALIZATION
   ========================================================= */

function initMapPage() {
  AppState.zoom             = 1;
  AppState.selectedLocation = null;
  AppState.routeFrom        = "";
  AppState.routeTo          = "";
  AppState.showRoute        = false;
  AppState.currentFloor     = 1;

  renderUserArea();
  populateRouteSelects();
  renderFloorButtons();
  renderLegendItems();
  renderMapCanvas();
  renderPins();
  renderRecommendations();
  updateYouAreHere();
  updateRouteBtnState();

  // Reset route selects
  var fromSel = document.getElementById("route-from");
  var toSel   = document.getElementById("route-to");
  if (fromSel) { fromSel.value = ""; }
  if (toSel)   { toSel.value   = ""; }
}

/* =========================================================
   MAP PAGE — FLOOR BUTTONS
   ========================================================= */

function renderFloorButtons() {
  var container = document.getElementById("floor-buttons");
  if (!container) { return; }
  var html = "";
  AppState.floors.forEach(function(floor) {
    var active = floor.id === AppState.currentFloor ? " active" : "";
    html += '<button class="floor-btn' + active + '" onclick="switchFloor(' + floor.id + ')">' +
      escHtml(floor.name) +
      '<span class="floor-btn-label">' + escHtml(floor.label) + '</span>' +
      '</button>';
  });
  container.innerHTML = html;
}

function switchFloor(floorId) {
  AppState.currentFloor     = floorId;
  AppState.selectedLocation = null;
  renderFloorButtons();
  updateFloorBadge();
  renderMapCanvas();
  renderPins();
  renderRouteOverlay();
  updateYouAreHere();
  closeSelectedPanel();
}

function updateFloorBadge() {
  var badge = document.getElementById("floor-badge");
  if (!badge) { return; }
  var floor = AppState.floors.find(function(f) { return f.id === AppState.currentFloor; });
  badge.textContent = floor ? floor.name : ("Floor " + AppState.currentFloor);
}

/* =========================================================
   MAP PAGE — LEGEND
   ========================================================= */

function renderLegendItems() {
  var container = document.getElementById("legend-items");
  if (!container) { return; }
  var html = "";
  AppState.legends.forEach(function(leg) {
    html += '<div class="legend-item">' +
      '<div class="legend-dot" style="background:' + leg.color + '"></div>' +
      '<span class="legend-label">' + escHtml(leg.label) + '</span>' +
      '</div>';
  });
  container.innerHTML = html;
}

function toggleLegend() {
  AppState.showLegend = !AppState.showLegend;
  var container = document.getElementById("legend-items");
  var btn       = document.getElementById("legend-toggle-btn");
  if (container) { container.style.display = AppState.showLegend ? "" : "none"; }
  if (btn) { btn.textContent = AppState.showLegend ? "Hide" : "Show"; }
}

function toggleLabels(checked) {
  AppState.showLabels = checked;
  renderPins();
}

/* =========================================================
   MAP PAGE — MAP CANVAS
   ========================================================= */

function renderMapCanvas() {
  var container = document.getElementById("map-image-container");
  if (!container) { return; }

  if (AppState.currentFloor === 1) {
    container.innerHTML =
      '<img src="images/map-ground-floor.png" alt="Ground Floor Plan" class="map-floor-img" draggable="false" />';
  } else {
    container.innerHTML =
      '<div class="map-grid-bg">' +
      '<svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0.25">' +
      '<line x1="50%" y1="10%" x2="50%" y2="90%" stroke="#2d2d2d" stroke-width="1.5" stroke-dasharray="4 4" />' +
      '<line x1="10%" y1="50%" x2="90%" y2="50%" stroke="#2d2d2d" stroke-width="1.5" stroke-dasharray="4 4" />' +
      '<rect x="10%" y="10%" width="38%" height="38%" fill="none" stroke="#2d2d2d" stroke-width="1" rx="4" />' +
      '<rect x="52%" y="10%" width="38%" height="38%" fill="none" stroke="#2d2d2d" stroke-width="1" rx="4" />' +
      '<rect x="10%" y="52%" width="38%" height="38%" fill="none" stroke="#2d2d2d" stroke-width="1" rx="4" />' +
      '<rect x="52%" y="52%" width="38%" height="38%" fill="none" stroke="#2d2d2d" stroke-width="1" rx="4" />' +
      '</svg>' +
      '</div>';
  }

  updateFloorBadge();
  applyZoom();
}

/* =========================================================
   MAP PAGE — PINS
   ========================================================= */

function renderPins() {
  var container = document.getElementById("map-pins");
  if (!container) { return; }

  var floorLocs = AppState.locations.filter(function(l) {
    return l.floor === AppState.currentFloor;
  });

  var colorMap = getColorMap();
  var html = "";

  floorLocs.forEach(function(loc) {
    var color    = colorMap[loc.type] || "#192A57";
    var isSelected = AppState.selectedLocation && AppState.selectedLocation.id === loc.id;
    var size     = AppState.currentFloor === 1 ? 28 : 30;
    var iconSize = size - 4;
    var selectedClass = isSelected ? " selected" : "";

    var pulseHtml = "";
    if (isSelected) {
      pulseHtml = '<div class="map-pin-pulse" style="width:' + (size + 18) + 'px;height:' + (size + 18) + 'px;top:' + (-(size + 18 - size) / 2) + 'px;left:' + (-(size + 18 - size) / 2) + 'px;background:' + color + '33;"></div>';
    }

    var labelHtml = "";
    if (AppState.showLabels) {
      labelHtml = '<span class="map-pin-label">' + escHtml(loc.name) + '</span>';
    }

    html += '<div class="map-pin-wrapper' + selectedClass + '" ' +
      'style="left:' + loc.x + '%;top:' + loc.y + '%;" ' +
      'onclick="selectPin(\'' + loc.id + '\')" ' +
      'title="' + escHtml(loc.name) + '">' +
      pulseHtml +
      '<div class="map-pin-icon" style="width:' + size + 'px;height:' + size + 'px;background:' + color + (isSelected ? ';box-shadow:0 0 0 3px white,0 0 0 5px ' + color : '') + '">' +
      getPinIcon(loc.type, iconSize) +
      '</div>' +
      labelHtml +
      '</div>';
  });

  container.innerHTML = html;
}

function getPinIcon(type, size) {
  var icons = {
    classroom: '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
    office:    '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>',
    admin:     '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    library:   '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
    cafeteria: '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
    gym:       '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path d="M6.5 6.5h11M6.5 17.5h11M3 9.5h18M3 14.5h18"/></svg>',
    restroom:  '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    stairwell: '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
    entrance:  '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    emergency: '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };
  return icons[type] || icons.entrance;
}

function selectPin(locId) {
  var loc = AppState.locations.find(function(l) { return l.id === locId; });
  if (!loc) { return; }

  if (AppState.selectedLocation && AppState.selectedLocation.id === locId) {
    AppState.selectedLocation = null;
    closeSelectedPanel();
  } else {
    AppState.selectedLocation = loc;
    showSelectedPanel(loc);
  }
  renderPins();
}

/* =========================================================
   MAP PAGE — SELECTED LOCATION PANEL
   ========================================================= */

function showSelectedPanel(loc) {
  var panel   = document.getElementById("selected-panel");
  var content = document.getElementById("selected-panel-content");
  if (!panel || !content) { return; }

  var colorMap = getColorMap();
  var color    = colorMap[loc.type] || "#192A57";

  content.innerHTML =
    '<div style="display:flex;align-items:flex-start;gap:8px">' +
    '<div class="info-panel-icon" style="background:' + color + ';margin-top:2px">' +
    '<span style="width:8px;height:8px;background:white;border-radius:50%;display:block"></span>' +
    '</div>' +
    '<div style="flex:1;min-width:0">' +
    '<p class="info-panel-title">' + escHtml(loc.name) + '</p>' +
    '<p class="info-panel-type">' + escHtml(loc.type) + ' • Floor ' + loc.floor + '</p>' +
    (loc.description ? '<p class="info-panel-desc">' + escHtml(loc.description) + '</p>' : '') +
    '</div>' +
    '</div>' +
    '<div class="info-panel-actions">' +
    '<button class="info-action-btn info-action-btn-primary" onclick="setRouteTo(\'' + loc.id + '\')">Go here</button>' +
    '<button class="info-action-btn info-action-btn-secondary" onclick="setRouteFrom(\'' + loc.id + '\')">Start here</button>' +
    '</div>';

  panel.style.display = "";
}

function closeSelectedPanel() {
  var panel = document.getElementById("selected-panel");
  if (panel) { panel.style.display = "none"; }
  AppState.selectedLocation = null;
  renderPins();
}

function setRouteTo(locId) {
  var toSel = document.getElementById("route-to");
  if (toSel) { toSel.value = locId; }
  AppState.routeTo = locId;
  updateRouteBtnState();
  closeSelectedPanel();
}

function setRouteFrom(locId) {
  var fromSel = document.getElementById("route-from");
  if (fromSel) { fromSel.value = locId; }
  AppState.routeFrom = locId;
  updateRouteBtnState();
  closeSelectedPanel();
}

/* =========================================================
   MAP PAGE — SEARCH
   ========================================================= */

function handleMapSearch(query) {
  AppState.searchQuery = query;
  var resultsBox = document.getElementById("search-results");
  if (!resultsBox) { return; }

  if (!query || query.length < 1) {
    resultsBox.style.display = "none";
    resultsBox.innerHTML = "";
    return;
  }

  var q   = query.toLowerCase();
  var matches = AppState.locations.filter(function(loc) {
    return loc.name.toLowerCase().indexOf(q) !== -1;
  });

  if (matches.length === 0) {
    resultsBox.style.display = "none";
    resultsBox.innerHTML = "";
    return;
  }

  var colorMap = getColorMap();
  var html = "";
  matches.slice(0, 8).forEach(function(loc) {
    var color = colorMap[loc.type] || "#192A57";
    html += '<div class="search-result-item" onclick="selectSearchResult(\'' + loc.id + '\')">' +
      '<div class="search-result-dot" style="background:' + color + '"></div>' +
      '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(loc.name) + '</span>' +
      '<span class="search-result-floor">Floor ' + loc.floor + '</span>' +
      '</div>';
  });

  resultsBox.innerHTML = html;
  resultsBox.style.display = "";
}

function selectSearchResult(locId) {
  var loc = AppState.locations.find(function(l) { return l.id === locId; });
  if (!loc) { return; }

  var searchInput = document.getElementById("map-search");
  var resultsBox  = document.getElementById("search-results");
  if (searchInput) { searchInput.value = ""; }
  if (resultsBox)  { resultsBox.style.display = "none"; }

  if (loc.floor !== AppState.currentFloor) {
    switchFloor(loc.floor);
  }

  AppState.selectedLocation = loc;
  showSelectedPanel(loc);
  renderPins();
}

/* =========================================================
   MAP PAGE — ROUTE FINDER
   ========================================================= */

function populateRouteSelects() {
  var fromSel = document.getElementById("route-from");
  var toSel   = document.getElementById("route-to");
  if (!fromSel || !toSel) { return; }

  var optionsHtml = '<option value="">From: Select location</option>';
  AppState.floors.forEach(function(floor) {
    var floorLocs = AppState.locations.filter(function(l) { return l.floor === floor.id; });
    if (floorLocs.length === 0) { return; }
    optionsHtml += '<optgroup label="' + escAttr(floor.name) + '">';
    floorLocs.forEach(function(loc) {
      optionsHtml += '<option value="' + escAttr(loc.id) + '">' + escHtml(loc.name) + '</option>';
    });
    optionsHtml += '</optgroup>';
  });
  fromSel.innerHTML = optionsHtml;

  var toOptionsHtml = optionsHtml.replace('From: Select location', 'To: Select destination');
  toSel.innerHTML = toOptionsHtml;
}

function handleRouteChange() {
  var fromSel = document.getElementById("route-from");
  var toSel   = document.getElementById("route-to");
  AppState.routeFrom  = fromSel ? fromSel.value : "";
  AppState.routeTo    = toSel   ? toSel.value   : "";
  AppState.showRoute  = false;
  closeRoutePanel();
  renderRouteOverlay();
  updateRouteBtnState();
}

function updateRouteBtnState() {
  var btn = document.getElementById("show-route-btn");
  if (!btn) { return; }
  btn.disabled = !(AppState.routeFrom && AppState.routeTo);
}

function showRoute() {
  if (!AppState.routeFrom || !AppState.routeTo) { return; }
  AppState.showRoute = true;

  var fromLoc = AppState.locations.find(function(l) { return l.id === AppState.routeFrom; });
  var toLoc   = AppState.locations.find(function(l) { return l.id === AppState.routeTo; });

  if (!fromLoc || !toLoc) { return; }

  if (fromLoc.floor !== AppState.currentFloor) {
    switchFloor(fromLoc.floor);
  }

  renderRouteOverlay();
  showRouteInfoPanel(fromLoc, toLoc);
}

function renderRouteOverlay() {
  var svg = document.getElementById("route-svg");
  if (!svg) { return; }

  if (!AppState.showRoute) {
    svg.style.display = "none";
    return;
  }

  var fromLoc = AppState.locations.find(function(l) { return l.id === AppState.routeFrom; });
  var toLoc   = AppState.locations.find(function(l) { return l.id === AppState.routeTo; });

  if (!fromLoc || !toLoc ||
     (fromLoc.floor !== AppState.currentFloor && toLoc.floor !== AppState.currentFloor)) {
    svg.style.display = "none";
    return;
  }

  svg.style.display = "";

  var routeLine  = document.getElementById("route-line");
  var fromDot    = document.getElementById("route-from-dot");
  var toDot      = document.getElementById("route-to-dot");

  if (fromLoc.floor === AppState.currentFloor && toLoc.floor === AppState.currentFloor) {
    if (routeLine) {
      routeLine.setAttribute("x1", fromLoc.x + "%");
      routeLine.setAttribute("y1", fromLoc.y + "%");
      routeLine.setAttribute("x2", toLoc.x + "%");
      routeLine.setAttribute("y2", toLoc.y + "%");
    }
    if (fromDot) {
      fromDot.setAttribute("cx", fromLoc.x + "%");
      fromDot.setAttribute("cy", fromLoc.y + "%");
      fromDot.style.display = "";
    }
    if (toDot) {
      toDot.setAttribute("cx", toLoc.x + "%");
      toDot.setAttribute("cy", toLoc.y + "%");
      toDot.style.display = "";
    }
  } else if (fromLoc.floor === AppState.currentFloor) {
    if (routeLine) {
      routeLine.setAttribute("x1", fromLoc.x + "%");
      routeLine.setAttribute("y1", fromLoc.y + "%");
      routeLine.setAttribute("x2", "50%");
      routeLine.setAttribute("y2", "90%");
    }
    if (fromDot) {
      fromDot.setAttribute("cx", fromLoc.x + "%");
      fromDot.setAttribute("cy", fromLoc.y + "%");
    }
    if (toDot) { toDot.style.display = "none"; }
  }
}

function showRouteInfoPanel(fromLoc, toLoc) {
  var panel   = document.getElementById("route-info-panel");
  var content = document.getElementById("route-info-content");
  if (!panel || !content) { return; }

  var html =
    '<div class="route-info-row">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="#15803d" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>' +
    '<span><strong>From:</strong> ' + escHtml(fromLoc.name) + '</span>' +
    '</div>' +
    '<div class="route-info-row">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="#C24322" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>' +
    '<span><strong>To:</strong> ' + escHtml(toLoc.name) + '</span>' +
    '</div>';

  if (fromLoc.floor !== toLoc.floor) {
    html += '<p class="route-warn">⚠ Different floors! Use stairwell.</p>';
  }

  content.innerHTML = html;
  panel.style.display = "";
}

function closeRoutePanel() {
  var panel = document.getElementById("route-info-panel");
  if (panel) { panel.style.display = "none"; }
  AppState.showRoute = false;
  var svg = document.getElementById("route-svg");
  if (svg) { svg.style.display = "none"; }
}

/* =========================================================
   MAP PAGE — ZOOM
   ========================================================= */

function changeZoom(delta) {
  AppState.zoom = Math.min(2.5, Math.max(0.5, AppState.zoom + delta));
  applyZoom();
}

function resetZoom() {
  AppState.zoom = 1;
  applyZoom();
}

function applyZoom() {
  var container = document.getElementById("map-zoom-container");
  if (container) {
    container.style.transform = "scale(" + AppState.zoom + ")";
    container.style.transformOrigin = "center center";
  }
}

/* =========================================================
   MAP PAGE — YOU ARE HERE
   ========================================================= */

function updateYouAreHere() {
  var el = document.getElementById("you-are-here");
  if (!el) { return; }
  if (AppState.currentFloor === 1) {
    el.style.left = "51%";
    el.style.top  = "88%";
  } else {
    el.style.left = "50%";
    el.style.top  = "85%";
  }
}

/* =========================================================
   MAP PAGE — RECOMMENDATIONS BAR
   ========================================================= */

function renderRecommendations() {
  var container = document.getElementById("rec-bar-items");
  if (!container) { return; }

  var colorMap = getColorMap();
  var html = "";

  RECOMMENDATIONS.forEach(function(rec) {
    var loc = AppState.locations.find(function(l) { return l.id === rec.id; });
    if (!loc) { return; }
    var color = colorMap[loc.type] || "#192A57";
    html += '<button class="rec-item" onclick="selectRecItem(\'' + loc.id + '\')">' +
      '<div class="rec-dot" style="background:' + color + '"></div>' +
      '<div>' +
      '<div class="rec-name">' + escHtml(loc.name) + '</div>' +
      '<div class="rec-reason">' + escHtml(rec.reason) + '</div>' +
      '</div>' +
      '</button>';
  });

  container.innerHTML = html || "<span style='font-size:13px;color:#2d2d2d66'>No recommendations available</span>";
}

function selectRecItem(locId) {
  var loc = AppState.locations.find(function(l) { return l.id === locId; });
  if (!loc) { return; }
  if (loc.floor !== AppState.currentFloor) { switchFloor(loc.floor); }
  AppState.selectedLocation = loc;
  showSelectedPanel(loc);
  renderPins();
}

/* =========================================================
   MAP PAGE — SIDEBAR TOGGLE (MOBILE)
   ========================================================= */

function toggleMapSidebar() {
  var sidebar = document.getElementById("map-sidebar");
  if (!sidebar) { return; }
  AppState.sidebarOpen = !AppState.sidebarOpen;
  sidebar.classList.toggle("open", AppState.sidebarOpen);
}

/* =========================================================
   ADMIN PAGE — INITIALIZATION
   ========================================================= */

function initAdminPage() {
  AppState.adminLocations = deepClone(AppState.locations);
  AppState.adminFloors    = deepClone(AppState.floors);
  AppState.adminLegends   = deepClone(AppState.legends);
  AppState.adminTab       = "locations";
  AppState.editingLocationId = null;
  AppState.editingFloorId    = null;
  AppState.showAddLocation   = false;
  AppState.showAddFloor      = false;

  resetAdminSaveBtn();
  renderAdminLocations();
  renderAdminFloors();
  renderAdminLegends();
}

function resetAdminSaveBtn() {
  var btns = [document.getElementById("admin-save-btn"), document.getElementById("admin-save-btn-2")];
  btns.forEach(function(btn) {
    if (!btn) { return; }
    btn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/></svg> Save All';
    btn.style.background = "#15803d";
  });
}

/* =========================================================
   ADMIN PAGE — TABS
   ========================================================= */

function switchAdminTab(tab, button) {
  AppState.adminTab = tab;

  document.querySelectorAll(".admin-tab").forEach(function(btn) {
    btn.classList.remove("active");
  });
  if (button) { button.classList.add("active"); }

  var tabs = ["locations", "floors", "legends"];
  tabs.forEach(function(t) {
    var el = document.getElementById("admin-tab-" + t);
    if (el) { el.style.display = (t === tab) ? "" : "none"; }
  });
}

/* =========================================================
   ADMIN PAGE — SAVE / RESET
   ========================================================= */

function adminSaveAll() {
  storageSet(APP_LOCATIONS_KEY, AppState.adminLocations);
  storageSet(APP_FLOORS_KEY,    AppState.adminFloors);
  storageSet(APP_LEGENDS_KEY,   AppState.adminLegends);

  AppState.locations = deepClone(AppState.adminLocations);
  AppState.floors    = deepClone(AppState.adminFloors);
  AppState.legends   = deepClone(AppState.adminLegends);

  var btns = [document.getElementById("admin-save-btn"), document.getElementById("admin-save-btn-2")];
  btns.forEach(function(btn) {
    if (!btn) { return; }
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Saved!';
    btn.style.background = "#0d6b2a";
  });

  setTimeout(resetAdminSaveBtn, 2000);
  showToast("All changes saved!");
}

function adminReset() {
  if (!confirm("Reset all data to defaults? This cannot be undone.")) { return; }
  AppState.adminLocations = deepClone(DEFAULT_LOCATIONS);
  AppState.adminFloors    = deepClone(DEFAULT_FLOORS);
  AppState.adminLegends   = deepClone(DEFAULT_LEGENDS);
  renderAdminLocations();
  renderAdminFloors();
  renderAdminLegends();
  showToast("Data reset to defaults.");
}

/* =========================================================
   ADMIN PAGE — LOCATIONS
   ========================================================= */

function toggleAddLocation() {
  AppState.showAddLocation = !AppState.showAddLocation;
  var formDiv = document.getElementById("add-location-form");
  if (!formDiv) { return; }

  if (AppState.showAddLocation) {
    formDiv.innerHTML = buildAddLocationForm();
    formDiv.style.display = "";
  } else {
    formDiv.style.display = "none";
  }
}

function buildAddLocationForm() {
  var floorOptions = "";
  AppState.adminFloors.forEach(function(f) {
    floorOptions += '<option value="' + f.id + '">' + escHtml(f.name) + '</option>';
  });
  var typeOptions = "";
  LOCATION_TYPES.forEach(function(t) {
    typeOptions += '<option value="' + t + '">' + t + '</option>';
  });

  return '<h3 style="font-family:\'Kalam\',cursive;font-weight:700;color:#192A57;margin-bottom:12px">New Pin Location</h3>' +
    '<div class="admin-form-grid">' +
    '<div class="field-group"><label class="field-label">Location Name</label><input type="text" class="wobbly-input" id="new-loc-name" placeholder="e.g. Room 101 - Math" /></div>' +
    '<div class="field-group"><label class="field-label">Description</label><input type="text" class="wobbly-input" id="new-loc-desc" placeholder="Optional description" /></div>' +
    '<div class="field-group"><label class="field-label">Type</label><select class="wobbly-input" id="new-loc-type">' + typeOptions + '</select></div>' +
    '<div class="field-group"><label class="field-label">Floor</label><select class="wobbly-input" id="new-loc-floor">' + floorOptions + '</select></div>' +
    '<div class="field-group"><label class="field-label">X Position (0–100%)</label><input type="number" class="wobbly-input" id="new-loc-x" value="50" min="0" max="100" /></div>' +
    '<div class="field-group"><label class="field-label">Y Position (0–100%)</label><input type="number" class="wobbly-input" id="new-loc-y" value="50" min="0" max="100" /></div>' +
    '</div>' +
    '<div class="admin-form-actions">' +
    '<button class="wobbly-btn wobbly-btn-primary wobbly-btn-sm" onclick="confirmAddLocation()">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Add Location</button>' +
    '<button class="wobbly-btn wobbly-btn-secondary wobbly-btn-sm" onclick="toggleAddLocation()">Cancel</button>' +
    '</div>';
}

function confirmAddLocation() {
  var name  = document.getElementById("new-loc-name").value.trim();
  var desc  = document.getElementById("new-loc-desc").value.trim();
  var type  = document.getElementById("new-loc-type").value;
  var floor = parseInt(document.getElementById("new-loc-floor").value, 10);
  var x     = parseFloat(document.getElementById("new-loc-x").value);
  var y     = parseFloat(document.getElementById("new-loc-y").value);

  if (!name) { alert("Location name is required."); return; }

  var newLoc = {
    id:          "loc-" + Date.now(),
    name:        name,
    description: desc,
    type:        type,
    floor:       floor,
    x:           x,
    y:           y
  };

  AppState.adminLocations.push(newLoc);
  toggleAddLocation();
  renderAdminLocations();
}

function renderAdminLocations() {
  var container = document.getElementById("locations-list");
  if (!container) { return; }

  var html = "";
  AppState.adminFloors.forEach(function(floor) {
    var floorLocs = AppState.adminLocations.filter(function(l) { return l.floor === floor.id; });
    if (floorLocs.length === 0) { return; }

    html += '<div class="admin-floor-section">';
    html += '<div class="admin-floor-header">';
    html += '<span class="floor-badge-sm">' + escHtml(floor.label) + '</span>';
    html += '<span class="admin-floor-label">' + escHtml(floor.name) + '</span>';
    html += '<div class="admin-floor-divider"></div>';
    html += '</div>';
    html += '<div class="admin-grid-2">';

    floorLocs.forEach(function(loc) {
      if (AppState.editingLocationId === loc.id) {
        html += buildLocationEditCard(loc);
      } else {
        html += buildLocationViewCard(loc);
      }
    });

    html += '</div></div>';
  });

  if (!html) {
    html = '<p style="color:#2d2d2d66;font-size:14px;text-align:center;padding:32px">No locations added yet. Click "Add Location" to get started.</p>';
  }

  container.innerHTML = html;
}

function buildLocationViewCard(loc) {
  return '<div class="admin-location-card">' +
    '<div class="admin-card-row">' +
    '<div class="admin-location-info">' +
    '<p>' + escHtml(loc.name) + '</p>' +
    '<small>' + escHtml(loc.type) + ' · (' + loc.x + '%, ' + loc.y + '%)</small>' +
    (loc.description ? '<br/><small style="color:#2d2d2d66">' + escHtml(loc.description) + '</small>' : '') +
    '</div>' +
    '<div class="admin-card-actions">' +
    '<button class="admin-icon-btn edit" onclick="startEditLocation(\'' + loc.id + '\')" title="Edit">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
    '</button>' +
    '<button class="admin-icon-btn delete" onclick="deleteLocation(\'' + loc.id + '\')" title="Delete">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>' +
    '</button>' +
    '</div>' +
    '</div>' +
    '</div>';
}

function buildLocationEditCard(loc) {
  var floorOptions = "";
  AppState.adminFloors.forEach(function(f) {
    floorOptions += '<option value="' + f.id + '"' + (f.id === loc.floor ? " selected" : "") + '>' + escHtml(f.name) + '</option>';
  });
  var typeOptions = "";
  LOCATION_TYPES.forEach(function(t) {
    typeOptions += '<option value="' + t + '"' + (t === loc.type ? " selected" : "") + '>' + t + '</option>';
  });

  return '<div class="admin-location-card">' +
    '<div class="inline-edit-form">' +
    '<input type="text" class="inline-input" id="edit-loc-name-' + loc.id + '" value="' + escAttr(loc.name) + '" placeholder="Location name" />' +
    '<input type="text" class="inline-input" id="edit-loc-desc-' + loc.id + '" value="' + escAttr(loc.description || "") + '" placeholder="Description" />' +
    '<div class="inline-edit-grid">' +
    '<div><label style="font-size:11px">Type</label><select class="inline-select" id="edit-loc-type-' + loc.id + '">' + typeOptions + '</select></div>' +
    '<div><label style="font-size:11px">Floor</label><select class="inline-select" id="edit-loc-floor-' + loc.id + '">' + floorOptions + '</select></div>' +
    '<div><label style="font-size:11px">X%</label><input type="number" class="inline-input" id="edit-loc-x-' + loc.id + '" value="' + loc.x + '" min="0" max="100" /></div>' +
    '<div><label style="font-size:11px">Y%</label><input type="number" class="inline-input" id="edit-loc-y-' + loc.id + '" value="' + loc.y + '" min="0" max="100" /></div>' +
    '</div>' +
    '<div class="inline-form-actions">' +
    '<button class="inline-btn inline-btn-primary" onclick="saveEditLocation(\'' + loc.id + '\')">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/></svg> Save</button>' +
    '<button class="inline-btn inline-btn-secondary" onclick="cancelEditLocation()">Cancel</button>' +
    '</div>' +
    '</div>' +
    '</div>';
}

function startEditLocation(locId) {
  AppState.editingLocationId = locId;
  renderAdminLocations();
}

function cancelEditLocation() {
  AppState.editingLocationId = null;
  renderAdminLocations();
}

function saveEditLocation(locId) {
  var name  = document.getElementById("edit-loc-name-"  + locId).value.trim();
  var desc  = document.getElementById("edit-loc-desc-"  + locId).value.trim();
  var type  = document.getElementById("edit-loc-type-"  + locId).value;
  var floor = parseInt(document.getElementById("edit-loc-floor-" + locId).value, 10);
  var x     = parseFloat(document.getElementById("edit-loc-x-"  + locId).value);
  var y     = parseFloat(document.getElementById("edit-loc-y-"  + locId).value);

  if (!name) { alert("Location name is required."); return; }

  AppState.adminLocations = AppState.adminLocations.map(function(loc) {
    if (loc.id !== locId) { return loc; }
    return { id: loc.id, name: name, description: desc, type: type, floor: floor, x: x, y: y };
  });

  AppState.editingLocationId = null;
  renderAdminLocations();
}

function deleteLocation(locId) {
  if (!confirm("Delete this location?")) { return; }
  AppState.adminLocations = AppState.adminLocations.filter(function(l) { return l.id !== locId; });
  renderAdminLocations();
}

/* =========================================================
   ADMIN PAGE — FLOORS
   ========================================================= */

function toggleAddFloor() {
  AppState.showAddFloor = !AppState.showAddFloor;
  var formDiv = document.getElementById("add-floor-form");
  if (!formDiv) { return; }

  if (AppState.showAddFloor) {
    formDiv.innerHTML =
      '<h3 style="font-family:\'Kalam\',cursive;font-weight:700;color:#192A57;margin-bottom:12px">New Floor</h3>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
      '<div class="field-group" style="flex:1"><label class="field-label">Floor Name</label><input type="text" class="wobbly-input" id="new-floor-name" placeholder="e.g. Ground Floor" /></div>' +
      '<div class="field-group" style="width:100px"><label class="field-label">Label</label><input type="text" class="wobbly-input" id="new-floor-label" placeholder="1F" /></div>' +
      '</div>' +
      '<div class="admin-form-actions">' +
      '<button class="wobbly-btn wobbly-btn-primary wobbly-btn-sm" onclick="confirmAddFloor()">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Add</button>' +
      '<button class="wobbly-btn wobbly-btn-secondary wobbly-btn-sm" onclick="toggleAddFloor()">Cancel</button>' +
      '</div>';
    formDiv.style.display = "";
  } else {
    formDiv.style.display = "none";
  }
}

function confirmAddFloor() {
  var name  = document.getElementById("new-floor-name").value.trim();
  var label = document.getElementById("new-floor-label").value.trim();
  if (!name || !label) { alert("Floor name and label are required."); return; }

  var maxId = 0;
  AppState.adminFloors.forEach(function(f) { if (f.id > maxId) { maxId = f.id; } });
  AppState.adminFloors.push({ id: maxId + 1, name: name, label: label });
  toggleAddFloor();
  renderAdminFloors();
}

function renderAdminFloors() {
  var container = document.getElementById("floors-list");
  if (!container) { return; }

  var html = "";
  AppState.adminFloors.forEach(function(floor) {
    if (AppState.editingFloorId === floor.id) {
      html += buildFloorEditCard(floor);
    } else {
      html += buildFloorViewCard(floor);
    }
  });

  container.innerHTML = html || '<p style="color:#2d2d2d66;font-size:14px">No floors added yet.</p>';
}

function buildFloorViewCard(floor) {
  var locCount = AppState.adminLocations.filter(function(l) { return l.floor === floor.id; }).length;
  return '<div class="admin-floor-card">' +
    '<div class="admin-card-row">' +
    '<div>' +
    '<div style="display:flex;align-items:center;gap:8px">' +
    '<span class="floor-badge-sm">' + escHtml(floor.label) + '</span>' +
    '<span style="font-family:\'Kalam\',cursive;font-weight:700;color:#192A57">' + escHtml(floor.name) + '</span>' +
    '</div>' +
    '<p style="font-size:12px;color:#2d2d2d66;margin-top:4px">' + locCount + ' locations</p>' +
    '</div>' +
    '<div class="admin-card-actions">' +
    '<button class="admin-icon-btn edit" onclick="startEditFloor(' + floor.id + ')" title="Edit">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
    '</button>' +
    '<button class="admin-icon-btn delete" onclick="deleteFloor(' + floor.id + ')" title="Delete">' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>' +
    '</button>' +
    '</div>' +
    '</div>' +
    '</div>';
}

function buildFloorEditCard(floor) {
  return '<div class="admin-floor-card">' +
    '<div class="inline-edit-form">' +
    '<div class="field-group"><label class="field-label">Floor Name</label><input type="text" class="inline-input" id="edit-floor-name-' + floor.id + '" value="' + escAttr(floor.name) + '" /></div>' +
    '<div class="field-group"><label class="field-label">Label</label><input type="text" class="inline-input" id="edit-floor-label-' + floor.id + '" value="' + escAttr(floor.label) + '" /></div>' +
    '<div class="inline-form-actions">' +
    '<button class="inline-btn inline-btn-primary" onclick="saveEditFloor(' + floor.id + ')">Save</button>' +
    '<button class="inline-btn inline-btn-secondary" onclick="cancelEditFloor()">Cancel</button>' +
    '</div>' +
    '</div>' +
    '</div>';
}

function startEditFloor(floorId) {
  AppState.editingFloorId = floorId;
  renderAdminFloors();
}

function cancelEditFloor() {
  AppState.editingFloorId = null;
  renderAdminFloors();
}

function saveEditFloor(floorId) {
  var name  = document.getElementById("edit-floor-name-"  + floorId).value.trim();
  var label = document.getElementById("edit-floor-label-" + floorId).value.trim();
  if (!name || !label) { alert("Name and label required."); return; }

  AppState.adminFloors = AppState.adminFloors.map(function(f) {
    return f.id === floorId ? { id: f.id, name: name, label: label } : f;
  });
  AppState.editingFloorId = null;
  renderAdminFloors();
}

function deleteFloor(floorId) {
  if (AppState.adminFloors.length <= 1) { alert("Cannot delete the only floor."); return; }
  if (!confirm("Delete this floor and all its locations?")) { return; }
  AppState.adminFloors    = AppState.adminFloors.filter(function(f) { return f.id !== floorId; });
  AppState.adminLocations = AppState.adminLocations.filter(function(l) { return l.floor !== floorId; });
  renderAdminFloors();
  renderAdminLocations();
}

/* =========================================================
   ADMIN PAGE — LEGENDS
   ========================================================= */

function renderAdminLegends() {
  var container = document.getElementById("legends-list");
  if (!container) { return; }

  var html = "";
  AppState.adminLegends.forEach(function(leg) {
    html += '<div class="admin-legend-card">' +
      '<div class="legend-color-swatch" style="background:' + leg.color + '" title="Pick color">' +
      '<input type="color" class="legend-color-input" value="' + leg.color + '" onchange="updateLegendColor(\'' + leg.id + '\', this.value)" />' +
      '</div>' +
      '<div style="flex:1">' +
      '<div class="legend-type-label">Type: <strong>' + escHtml(leg.type) + '</strong></div>' +
      '<input type="text" class="legend-label-input" value="' + escAttr(leg.label) + '" onchange="updateLegendLabel(\'' + leg.id + '\', this.value)" />' +
      '</div>' +
      '</div>';
  });

  container.innerHTML = html;
}

function updateLegendColor(legendId, color) {
  AppState.adminLegends = AppState.adminLegends.map(function(leg) {
    return leg.id === legendId ? Object.assign({}, leg, { color: color }) : leg;
  });
}

function updateLegendLabel(legendId, label) {
  AppState.adminLegends = AppState.adminLegends.map(function(leg) {
    return leg.id === legendId ? Object.assign({}, leg, { label: label }) : leg;
  });
}

/* =========================================================
   TOAST NOTIFICATION
   ========================================================= */

var toastTimer = null;

function showToast(message) {
  var toast = document.getElementById("toast");
  if (!toast) { return; }
  toast.textContent = message;
  toast.style.display = "";

  if (toastTimer) { clearTimeout(toastTimer); }
  toastTimer = setTimeout(function() {
    toast.style.display = "none";
  }, 3000);
}

/* =========================================================
   HTML ESCAPING UTILITIES
   ========================================================= */

function escHtml(str) {
  if (!str && str !== 0) { return ""; }
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escAttr(str) {
  return escHtml(str);
}

/* =========================================================
   BOOT
   ========================================================= */

document.addEventListener("DOMContentLoaded", function() {
  initApp();
});
