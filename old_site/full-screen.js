
  document.addEventListener('DOMContentLoaded', function () {
    var video = document.getElementById('myVideo');

    // Check if the browser supports the Fullscreen API
    if (video.requestFullscreen) {
      video.addEventListener('click', function () {
        video.requestFullscreen();
      });
    }
  });
