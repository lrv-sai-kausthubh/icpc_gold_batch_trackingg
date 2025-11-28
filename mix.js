// Default user lists for each platform
const defaultAtCoderUsers = [
    "jalaluddin420",
    "sonu24", "manichandana", 
    "lrv", "shiva_karthik121", "advaithchaitanya", 
    "manchalaganesh", 
];

const defaultCodeforcesUsers = [
    "jalaluddin420",
    "sonu24", "manichandanaa", 
    "lrvkausthubh", "shiva_karthik121", "advaithchaitanya", 
    "manchalaganesh", 
];

// User mapping to connect AtCoder and CodeForces IDs
const userMapping = {};
defaultAtCoderUsers.forEach((user, index) => {
    userMapping[user] = {
        atcoder: user,
        codeforces: defaultCodeforcesUsers[index] || user // Fallback to same name if no mapping
    };
});



// Add this new function to combine data by user
function consolidateUserData() {
    const consolidatedData = [];
    const userMap = new Map();
    
    // First, process AtCoder data
    if (platformVisibility.atcoder) {
        fetchedData.atcoder.forEach(atcoderUser => {
            userMap.set(atcoderUser.Username, {
                Username: atcoderUser.Username,
                AtCoderUsername: atcoderUser.PlatformUsername,
                CodeforcesUsername: "",
                // AtCoder data - only track A, B, C as requested
                "A": atcoderUser.A,
                "B": atcoderUser.B,
                "C": atcoderUser.C,
                // Initialize CodeForces data as empty
                "CF-900": "-",
                "CF-1000": "-",
                "CF-1100": "-",
                // Combined total will be calculated later
                Total: (atcoderUser.Total === "Err") ? "Err" : 
                       ((parseInt(atcoderUser.A) || 0) + 
                        (parseInt(atcoderUser.B) || 0) + 
                        (parseInt(atcoderUser.C) || 0))
            });
        });
    }
    
    // Then, process and merge CodeForces data
    if (platformVisibility.codeforces) {
        fetchedData.codeforces.forEach(cfUser => {
            if (userMap.has(cfUser.Username)) {
                // Update existing user with CodeForces data
                const userData = userMap.get(cfUser.Username);
                userData.CodeforcesUsername = cfUser.PlatformUsername;
                userData["CF-900"] = cfUser["CF-900"];
                userData["CF-1000"] = cfUser["CF-1000"];
                userData["CF-1100"] = cfUser["CF-1100"];
                
                // Update total with the specific CF columns we're tracking
                if (userData.Total !== "Err" && cfUser.Total !== "Err") {
                    userData.Total += (parseInt(cfUser["CF-900"]) || 0) + 
                                     (parseInt(cfUser["CF-1000"]) || 0) + 
                                     (parseInt(cfUser["CF-1100"]) || 0);
                }
            } else {
                // Create new user with only CodeForces data
                userMap.set(cfUser.Username, {
                    Username: cfUser.Username,
                    AtCoderUsername: "",
                    CodeforcesUsername: cfUser.PlatformUsername,
                    // Initialize AtCoder data as empty
                    "A": "-",
                    "B": "-",
                    "C": "-",
                    // CodeForces data
                    "CF-900": cfUser["CF-900"],
                    "CF-1000": cfUser["CF-1000"],
                    "CF-1100": cfUser["CF-1100"],
                    // Total
                    Total: (cfUser.Total === "Err") ? "Err" : 
                           ((parseInt(cfUser["CF-900"]) || 0) + 
                            (parseInt(cfUser["CF-1000"]) || 0) + 
                            (parseInt(cfUser["CF-1100"]) || 0))
                });
            }
        });
    }
    
    // Convert the map to an array
    userMap.forEach(userData => {
        consolidatedData.push(userData);
    });
    
    return consolidatedData;
}


// Track selected users
let selectedUsers = [];
// Track if all users are selected
let allSelected = false;
// Store the fetched data
let fetchedData = {
    atcoder: [],
    codeforces: []
};
// Store the combined data
let combinedData = [];

// Store the category filters
let categoryFilters = {
    // AtCoder categories
    "A": true,
    "B": true,
    "C": true,
    "D": true,
    "E": true,
    "F": true,
    "G": true,
    "H/Ex": true,
    // CodeForces categories by rating
    "CF-800": true,   // 800-999
    "CF-1000": true,  // 1000-1199
    "CF-1200": true,  // 1200-1399
    "CF-1400": true,  // 1400-1599
    "CF-1600": true,  // 1600-1899
    "CF-1900": true   // 1900+
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Setup dropdown for user selection
    setupUserDropdown();
    
    // Add theme switch functionality
    const themeSwitch = document.getElementById('checkbox');
    const themeLabel = document.getElementById('theme-label');
    
    // Check if user has previously selected a theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Update checkbox state based on saved preference
    if (currentTheme === 'dark') {
        themeSwitch.checked = true;
        themeLabel.textContent = 'Dark Mode';
    }
    
    // Listen for theme toggle
    themeSwitch.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeLabel.textContent = 'Dark Mode';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeLabel.textContent = 'Light Mode';
        }
    });
});



