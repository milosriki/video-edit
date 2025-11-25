from google.cloud import videointelligence
from google.cloud import speech
from typing import List, Dict, Any, Optional
import os

class VideoIntelligenceService:
    def __init__(self):
        self.video_client = videointelligence.VideoIntelligenceServiceClient()
        self.speech_client = speech.SpeechClient()

    def analyze_faces(self, video_uri: str) -> List[Dict[str, Any]]:
        """
        Detects faces and emotions in a video.
        """
        print(f"🕵️ VIDEO INTEL: Detecting faces in {video_uri}")
        
        features = [videointelligence.Feature.FACE_DETECTION]
        
        # Face Detection Config (include bounding boxes and attributes)
        face_config = videointelligence.FaceDetectionConfig(
            include_bounding_boxes=True,
            include_attributes=True
        )
        
        context = videointelligence.VideoContext(face_detection_config=face_config)

        try:
            operation = self.video_client.annotate_video(
                request={
                    "features": features,
                    "input_uri": video_uri,
                    "video_context": context,
                }
            )
            
            print("⏳ VIDEO INTEL: Waiting for operation to complete...")
            result = operation.result(timeout=300) # 5 minute timeout
            
            faces_data = []
            
            # Process results
            annotation_result = result.annotation_results[0]
            for face_annotation in annotation_result.face_detection_annotations:
                for track in face_annotation.tracks:
                    # Get the segment timestamp
                    start_time = track.segment.start_time_offset.seconds + track.segment.start_time_offset.microseconds / 1e6
                    end_time = track.segment.end_time_offset.seconds + track.segment.end_time_offset.microseconds / 1e6
                    
                    # Get attributes (emotions, glasses, etc.)
                    attributes = []
                    for attr in track.attributes:
                        attributes.append({
                            "name": attr.name,
                            "confidence": attr.confidence,
                            "value": attr.value
                        })

                    faces_data.append({
                        "start_time": start_time,
                        "end_time": end_time,
                        "attributes": attributes,
                        "confidence": track.confidence
                    })
            
            print(f"✅ VIDEO INTEL: Found {len(faces_data)} face segments.")
            return faces_data

        except Exception as e:
            print(f"❌ VIDEO INTEL Error: {e}")
            return []

    def transcribe_video(self, video_uri: str, language_code: str = "en-US") -> List[Dict[str, Any]]:
        """
        Transcribes video audio using Google Cloud Speech-to-Text.
        Note: For video files on GCS, we usually need to extract audio or use the LongRunningRecognize on the video file if supported container.
        For robust video transcription, Video Intelligence API also has SPEECH_TRANSCRIPTION feature.
        """
        print(f"🗣️ VIDEO INTEL: Transcribing {video_uri}")
        
        features = [videointelligence.Feature.SPEECH_TRANSCRIPTION]
        
        config = videointelligence.SpeechTranscriptionConfig(
            language_code=language_code,
            enable_automatic_punctuation=True
        )
        
        context = videointelligence.VideoContext(speech_transcription_config=config)

        try:
            operation = self.video_client.annotate_video(
                request={
                    "features": features,
                    "input_uri": video_uri,
                    "video_context": context,
                }
            )
            
            print("⏳ VIDEO INTEL: Waiting for transcription...")
            result = operation.result(timeout=300)
            
            transcripts = []
            annotation_result = result.annotation_results[0]
            
            for speech_transcription in annotation_result.speech_transcriptions:
                # The First alternative is the most likely one
                alt = speech_transcription.alternatives[0]
                
                transcripts.append({
                    "transcript": alt.transcript,
                    "confidence": alt.confidence,
                    "words": [{
                        "word": word.word,
                        "start_time": word.start_time.seconds + word.start_time.microseconds / 1e6,
                        "end_time": word.end_time.seconds + word.end_time.microseconds / 1e6
                    } for word in alt.words]
                })
                
            print(f"✅ VIDEO INTEL: Transcription complete.")
            return transcripts

        except Exception as e:
            print(f"❌ VIDEO INTEL Transcription Error: {e}")
            return []

    def detect_labels(self, video_uri: str) -> List[Dict[str, Any]]:
        """
        Detects objects, locations, and activities.
        """
        print(f"🏷️ VIDEO INTEL: Labeling {video_uri}")
        
        features = [videointelligence.Feature.LABEL_DETECTION]
        
        try:
            operation = self.video_client.annotate_video(
                request={
                    "features": features,
                    "input_uri": video_uri,
                }
            )
            
            result = operation.result(timeout=300)
            labels_data = []
            
            annotation_result = result.annotation_results[0]
            for label in annotation_result.segment_label_annotations:
                for segment in label.segments:
                    start_time = segment.segment.start_time_offset.seconds + segment.segment.start_time_offset.microseconds / 1e6
                    end_time = segment.segment.end_time_offset.seconds + segment.segment.end_time_offset.microseconds / 1e6
                    
                    labels_data.append({
                        "entity": label.entity.description,
                        "category": label.category_entities[0].description if label.category_entities else "General",
                        "start_time": start_time,
                        "end_time": end_time,
                        "confidence": segment.confidence
                    })
            
            return labels_data
            
        except Exception as e:
            print(f"❌ VIDEO INTEL Label Error: {e}")
            return []
