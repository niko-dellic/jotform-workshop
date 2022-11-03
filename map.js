document.addEventListener("contextmenu", (event) => event.preventDefault()); //disable right click for map

//JF.login(success, error) method takes two optional arguments
//Both arguments should be function
//First argument will be called after successful login
//Second argument will be called if authorization fails

const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
};

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
    const currentLocationLayer = new deck.IconLayer({
      id: "current-location",
      data: [
        {
          position: [position.coords.longitude, position.coords.latitude],
        },
      ],
      getPosition: (d) => d.position,
      //
      iconAtlas:
        "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
      iconMapping: ICON_MAPPING,
      getIcon: (d) => "marker",
      sizeScale: 15,
      getSize: (d) => 5,
      getColor: [255, 255, 255],
      pickable: true,
    });

    deckgl.setProps({
      layers: [...deckgl.props.layers, currentLocationLayer],
    });

    return [position.coords.latitude, position.coords.longitude];
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

  const newLocation = getCurrentLocation();
  // console.log(newLocation);

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
