const iframe = document.getElementsByTagName("iframe");

window.onload = function () {
  for (let i = 0; i < iframe.length; i++) {
    counter = 0;

    if (iframe) {
      const footers =
        iframe[i].contentWindow.document.getElementsByClassName("branding21");
      for (let j = 0; j < footers.length; j++) {
        console.log(footers[j].style);
        footers[j].remove();
      }
    }
  }
};
