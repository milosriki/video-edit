# Trained Models Directory

This directory is for storing trained machine learning models.

## Expected Files

- `deepfm_v2_trained.pth` - DeepFM model weights for CTR/ROAS prediction

## Usage

Place trained model files here. The DeepCTR engine will automatically load them.

If models are not found, the engine will fall back to Gemini Zero-Shot prediction.
