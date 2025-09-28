/* 
DISCLAIMER:
The content of this project is subject to the Miro Developer Terms of Use: https://miro.com/legal/developer-terms-of-use/
This script is provided only as an example to illustrate how to identify inactive users in Miro and to deactivate them automatically via API.
The usage of this script is at the sole discretion and responsibility of the customer and is to be tested thoroughly before running it on Production environments.

Script Author: Luis Colman (luis.s@miro.com) | LinkedIn: https://www.linkedin.com/in/luiscolman/
*/

let MIRO_ORG_ID = '';
let API_TOKEN = '';
const readline = require('readline');
const fs = require('fs');

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to ask a question
function askQuestion(question, validator, callback) {
    rl.question(question, (answer) => {
        if (validator(answer)) {
            callback(answer);
        } else {
            console.log('Invalid input. Please try again.');
            askQuestion(question, validator, callback); // Re-ask the question
        }
    });
}

// Array of questions with corresponding validators
const questions = [
    {
        question: 'Enter your Miro Organization ID: ',
        validator: (answer) => !isNaN(parseFloat(answer)) && isFinite(answer)
    },
    {
        question: 'Enter your Miro REST API Token: ',
        validator: (answer) => typeof answer === 'string'
    },
    // Add more questions with validators as needed
];

// Function to ask multiple questions recursively
async function askQuestions(index) {
    if (index >= questions.length) {
        // End of questions
        console.log('Thank you for answering the questions!');
        await runGetBoardsScript();
        rl.close();
        return;
    }
  
    const { question, validator } = questions[index];
    askQuestion(question, validator, (answer) => {
        if (question === 'Enter your Miro Organization ID: ') {
            MIRO_ORG_ID = answer;
        }
        else if (question === 'Enter your Miro REST API Token: ') {
            API_TOKEN = answer;
        }
        askQuestions(index + 1); // Ask the next question
    });
}

// Start asking questions
askQuestions(0);

// ========================= MAIN SCRIPT - BEGIN =============================
let getBoards_Requests_Batch_Number = 250;
let getUsers_Requests_Batch_Number = 70;

let teams = {};
let globalProcessedUrls = {};
let boardsObject = {};
let getUserErrors = {};

let getBoardsExclusionList = {};
let getTeamsErrors = [];
let errorRetryCount = 0;
let getBoardsErrors = {};
let users = {};

let IS_TEST = true;
let DOWNLOAD_FULL_REPORT_OF_EXISTING_BOARDS = true;

