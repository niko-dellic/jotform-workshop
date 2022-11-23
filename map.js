document.addEventListener("contextmenu", (event) => event.preventDefault()); //disable right click for map

// api key to access JotForm
JF.initialize({ apiKey: "336b42c904dd34391b7e1c055286588b" });

// get form submissions from JotForm Format: (formID, callback)
JF.getFormSubmissions("223067547406053", function (responses) {
  // array to store all the submissions: we will use this to create the map
  const submissions = [];
  // for each responses
  for (var i = 0; i < responses.length; i++) {
    // create an object to store the submissions and structure as a json
    const submissionProps = {};

    // add all fields of responses.answers to our object
    const keys = Object.keys(responses[i].answers);
    keys.forEach((answer) => {
      const lookup = responses[i].answers[answer].cfname ? "cfname" : "name";
      submissionProps[responses[i].answers[answer][lookup]] =
        responses[i].answers[answer].answer;
    });

    // convert location coordinates string to float array
    submissionProps["Location Coordinates"] = submissionProps[
      "Location Coordinates"
    ]
      .split(/\r?\n/)
      .map((X) => parseFloat(X.replace(/[^\d.-]/g, "")));

    // add submission to submissions array
    submissions.push(submissionProps);
  }

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
        data: submissions, // data formatted as array of objects
        getPosition: (d) => {
          return d["Location Coordinates"];
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
          getImageGallery(
            info.object.fileUpload,
            info.object.describeWhat,
            (preview = false)
          );
          flyToClick(info.object["Location Coordinates"]);
        },
      }),
    ],
    getTooltip: ({ object }) => {
      if (object) {
        return (
          object && {
            html: `<div>YO what is up!</div>`,
          }
        );
        // return (
        //   object && {
        //     html: getImageGallery(
        //       object.fileUpload,
        //       object.describeWhat,
        //       (preview = true)
        //     ),
        //     style: {
        //       width: "fit-content",
        //       backgroundColor: "transparent",
        //       overflow: "hidden",
        //     },
        //   }
        // );
      }
    },
  });

  function getImageGallery(images, text, preview = false) {
    if (!images && preview) {
      // return you are here text
      return `<p id="current-location-text">You are here</p>`;
    }

    const imageGallery = document.createElement("div");
    imageGallery.id = !preview ? "image-gallery" : "";

    for (var i = 0; i < images.length; i++) {
      const image = document.createElement("img");
      image.src = images[i];

      // set max width to image
      image.style.maxWidth = preview ? "350px" : "";

      if (!preview || i === 0) {
        imageGallery.appendChild(image);
      }
    }

    // add text to image gallery
    const textDiv = document.createElement("div");
    textDiv.id = "image-gallery-text";
    textDiv.innerHTML = text;

    // add fixed styling if in modal view
    if (!preview) {
      textDiv.style.position = "fixed";
      textDiv.style.top = "0";
      textDiv.style.left = "0";
      textDiv.style.right = "0";
      textDiv.style.borderRadius = "0";
      textDiv.style.padding = "2rem";
    }
    imageGallery.appendChild(textDiv);

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
        "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
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

  const ICON_MAPPING = {
    marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
  };
  const locationButton = document.createElement("div");
  // create a button that will request the users location
  locationButton.textContent = "Where am I?";
  locationButton.id = "location-button";
  locationButton.addEventListener("click", () => {
    // when clicked, get the users location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;

        locationButton.textContent =
          "Where am I? " +
          position.coords.latitude.toFixed(3) +
          ", " +
          position.coords.longitude.toFixed(3);
        // create a deck gl layer for the users location
        const layer = new deck.IconLayer({
          id: "location",
          data: [{ longitude, latitude }],
          pickable: true,
          iconAtlas:
            "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png",
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

  // add a button to take you to the next page
  const nextButton = document.createElement("a");
  nextButton.textContent = "Submit a request";
  nextButton.id = "next-button";
  nextButton.href = "./form.html";

  // append the button
  document.body.appendChild(locationButton);
  document.body.appendChild(nextButton);
});
