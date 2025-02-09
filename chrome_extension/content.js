chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start") {
        startSelection();
    } else if (message.action === "stop") {
        stopCapture();
    }
});

let captureInterval;
let rect;
let videoStream;

function startSelection() {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.border = '2px dashed red';
    div.style.zIndex = '10000';
    div.style.pointerEvents = 'none';

    document.body.appendChild(div);

    let startX, startY, endX, endY;

    function onMouseMove(e) {
        if (!startX || !startY) return;
        endX = e.pageX;
        endY = e.pageY;
        div.style.left = Math.min(startX, endX) + 'px';
        div.style.top = Math.min(startY, endY) + 'px';
        div.style.width = Math.abs(endX - startX) + 'px';
        div.style.height = Math.abs(endY - startY) + 'px';
    }

    function onMouseDown(e) {
        startX = e.pageX;
        startY = e.pageY;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        rect = {
            left: Math.min(startX, endX),
            top: Math.min(startY, endY),
            width: Math.abs(endX - startX),
            height: Math.abs(endY - startY)
        };
        document.body.removeChild(div);
        startVideoCapture();
    }

    document.addEventListener('mousedown', onMouseDown, { once: true });
}

function startVideoCapture() {
    navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
        videoStream = stream;
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = rect.width;
        canvas.height = rect.height;

        captureInterval = setInterval(() => {
            ctx.drawImage(video, rect.left, rect.top, rect.width, rect.height, 0, 0, rect.width, rect.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            fetch("http://127.0.0.1:5000/upload", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ image: dataUrl })
            })
            .then(response => response.json())
            .then(data => {
                console.log("Image processed: ", data);
            })
            .catch(error => {
                console.error("Error processing image: ", error);
            });
        }, 1000); // Capture every second
    }).catch((err) => {
        console.error("Error accessing display media: ", err);
    });
}

function stopCapture() {
    clearInterval(captureInterval);
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
}
