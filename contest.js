// User mapping

// Add this at the top with other global variables
let allUserData = []; // Store all user data for filtering


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



// User name mapping - add this after the userMapping
const userNames = {

    "jalaluddin420": "Jalaluddin",
    
    "sonu24": "Sonu",
    
    "manichandana": "Mani Chandana",
    "lrv": "LRV Kausthubh",
   
    "shiva_karthik121": "Shiva Karthik",
    "advaithchaitanya": "Advaith Chaitanya",
    "manchalaganesh": "Ganesh",
    
};



// Create user mapping
const userMapping = {};
defaultAtCoderUsers.forEach((atcoderHandle, index) => {
    const codeforcesHandle = defaultCodeforcesUsers[index];
    userMapping[atcoderHandle] = codeforcesHandle;
});

// Fetch AtCoder contest history (contests the user actually participated in)

// Fetch AtCoder contest participation by analyzing submissions with problem-level stats
async function fetchAtcoderContests(user) {
    try {
        // First, fetch all submissions for the user
        const submissionsResponse = await fetch(
            `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${user}&from_second=0`
        );
        
        if (!submissionsResponse.ok) {
            console.log(`Failed to fetch AtCoder submissions for ${user}`);
            return { count: 0, contests: [] };
        }
        
        const submissions = await submissionsResponse.json();
        
        // Group submissions by contest
        const contestMap = new Map();
        
        submissions.forEach(sub => {
            if (sub.contest_id) {
                if (!contestMap.has(sub.contest_id)) {
                    contestMap.set(sub.contest_id, {
                        id: sub.contest_id,
                        name: sub.contest_id,
                        submissions: [],
                        solvedProblems: new Set(),
                        firstSubmission: sub.epoch_second,
                        problemStats: {} // Track stats per problem
                    });
                }
                
                const contest = contestMap.get(sub.contest_id);
                contest.submissions.push(sub);
                
                // Track problem-level statistics
                const problemId = sub.problem_id;
                
                // Determine category from problem_id (usually ends with _a, _b, _c, etc.)
                const categoryMatch = problemId.match(/_([a-z])$/i);
                const category = categoryMatch ? categoryMatch[1].toLowerCase() : null;
                
                if (category) {
                    if (!contest.problemStats[category]) {
                        contest.problemStats[category] = {
                            ac: 0,
                            wa: 0,
                            attempts: []
                        };
                    }
                    
                    // Track submission result
                    contest.problemStats[category].attempts.push(sub.result);
                    
                    if (sub.result === 'AC') {
                        // Only count first AC
                        if (!contest.solvedProblems.has(problemId)) {
                            contest.problemStats[category].ac = 1;
                            contest.solvedProblems.add(problemId);
                        }
                    } else if (sub.result === 'WA') {
                        // Count WAs only before first AC
                        if (!contest.solvedProblems.has(problemId)) {
                            contest.problemStats[category].wa++;
                        }
                    }
                }
                
                // Update first submission time
                if (sub.epoch_second < contest.firstSubmission) {
                    contest.firstSubmission = sub.epoch_second;
                }
            }
        });
        
        // Now fetch contest information to get actual contest details
        let contestsWithDetails = [];
        
        // Fetch all contests info
        try {
            const contestsResponse = await fetch(
                'https://kenkoooo.com/atcoder/resources/contests.json'
            );
            
            if (contestsResponse.ok) {
                const allContests = await contestsResponse.json();
                const contestInfoMap = new Map();
                
                allContests.forEach(c => {
                    contestInfoMap.set(c.id, c);
                });
                
                // Match user's contests with contest info
                contestMap.forEach((userContest, contestId) => {
                    const contestInfo = contestInfoMap.get(contestId);
                    
                    if (contestInfo) {
                        const startTime = contestInfo.start_epoch_second;
                        const duration = contestInfo.duration_second;
                        const endTime = startTime + duration;
                        
                        // Check if user submitted during contest time
                        const submittedDuringContest = userContest.submissions.some(sub => 
                            sub.epoch_second >= startTime && sub.epoch_second <= endTime
                        );
                        
                        if (submittedDuringContest) {
                            contestsWithDetails.push({
                                id: contestId,
                                name: contestInfo.title || contestId,
                                solvedCount: userContest.solvedProblems.size,
                                totalSubmissions: userContest.submissions.length,
                                startTime: new Date(startTime * 1000).toLocaleDateString(),
                                problemStats: userContest.problemStats,
                                rank: 'N/A',
                                oldRating: 'N/A',
                                newRating: 'N/A'
                            });
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching contest details:', err);
            // Fallback: use contest IDs without detailed info
            contestMap.forEach((userContest, contestId) => {
                contestsWithDetails.push({
                    id: contestId,
                    name: contestId,
                    solvedCount: userContest.solvedProblems.size,
                    totalSubmissions: userContest.submissions.length,
                    startTime: new Date(userContest.firstSubmission * 1000).toLocaleDateString(),
                    problemStats: userContest.problemStats,
                    rank: 'N/A',
                    oldRating: 'N/A',
                    newRating: 'N/A'
                });
            });
        }
        
        // Sort by date (most recent first)
        contestsWithDetails.sort((a, b) => {
            const dateA = new Date(a.startTime);
            const dateB = new Date(b.startTime);
            return dateB - dateA;
        });
        
        return {
            count: contestsWithDetails.length,
            contests: contestsWithDetails
        };
        
    } catch (err) {
        console.error(`Error fetching AtCoder contest data for ${user}:`, err);
        return { count: 0, contests: [] };
    }
}






// Fetch Codeforces contest participation with dates
async function fetchCodeforcesContests(user) {
    try {
        // Fetch user's rated contests
        const response = await fetch(
            `https://codeforces.com/api/user.rating?handle=${user}`
        );
        
        if (!response.ok) {
            console.log(`Failed to fetch Codeforces contest data for ${user}`);
            return { count: 0, contests: [] };
        }
        
        const data = await response.json();
        
        if (data.status !== 'OK') {
            console.log(`API error for ${user}: ${data.comment || 'Unknown error'}`);
            return { count: 0, contests: [] };
        }
        
        // Fetch all contests to get dates and other details
        let contestDetailsMap = new Map();
        
        try {
            const contestsResponse = await fetch(
                'https://codeforces.com/api/contest.list?gym=false'
            );
            
            if (contestsResponse.ok) {
                const contestsData = await contestsResponse.json();
                
                if (contestsData.status === 'OK') {
                    contestsData.result.forEach(contest => {
                        contestDetailsMap.set(contest.id, {
                            name: contest.name,
                            startTime: contest.startTimeSeconds,
                            date: new Date(contest.startTimeSeconds * 1000).toLocaleDateString()
                        });
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching contest list:', err);
        }
        
        // Map user's contest participation with dates
        const contests = data.result.map(contest => {
            const contestDetails = contestDetailsMap.get(contest.contestId);
            
            return {
                id: contest.contestId,
                name: contest.contestName,
                rank: contest.rank,
                oldRating: contest.oldRating,
                newRating: contest.newRating,
                ratingChange: contest.newRating - contest.oldRating,
                date: contestDetails ? contestDetails.date : new Date(contest.ratingUpdateTimeSeconds * 1000).toLocaleDateString(),
                timestamp: contestDetails ? contestDetails.startTime : contest.ratingUpdateTimeSeconds
            };
        });
        
        return {
            count: contests.length,
            contests: contests.reverse() // Most recent first
        };
    } catch (err) {
        console.error(`Error fetching Codeforces contest data for ${user}:`, err);
        return { count: 0, contests: [] };
    }
}




// Create expandable details cell with proper contest information in table format
function createDetailsCell(atcoder, codeforces, atcoderHandle, codeforcesHandle) {
    const container = document.createElement('div');
    container.className = 'details-container';
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'details-btn';
    toggleBtn.innerHTML = '<i class="fas fa-eye"></i> View Details';
    
    // Store reference to the details row for toggling
    toggleBtn.dataset.detailsId = `details-${atcoderHandle}-${Math.random().toString(36).substr(2, 9)}`;
    
    return { container: toggleBtn, detailsId: toggleBtn.dataset.detailsId, atcoder, codeforces, atcoderHandle, codeforcesHandle };
}





// Create the details row that spans the full table width
function createDetailsRow(atcoder, codeforces, atcoderHandle, codeforcesHandle, detailsId) {
    const detailsRow = document.createElement('tr');
    detailsRow.className = 'details-row hidden';
    detailsRow.id = detailsId;
    
    const detailsCell = document.createElement('td');
    detailsCell.colSpan = 5; // Changed from 7 to 5 (User Name, AC Contests, CF Contests, Total, Details)
    detailsCell.style.padding = '0';
    detailsCell.style.backgroundColor = '#f8f9fa';
    
    const detailsContent = document.createElement('div');
    detailsContent.style.padding = '20px';
    detailsContent.style.width = '100%';
    
    // Create a combined table for both platforms
    const detailsTable = document.createElement('table');
    detailsTable.style.width = '100%';
    detailsTable.style.borderCollapse = 'collapse';
    detailsTable.style.fontSize = '0.9em';
    detailsTable.style.backgroundColor = 'white';
    
    // Table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background-color: #3498db; color: white;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">AtCoder Username</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Codeforces Username</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Contest Name</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Category A</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Category B</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Category C</th>
        </tr>
    `;
    detailsTable.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    // Add AtCoder contests
    if (atcoder.contests.length > 0) {
        atcoder.contests.forEach(contest => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #e0e0e0';
            
            // Get problem statistics by category
            const categoryStats = getAtCoderCategoryStats(contest);
            
            row.innerHTML = `
                <td style="padding: 10px; border: 1px solid #ddd;">${atcoderHandle}</td>
                <td style="padding: 10px; border: 1px solid #ddd; color: #95a5a6;">-</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${contest.startTime}</td>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>${contest.name}</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${categoryStats.a}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${categoryStats.b}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${categoryStats.c}</td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    // Add Codeforces contests
    if (codeforces.contests.length > 0) {
        codeforces.contests.forEach(contest => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #e0e0e0';
            
            const ratingChangeColor = contest.ratingChange >= 0 ? '#2ecc71' : '#e74c3c';
            const ratingChangeSign = contest.ratingChange >= 0 ? '+' : '';
            
            row.innerHTML = `
                <td style="padding: 10px; border: 1px solid #ddd; color: #95a5a6;">-</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${codeforcesHandle}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${contest.date}</td>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>${contest.name}</strong></td>
                <td colspan="3" style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                    Rank: <strong>${contest.rank}</strong> | 
                    Rating: ${contest.oldRating} → ${contest.newRating}
                    <span style="color: ${ratingChangeColor}; font-weight: bold;">
                        (${ratingChangeSign}${contest.ratingChange})
                    </span>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    // If no contests
    if (atcoder.contests.length === 0 && codeforces.contests.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" style="padding: 20px; text-align: center; color: #95a5a6; font-style: italic;">
                No contests participated
            </td>
        `;
        tbody.appendChild(row);
    }
    
    detailsTable.appendChild(tbody);
    detailsContent.appendChild(detailsTable);
    detailsCell.appendChild(detailsContent);
    detailsRow.appendChild(detailsCell);
    
    return detailsRow;
}






// Helper function to get problem statistics by category for AtCoder
function getAtCoderCategoryStats(contest) {
    const stats = {
        a: '-',
        b: '-',
        c: '-'
    };
    
    // If we have problem-level details stored
    if (contest.problemStats) {
        // Format: "1 AC | 2 WA" or just "1 AC | 0 WA"
        if (contest.problemStats.a) {
            const a = contest.problemStats.a;
            stats.a = `${a.ac} AC | ${a.wa} WA`;
        }
        if (contest.problemStats.b) {
            const b = contest.problemStats.b;
            stats.b = `${b.ac} AC | ${b.wa} WA`;
        }
        if (contest.problemStats.c) {
            const c = contest.problemStats.c;
            stats.c = `${c.ac} AC | ${c.wa} WA`;
        }
    }
    
    return stats;
}






// Load and render contest data
// Load and render contest data with optimized parallel processing and rate limiting
// Load and render contest data with progress tracking
async function loadAndRenderContests() {
    const loading = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const error = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    const statsSummary = document.getElementById('stats-summary');
    const searchSection = document.getElementById('search-section');
    const tableContainer = document.getElementById('contest-table-container');
    const tableBody = document.getElementById('contest-table-body');
    
    // Show loading
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    statsSummary.classList.add('hidden');
    searchSection.classList.add('hidden');
    tableContainer.classList.add('hidden');
    
    // Reset progress
    progressFill.style.width = '0%';
    progressText.textContent = `0 / ${defaultAtCoderUsers.length} (0%)`;
    
    try {
        // Batch processing configuration to avoid rate limiting
        const BATCH_SIZE = 5; // Process 5 users at a time
        const BATCH_DELAY = 50; // 50ms delay between batches
        
        const userData = [];
        let totalAtcoderContests = 0;
        let totalCodeforcesContests = 0;
        let processedCount = 0;
        const totalUsers = defaultAtCoderUsers.length;
        
        // Split users into batches
        const batches = [];
        for (let i = 0; i < defaultAtCoderUsers.length; i += BATCH_SIZE) {
            batches.push(defaultAtCoderUsers.slice(i, i + BATCH_SIZE));
        }
        
        console.log(`Processing ${totalUsers} users in ${batches.length} batches...`);
        loadingText.textContent = `Processing ${totalUsers} users...`;
        
        // Process each batch sequentially, but users within batch in parallel
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            
            console.log(`Processing batch ${batchIndex + 1}/${batches.length}...`);
            
            // Process users in current batch in parallel
            const batchPromises = batch.map(async (atcoderHandle) => {
                const codeforcesHandle = userMapping[atcoderHandle];
                const userName = userNames[atcoderHandle] || atcoderHandle;
                
                console.log(`Fetching data for ${userName}...`);
                
                try {
                    // Fetch AtCoder and Codeforces data in parallel for each user
                    const [atcoderData, codeforcesData] = await Promise.all([
                        fetchAtcoderContests(atcoderHandle),
                        fetchCodeforcesContests(codeforcesHandle)
                    ]);
                    
                    // Update progress after each user is processed
                    processedCount++;
                    const percentage = Math.round((processedCount / totalUsers) * 100);
                    progressFill.style.width = `${percentage}%`;
                    progressText.textContent = `${processedCount} / ${totalUsers} (${percentage}%)`;
                    loadingText.textContent = `Loading data for ${userName}...`;
                    
                    return {
                        userName,
                        atcoderHandle,
                        codeforcesHandle,
                        atcoderData,
                        codeforcesData,
                        totalContests: atcoderData.count + codeforcesData.count
                    };
                } catch (err) {
                    console.error(`Error fetching data for ${userName}:`, err);
                    
                    // Update progress even on error
                    processedCount++;
                    const percentage = Math.round((processedCount / totalUsers) * 100);
                    progressFill.style.width = `${percentage}%`;
                    progressText.textContent = `${processedCount} / ${totalUsers} (${percentage}%)`;
                    
                    // Return partial data if fetch fails
                    return {
                        userName,
                        atcoderHandle,
                        codeforcesHandle,
                        atcoderData: { count: 0, contests: [] },
                        codeforcesData: { count: 0, contests: [] },
                        totalContests: 0
                    };
                }
            });
            
            // Wait for current batch to complete
            const batchResults = await Promise.all(batchPromises);
            userData.push(...batchResults);
            
            // Add delay between batches to avoid rate limiting (except for last batch)
            if (batchIndex < batches.length - 1) {
                console.log(`Waiting ${BATCH_DELAY}ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
            }
        }
        
        // Final progress update
        loadingText.textContent = 'Processing complete! Preparing data...';
        progressFill.style.width = '100%';
        progressText.textContent = `${totalUsers} / ${totalUsers} (100%)`;
        
        // Calculate totals
        userData.forEach(user => {
            totalAtcoderContests += user.atcoderData.count;
            totalCodeforcesContests += user.codeforcesData.count;
        });
        
        // Sort by total contests (descending)
        userData.sort((a, b) => b.totalContests - a.totalContests);
        
        // Store data globally for search functionality
        allUserData = userData;
        
        // Update summary stats
        document.getElementById('total-users').textContent = userData.length;
        document.getElementById('total-atcoder').textContent = totalAtcoderContests;
        document.getElementById('total-codeforces').textContent = totalCodeforcesContests;
        
        // Render the table with all users
        renderUserTable(userData);
        
        // Setup search functionality
        setupSearch();
        
        // Hide loading, show content
        loading.classList.add('hidden');
        statsSummary.classList.remove('hidden');
        searchSection.classList.remove('hidden');
        tableContainer.classList.remove('hidden');
        
        console.log('All data loaded successfully!');
        
    } catch (err) {
        console.error('Error loading contest data:', err);
        loading.classList.add('hidden');
        error.classList.remove('hidden');
        errorMessage.textContent = err.message || 'Failed to load contest data. Please try again.';
    }
}








// New function to render the user table
function renderUserTable(userData) {
    const tableBody = document.getElementById('contest-table-body');
    tableBody.innerHTML = '';
    
    if (userData.length === 0) {
        // Show no results message
        const noResultsRow = document.createElement('tr');
        noResultsRow.innerHTML = `
            <td colspan="5" class="no-results">
                <i class="fas fa-search"></i>
                <p>No users found</p>
                <small>Try adjusting your search terms</small>
            </td>
        `;
        tableBody.appendChild(noResultsRow);
        return;
    }
    
    // Populate table
    userData.forEach((user, index) => {
        const row = document.createElement('tr');
        row.className = 'main-row';
        row.dataset.userName = user.userName.toLowerCase();
        
        // User name
        const userNameCell = document.createElement('td');
        userNameCell.innerHTML = `<strong>${user.userName}</strong>`;
        row.appendChild(userNameCell);
        
        // AtCoder contests count
        const atcoderCountCell = document.createElement('td');
        atcoderCountCell.innerHTML = `<span class="contest-count ${user.atcoderData.count === 0 ? 'zero' : ''}">${user.atcoderData.count}</span>`;
        row.appendChild(atcoderCountCell);
        
        // Codeforces contests count
        const codeforcesCountCell = document.createElement('td');
        codeforcesCountCell.innerHTML = `<span class="contest-count ${user.codeforcesData.count === 0 ? 'zero' : ''}">${user.codeforcesData.count}</span>`;
        row.appendChild(codeforcesCountCell);
        
        // Total contests
        const totalCell = document.createElement('td');
        totalCell.innerHTML = `<strong class="contest-count">${user.totalContests}</strong>`;
        row.appendChild(totalCell);
        
        // Details button
        const detailsCell = document.createElement('td');
        const detailsData = createDetailsCell(
            user.atcoderData, 
            user.codeforcesData, 
            user.atcoderHandle, 
            user.codeforcesHandle
        );
        
        detailsCell.appendChild(detailsData.container);
        row.appendChild(detailsCell);
        
        // Add main row to table
        tableBody.appendChild(row);
        
        // Create and add details row
        const detailsRow = createDetailsRow(
            user.atcoderData,
            user.codeforcesData,
            user.atcoderHandle,
            user.codeforcesHandle,
            detailsData.detailsId
        );
        tableBody.appendChild(detailsRow);
        
        // Add click event to toggle button
        detailsData.container.addEventListener('click', () => {
            const detailsRowElement = document.getElementById(detailsData.detailsId);
            const isHidden = detailsRowElement.classList.contains('hidden');
            
            detailsRowElement.classList.toggle('hidden');
            detailsData.container.innerHTML = isHidden 
                ? '<i class="fas fa-eye-slash"></i> Hide Details' 
                : '<i class="fas fa-eye"></i> View Details';
        });
    });
}

// New function to setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('user-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const searchResultsCount = document.getElementById('search-results-count');
    
    // Search input event
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        // Show/hide clear button
        if (searchTerm) {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
        
        // Filter users
        if (searchTerm === '') {
            // Show all users
            renderUserTable(allUserData);
            searchResultsCount.textContent = `Showing all ${allUserData.length} users`;
        } else {
            // Filter users by name
            const filteredUsers = allUserData.filter(user => 
                user.userName.toLowerCase().includes(searchTerm) ||
                user.atcoderHandle.toLowerCase().includes(searchTerm) ||
                user.codeforcesHandle.toLowerCase().includes(searchTerm)
            );
            
            renderUserTable(filteredUsers);
            
            // Update search results count
            if (filteredUsers.length === 0) {
                searchResultsCount.textContent = 'No users found';
            } else if (filteredUsers.length === 1) {
                searchResultsCount.textContent = '1 user found';
            } else {
                searchResultsCount.textContent = `${filteredUsers.length} users found`;
            }
        }
    });
    
    // Clear search button
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        renderUserTable(allUserData);
        searchResultsCount.textContent = `Showing all ${allUserData.length} users`;
        searchInput.focus();
    });
    
    // Initial state
    searchResultsCount.textContent = `Showing all ${allUserData.length} users`;
}




// async function loadAndRenderContests() {
//     const loading = document.getElementById('loading');
//     const error = document.getElementById('error');
//     const errorMessage = document.getElementById('error-message');
//     const statsSummary = document.getElementById('stats-summary');
//     const tableContainer = document.getElementById('contest-table-container');
//     const tableBody = document.getElementById('contest-table-body');
    
//     // Show loading
//     loading.classList.remove('hidden');
//     error.classList.add('hidden');
//     statsSummary.classList.add('hidden');
//     tableContainer.classList.add('hidden');
    
//     try {
//         const userData = [];
//         let totalAtcoderContests = 0;
//         let totalCodeforcesContests = 0;
        
//         // Fetch data for all users
//         for (const atcoderHandle of defaultAtCoderUsers) {
//             const codeforcesHandle = userMapping[atcoderHandle];
//             const userName = userNames[atcoderHandle] || atcoderHandle; // Fallback to handle if no name
            
//             // Add delay to avoid rate limiting
//             await new Promise(resolve => setTimeout(resolve, 300));
            
//             console.log(`Fetching data for ${userName} (${atcoderHandle} / ${codeforcesHandle})...`);
            
//             const [atcoderData, codeforcesData] = await Promise.all([
//                 fetchAtcoderContests(atcoderHandle),
//                 fetchCodeforcesContests(codeforcesHandle)
//             ]);
            
//             totalAtcoderContests += atcoderData.count;
//             totalCodeforcesContests += codeforcesData.count;
            
//             userData.push({
//                 userName,
//                 atcoderHandle,
//                 codeforcesHandle,
//                 atcoderData,
//                 codeforcesData,
//                 totalContests: atcoderData.count + codeforcesData.count
//             });
//         }
        
//         // Sort by total contests (descending)
//         userData.sort((a, b) => b.totalContests - a.totalContests);
        
//         // Update summary stats
//         document.getElementById('total-users').textContent = userData.length;
//         document.getElementById('total-atcoder').textContent = totalAtcoderContests;
//         document.getElementById('total-codeforces').textContent = totalCodeforcesContests;
        
//         // Clear table body
//         tableBody.innerHTML = '';
        
//         // Populate table with updated structure
//         userData.forEach((user, index) => {
//             const row = document.createElement('tr');
//             row.className = 'main-row';
            
//             // User name
//             const userNameCell = document.createElement('td');
//             userNameCell.innerHTML = `<strong>${user.userName}</strong>`;
//             row.appendChild(userNameCell);
            
//             // AtCoder contests count
//             const atcoderCountCell = document.createElement('td');
//             atcoderCountCell.innerHTML = `<span class="contest-count ${user.atcoderData.count === 0 ? 'zero' : ''}">${user.atcoderData.count}</span>`;
//             row.appendChild(atcoderCountCell);
            
//             // Codeforces contests count
//             const codeforcesCountCell = document.createElement('td');
//             codeforcesCountCell.innerHTML = `<span class="contest-count ${user.codeforcesData.count === 0 ? 'zero' : ''}">${user.codeforcesData.count}</span>`;
//             row.appendChild(codeforcesCountCell);
            
//             // Total contests
//             const totalCell = document.createElement('td');
//             totalCell.innerHTML = `<strong class="contest-count">${user.totalContests}</strong>`;
//             row.appendChild(totalCell);
            
//             // Details button
//             const detailsCell = document.createElement('td');
//             const detailsData = createDetailsCell(
//                 user.atcoderData, 
//                 user.codeforcesData, 
//                 user.atcoderHandle, 
//                 user.codeforcesHandle
//             );
            
//             detailsCell.appendChild(detailsData.container);
//             row.appendChild(detailsCell);
            
//             // Add main row to table
//             tableBody.appendChild(row);
            
//             // Create and add details row
//             const detailsRow = createDetailsRow(
//                 user.atcoderData,
//                 user.codeforcesData,
//                 user.atcoderHandle,
//                 user.codeforcesHandle,
//                 detailsData.detailsId
//             );
//             tableBody.appendChild(detailsRow);
            
//             // Add click event to toggle button
//             detailsData.container.addEventListener('click', () => {
//                 const detailsRowElement = document.getElementById(detailsData.detailsId);
//                 const isHidden = detailsRowElement.classList.contains('hidden');
                
//                 detailsRowElement.classList.toggle('hidden');
//                 detailsData.container.innerHTML = isHidden 
//                     ? '<i class="fas fa-eye-slash"></i> Hide Details' 
//                     : '<i class="fas fa-eye"></i> View Details';
//             });
//         });
        
//         // Hide loading, show content
//         loading.classList.add('hidden');
//         statsSummary.classList.remove('hidden');
//         tableContainer.classList.remove('hidden');
        
//     } catch (err) {
//         console.error('Error loading contest data:', err);
//         loading.classList.add('hidden');
//         error.classList.remove('hidden');
//         errorMessage.textContent = err.message || 'Failed to load contest data. Please try again.';
//     }
// }





// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAndRenderContests();
    
    // Retry button
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', loadAndRenderContests);
    }

});
