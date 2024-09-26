from flask import Flask, request, jsonify, redirect
from spotipy.oauth2 import SpotifyOAuth
import spotipy
from sklearn.neighbors import NearestNeighbors
import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image
import io
from flask_cors import CORS 
from tensorflow.keras.preprocessing import image
import pandas as pd
import cv2

app = Flask(__name__)
CORS(app)

df = pd.read_csv('./SongRecomandation/Dataset/278k_labelled_uri.csv')
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Spotify authentication credentials (Replace with your own)
SPOTIPY_CLIENT_ID = '1545847bab2d47cd81fe5d91f4a218d5'
SPOTIPY_CLIENT_SECRET = '09dc7214c60345afb4add114d7debd39'
SPOTIPY_REDIRECT_URI = 'http://localhost:5173/login'
SCOPE = 'streaming user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-email user-read-private '

sp_oauth = SpotifyOAuth(client_id=SPOTIPY_CLIENT_ID,
                        client_secret=SPOTIPY_CLIENT_SECRET,
                        redirect_uri=SPOTIPY_REDIRECT_URI,
                        scope=SCOPE)

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(client_id=SPOTIPY_CLIENT_ID,
                                               client_secret=SPOTIPY_CLIENT_SECRET,
                                               redirect_uri=SPOTIPY_REDIRECT_URI,
                                               scope=SCOPE))

# Load the KNN model for song recommendations
knn_model = NearestNeighbors(n_neighbors=7)
song_features = df[['danceability', 'energy', 'loudness', 'speechiness', 
                    'acousticness', 'instrumentalness', 'liveness', 
                    'valence', 'tempo', 'spec_rate']].values
knn_model.fit(song_features)
# Load the pre-trained emotion detection model
emotion_model = load_model('./EmotionDetection/Pre-trained-model/face_model.h5')
# Mapping from face recognition emotions to song moods
emotion_to_mood_map = {
    0: 2,  # Angry -> Energetic
    1: 0,  # Disgusted -> Sad
    2: 3,  # Fear -> Calm
    3: 1,  # Happy -> Happy
    4: 0,  # Sad -> Sad
    5: 2,  # Surprise -> Energetic
    6: 3   # Neutral -> Calm
}
# Mapping from mood labels to mood names
mood_label_to_name = {
    0: 'sad',
    1: 'happy',
    2: 'energetic',
    3: 'calm'
}
mood_name_to_label = {
    'sad': 0,
    'happy': 1,
    'energetic': 2,
    'calm': 3
}
# Predict mood from the face image
def predict_mood(image_bytes):
    # Convert image bytes to a numpy array
    img = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(img, cv2.IMREAD_COLOR)

    if img is None:
        return None  # Return None to signify an error

    # Convert to grayscale for face detection
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Detect faces in the image
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5, minSize=(30, 30))

    if len(faces) == 0:
        return None  # No face detected, return None

    # Process the first detected face
    x, y, w, h = faces[0]  # Using the first detected face
    face_roi = img[y:y + h, x:x + w]

    # Resize the face image to the required input size for the model (48x48)
    face_image = cv2.resize(face_roi, (48, 48))

    # Convert the face image to grayscale (since your model expects grayscale images)
    face_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)

    # Normalize and reshape the image
    face_image = np.expand_dims(face_image, axis=-1)  # Add channel dimension for grayscale
    face_image = np.expand_dims(face_image, axis=0)   # Add batch dimension

    # Predict emotion using the loaded model
    emotion_prediction = emotion_model.predict(face_image)
    emotion_label = np.argmax(emotion_prediction, axis=1)[0]

    # Map the emotion label to a song mood
    mood_label = emotion_to_mood_map.get(emotion_label)

    # Return the mood name instead of the label
    mood_name = mood_label_to_name.get(mood_label)

    return mood_name

# Get 5 random songs for a given mood
def get_songs_for_mood(mood_name):
    # Convert mood name to label
    mood_label = mood_name_to_label.get(mood_name)
    
    # Filter songs based on the mood label
    mood_songs = df[df['labels'] == mood_label]
    
    # Randomly select 5 songs
    selected_songs = mood_songs.sample(5)
    
    song_info = []

    for _, song in selected_songs.iterrows():
        # Use the Spotify API to fetch song details using the song URI
        song_uri = song['uri']
        song_id = song_uri.split(":")[-1]  # Extract the song ID from the URI
        
        # Fetch song details using spotipy
        try:
            song_data = sp.track(song_id)  # Get track details using spotipy
            # Extract relevant song info
            album_images = song_data['album']['images']  # List of images (small, medium, large)

            # Choose the largest image (highest resolution) or change the index to choose smaller sizes
            photo_url = album_images[0]['url'] if album_images else None

            # Append the song details along with the album photo URL
            song_info.append({
                'name': song_data['name'],
                'uri': song['uri'],
                'artists': ", ".join([artist['name'] for artist in song_data['artists']]),
                'album': song_data['album']['name'],
                'duration_ms': song_data['duration_ms'],
                'photo_url': photo_url  # Album cover URL
            })
        except Exception as e:
            print(f"Failed to fetch song details for URI: {song_uri}, error: {e}")

    return song_info


# Find 7 related songs using KNN
def get_related_songs(song_uri):
    song_row = df[df['uri'] == song_uri]
    if song_row.empty:
        return []
    
    song_features = song_row[['danceability', 'energy', 'loudness', 'speechiness', 
                              'acousticness', 'instrumentalness', 'liveness', 
                              'valence', 'tempo', 'spec_rate']].values
    distances, indices = knn_model.kneighbors(song_features)
    
    related_songs = []
    for idx in indices[0]:
        related_song = df.iloc[idx]
        related_songs.append(related_song['uri'])
    
    return related_songs

@app.route('/predict-mood', methods=['POST'])
def predict_mood_route():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file'].read()
    try:
        mood_name = predict_mood(file)
        if mood_name:
            return jsonify({'mood': mood_name}), 200
        else:
            return jsonify({'error': 'No face detected in the image.'}), 400
    except Exception as e:
        print(f"Error processing the image: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/get-songs', methods=['POST'])
def get_songs():
    mood = request.json.get('mood')
    songs = get_songs_for_mood(mood)
    return jsonify(songs)

@app.route('/play-songs', methods=['POST'])
def play_songs():
    song_uri = request.json.get('song_uri')
    related_songs = get_related_songs(song_uri)
    return jsonify(related_songs)



@app.route('/login')
def login():
    return redirect(sp_oauth.get_authorize_url())


@app.route('/callback')
def callback():
    code = request.args.get('code')
    token_info = sp_oauth.get_access_token(code, check_cache=False)
    return jsonify(token_info)


if __name__ == '__main__':
    app.run(debug=True)