// Populate dropdown with filtered users
// Populate dropdown with filtered users
function populateDropdown(searchTerm, shouldShow = false) {
    const dropdownMenu = document.getElementById('dropdown-menu');
    dropdownMenu.innerHTML = '';
    
    // Filter users based on search term
    const filteredUsers = Object.keys(userMapping).filter(username => {
        const atcoderId = userMapping[username].atcoder.toLowerCase();
        const codeforcesId = userMapping[username].codeforces.toLowerCase();
        
        return username.toLowerCase().includes(searchTerm) || 
               atcoderId.includes(searchTerm) || 
               codeforcesId.includes(searchTerm);
    });
    
    // If no results, show message
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No users found';
        dropdownMenu.appendChild(noResults);
        return;
    }
    
    // Add user options to dropdown
    filteredUsers.forEach(username => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        
        // Create main username display
        const nameSpan = document.createElement('span');
        nameSpan.textContent = username;
        
        // Create platform tags if usernames differ
        const platformTags = document.createElement('div');
        platformTags.className = 'platform-tags';
        
        if (userMapping[username].atcoder !== userMapping[username].codeforces) {
            const atcoderTag = document.createElement('span');
            atcoderTag.className = 'platform-mini-tag atcoder-icon';
            atcoderTag.textContent = 'AC';
            atcoderTag.title = `AtCoder: ${userMapping[username].atcoder}`;
            
            const codeforcesTag = document.createElement('span');
            codeforcesTag.className = 'platform-mini-tag codeforces-icon';
            codeforcesTag.textContent = 'CF';
            codeforcesTag.title = `CodeForces: ${userMapping[username].codeforces}`;
            
            platformTags.appendChild(atcoderTag);
            platformTags.appendChild(codeforcesTag);
        }
        
        // Add everything to the item
        item.appendChild(nameSpan);
        item.appendChild(platformTags);
        
        // Highlight if already selected
        if (selectedUsers.includes(username)) {
            item.classList.add('selected');
        }
        
        // Add click handler
        item.addEventListener('click', function(e) {
            toggleUserSelection(username, e);
        });
        
        dropdownMenu.appendChild(item);
    });
    
    // Only show the dropdown if explicitly requested
    if (shouldShow) {
        dropdownMenu.classList.add('show');
    }
}




// Toggle user selection
function toggleUserSelection(username, event) {
    const index = selectedUsers.indexOf(username);
    const searchInput = document.getElementById('user-search');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    // Check if this was triggered by clicking the remove button
    const isRemoveButtonClick = event && event.target && event.target.classList.contains('remove-user');
    
    if (index === -1) {
        // Add user to selection
        selectedUsers.push(username);
        
        // Update UI to reflect selection
        updateSelectedUsersDisplay();
        
        // Keep dropdown visible after adding a selection
        populateDropdown(searchTerm, true);
        
        // Select all text in the search input and keep focus
        searchInput.focus();
        searchInput.select();
    } else {
        // Remove user from selection
        selectedUsers.splice(index, 1);
        
        // Update UI to reflect selection
        updateSelectedUsersDisplay();
        
        // Only keep dropdown visible if not triggered by the remove button
        if (!isRemoveButtonClick) {
            populateDropdown(searchTerm, true);
            
            // Select all text in the search input and keep focus
            searchInput.focus();
            searchInput.select();
        }
    }
}



// Set up user dropdown with search functionality and select all button
function setupUserDropdown() {
    const searchInput = document.getElementById('user-search');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const toggleAllButton = document.getElementById('toggle-all-users');
    
    // Make sure dropdown is hidden initially
    dropdownMenu.classList.remove('show');
    
    // Initially populate dropdown with all users (but keep it hidden)
    populateDropdown('', false);
    
    // Add search functionality
    searchInput.addEventListener('input', function() {
        const value = this.value.trim().toLowerCase();
        
        // Populate and show dropdown when typing in the search field
        populateDropdown(value, value !== '');
        
        // Reset toggle button text after filtering
        updateToggleAllButtonText();
    });
    
    // Toggle dropdown visibility when clicking on search input
    searchInput.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // Hide dropdown when clicking outside (except when clicking on dropdown items)
    document.addEventListener('click', function(e) {
        if (!dropdownMenu.contains(e.target) && 
            e.target !== searchInput && 
            e.target !== toggleAllButton) {
            dropdownMenu.classList.remove('show');
        }
    });
    
    // Set up toggle all button - FIXED: Removed the line that shows dropdown
    toggleAllButton.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleAllVisibleUsers();
        // REMOVED: dropdownMenu.classList.add('show'); 
        // The dropdown will be closed by toggleAllVisibleUsers() function
    });
    
    // Update selected users display initially
    updateSelectedUsersDisplay();
}




// Update the display of selected users
function updateSelectedUsersDisplay() {
    const container = document.getElementById('selected-users');
    const headerElement = document.getElementById('selected-users-header');
    
    // Ensure we have the count element, if not create it
    let countElement = headerElement.querySelector('.selected-users-count');
    if (!countElement) {
        // Create the header structure if it doesn't exist
        headerElement.innerHTML = `
            <h3>Selected Users (<span class="selected-users-count">${selectedUsers.length}</span>)</h3>
            <span class="dropdown-arrow">▼</span>
        `;
        countElement = headerElement.querySelector('.selected-users-count');
    } else {
        // Just update the count
        countElement.textContent = selectedUsers.length;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Ensure the container has the collapsed class by default
    if (!container.classList.contains('collapsed')) {
        container.classList.add('collapsed');
        headerElement.classList.remove('open');
    }
    
    if (selectedUsers.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-selection';
        emptyMessage.textContent = 'No users selected. Search and select users above.';
        container.appendChild(emptyMessage);
        return;
    }
    
    selectedUsers.forEach(username => {
        const userTag = document.createElement('div');
        userTag.className = 'selected-user-tag';
        
        // User name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = username;
        userTag.appendChild(nameSpan);
        
        // Platform indicators if different
        if (userMapping[username].atcoder !== userMapping[username].codeforces) {
            const platformTags = document.createElement('div');
            platformTags.className = 'platform-tags';
            
            // removes the ACP and CFP in the display
            const atcoderTag = document.createElement('span');
            //atcoderTag.className = 'platform-mini-tag atcoder-icon';
            //atcoderTag.textContent = 'AC';
            //atcoderTag.title = `AtCoder: ${userMapping[username].atcoder}`;
            
            const codeforcesTag = document.createElement('span');
            //codeforcesTag.className = 'platform-mini-tag codeforces-icon';
            //codeforcesTag.textContent = 'CF';
            //codeforcesTag.title = `CodeForces: ${userMapping[username].codeforces}`;
            
            platformTags.appendChild(atcoderTag);
            platformTags.appendChild(codeforcesTag);
            userTag.appendChild(platformTags);
        }
        
        // Remove button
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-user';
        removeBtn.textContent = '×';
        removeBtn.title = 'Remove user';
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleUserSelection(username, e);
        });
        userTag.appendChild(removeBtn);
        
        container.appendChild(userTag);
    });
}

