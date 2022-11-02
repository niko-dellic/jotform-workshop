document.addEventListener("contextmenu", (event) => event.preventDefault()); //disable right click for map

//JF.login(success, error) method takes two optional arguments
//Both arguments should be function
//First argument will be called after successful login
//Second argument will be called if authorization fails

JF.initialize({ apiKey: "336b42c904dd34391b7e1c055286588b" });
var apiKey = JF.getAPIKey();

JF.getFormSubmissions("223046917466057", function (response) {
  /**
   successful response including submissions of form with given id
   .
   */
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
          const div = document.createElement("div");

          const imageElements = info.object.images.map((image) => {
            const imageElement = document.createElement("img");
            imageElement.src = image;
            return imageElement;
          });
          div.id = "popup";
          div.innerHTML = `${imageElements
            .map((d) => {
              return d.outerHTML;
            })
            .join(" ")}`;

          // add event listener to close modal
          div.addEventListener("click", () => {
            div.remove();
          });
          document.body.appendChild(div);

          flyToClick(info.object.coordinates);
        },
      }),
    ],
    getTooltip: ({ object }) => {
      if (object) {
        console.log(object);
        return (
          object && {
            html: `<img  src=${object.images[0]} />`,
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
