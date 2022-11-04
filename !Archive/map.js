document.addEventListener("contextmenu", (event) => event.preventDefault()); //disable right click for map

// icon for current location
const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
};

// api key to access JotForm
JF.initialize({ apiKey: "336b42c904dd34391b7e1c055286588b" });
var apiKey = JF.getAPIKey();

// get form submissions from JotForm Format: (formID, callback)
JF.getFormSubmissions("223046917466057", function (response) {
  // array to store all the responses
  const responses = [];

  // for each response
  for (var i = 0; i < response.length; i++) {
    // create an object to store the responses and structure as a json
    const answerObject = {};

    // get coordinates from the response, correctly format them
    const stringCoords = response[i].answers[3].answer;
    const coordinates = stringCoords
      .split(",")
      .map((X) => parseFloat(X))
      .reverse();

    // add coordinates and images to the answer object
    answerObject["coordinates"] = coordinates;
    answerObject["images"] = response[i].answers[4].answer;
    responses.push(answerObject);
  }

  function getImageGallery(images, preview = false) {
    if (!images && preview) {
      // return you are here text
      return `<p id="current-location-text">You are here</p>`;
    }

    const imageGallery = document.createElement("div");
    imageGallery.id = !preview ? "image-gallery" : "";

    for (var i = 0; i < images.length; i++) {
      const image = document.createElement("img");
      image.src = images[i];

      if (!preview || i === 0) {
        imageGallery.appendChild(image);
      }
    }

    // for closing the image gallery (only for click)
    if (!preview) {
      imageGallery.addEventListener("click", function () {
        imageGallery.remove();
      });
      // append the image gallery to the body
      document.body.appendChild(imageGallery);
    } else {
      return imageGallery.outerHTML;
    }
  }

  // get current location
  const successCallback = (position) => {
    // add new point layer of current location to deck gl
    const layer = new deck.IconLayer({
      id: "location",
      data: [
        {
          position: [position.coords.longitude, position.coords.latitude],
        },
      ],
      pickable: true,
      iconAtlas:
        "https://img.icons8.com/emoji/48/000000/round-pushpin-emoji.png",
      iconMapping: ICON_MAPPING,
      getIcon: (d) => "marker",
      sizeScale: 15,
      getPosition: (d) => d.position,
      getSize: 10,
      getColor: [255, 255, 255],
    });

    deckgl.setProps({
      layers: [...deckgl.props.layers, layer],
    });
  };

  const errorCallback = (error) => {
    console.log(error);
  };

  // create async function to await for current location and then return the promise as lat long coordinates then resolve the promise
  function getCurrentLocation() {
    const currentLocation = navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback
    );
    return currentLocation;
  }
  if (navigator.geolocation) {
    getCurrentLocation();
  }

  const locationButton = document.createElement("button");
  // create a button that will request the users location
  locationButton.textContent = "Show my location";
  locationButton.id = "location-button";
  locationButton.addEventListener("click", () => {
    // when clicked, get the users location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        // create a deck gl layer for the users location
        const layer = new deck.IconLayer({
          id: "location",
          data: [{ longitude, latitude }],
          pickable: true,
          iconAtlas:
            "https://img.icons8.com/emoji/48/000000/round-pushpin-emoji.png",
          iconMapping: ICON_MAPPING,
          getIcon: (d) => "marker",
          sizeScale: 15,
          getPosition: (d) => [d.longitude, d.latitude],
          getSize: 10,
          getColor: [255, 255, 255],
        });
        const keepLayers = deckgl.props.layers[0];

        deckgl.setProps({
          layers: [keepLayers, layer],
        });

        flyToClick([longitude, latitude]);
      });
    }
  });
  // append the button
  document.body.appendChild(locationButton);

  const deckgl = new deck.DeckGL({
    container: "map",
    // Set your Mapbox access token here
    mapboxApiAccessToken:
      "pk.eyJ1Ijoibmlrby1kZWxsaWMiLCJhIjoiY2w5c3p5bGx1MDh2eTNvcnVhdG0wYWxkMCJ9.4uQZqVYvQ51iZ64yG8oong",
    // Set your Mapbox style here
    mapStyle: "mapbox://styles/niko-dellic/cl9t226as000x14pr1hgle9az",
    initialViewState: {
      latitude: 42.36476,
      longitude: -71.10326,
      zoom: 12,
      bearing: 0,
      pitch: 0,
    },
    touchRotate: true,
    controller: true,

    layers: [
      new deck.ScatterplotLayer({
        id: "form-submissions", // layer id
        data: responses, // data formatted as array of objects
        getPosition: (d) => {
          return d.coordinates;
        },
        // Styles
        radiusUnits: "pixels",
        getRadius: 10,
        opacity: 0.7,
        stroked: false,
        filled: true,
        radiusScale: 3,
        getFillColor: [255, 0, 0],
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 255],
        parameters: {
          depthTest: false,
        },

        onClick: (info) => {
          getImageGallery(info.object.images);
          flyToClick(info.object.coordinates);
        },
      }),
    ],
    getTooltip: ({ object }) => {
      if (object) {
        return (
          object && {
            html: getImageGallery(object.images, (preview = true)),
            style: {
              width: "fit-content",
              backgroundColor: "transparent",
              overflow: "hidden",
            },
          }
        );
      }
    },
  });

  function flyToClick(coords) {
    deckgl.setProps({
      initialViewState: {
        longitude: coords[0],
        latitude: coords[1],
        zoom: 17,
        bearing: 20,
        pitch: 20,
        transitionDuration: 750,
        transitionInterpolator: new deck.FlyToInterpolator(),
      },
    });
  }
});