// Add this function to handle the dropdown toggle behavior
function setupSelectedUsersDropdown() {
    const header = document.getElementById('selected-users-header');
    const dropdownContent = document.getElementById('selected-users');
    
    header.addEventListener('click', function(e) {
        // Toggle collapsed class on the content
        dropdownContent.classList.toggle('collapsed');
        
        // Toggle open class on the header for arrow rotation
        header.classList.toggle('open');
        
        e.stopPropagation();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!header.contains(e.target) && !dropdownContent.contains(e.target)) {
            dropdownContent.classList.add('collapsed');
            header.classList.remove('open');
        }
    });
}

// Make sure to call this function in your document ready handler
document.addEventListener('DOMContentLoaded', function() {
    // Setup dropdown for selected users
    setupSelectedUsersDropdown();
    
    // Your other initialization code...
});




// Store platform visibility
let platformVisibility = {
    atcoder: true,
    codeforces: true
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Generate user profiles
    generateUserProfiles();
    
    // Add search functionality
    document.getElementById('profile-search').addEventListener('input', filterProfiles);
    
    // Add Select All functionality
    document.getElementById('select-all-btn').addEventListener('click', toggleSelectAll);
    
    // Add theme switch functionality
    const themeSwitch = document.getElementById('checkbox');
    const themeLabel = document.getElementById('theme-label');
    
    // Check if user has previously selected a theme
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Update checkbox state based on saved preference
    if (currentTheme === 'dark') {
        themeSwitch.checked = true;
        themeLabel.textContent = 'Dark Mode';
    }
    
    // Listen for theme toggle
    themeSwitch.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeLabel.textContent = 'Dark Mode';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeLabel.textContent = 'Light Mode';
        }
    });

    // Set up category filter listeners
    setupFilterListeners();
});



// Set up filter functionality
// Update the setupFilterListeners function
function setupFilterListeners() {
    // Log current filter state for debugging
    console.log("Initial category filters:", categoryFilters);

    // All checkbox functionality
    const allCheckbox = document.getElementById('filter-all');
    allCheckbox.addEventListener('change', function() {
        const checked = this.checked;
        
        // Update all individual category checkboxes
        document.querySelectorAll('.filter-checkbox input:not(#filter-all)').forEach(checkbox => {
            checkbox.checked = checked;
            
            // Extract the full category ID
            let category = checkbox.id.replace('filter-', '');
            
            // Special case handling
            if (category === 'H') {
                category = 'H/Ex';
            }
            
            // Update the filter state
            categoryFilters[category] = checked;
        });
        
        console.log("After 'All' change:", categoryFilters);
    });

    // Individual AtCoder category checkboxes
    document.querySelectorAll('#atcoder-categories .filter-checkbox input').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Get category from checkbox id
            let category = this.id.replace('filter-', '');
            
            // Special case for H/Ex
            if (category === 'H') {
                category = 'H/Ex';
            }
            
            // Update filter state
            categoryFilters[category] = this.checked;
            console.log(`AtCoder category ${category} set to ${this.checked}`);
            
            updateAllCheckboxState();
        });
    });
    
    // Individual CodeForces category checkboxes
    document.querySelectorAll('#codeforces-categories .filter-checkbox input').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // For CodeForces, we need the full ID including "CF-"
            const category = this.id.replace('filter-', '');
            
            // Update filter state
            categoryFilters[category] = this.checked;
            console.log(`CodeForces category ${category} set to ${this.checked}`);
            
            updateAllCheckboxState();
        });
    });

    // Platform visibility checkboxes
    document.getElementById('show-atcoder').addEventListener('change', function() {
        platformVisibility.atcoder = this.checked;
        console.log(`AtCoder visibility set to ${this.checked}`);
    });
    
    document.getElementById('show-codeforces').addEventListener('change', function() {
        platformVisibility.codeforces = this.checked;
        console.log(`CodeForces visibility set to ${this.checked}`);
    });

    // Apply filter button
    document.getElementById('apply-filter').addEventListener('click', function() {
        console.log("Applying filters:", categoryFilters);
        combineAndRenderData();
    });
}

// Helper function to update the "All" checkbox state
function updateAllCheckboxState() {
    const allCheckbox = document.getElementById('filter-all');
    const allCategoryCheckboxes = document.querySelectorAll('.filter-checkbox input:not(#filter-all)');
    const allChecked = Array.from(allCategoryCheckboxes).every(cb => cb.checked);
    
    // Update the "All" checkbox without triggering its change event
    allCheckbox.checked = allChecked;
}


// Toggle select all users
function toggleSelectAll() {
    const profiles = document.querySelectorAll('.user-profile');
    allSelected = !allSelected;
    
    // Update button text
    const selectAllBtn = document.getElementById('select-all-btn');
    selectAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
    
    // Reset selectedUsers array
    selectedUsers = [];
    
    profiles.forEach(profile => {
        if (profile.style.display !== 'none') { // Only select visible profiles
            if (allSelected) {
                profile.classList.add('selected');
                selectedUsers.push(profile.dataset.username);
            } else {
                profile.classList.remove('selected');
            }
        }
    });
}

// Show the selected tab
function showTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Show the selected tab
    document.getElementById(tabId).style.display = 'block';
    
    // Update active class
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Find the button that triggered this and add active class
    const buttons = document.querySelectorAll('.tab-button');
    for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].onclick.toString().includes(tabId)) {
            buttons[i].classList.add('active');
            break;
        }
    }
}

