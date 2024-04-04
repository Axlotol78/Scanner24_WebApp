// //sign in func:
// function signIn() {
//     let oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth'

//     let form = document.createElement('form');
//     form.setAttribute('method', 'GET');
//     form.setAttribute('action', oauth2Endpoint);

//     let params = {
//         'client_id': '779788483159-vrp6o8u9g33cbfcr1tgd1ee9ntu3l0h2.apps.googleusercontent.com',
//         'redirect_uri': 'http://127.0.0.1:5500/Scanner24/dashboard.html',
//         'response_type': 'token',
//         'scope': 'https://www.googleapis.com/auth/userinfo.profile',
//         'include_granted_scopes': 'true',
//         'state': 'pass-through value'

//     }
//     for (let key in params) {
//         let input = document.createElement('input');
//         input.setAttribute('type', 'hidden');
//         input.setAttribute('name', key);
//         input.setAttribute('value', params[key]);
//         form.appendChild(input);
//     }
//     document.body.appendChild(form);
//     form.submit();
//     // let queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&')
//     // let url = oauth2Endpoint + '?' + queryString
//     // console.log(url)

//     // fetch(url)
//     //     .then(response => response.json())
//     //     .then(data => console.log(data))

    
// }

// Function to handle sign-in button click
backend_endpoint = 'http://127.0.0.1:3000'
function signIn() {
    // Make an AJAX request to the backend endpoint '/google-login'
    console.log("clicky")
    fetch(backend_endpoint + '/google-login')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(data => {
        console.log(data); // Log the response from the server
        //write data to file:
        // let a = document.createElement('a');
        // let blob = new Blob([data], { type: 'text/plain' });
        // a.href = window.URL.createObjectURL(blob);
        // a.download = 'auth_url.txt';
        // a.click();
        // window.URL.revokeObjectURL(a.href);


        // Redirect the user to the Google authentication page
        window.location.href = data;
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

// Attach signIn function to the click event of the sign-in button
document.getElementById('signInButton').addEventListener('click', signIn);
