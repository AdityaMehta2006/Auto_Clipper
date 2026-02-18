import google.generativeai as genai
from config import GEMINI_API_KEY
import os

# Manual fallback if config load fails
if not GEMINI_API_KEY:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("ERROR: No API Key found.")
    exit(1)

genai.configure(api_key=GEMINI_API_KEY)

print("Available Models:")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")