// Generate user profile elements
function generateUserProfiles() {
    const container = document.getElementById('user-profiles');
    container.innerHTML = '';
    
    Object.keys(userMapping).forEach(username => {
        const profileEl = document.createElement('div');
        profileEl.className = 'user-profile';
        profileEl.dataset.username = username;
        profileEl.dataset.atcoder = userMapping[username].atcoder;
        profileEl.dataset.codeforces = userMapping[username].codeforces;
        
        const avatarEl = document.createElement('div');
        avatarEl.className = 'avatar';
        avatarEl.textContent = username.charAt(0).toUpperCase();
        
        const nameEl = document.createElement('div');
        nameEl.className = 'username';
        nameEl.textContent = username;
        
        // Add platform usernames if they differ
        if (userMapping[username].atcoder !== userMapping[username].codeforces) {
            const platformsEl = document.createElement('div');
            platformsEl.className = 'platform-usernames';
            platformsEl.innerHTML = `
                <span class="platform-tag atcoder-tag">AC: ${userMapping[username].atcoder}</span>
                <span class="platform-tag codeforces-tag">CF: ${userMapping[username].codeforces}</span>
            `;
            profileEl.appendChild(avatarEl);
            profileEl.appendChild(nameEl);
            profileEl.appendChild(platformsEl);
        } else {
            profileEl.appendChild(avatarEl);
            profileEl.appendChild(nameEl);
        }
        
        // Add click event to select/deselect
        profileEl.addEventListener('click', function() {
            this.classList.toggle('selected');
            
            if (this.classList.contains('selected')) {
                selectedUsers.push(username);
            } else {
                selectedUsers = selectedUsers.filter(user => user !== username);
            }
            
            // Update allSelected status when clicking individual profiles
            updateSelectAllStatus();
        });
        
        container.appendChild(profileEl);
    });
}

// Update the Select All button status based on individual selections
function updateSelectAllStatus() {
    // Same as before - no changes needed here
    // ...existing code...
}

// Filter profiles based on search input
function filterProfiles() {
    const searchTerm = document.getElementById('profile-search').value.toLowerCase();
    const profiles = document.querySelectorAll('.user-profile');
    
    profiles.forEach(profile => {
        const username = profile.dataset.username.toLowerCase();
        const atcoderId = profile.dataset.atcoder.toLowerCase();
        const codeforcesId = profile.dataset.codeforces.toLowerCase();
        
        if (username.includes(searchTerm) || 
            atcoderId.includes(searchTerm) || 
            codeforcesId.includes(searchTerm)) {
            profile.style.display = 'block';
        } else {
            profile.style.display = 'none';
        }
    });
    
    // Update Select All button after filtering
    updateSelectAllStatus();
}


// Fetch statistics from both platforms
async function fetchStats() {
    // Determine which users to fetch
    let selectedUsernames = [];
    
    // Check if we're on the profiles tab with the dropdown selection
    if (document.getElementById('profiles-tab').style.display !== 'none') {
        // Use the dropdown selection
        if (selectedUsers.length === 0) {
            alert("Please select at least one user from the dropdown.");
            return;
        }
        selectedUsernames = selectedUsers;
    } else {
        // Handle manual entry with separate textareas
        const atcoderText = document.getElementById("atcoder-usernames")?.value.trim() || "";
        const codeforcesText = document.getElementById("codeforces-usernames")?.value.trim() || "";
        
        if (!atcoderText && !codeforcesText) {
            alert("Please either select users from the dropdown or enter usernames manually for at least one platform.");
            return;
        }
        
        // Process AtCoder usernames
        const atcoderUsers = atcoderText.split("\n").map(u => u.trim()).filter(u => u);
        
        // Process CodeForces usernames
        const codeforcesUsers = codeforcesText.split("\n").map(u => u.trim()).filter(u => u);
        
        // Create manual mapping - if one platform has more entries than the other, use corresponding positions or leave blank
        const maxCount = Math.max(atcoderUsers.length, codeforcesUsers.length);
        
        for (let i = 0; i < maxCount; i++) {
            const mappedUser = `user_${i+1}`;
            userMapping[mappedUser] = {
                atcoder: atcoderUsers[i] || "",
                codeforces: codeforcesUsers[i] || ""
            };
            selectedUsernames.push(mappedUser);
        }
    }
    
    // Reset data structures
    fetchedData = {
        atcoder: [],
        codeforces: []
    };
    
    // Determine which platforms to fetch
    let fetchAtCoder = true;
    let fetchCodeforces = true;
    
    // If in manual mode, check platform selections
    if (document.getElementById('manual-tab').style.display !== 'none') {
        const atcoderCheckbox = document.getElementById('platform-atcoder');
        const codeforcesCheckbox = document.getElementById('platform-codeforces');
        
        fetchAtCoder = atcoderCheckbox && atcoderCheckbox.checked;
        fetchCodeforces = codeforcesCheckbox && codeforcesCheckbox.checked;
        
        if (!fetchAtCoder && !fetchCodeforces) {
            alert("Please select at least one platform to fetch data from.");
            return;
        }
        
        // Additional validation: if a platform is selected but no usernames are provided
        const atcoderUsernamesField = document.getElementById("atcoder-usernames");
        const codeforcesUsernamesField = document.getElementById("codeforces-usernames");
        
        if (fetchAtCoder && atcoderUsernamesField && atcoderUsernamesField.value.trim() === "") {
            alert("You selected AtCoder but didn't provide any usernames. Please enter AtCoder usernames or uncheck the platform.");
            return;
        }
        
        if (fetchCodeforces && codeforcesUsernamesField && codeforcesUsernamesField.value.trim() === "") {
            alert("You selected CodeForces but didn't provide any usernames. Please enter CodeForces usernames or uncheck the platform.");
            return;
        }
    }
    
    // Show loading indicator
    document.getElementById("table-container").innerHTML = 
        "<p>Fetching data from both platforms, please wait...</p>";
    
    // Fetch data in parallel
    const fetchPromises = [];
    
    if (fetchAtCoder) {
        fetchPromises.push(fetchAtCoderData(selectedUsernames));
    }
    
    if (fetchCodeforces) {
        fetchPromises.push(fetchCodeforcesData(selectedUsernames));
    }
    
    try {
        await Promise.all(fetchPromises);
        
        // Combine and render data without showing filters
        combineAndRenderData();
        
        const timestamp = new Date();
        const timestampElement = document.getElementById("timestamp");
        if (timestampElement) {
            timestampElement.innerText = `Generated on: ${timestamp.toLocaleString()}`;

            // Add explanation text for N/A values
            const explanationText = document.createElement('p');
            explanationText.className = 'explanation-note';
            explanationText.innerHTML = '<small><i>Note: "N/A" indicates that the user ID was not found or there was an error fetching data.</i></small>';
            timestampElement.appendChild(document.createElement('br'));
            timestampElement.appendChild(explanationText);




        }
        // add html saying N/A = not avaliable

    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById("table-container").innerHTML = 
            "<p>Error fetching data. Please try again.</p>";
    }
}




