import google.generativeai as genai
from config import GEMINI_API_KEY
import os

# Manual fallback
if not GEMINI_API_KEY:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    with open("models_utf8.txt", "w", encoding="utf-8") as f:
        f.write("ERROR: No API Key found.\n")
    exit(1)

genai.configure(api_key=GEMINI_API_KEY)

with open("models_utf8.txt", "w", encoding="utf-8") as f:
    try:
        f.write("Available Models:\n")
        count = 0
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                f.write(f"{m.name}\n")
                count += 1
        if count == 0:
            f.write("No models found with generateContent support.\n")
    except Exception as e:
        f.write(f"Error listing models: {e}\n")