async function runGetBoardsScript() {

    function jsonToCsv(jsonData) {
      if (jsonData) {
        let csv = '';
        // Get the headers
        let headers = Object.keys(jsonData[Object.keys(jsonData)[0]]);
        csv += headers.join(',') + '\n';
        
        // Helper function to escape CSV special characters
        const escapeCSV = (value) => {
          if (typeof value === 'string') {
            if (value.includes('"')) {
              value = value.replace(/"/g, '""');
            }
          }
          value = `"${value}"`;
          return value;
        };
    
        // Add the data
        Object.keys(jsonData).forEach(function(row) {
          let data = headers.map(header => escapeCSV(jsonData[row][header])).join(',');
          csv += data + '\n';
        });
        return csv;
      }
    }
    
    /* Function to get User IDs */
    async function getUserIds(numberOfRequests) {   
        let totalItems;
        let batchUrls;
        let usersInBatch;
        let getProcessedUsers = {}
        let processedUrls = [];
        let batchSize;
        let getRemainingUsers = {};
    
        let reqHeaders = {
            'cache-control': 'no-cache, no-store',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + API_TOKEN
        };
    
        let reqGetOptions = {
            method: 'GET',
            headers: reqHeaders,
            body: null
        };
    
        totalItems = Object.keys(users);
    
        for(let i=0; i < totalItems.length; i++) {
            getRemainingUsers[totalItems[i]] = { usersInBatch: totalItems[i] }
        }
    
        while (Object.keys(getRemainingUsers).length > 0) {
            console.log(`----- Getting Owner Emails - Remaining ${Object.keys(getRemainingUsers).length}`);
            let apiUrl = `https://api.miro.com/v2/orgs/${MIRO_ORG_ID}/members`;
            
            // Calculate the number of items remaining to fetch
            let remainingItems = totalItems.length - Object.keys(getProcessedUsers).length;
    
            if (Object.keys(getUserErrors).length === 0) {
    
                // Calculate the number of calls to make in this batch
                batchSize = Math.min(numberOfRequests, Math.ceil(remainingItems / 1));
                batchUrls = Array.from({ length: batchSize }, (_, index) => `${apiUrl}/${Object.keys(getRemainingUsers)[index]}`);
    
            }
            else {
                console.log('Errors found - retrying failed requests');
                await holdScriptExecution(61000);
                batchSize = Object.keys(getUserErrors).length;
                batchUrls = Array.from({ length: batchSize }, (_, index) => `${Object.keys(getUserErrors)[index]}`);
                processedUrls.forEach(function(item) {
                    let urlIndex = batchUrls.indexOf(item);
                    if (urlIndex !== -1) {
                        batchUrls.splice(urlIndex, 1);
                    }
                });
                errorRetryCount = errorRetryCount + 1;
                console.log(`errorRetryCount --> ${errorRetryCount}`);
                if (errorRetryCount < 13) {
                    if (errorRetryCount === 12) { 
                        console.log('This is the 7th and last attempt to retry failed "getTeamAdmins" calls...');
                    }
                }
                else {
                    console.log('Maximum amount of retry attempts for failed "getTeamAdmins" calls reached (7). Please review the "getIndividualTeamsErrors" object to find out what the problem is...');
                    return false;
                }
            }
            if (Object.keys(getUserErrors).length > 0) { 
                console.log(`Failed API calls to retry below: -----`); 
            }
            if (batchUrls.length > 0) {
                console.log(`.........API URLs in this the batch are:`);
                console.table(batchUrls);
                try {       
                    const promisesWithUrls = batchUrls.map(url => {
                        const promise = fetch(url, reqGetOptions)
                            .catch(error => {
                                // Check if the error is a response error
                                if (error instanceof Response) {
                                    // Capture the HTTP error code and throw it as an error
                                    usersInBatch = value.url.split('/');
                                    usersInBatch = usersInBatch[7];
                                    if (!getUserErrors[url]) {
                                        getUserErrors[url] = { usersInBatch: usersInBatch, url: url, error: error.status, errorMessage: error.statusText };
                                    }
                                    console.error({ usersInBatch: usersInBatch, url: url, error: error.status, errorMessage: error.statusText });
                                    return Promise.reject(error);
                                } else {
                                    // For other types of errors, handle them as usual
                                    throw error;
                                }
                            });
                        return { promise, url };
                    });
    
                    // Fetch data for each URL in the batch
                    const batchResponses = await Promise.allSettled(promisesWithUrls.map(({ promise }) => promise));
                    for (let i = 0; i < batchResponses.length; i++) {
                        let { status, value, reason } = batchResponses[i];
                        usersInBatch = value.url.split('/');
                        usersInBatch = usersInBatch[7];
                        if (status === 'fulfilled') {
                            if (value.ok) {
                                errorRetryCount = 0;
                                if (value.status === 200) {
                                    let batchData = await value.json();
                                    users[batchData.id].user_id = batchData.id;
                                    users[batchData.id].user_email = batchData.email;
                                    if (processedUrls.indexOf(value.url) === -1) { processedUrls.push(value.url) };
                                    delete getRemainingUsers[usersInBatch];
                                    getProcessedUsers[usersInBatch] = { usersInBatch: usersInBatch };
                                    if (getUserErrors[value.url]) {
                                        delete getUserErrors[value.url];
                                    }
                                    console.log(`Processed user: ${Object.keys(getProcessedUsers).length} out of ${totalItems.length}`);
                                }
                            }
                            else {
                                if (!getUserErrors[value.url]) {
                                    getUserErrors[value.url] = { usersInBatch: usersInBatch, error: value.status };
                                }
                            }
                        }
                        else {
                            let index = batchResponses.indexOf({ status, value, reason });
                            let failedUrl = promisesWithUrls[index].url;
                            usersInBatch = failedUrl.split('/');
                            usersInBatch = usersInBatch[7];
                            if (!getUserErrors[failedUrl]) {
                                getUserErrors[failedUrl] = { usersInBatch: usersInBatch, error: value.status };
                            }
                            console.error(`Custom Message - API URL --> ${failedUrl}:`, reason);
                        }
                    }
    
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }

    async function populateOwnerEmailInChunks(chunkSize = 1000) {
        return new Promise((resolve) => {
            const entries = Object.entries(boardsObject);
            let index = 0;
    
            function processChunk() {
                const end = Math.min(index + chunkSize, entries.length);
                for (; index < end; index++) {
                    const [boardId, board] = entries[index];
                    board.board_owner_email = users[board.board_owner_id].user_email;
                }
    
                if (index < entries.length) {
                    setTimeout(processChunk, 0); // yield back to event loop
                }
                else {
                    resolve(); // completion
                }
            }
    
            processChunk();
        });
    }

    // --- helpers ---
    async function safeFetch(url, options) {
        const res = await fetch(url, options);
        if (!res.ok) {
            throw Object.assign(new Error(`HTTP ${res.status}`), { url, status: res.status });
        }
        return res; // return a real Response object
    }

    async function runWithConcurrency(urls, limit, fn) {
        const results = [];
        for (let i = 0; i < urls.length; i += limit) {
            const chunk = urls.slice(i, i + limit);
            const chunkResults = await Promise.allSettled(chunk.map(url => fn(url)));
            results.push(...chunkResults);
        }
        return results;
    }

    // --- main function ---
    async function getBoards(apiUrl, teamId, teamIndex, teamsLength, numberOfRequests, isErrorRetry) {
        const results = [];
        let processedUrls = [];
        let batchUrls;
        let response;
        let responseCounter = 1;

        let reqHeaders = {
            'cache-control': 'no-cache, no-store',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + API_TOKEN
        };

        let reqGetOptions = {
            method: 'GET',
            headers: reqHeaders,
            body: null
        };

        try {
            response = await fetch(apiUrl, reqGetOptions);
            if (!response.ok) {
                throw new Error(`Failed to fetch data from ${apiUrl}: ${response.status} ${response.statusText}`);
            } else {
                processedUrls.push(apiUrl);
                if (!globalProcessedUrls[apiUrl]) {
                    globalProcessedUrls[apiUrl] = { requestStatus: 'valid response received' };
                }
                if (getBoardsErrors[apiUrl]) {
                    delete getBoardsErrors[apiUrl];
                }
            }
        } catch (error) {
            console.error(error);
            if (!getBoardsErrors[apiUrl]) {
                getBoardsErrors[apiUrl] = { team: teamId, url: apiUrl, error: error };
            }
            return await getBoards(apiUrl, teamId, teamIndex, teamsLength, numberOfRequests, isErrorRetry);
        }

        console.log(`Getting Boards of Team ${teamId} (Team No. ${teamIndex + 1} of ${teamsLength}) - API URL --> ${apiUrl}`);
        let initialData = await response.json();
        let totalItems = initialData.total;
        let processedItems = initialData.data.length;
        let idsToAdd = initialData.data.map(item => item.id);
        teams[teamId].all_boards.push(...idsToAdd);
        results.push(...initialData.data);

        for (let i = 0; i < initialData.data.length; i++) {
            if (!boardsObject[initialData.data[i].id]) {
                boardsObject[initialData.data[i].id] = {
                    board_id: initialData.data[i].id,
                    board_url: `https://miro.com/app/board/${initialData.data[i].id}`,
                    board_name: initialData.data[i].name,
                    team_id: initialData.data[i].team.id,
                    team_name: initialData.data[i].team.name,
                    board_owner_id: initialData.data[i].owner.id,
                    board_owner_email: 'TBD'
                };
                if (!users[initialData.data[i].owner.id]) {
                    users[initialData.data[i].owner.id] = {
                        user_id: initialData.data[i].owner.id,
                        user_email: 'TBD'
                    };
                }
            }
        }

        while (processedItems < totalItems) {
            console.log(`ProcessedItems --> ${processedItems} out of ${totalItems} in Team ID ${teamId} (Team ${teamIndex} out of ${teamsLength})`);
            console.log(`....Getting further Boards of Team ${teamId} asynchronously in batches of max ${numberOfRequests} per batch`);

            let remainingItems = totalItems - processedItems;
            let batchSize = Math.min(numberOfRequests, Math.ceil(remainingItems / 50));

            if (Object.keys(getBoardsErrors).length > 0) {
                if (getBoardsErrors[Object.keys(getBoardsErrors)[Object.keys(getBoardsErrors).length - 1]].error == 429) {
                    await holdScriptExecution(38000);
                }
                batchUrls = Array.from({ length: batchSize }, (_, index) => `${Object.keys(getBoardsErrors)[index]}`);
                processedUrls.forEach(item => {
                    const urlIndex = batchUrls.indexOf(item);
                    if (urlIndex !== -1) batchUrls.splice(urlIndex, 1);
                });
                batchUrls = batchUrls.filter(item => item !== 'undefined');

                errorRetryCount++;
                if (errorRetryCount >= 8) {
                    console.log('Maximum retry attempts (7) reached for failed "getBoards" calls.');
                    return false;
                }
            } else {
                batchUrls = Array.from({ length: batchSize }, (_, index) => `${apiUrl}&offset=${processedItems + index * 50}`);
            }

            console.log(".........API URLs for the batch are:");
            console.table(batchUrls);

            try {
                // ✅ concurrency limited batch fetch
                const batchResponses = await runWithConcurrency(batchUrls, 100, (url) =>
                    safeFetch(url, reqGetOptions)
                );

                console.log("---- Batch responses received --------");

                for (let i = 0; i < batchResponses.length; i++) {
                    const { status, value, reason } = batchResponses[i];

                    if (status === "fulfilled") {
                        const res = value; // real Response
                        const batchData = await res.json();

                        idsToAdd = batchData.data.map(item => item.id);
                        teams[teamId].all_boards.push(...idsToAdd);
                        responseCounter++;
                        processedItems += batchData.data.length;
                        processedUrls.push(res.url);

                        for (const item of batchData.data) {
                            if (!boardsObject[item.id]) {
                                boardsObject[item.id] = {
                                    board_id: item.id,
                                    board_url: `https://miro.com/app/board/${item.id}`,
                                    board_name: item.name,
                                    team_id: item.team.id,
                                    team_name: item.team.name,
                                    board_owner_id: item.owner.id,
                                    board_owner_email: 'TBD'
                                };
                            }
                            if (!users[item.owner.id]) {
                                users[item.owner.id] = {
                                    user_id: item.owner.id,
                                    user_email: 'TBD'
                                };
                            }
                        }

                        if (getBoardsErrors[res.url]) {
                            delete getBoardsErrors[res.url];
                        }
                        if (getBoardsExclusionList[res.url]) {
                            delete getBoardsExclusionList[res.url];
                        }
                        if (!globalProcessedUrls[res.url]) {
                            globalProcessedUrls[res.url] = { requestStatus: 'valid response received' };
                        }
                    } else {
                        const failedUrl = reason.url || batchUrls[i];
                        getBoardsErrors[failedUrl] = {
                            team: teamId,
                            url: failedUrl,
                            error: reason.status || reason.message || "fetch failed",
                        };
                        console.error(`Custom Message - API URL --> ${failedUrl}:`, reason);
                    }
                }
            } catch (error) {
                console.error("Batch processing error:", error);
            }
        }

        return { results };
    }

    let delay = ms => new Promise(res => setTimeout(res, ms));
    let holdScriptExecution = async (ms) => {
        console.log('**** Rate limit hit - Delaying execution for ' + (ms/1000) + ' seconds to replenish rate limit credits - Current time: ' + new Date() + '***');
        await delay(ms);
        console.log('**** Resumming script execution ***');
    };

    async function callAPI(url, options) {
        async function manageErrors(response) {
            if(!response.ok){
                let parsedResponse = await response.json();
                let responseError = {
                    status: response.status,
                    statusText: response.statusText,
                    requestUrl: response.url,
                    errorDetails: parsedResponse
                };
                throw(responseError);
            }
            return response;
        }

        let response = await fetch(url, options)
        .then(manageErrors)
        .then((res) => {
            if (res.ok) {
                let rateLimitRemaining = res.headers.get('X-RateLimit-Remaining');
                return res[res.status == 204 ? 'text' : 'json']().then((data) => ({ status: res.status, rate_limit_remaining: rateLimitRemaining, body: data }));
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            return error;
        });
        return response;
    }

    async function iterateThroughTeams(teamsArray, isErrorRetry) {
        if (DOWNLOAD_FULL_REPORT_OF_EXISTING_BOARDS) {
            for(let i=0; i < Object.keys(teamsArray).length; i++) {
                let apiUrl = `https://api.miro.com/v2/boards?team_id=${Object.keys(teamsArray)[i]}&limit=50`;
                await getBoards(apiUrl, Object.keys(teamsArray)[i], i, Object.keys(teamsArray).length, getBoards_Requests_Batch_Number, isErrorRetry);
            }

            if (Object.keys(getBoardsErrors).length > 0) {
                console.log('Errors found. Holding execution for 25 seconds to allow Rate Limit Credits to replenish');
                await holdScriptExecution(25000);
                errorRetryCount = errorRetryCount + 1;
                if (errorRetryCount < 4) {
                    if (errorRetryCount === 3) { console.log('This is the third and last attempt to retry failed "getBoards" calls...'); }
                    await iterateThroughTeams(getBoardsErrors, true);
                }
                else {
                    console.log('Maximum amount of retry attempts for failed "getBoards" calls reached. Please review the errors array to find out what the problem is...');
                    return false;
                }
            }
            else {
                errorRetryCount = 0;
                await getUserIds(getUsers_Requests_Batch_Number);
                await populateOwnerEmailInChunks();
                //console.log('Populating owner Email complete -----');
            }
        }
        return true;
    }

    function convertTimestampToDate(timestamp) {
        const date = new Date(timestamp); // Convert the 13-digit timestamp to a Date object
    
        const day = String(date.getDate()).padStart(2, '0'); // Get the day and pad with leading zero if needed
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Get the month (0-based) and pad with leading zero
        const year = date.getFullYear(); // Get the full year
    
        return `${year}-${month}-${day}`; // Format as YYYY/MM/DD
    }    

    async function getTeams(orgId, cursor) {
        let reqHeaders = {
            'cache-control': 'no-cache, no-store',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + API_TOKEN
        };

        let reqGetOptions = {
            method: 'GET',
            headers: reqHeaders,
            body: null
        };

        let url = `https://api.miro.com/v2/orgs/${orgId}/teams` + (cursor ? `?cursor=${cursor}` : '');
        console.log('Getting Miro Teams - API URL --> : ' + url);
        let listTeams = await callAPI(url, reqGetOptions);
        
        if (listTeams.status === 200) {
            for(let i=0; i < listTeams.body.data.length; i++) {
                let teamId = listTeams.body.data[i].id;
                teams[teamId] = listTeams.body.data[i];
                teams[teamId].team_id = teamId.toString();
                teams[teamId].team_name = teams[teamId].name.toString();
                teams[teamId].all_boards = [];
                delete teams[teamId].id;
                delete teams[teamId].name;
            }
            if (listTeams.body.cursor) {
                await getTeams(orgId, listTeams.body.cursor);
            }
            else {
                console.log('Getting Miro Teams COMPLETE - Begin iterating through Teams to get Boards...');
                await iterateThroughTeams(teams);

                console.log(`Script end time: ${new Date()}`);
                console.log('\n\n********** GETTING BOARDS COMPLETE **********');
                console.log(`Total number of boards --> ${Object.keys(boardsObject).length}`);
                console.log('For further details review the "miro_getboards_output_files" folder within your local directory where this script lives');
                let directory = `miro_getboards_output_files_${convertTimestampToDate(Date.now())}`;
                if (!fs.existsSync(directory)) {
                    fs.mkdirSync(directory);
                }
                let content;
                let filePath;

                if (Object.keys(getBoardsErrors).length > 0) {
                    content = JSON.stringify(getBoardsErrors, null, '2');
                    filePath = `${directory}/board_errors.json`;
                    fs.writeFileSync(filePath, content);
                }

                //content = JSON.stringify(boardsObject, null, 2);
                content = JSON.stringify(boardsObject, null);
                filePath = `${directory}/full_report_by_board.json`;
                fs.writeFileSync(filePath, content);

                content = jsonToCsv(boardsObject);
                filePath = `${directory}/full_report_by_board.csv`;
                fs.writeFileSync(filePath, content);

                if (Object.keys(getBoardsExclusionList).length > 0) {
                    console.log(`====== There are URLs in the "getBoardsExclusionList" object. Plese check --> `);
                    console.log(JSON.stringify(getBoardsExclusionList, null, 2));
                }

                console.log(`\n# Next step: For further details review the "miro_getboards_output_files" folder within your local directory where this script lives`);
                console.log('********** END OF SCRIPT **********\n\n');
            }
        }
        else if (listTeams.rate_limit_remaining === 0) {
            await holdScriptExecution(43000);
            return await getTeams(orgId, cursor);
        }
        else {
            console.log('====== Get Teams Error - see errors array below ======');
            console.dir(listTeams);
            let result = {
                'team_id': teams[i],
                'response_error': JSON.stringify(listTeams),
                'full_error': listTeams
            };
            getTeamsErrors.push(result);
            console.log('====== ERROR: Could not get all Teams, please check the "getTeamsErrors" array to learn what the problem is ======');
            console.log(`Script end time: ${new Date()}`);
            console.log(`********** END OF SCRIPT  ${IS_TEST ? '(IN TEST MODE)': ''} **********`);
            return false;
        }
    }

    async function init() {
        console.log(`********** BEGIN OF SCRIPT **********`);
        console.log(`Script start time: ${new Date()}`);
        await getTeams(MIRO_ORG_ID);
        return true;
    }

    init();
}
// ========================= MAIN SCRIPT - END =============================