// Fetch AtCoder data
async function fetchAtCoderData(selectedUsernames) {
    for (let username of selectedUsernames) {
        const atcoderUsername = userMapping[username].atcoder;
        if (!atcoderUsername) continue; // Skip if no AtCoder username
        
        try {
            const res = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${atcoderUsername}&from_second=0`);
            if (!res.ok) throw new Error("Failed to fetch");
            const submissions = await res.json();
            const accepted = submissions.filter(sub => sub.result === "AC");
            const solvedProblems = [...new Set(accepted.map(sub => sub.problem_id))];

            const levels = {
                "A": 0,
                "B": 0,
                "C": 0,
                "D": 0,
                "E": 0,
                "F": 0,
                "G": 0,
                "H/Ex": 0
            };
            solvedProblems.forEach(pid => {
                if (pid.endsWith("_a")) levels["A"]++;
                else if (pid.endsWith("_b")) levels["B"]++;
                else if (pid.endsWith("_c")) levels["C"]++;
                else if (pid.endsWith("_d")) levels["D"]++;
                else if (pid.endsWith("_e")) levels["E"]++;
                else if (pid.endsWith("_f")) levels["F"]++;
                else if (pid.endsWith("_g")) levels["G"]++;
                else if (pid.endsWith("_h") || pid.endsWith("_ex")) levels["H/Ex"]++;
            });
            const total = Object.values(levels).reduce((a, b) => a + b, 0);
            fetchedData.atcoder.push({
                Username: username,
                PlatformUsername: atcoderUsername,
                Platform: "AtCoder",
                ...levels,
                Total: total
            });
        } catch (e) {
            fetchedData.atcoder.push({
                Username: username,
                PlatformUsername: atcoderUsername,
                Platform: "AtCoder",
                "A": "Err",
                "B": "Err",
                "C": "Err",
                "D": "Err",
                "E": "Err",
                "F": "Err",
                "G": "Err",
                "H/Ex": "Err",
                "Total": "Err"
            });
        }
    }
}

// Fetch Codeforces data
// Update the CodeForces data fetching function to categorize by rating
// Fetch Codeforces data
async function fetchCodeforcesData(selectedUsernames) {
    for (let username of selectedUsernames) {
        const codeforcesUsername = userMapping[username].codeforces;
        if (!codeforcesUsername) continue; // Skip if no CodeForces username
        
        try {
            const res = await fetch(`https://codeforces.com/api/user.status?handle=${codeforcesUsername}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            
            if (data.status !== "OK") throw new Error("API returned error");
            
            const submissions = data.result;
            const accepted = submissions.filter(sub => sub.verdict === "OK");
            
            // Create a unique set of solved problems with their exact ratings
            const solvedProblems = [];
            const uniqueProblemIds = new Set();
            
            accepted.forEach(sub => {
                const problemId = `${sub.contestId}_${sub.problem.index}`;
                if (!uniqueProblemIds.has(problemId)) {
                    uniqueProblemIds.add(problemId);
                    solvedProblems.push({
                        id: problemId,
                        rating: sub.problem.rating || 0
                    });
                }
            });

            // Track exact ratings instead of ranges
            const exactRatings = {
                "CF-900": 0,
                "CF-1000": 0,
                "CF-1100": 0
            };
            
            solvedProblems.forEach(problem => {
                const rating = problem.rating;
                
                // Only count problems with exactly 900, 1000, or 1100 rating
                if (rating === 900) {
                    exactRatings["CF-900"]++;
                } else if (rating === 1000) {
                    exactRatings["CF-1000"]++;
                } else if (rating === 1100) {
                    exactRatings["CF-1100"]++;
                }
            });
            
            const total = Object.values(exactRatings).reduce((a, b) => a + b, 0);
            fetchedData.codeforces.push({
                Username: username,
                PlatformUsername: codeforcesUsername,
                Platform: "CodeForces",
                ...exactRatings,
                Total: total
            });
        } catch (e) {
            fetchedData.codeforces.push({
                Username: username,
                PlatformUsername: codeforcesUsername,
                Platform: "CodeForces",
                "CF-900": "Err",
                "CF-1000": "Err",
                "CF-1100": "Err",
                "Total": "Err"
            });
        }
    }
}

// Combine data from both platforms and render
// Replace the existing combineAndRenderData function

function combineAndRenderData() {
    // Use the new consolidation function
    const consolidatedData = consolidateUserData();
    
    // Sort by total score
    consolidatedData.sort((a, b) => {
        if (a.Total === "Err") return 1;
        if (b.Total === "Err") return -1;
        return b.Total - a.Total;
    });
    
    // Render the consolidated data
    renderConsolidatedTable(consolidatedData);
}


