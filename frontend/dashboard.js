const backend_endpoint = 'https://scanner24-webapp.onrender.com'
// const backend_endpoint = 'http://localhost:3000'

//extract params from url:

function logout() {
    localStorage.removeItem('auth');
    window.location.href = 'index.html'; // Redirect to homepage
}

// Function to determine risk level based on spam chance
function getRiskLevel(spamChance) {
    if (spamChance <= 0.5) {
        return 'No Risk';
    } else if (spamChance <= 0.7) {
        return 'Medium Risk';
    } else {
        return 'High Risk';
    }
}
function getParamsFromUrl() {
    let url = window.location.href;
    let params = url.split('?')[1];
    let paramList = params.split('&');
    let paramObj = {};
    paramList.forEach(param => {
        let [key, value] = param.split('=');
        paramObj[key] = value;
    });
    return paramObj;
}
async function googleAuth() {
    params = getParamsFromUrl();
    if (params.error) {
        console.error(params.error)
        return; // Exit early if there's an error
    }
    const access_code = params.code;
    console.log(params);

    //send access_code to backend for tokens:
    
    try {
        const response = await fetch(backend_endpoint + '/google-auth-callback?code=' + access_code);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json()
        if(data.error){
            console.error(data.error);
            return;
        }
        console.log(data) // Log the response from the server
        localStorage.setItem('auth', JSON.stringify(data))
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error)
    }
}
async function getEmails() {
    const user = localStorage.getItem('auth');
    if (user == null) {
        console.error('User not found');
        return;
    }
    const userObj = JSON.parse(user);
    console.log(userObj);
    
    try {
        const response = await fetch(backend_endpoint + '/get-emails?user_id=' + userObj.id);
        console.log(userObj.id)
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const emails = await response.json();
        console.log(emails); // Log the response from the server
        
        const messagesContainer = document.getElementById('messages');
        messagesContainer.innerHTML = ''; // Clear previous content
        
        emails.forEach(email => {
            const row = document.createElement('tr');
            const dateCell = document.createElement('td');
            dateCell.textContent = email.Date;
            row.appendChild(dateCell);
            const fromCell = document.createElement('td');
            fromCell.textContent = email.From;
            row.appendChild(fromCell);
            // const toCell = document.createElement('td');
            // toCell.textContent = email.To;
            // row.appendChild(toCell);
            const subjectCell = document.createElement('td');
            subjectCell.textContent = email.Subject;
            row.appendChild(subjectCell);
            const emailCell = document.createElement('td');
            emailCell.textContent = email.snippet;
            row.appendChild(emailCell);
            let spam_chance
            for (const score of email.spam_score) {
                if (score.label === "LABEL_0") {
                    spam_chance = score.score
                }
            }
            const riskLevelCell = document.createElement('td');
            const riskLevel = getRiskLevel(spam_chance)
            riskLevelCell.textContent = riskLevel
            row.appendChild(riskLevelCell)
            if (riskLevel === 'Medium Risk') {
                row.classList.add('medium-risk');
            } else if (riskLevel === 'High Risk') {
                row.classList.add('high-risk');
            }

            messagesContainer.appendChild(row);
        });
        
        // Update total message count
        document.getElementById('total').textContent = `Total Messages: ${emails.length}`;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}
document.getElementById('logout-btn').addEventListener('click', logout);
// Check if there's an authentication item in local storage
const authItem = localStorage.getItem('auth');

if (!authItem) {
  // If there's no authentication item

  // Check if there's a code or an error in the URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');

  if (!code && !error) {
    // If there's neither a code nor an error in the URL parameters, redirect back to homepage
    window.location.href = 'index.html';
  } else {
    // If there's a code or an error, run the Google auth function followed by getemails
    googleAuth()
      .then(() => {
        getEmails();
      })
      .catch((err) => {
        console.error('Error while authenticating:', err);
        // Handle error as needed
      });
  }
} else {
  // If there's an authentication item, simply run the getemails function
  getEmails();
}
