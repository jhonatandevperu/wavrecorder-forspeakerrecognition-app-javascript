"use strict";

const UrlInterface = window.URL || window.webkitURL;
const AudioContextInterface = window.AudioContext || window.webkitAudioContext;
let currentStream;
let recorderjs;

const recordButton = document.getElementById("recordButton");
const stopButton = document.getElementById("stopButton");
const pauseButton = document.getElementById("pauseButton");
const recordingsList = document.getElementById("recordingsList");

recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);

async function getMediaStreamFromUser() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
  } catch (error) {
    throw new Error("Error on getMediaStreamFromUser: ", error);
  }
}

function createAudioElement(srcUrl) {
  const audioElement = document.createElement("audio");
  audioElement.controls = true;
  audioElement.src = srcUrl;
  return audioElement;
}

function createDownloadElement(srcUrl, filename) {
  const downloadElement = document.createElement("a");
  downloadElement.href = srcUrl;
  downloadElement.download = filename;
  downloadElement.innerHTML = "Download";
  return downloadElement;
}

function createUploadElement(blob, filename) {
  const uploadElement = document.createElement("a");
  uploadElement.href = "#";
  uploadElement.innerHTML = "Upload";
  uploadElement.addEventListener("click", () => {
    const formData = new FormData();
    formData.append("audio_data", blob, filename);
    fetch("https://exampleapp.com/recordings", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        alert(`Success: ${data}`);
      })
      .catch((error) => {
        throw new Error("Error uploading the audio file: ", error);
      });
  });
  return uploadElement;
}

function createDownloadLink(blob) {
  const url = UrlInterface.createObjectURL(blob);
  const filename = `recording_${new Date().getTime()}`;
  const li = document.createElement("li");
  li.appendChild(createAudioElement(url));
  li.appendChild(document.createTextNode(`${filename}.wav`));
  li.appendChild(document.createTextNode(" "));
  li.appendChild(createDownloadElement(url, filename));
  li.appendChild(document.createTextNode(" "));
  li.appendChild(createUploadElement(blob, filename));
  recordingsList.appendChild(li);
}

function pauseRecording() {
  if (recorderjs.recording) {
    recorderjs.stop();
    pauseButton.innerHTML = "Resume";
  } else {
    recorderjs.record();
    pauseButton.innerHTML = "Pause";
  }
}

async function startRecording() {
  try {
    const stream = await getMediaStreamFromUser();
    const audioContext = new AudioContextInterface({
      latencyHint: "interactive",
      sampleRate: 16000,
    });
    const input = audioContext.createMediaStreamSource(stream);

    recordButton.disabled = true;
    stopButton.disabled = false;
    pauseButton.disabled = false;

    currentStream = stream;

    recorderjs = new Recorder(input, { numChannels: 1 });
    recorderjs.record();
  } catch (error) {
    recordButton.disabled = false;
    stopButton.disabled = true;
    pauseButton.disabled = true;
  }
}

function stopRecording() {
  stopButton.disabled = true;
  recordButton.disabled = false;
  pauseButton.disabled = true;
  pauseButton.innerHTML = "Pause";
  recorderjs.stop();
  currentStream.getAudioTracks()[0].stop();
  recorderjs.exportWAV(createDownloadLink);
}
