from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from ytmusicapi import YTMusic
import cv2
import numpy as np
from deepface import DeepFace
from collections import deque
import requests
import re
import asyncio
from typing import Optional

ytmusic = YTMusic()

app = FastAPI(title="MoodSync AI Backend")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmotionResponse(BaseModel):
    happy: float
    sad: float
    angry: float
    excited: float
    relaxed: float
    surprised: float
    neutral: float
    stressed: float
    dominant_emotion: str

@app.get("/")
def read_root():
    return {"status": "MoodSync API is running."}

import cv2
import numpy as np
from deepface import DeepFace
from collections import deque

# Global mood history for smoothing (prototype approach)
mood_history = deque(maxlen=20)

def map_deepface_emotions(emotions_dict):
    """Map DeepFace default emotions to our expected fields."""
    return {
        "happy": emotions_dict.get("happy", 0.0) / 100.0,
        "sad": emotions_dict.get("sad", 0.0) / 100.0,
        "angry": emotions_dict.get("angry", 0.0) / 100.0,
        "excited": emotions_dict.get("surprise", 0.0) / 100.0, # mapping surprise to excited
        "relaxed": emotions_dict.get("neutral", 0.0) / 100.0, # mapping neutral to relaxed
        "surprised": emotions_dict.get("surprise", 0.0) / 100.0,
        "neutral": emotions_dict.get("neutral", 0.0) / 100.0,
        "stressed": emotions_dict.get("fear", 0.0) / 100.0, # mapping fear to stressed
    }

@app.post("/analyze-emotion", response_model=EmotionResponse)
async def analyze_emotion(file: UploadFile = File(...)):
    try:
        # Read image from upload
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Run DeepFace analysis
        # enforce_detection=False so it doesn't crash if no face is found
        result = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)
        
        if isinstance(result, list):
            result = result[0] # Take the first face detected
            
        raw_emotions = result['emotion']
        mapped_emotions = map_deepface_emotions(raw_emotions)
        
        dominant = max(mapped_emotions, key=mapped_emotions.get)
        
        # Mood Smoothing (Rolling History)
        mood_history.append(dominant)
        
        # Majority voting
        smoothed_dominant = max(set(mood_history), key=mood_history.count)
        
        return EmotionResponse(
            **mapped_emotions,
            dominant_emotion=smoothed_dominant
        )
    except Exception as e:
        print(f"Error in emotion detection: {e}")
        # Return fallback neutral if detection fails
        return EmotionResponse(
            happy=0.0, sad=0.0, angry=0.0, excited=0.0,
            relaxed=0.0, surprised=0.0, neutral=1.0, stressed=0.0,
            dominant_emotion="neutral"
        )

class MusicRecommendation(BaseModel):
    videoId: str
    title: str
    artist: str
    thumbnail: str

@app.get("/recommend-music/{mood}")
def recommend_music(mood: str):
    # Map mood to a search query for YouTube Music (focusing on vocal songs)
    query_map = {
        "happy": "upbeat pop vocal hits -instrumental",
        "sad": "sad emotional vocal pop songs -instrumental",
        "angry": "heavy metal hard rock vocal gym songs -instrumental",
        "relaxed": "chill R&B acoustic vocal songs -instrumental",
        "excited": "festival EDM high energy vocal songs -instrumental",
        "neutral": "popular top 40 vocal songs -instrumental",
        "stressed": "calming acoustic vocal songs -instrumental",
        "surprised": "epic pop anthems vocal -instrumental"
    }
    
    query = query_map.get(mood, "popular vocal hits")
    
    try:
        # Search YTMusic
        search_results = ytmusic.search(query, filter="songs", limit=25)
        recommendations = []
        
        for item in search_results:
            # Extract highest quality thumbnail
            thumbnail_url = ""
            if "thumbnails" in item and len(item["thumbnails"]) > 0:
                thumbnail_url = item["thumbnails"][-1]["url"]
                
            artist_name = "Unknown Artist"
            if "artists" in item and len(item["artists"]) > 0:
                artist_name = item["artists"][0]["name"]
                
            recommendations.append(MusicRecommendation(
                videoId=item["videoId"],
                title=item["title"],
                artist=artist_name,
                thumbnail=thumbnail_url
            ))
            
        return {"mood": mood, "recommendations": recommendations}
    except Exception as e:
        print(f"Error fetching music: {e}")
        return {"mood": mood, "recommendations": []}

@app.get("/lyrics/{video_id}")
def get_lyrics(video_id: str, track: str = Query(None), artist: str = Query(None)):
    try:
        # First try to get synced lyrics from LRCLIB if we have track and artist
        if track and artist:
            # Clean up track name (remove parenthetical text like "(Official Audio)")
            clean_track = re.sub(r'\([^)]*\)|\[[^\]]*\]', '', track).strip()
            # Clean up artist name
            clean_artist = artist.split(',')[0].strip()
            
            lrclib_url = f"https://lrclib.net/api/get?track_name={requests.utils.quote(clean_track)}&artist_name={requests.utils.quote(clean_artist)}"
            res = requests.get(lrclib_url, headers={'User-Agent': 'MoodSyncAI/1.0'})
            
            if res.status_code == 200:
                data = res.json()
                if data.get("syncedLyrics"):
                    return {"synced": True, "lyrics": data.get("syncedLyrics")}
                elif data.get("plainLyrics"):
                    return {"synced": False, "lyrics": data.get("plainLyrics")}
        
        # Fallback to YTMusic plain lyrics
        watch_playlist = ytmusic.get_watch_playlist(videoId=video_id)
        lyrics_id = watch_playlist.get("lyrics")
        if not lyrics_id:
            return {"synced": False, "lyrics": "No lyrics available for this track."}
        
        lyrics_dict = ytmusic.get_lyrics(lyrics_id)
        return {"synced": False, "lyrics": lyrics_dict.get("lyrics", "No lyrics available for this track.")}
    except Exception as e:
        print(f"Error fetching lyrics: {e}")
        return {"synced": False, "lyrics": "No lyrics available for this track."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
