
// Function to handle sign-in button click
backend_endpoint = 'https://scanner24-webapp.onrender.com'
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

        window.location.href = data;
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

// Attach signIn function to the click event of the sign-in button
document.getElementById('signInButton').addEventListener('click', signIn);