function renderConsolidatedTable(data) {
    if (data.length === 0) {
        document.getElementById("table-container").innerHTML = "<p>No data to display. Please select at least one user.</p>";
        return;
    }
    
    // Start building table with fixed columns in the specific order
    // Start building table with fixed columns in the specific order
let html = `<table>
    <tr>
        <th style="padding-top: 7px; padding-bottom: 7px;">
            <img src="https://res.cloudinary.com/dldbsjets/image/upload/v1760687848/atcoder_image_czj4fy.jpg" alt="AtCoder" style="height: 20px; vertical-align: middle; margin-right: 5px;"> 
             Username
        </th>
        <th style="padding-top: 7px; padding-bottom: 7px;">
            <img src="https://res.cloudinary.com/dldbsjets/image/upload/v1760687847/codeforces_image_xzptbe.jpg" alt="CodeForces" style="height: 20px; vertical-align: middle; margin-right: 5px;"> 
             Username
        </th>
        <th style="padding-top: 7px; padding-bottom: 7px;">
            <img src="https://res.cloudinary.com/dldbsjets/image/upload/v1760687848/atcoder_image_czj4fy.jpg" alt="AtCoder" style="height: 20px; vertical-align: middle; margin-right: 5px;"> 
             A
        </th>
        <th style="padding-top: 7px; padding-bottom: 7px;">
            <img src="https://res.cloudinary.com/dldbsjets/image/upload/v1760687848/atcoder_image_czj4fy.jpg" alt="AtCoder" style="height: 20px; vertical-align: middle; margin-right: 5px;"> 
             B
        </th>
        <th style="padding-top: 7px; padding-bottom: 7px;">
            <img src="https://res.cloudinary.com/dldbsjets/image/upload/v1760687847/codeforces_image_xzptbe.jpg" alt="CodeForces" style="height: 20px; vertical-align: middle; margin-right: 5px;"> 
             900
        </th>
        <th style="padding-top: 7px; padding-bottom: 7px;">
            <img src="https://res.cloudinary.com/dldbsjets/image/upload/v1760687847/codeforces_image_xzptbe.jpg" alt="CodeForces" style="height: 20px; vertical-align: middle; margin-right: 5px;"> 
             1000
        </th>
        <th style="padding-top: 7px; padding-bottom: 7px;">
            <img src="https://res.cloudinary.com/dldbsjets/image/upload/v1760687847/codeforces_image_xzptbe.jpg" alt="CodeForces" style="height: 20px; vertical-align: middle; margin-right: 5px;"> 
             1100
        </th>
        <th style="padding-top: 7px; padding-bottom: 7px;">
            <img src="https://res.cloudinary.com/dldbsjets/image/upload/v1760687848/atcoder_image_czj4fy.jpg" alt="AtCoder" style="height: 20px; vertical-align: middle; margin-right: 5px;"> 
             C
        </th>
        <th style="padding-top: 7px; padding-bottom: 7px;">Total</th>
    </tr>`;
    
    // Find the top performer
    const validUsers = data.filter(user => user.Total !== "Err");
    const topTotal = validUsers.length > 0 ? Math.max(...validUsers.map(user => user.Total)) : 0;
    
    // Add rows for each user
    data.forEach(row => {
        const isTop = (row.Total === topTotal && row.Total !== "Err");
        const topClass = isTop ? "top" : "";
        
        // Check for invalid AtCoder username
        const invalidAtCoder = row.AtCoderUsername === "" || (row["A"] === "Err" && row["B"] === "Err" && row["C"] === "Err");
        const atCoderUsername = invalidAtCoder ? "N/A" : (row.AtCoderUsername || "-");
        
        // Check for invalid CodeForces username
        const invalidCodeForces = row.CodeforcesUsername === "" || (row["CF-900"] === "Err" && row["CF-1000"] === "Err" && row["CF-1100"] === "Err");
        const codeforcesUsername = invalidCodeForces ? "N/A" : (row.CodeforcesUsername || "-");
        
        html += `<tr class="${topClass}">
            <td>
                
                ${atCoderUsername}
            </td>
            <td>
                <!--<span class="platform-icon codeforces-icon"></span>-->
                ${codeforcesUsername}
            </td>
            <td>${row["A"] === "Err" ? "N/A" : (row["A"] || "0")}</td>
            <td>${row["B"] === "Err" ? "N/A" : (row["B"] || "0")}</td>
            <td>${row["CF-900"] === "Err" ? "N/A" : (row["CF-900"] === "-" ? "0" : row["CF-900"])}</td>
            <td>${row["CF-1000"] === "Err" ? "N/A" : (row["CF-1000"] === "-" ? "0" : row["CF-1000"])}</td>
            <td>${row["CF-1100"] === "Err" ? "N/A" : (row["CF-1100"] === "-" ? "0" : row["CF-1100"])}</td>
            <td>${row["C"] === "Err" ? "N/A" : (row["C"] || "0")}</td>`;

        // Calculate combined total for displayed columns only
        let displayTotal = 0;
        if (row.Total !== "Err") {
            // Update total calculation to handle "-" and "Err" as 0 for all columns
            const atcoderColumns = ["A", "B", "C"];
            const cfColumns = ["CF-900", "CF-1000", "CF-1100"];
            
            // Add AtCoder values (treating "-" as 0, "Err" as 0 for calculation purposes)
            atcoderColumns.forEach(col => {
                if (row[col] === "Err" || row[col] === "-" || !row[col]) {
                    // Count as 0
                } else if (!isNaN(parseInt(row[col]))) {
                    displayTotal += parseInt(row[col]);
                }
            });
            
            // Add CodeForces values (treating "-" and "Err" as 0)
            cfColumns.forEach(col => {
                if (row[col] === "Err" || row[col] === "-") {
                    // Count as 0
                } else if (!isNaN(parseInt(row[col]))) {
                    displayTotal += parseInt(row[col]);
                }
            });
        } else {
            displayTotal = "Err";
        }
        
        html += `<td>${displayTotal}</td></tr>`;
    });
    
    // Calculate summary statistics for the fixed columns
    // if (data.length > 0) {
    //     const validData = data.filter(user => user.Total !== "Err");
        
    //     if (validData.length > 0) {
    //         html += `<tr class="summary-row">
    //             <td colspan="2"><strong>Average</strong></td>`;
            
    //         // Calculate averages for each displayed column
    //         const columns = ["A", "B", "CF-900", "CF-1000", "CF-1100", "C"];
    //         columns.forEach(col => {
    //             let sum = 0;
    //             let count = 0;
                
    //             validData.forEach(user => {
    //                 // For all columns, treat "-", "Err", and empty values as 0
    //                 if (user[col] === "Err" || user[col] === "-" || !user[col]) {
    //                     count++;
    //                 } else if (!isNaN(parseInt(user[col]))) {
    //                     sum += parseInt(user[col]);
    //                     count++;
    //                 }
    //             });
                
    //             const avg = count > 0 ? sum / count : 0;
    //             html += `<td>${avg.toFixed(1)}</td>`;
    //         });
            
    //         // Average total (recalculated same way as individual rows)
    //         let totalSum = 0;
    //         validData.forEach(user => {
    //             let userTotal = 0;
                
    //             // AtCoder columns (treating "-", "Err", and empty as 0)
    //             ["A", "B", "C"].forEach(col => {
    //                 if (user[col] === "Err" || user[col] === "-" || !user[col]) {
    //                     // Count as 0
    //                 } else if (!isNaN(parseInt(user[col]))) {
    //                     userTotal += parseInt(user[col]);
    //                 }
    //             });
                
    //             // CodeForces columns (treating "-" and "Err" as 0)
    //             ["CF-900", "CF-1000", "CF-1100"].forEach(col => {
    //                 if (user[col] === "Err" || user[col] === "-" || !user[col]) {
    //                     // Count as 0
    //                 } else if (!isNaN(parseInt(user[col]))) {
    //                     userTotal += parseInt(user[col]);
    //                 }
    //             });
                
    //             totalSum += userTotal;
    //         });
            
    //         const avgTotal = totalSum / validData.length;
    //         html += `<td>${avgTotal.toFixed(1)}</td></tr>`;
    //     }
    // }
    
    html += "</table>";
    
    document.getElementById("table-container").innerHTML = html;
}




















