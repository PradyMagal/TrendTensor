require('dotenv').config();
const axios = require('axios');
const got = require("fix-esm").require("got");
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;


const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET
const openAIKey = process.env.OPEN_AI_KEY


const maleString = `You will be provided with a set of colors, and a set of tags extracted from an image. We want to generate Google Shopping search queries to create outfits. Generate:
- 4 search terms for outerwear (for example, hoodies, canvas jackets, etc.)
- 4 search terms for tops/shirts (for example, t-shirts, sweatshirts)
- 4 search terms for bottoms/pants (for example, jeans, carpenter pants, shorts)
- 4 search terms for accessories (for example, camera bags, sunglasses)
Make sure the terms are for trendy and fashionable people
Gender for all the clothing in this case: MENS
reply in JSON Format with keys "outerwear","top","bottom","acc" and the search terms as values`;

const femaleString = `You will be provided with a set of colors, and a set of tags extracted from an image. We want to generate Google Shopping search queries to create outfits. Generate:
- 4 search terms for outerwear (for example, hoodies, canvas jackets, etc.)
- 4 search terms for tops/shirts (for example, t-shirts, sweatshirts)
- 4 search terms for bottoms/pants (for example, jeans, carpenter pants, shorts)
- 4 search terms for accessories (for example, camera bags, sunglasses)
Make sure the terms are for trendy and fashionable people
Gender for all the clothing in this case: WOMENS
reply in JSON Format with keys "outerwear","top","bottom","acc" and the search terms as values`;

const unitString = `You will be provided with a set of colors, and a set of tags extracted from an image. We want to generate Google Shopping search queries to create outfits. Generate:
- 4 search terms for outerwear (for example, hoodies, canvas jackets, etc.)
- 4 search terms for tops/shirts (for example, t-shirts, sweatshirts)
- 4 search terms for bottoms/pants (for example, jeans, carpenter pants, shorts)
- 4 search terms for accessories (for example, camera bags, sunglasses)
Make sure the terms are for trendy and fashionable people
Clothing item search terms can be unisex in this case
reply in JSON Format with with keys "outerwear","top","bottom","acc" and the search terms as values`;


async function sendChatMessage(gender, desc) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openAIKey}`  // Using environment variable for API key
  };
  const data = {
      model: "gpt-4",
      messages: [
          {
              role: "system",
              content: gender
          },
          {
              role: "user",
              content: desc
          }
      ]
  };

  try {
      const response = await axios.post(url, data, { headers: headers });
      console.log('Response:', response.data);
      
      // Assume the response message content is a JSON-formatted string and parse it
      let messageContent = response.data.choices[0].message.content;
      let parsedContent = JSON.parse(messageContent);  // Parsing the JSON content from the response
      
      console.log(parsedContent); // This logs the structured data for debugging
      return parsedContent; // Return the parsed JSON object

  } catch (error) {
      console.error('Error in sending message:', error.response ? error.response.data : error.message);
      return null; // Return null or an appropriate error object
  }
}




async function getImageTags(imgurl) {
  const url = 'https://api.imagga.com/v2/tags?image_url=' + encodeURIComponent(imgurl);
  let rArr = [];

  try {
      // Assuming `got` is already imported and configured to use as an ES module
      const response = await got(url, {username: apiKey, password: apiSecret});
      const data = JSON.parse(response.body); // Parse the JSON string into an object
      // Get the first five tags and add their English descriptions to rArr
      const tags = data.result.tags.slice(0, 4); // Take only the first five tags
      tags.forEach(tag => {
          rArr.push(tag.tag.en); // Assuming each tag has an 'en' property
      });

      return rArr; // Return the array containing the tags
  } catch (error) {
      console.error('Error fetching or processing data:', error.response ? error.response.body : error.message);
      return []; // Return an empty array in case of error
  }
}

async function getColors(imgurl){
  const url = 'https://api.imagga.com/v2/colors?image_url=' + encodeURIComponent(imgurl);
  let resultColors = [];

  try {
      // Assuming 'got' is properly imported and setup to handle asynchronous requests.
      const response = await got(url, {username: apiKey, password: apiSecret});
      const data = JSON.parse(response.body); // Parse the JSON response body into a JavaScript object.

      // Extract the first three closest_palette_color from background_colors
      if (data.result && data.result.colors && data.result.colors.background_colors) {
          const backgroundColors = data.result.colors.background_colors.slice(0, 3).map(color => color.closest_palette_color);
          resultColors = resultColors.concat(backgroundColors);
      }

      // Extract the first three closest_palette_color_parent from image_colors
      if (data.result && data.result.colors && data.result.colors.image_colors) {
          const imageColors = data.result.colors.image_colors.slice(0, 3).map(color => color.closest_palette_color_parent);
          resultColors = resultColors.concat(imageColors);
      }

      console.log('Resulting Colors:', resultColors);
      return resultColors; // Return the combined array of colors.
  } catch (error) {
      console.log('Error fetching colors:', error.response ? error.response.body : error.message);
      return []; // Return an empty array in case of error.
  }
}


app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Root route to serve the index.html file
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/submit', async function(req, res) {
  // Access the body of the POST request
  const data = req.body;
  console.log(data.imageUrl); // Logging the image URL from the request
  const userImageURL = data.imageUrl; // Using const for better practice if not reassigning
  let globalTags = [];
  let globalColors = [];

  if(userImageURL){
    try {
      // Get the image tags and wait for it to complete
      globalTags = await getImageTags(userImageURL);
      console.log('Tags:', globalTags);

      // Get the image colors and wait for it to complete
      globalColors = await getColors(userImageURL);
      console.log('Colors:', globalColors);

      // Combine and log the arrays only after both promises resolve
      let combinedArray = globalColors.concat(globalTags);
      let combinedString = combinedArray.join(', ');
      console.log(combinedString);

      // Example of further actions, e.g., sending a chat message
      termsJson = await sendChatMessage(maleString,combinedString);

      console.log(termsJson.outerwear);
      // You should send a response back, for example:
      res.status(200).json({ message: 'Data received successfully', receivedData: data });

    } catch (error) {
      console.error('Error processing image data:', error);
      res.status(500).json({ error: 'Failed to process image data' });
    }
  } else {
    res.status(400).json({ error: 'No image URL provided' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


