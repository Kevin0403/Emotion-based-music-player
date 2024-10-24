import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Loader from "./Loader";

function MoodPrediction({ accessToken }) {
  const [image, setImage] = useState(null);
  const [mood, setMood] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const mediaStreamRef = useRef(null); // Ref to store media stream

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setImage(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleMoodPrediction = () => {
    if (!image) return alert("Please upload or capture an image!");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", image);

    axios
      .post("http://localhost:5000/predict-mood", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        setMood(response.data.mood);
        navigate("/song-selection", { state: { mood: response.data.mood } });
      })
      .catch((error) => {
        console.error(error);
        alert("Error in mood prediction. Please try again. " + error.response.data.error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const openCamera = () => {
    setIsCameraOpen(true);
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream; // Store the media stream
        videoRef.current.play();
      })
      .catch((err) => {
        console.error("Error accessing camera: ", err);
      });
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    mediaStreamRef.current.getTracks().forEach((track) => track.stop()); // Stop the camera stream
    const capturedImage = canvasRef.current.toDataURL("image/png");

    // Convert dataURL to a file object
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "captured-image.png", { type: "image/png" });
        setImage(file);
        setImagePreview(capturedImage);
        setIsCameraOpen(false); // Close the camera after capturing the image
      });
  };

  return (
    <div className="mt-[80px] flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        {loading && <Loader />}
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Upload or Capture Image to Predict Mood
        </h1>

        {/* File Upload */}
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full mb-4 text-sm text-gray-700 border border-gray-300 rounded-lg p-2"
        />

        {/* Image Preview */}
        {imagePreview && (
          <div className="w-full max-w-xs mb-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-auto border rounded-lg shadow-md"
            />
          </div>
        )}

        {/* Camera Capture */}
        {!isCameraOpen ? (
          <button
            onClick={openCamera}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-200 mb-4"
          >
            Capture Photo
          </button>
        ) : (
          <div className="mb-4">
            <video ref={videoRef} className="w-full h-auto border rounded-lg shadow-md"></video>
            <canvas ref={canvasRef} width="640" height="480" className="hidden"></canvas>
            <button
              onClick={capturePhoto}
              className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition duration-200 mt-2"
            >
              Take Photo
            </button>
          </div>
        )}

        {/* Predict Mood Button */}
        <button
          onClick={handleMoodPrediction}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
        >
          Predict Mood
        </button>

        {/* Display Predicted Mood */}
        {mood && (
          <p className="mt-4 text-center text-lg font-medium">
            Predicted Mood: <span className="font-bold">{mood}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default MoodPrediction;