// js for sleecting users from dropdown with search and select all functionality

// Track whether all visible users are selected
let allVisibleSelected = false;

// Set up user dropdown with search functionality and select all button
function setupUserDropdown() {
    const searchInput = document.getElementById('user-search');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const toggleAllButton = document.getElementById('toggle-all-users');
    
    // Make sure dropdown is hidden initially
    dropdownMenu.classList.remove('show');
    
    // Initially populate dropdown with all users (but keep it hidden)
    populateDropdown('', false);
    
    // Add search functionality
    searchInput.addEventListener('input', function() {
        const value = this.value.trim().toLowerCase();
        
        // Populate and show dropdown when typing in the search field
        populateDropdown(value, value !== '');
        
        // Reset toggle button text after filtering
        updateToggleAllButtonText();
    });
    
    // Toggle dropdown visibility when clicking on search input
    searchInput.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // Hide dropdown when clicking outside (except when clicking on dropdown items)
    document.addEventListener('click', function(e) {
        if (!dropdownMenu.contains(e.target) && e.target !== searchInput && e.target !== toggleAllButton) {
            dropdownMenu.classList.remove('show');
        }
    });
    
    // Set up toggle all button
    toggleAllButton.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleAllVisibleUsers();
        dropdownMenu.classList.add('show'); // Keep dropdown visible after toggle
    });
    
    // Update selected users display initially
    updateSelectedUsersDisplay();
}


// Toggle all visible users in the dropdown
// Set up user dropdown with search functionality and select all button
function setupUserDropdown() {
    const searchInput = document.getElementById('user-search');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const toggleAllButton = document.getElementById('toggle-all-users');
    
    // Make sure dropdown is hidden initially
    dropdownMenu.classList.remove('show');
    
    // Initially populate dropdown with all users (but keep it hidden)
    populateDropdown('', false);
    
    // Add search functionality
    searchInput.addEventListener('input', function() {
        const value = this.value.trim().toLowerCase();
        
        // Populate and show dropdown when typing in the search field
        populateDropdown(value, value !== '');
        
        // Reset toggle button text after filtering
        updateToggleAllButtonText();
    });
    
    // Toggle dropdown visibility when clicking on search input
    searchInput.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // Hide dropdown when clicking outside (except when clicking on dropdown items)
    document.addEventListener('click', function(e) {
        if (!dropdownMenu.contains(e.target) && 
            e.target !== searchInput && 
            e.target !== toggleAllButton) {
            dropdownMenu.classList.remove('show');
        }
    });
    
    // Set up toggle all button - FIXED: Close dropdown after toggling
    toggleAllButton.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleAllVisibleUsers();
        // Dropdown will be closed by toggleAllVisibleUsers() function
    });
    
    // Update selected users display initially
    updateSelectedUsersDisplay();
}


function toggleAllVisibleUsers() {
    const dropdownMenu = document.getElementById('dropdown-menu');
    const visibleItems = dropdownMenu.querySelectorAll('.dropdown-item');
    const toggleAllButton = document.getElementById('toggle-all-users');
    
    // Determine the new state based on current button text
    const selectAll = toggleAllButton.textContent === 'Select All';
    
    visibleItems.forEach(item => {
        const username = item.querySelector('span').textContent;
        const isCurrentlySelected = selectedUsers.includes(username);
        
        if (selectAll && !isCurrentlySelected) {
            // Add to selection
            selectedUsers.push(username);
            item.classList.add('selected');
        } else if (!selectAll && isCurrentlySelected) {
            // Remove from selection
            selectedUsers = selectedUsers.filter(u => u !== username);
            item.classList.remove('selected');
        }
    });
    
    // Update UI
    updateSelectedUsersDisplay();
    updateToggleAllButtonText();
}




