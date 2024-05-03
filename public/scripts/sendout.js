function sendImgReq() {
    const urlBox = document.getElementById("urlin");
    const urlIn = urlBox.value;
    const alert = document.getElementById('noturl');
    const failalert = document.getElementById('fail');
    const progressBar = document.getElementById('loadingProgressBar'); // Get the progress bar element
    let radio = document.getElementById('radiogroup');

    // console.log(radio.value);

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            alert.show();
            return false; // If error, URL is not valid
        }
    }

    // Check for a non-falsy value, which includes non-empty strings
    if (urlIn && isValidUrl(urlIn)) {
        progressBar.style.display = 'block'; // Show the progress bar when the request starts

        fetch("http://localhost:3000/submit", {
            method: "POST",
            body: JSON.stringify({
                imageUrl: urlIn,
                gender: radio.value,
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json(); // We read the response JSON if the fetch call was successful
        })
        .then(data => {
            console.log(data); // Handle the response data
            progressBar.style.display = 'none'; // Hide the progress bar when data is successfully fetched
        })
        .catch(error => {
            failalert.show();
            console.error('There has been a problem with your fetch operation:', error);
            progressBar.style.display = 'none'; // Hide the progress bar on error
        });
    }
}
