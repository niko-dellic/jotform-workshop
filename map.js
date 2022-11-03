document.addEventListener("contextmenu", (event) => event.preventDefault()); //disable right click for map

//JF.login(success, error) method takes two optional arguments
//Both arguments should be function
//First argument will be called after successful login
//Second argument will be called if authorization fails

JF.initialize({ apiKey: "336b42c904dd34391b7e1c055286588b" });
var apiKey = JF.getAPIKey();

JF.getFormSubmissions("223046917466057", function (response) {
  const responses = [];
  for (var i = 0; i < response.length; i++) {
    const answerObject = {};

    const stringCoords = response[i].answers[3].answer;
    const coordinates = stringCoords
      .split(",")
      .map((X) => parseFloat(X))
      .reverse();

    answerObject["coordinates"] = coordinates;
    answerObject["images"] = response[i].answers[4].answer;
    responses.push(answerObject);
  }

  function getImageGallery(images, preview = false) {
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
    return [position.coords.latitude, position.coords.longitude];
  };

  const errorCallback = (error) => {
    console.log(error);
  };

  const currentLocation = navigator.geolocation.getCurrentPosition(
    successCallback,
    errorCallback
  );

  console.log(currentLocation);

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
        opacity: 0.7,
        stroked: false,
        filled: true,
        radiusScale: 20,
        radiusMinPixels: 10,
        radiusMaxPixels: 50,
        lineWidthMinPixels: 1,
        getFillColor: [255, 0, 0],
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 255],

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