// Update the toggle all button text based on current selection state
function updateToggleAllButtonText() {
    const dropdownMenu = document.getElementById('dropdown-menu');
    const visibleItems = dropdownMenu.querySelectorAll('.dropdown-item');
    const toggleAllButton = document.getElementById('toggle-all-users');
    
    if (visibleItems.length === 0) {
        toggleAllButton.textContent = 'Select All';
        return;
    }
    
    // Check if all visible items are already selected
    const allSelected = Array.from(visibleItems).every(item => {
        const username = item.querySelector('span').textContent;
        return selectedUsers.includes(username);
    });
    
    toggleAllButton.textContent = allSelected ? 'Deselect All' : 'Select All';
}

// Populate dropdown with filtered users
function populateDropdown(searchTerm, shouldShow = false) {
    const dropdownMenu = document.getElementById('dropdown-menu');
    dropdownMenu.innerHTML = '';
    
    // Filter users based on search term
    const filteredUsers = Object.keys(userMapping).filter(username => {
        const atcoderId = userMapping[username].atcoder.toLowerCase();
        const codeforcesId = userMapping[username].codeforces.toLowerCase();
        
        return username.toLowerCase().includes(searchTerm) || 
               atcoderId.includes(searchTerm) || 
               codeforcesId.includes(searchTerm);
    });
    
    // If no results, show message
    if (filteredUsers.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = 'No users found';
        dropdownMenu.appendChild(noResults);
        updateToggleAllButtonText();
        return;
    }
    
    // Add user options to dropdown
    filteredUsers.forEach(username => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        
        // Create main username display
        const nameSpan = document.createElement('span');
        nameSpan.textContent = username;
        

        // removed ACP & CFP THE ICONZ
        // Create platform tags if usernames differ
        const platformTags = document.createElement('div');
        platformTags.className = 'platform-tags';
        
        if (userMapping[username].atcoder !== userMapping[username].codeforces) {
            const atcoderTag = document.createElement('span');
            //atcoderTag.className = 'platform-mini-tag atcoder-icon';
            //atcoderTag.textContent = 'AC';
            atcoderTag.title = `AtCoder: ${userMapping[username].atcoder}`;
            
            const codeforcesTag = document.createElement('span');
            //codeforcesTag.className = 'platform-mini-tag codeforces-icon';
            //codeforcesTag.textContent = 'CF';
            codeforcesTag.title = `CodeForces: ${userMapping[username].codeforces}`;
            
            platformTags.appendChild(atcoderTag);
            platformTags.appendChild(codeforcesTag);
        }
        
        // Add everything to the item
        item.appendChild(nameSpan);
        item.appendChild(platformTags);
        
        // Highlight if already selected
        if (selectedUsers.includes(username)) {
            item.classList.add('selected');
        }
        
        // Add click handler
        item.addEventListener('click', function(e) {
            toggleUserSelection(username, e);
        });
        
        dropdownMenu.appendChild(item);
    });
    
    // Only show the dropdown if explicitly requested
    if (shouldShow) {
        dropdownMenu.classList.add('show');
    }
    
    // Update the toggle all button text based on the current selection state
    updateToggleAllButtonText();
}

// Toggle user selection (keep the existing function but add updating toggle button text)
function toggleUserSelection(username, event) {
    const index = selectedUsers.indexOf(username);
    const searchInput = document.getElementById('user-search');
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    // Check if this was triggered by clicking the remove button
    const isRemoveButtonClick = event && event.target && event.target.classList.contains('remove-user');
    
    if (index === -1) {
        // Add user to selection
        selectedUsers.push(username);
        
        // Update UI to reflect selection
        updateSelectedUsersDisplay();
        
        // Keep dropdown visible after adding a selection
        populateDropdown(searchTerm, true);
        
        // Select all text in the search input and keep focus
        searchInput.focus();
        searchInput.select();
    } else {
        // Remove user from selection
        selectedUsers.splice(index, 1);
        
        // Update UI to reflect selection
        updateSelectedUsersDisplay();
        
        // Only keep dropdown visible if not triggered by the remove button
        if (!isRemoveButtonClick) {
            populateDropdown(searchTerm, true);
            
            // Select all text in the search input and keep focus
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Update the toggle all button text
    updateToggleAllButtonText();
}





// Redirect to contests page with selected usernames
function redirectToContestsPage() {
    // collect usernames from manual textarea (AtCoder) if present
    const manualAtcoder = document.getElementById('atcoder-usernames');
    const manualList = manualAtcoder ? manualAtcoder.value.trim().split(/\s+/).filter(Boolean) : [];

    // collect selected users from UI (#selected-users) - try to be tolerant of markup
    const selectedUsersContainer = document.getElementById('selected-users');
    const selectedFromUI = [];
    if (selectedUsersContainer) {
        // assume each selected entry has data-username or contains plain text
        selectedUsersContainer.querySelectorAll('.selected-user, .user-item, li, div').forEach(el => {
            const uname = el.dataset && el.dataset.username ? el.dataset.username.trim() : el.textContent.trim();
            if (uname) selectedFromUI.push(...uname.split(/\s+/).filter(Boolean));
        });
    }

    // merge and dedupe
    const allUsers = Array.from(new Set([...manualList, ...selectedFromUI]));

    if (allUsers.length === 0) {
        alert('No usernames found. Add usernames in Manual Entry or select users from the list.');
        return;
    }

    // save to localStorage for the contests page to consume
    localStorage.setItem('contestUsernames', JSON.stringify(allUsers));
    // optionally store platform target (for now AtCoder only)
    localStorage.setItem('contestPlatform', 'atcoder');

    // redirect to contests page (create contests.html next)
    window.location.href = 'contests.html';
}

// attach handler to the existing button
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('fetch-contest-button');
    if (btn) btn.addEventListener('click', redirectToContestsPage);
});


