from flask import Flask, render_template, request, jsonify
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
from dotenv import load_dotenv
import requests

from core import (
    check_username, 
    generate_smart_variations, 
    PLATFORMS, 
    check_domain, 
    TLDS_TO_CHECK,
    calculate_quality_score,
    VIBE_WORDS
)

# --- Initialization ---
load_dotenv()
app = Flask(__name__)

# Define the Hugging Face model we want to use
HUGGINGFACE_MODEL_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/platforms')
def api_platforms():
    return jsonify(list(PLATFORMS.keys()))

@app.route('/api/vibes')
def api_vibes():
    return jsonify(list(VIBE_WORDS.keys()))

@app.route('/api/check_domains', methods=['POST'])
def api_check_domains():
    data = request.json
    keyword = data.get('keyword')
    if not keyword: return jsonify({"error": "Keyword is required"}), 400
    domains_to_check = [f"{keyword}{tld}" for tld in TLDS_TO_CHECK]
    results = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_domain = {executor.submit(check_domain, domain): domain for domain in domains_to_check}
        for future in as_completed(future_to_domain):
            results[future_to_domain[future]] = bool(future.result())
    return jsonify(results)

@app.route('/api/check', methods=['POST'])
def api_check():
    try:
        data = request.json
        mode = data.get('mode')
        max_workers = 20

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            if mode == 'matrix':
                username = data.get('username')
                if not username: return jsonify({"error": "Username is required"}), 400
                future_to_platform = {executor.submit(check_username, username, info): name for name, info in PLATFORMS.items()}
                results = {future_to_platform[future]: bool(future.result()) for future in as_completed(future_to_platform)}
                return jsonify(results)

            platform_names = data.get('platforms', [])
            if not platform_names: return jsonify({"error": "Platforms are required"}), 400

            if mode == 'smart':
                keyword = data.get('keyword')
                max_len = int(data.get('maxLength', 15))
                vibe = data.get('vibe', 'default')
                if not keyword: return jsonify({"error": "Keyword is required"}), 400
                usernames_to_check = set(generate_smart_variations(keyword, max_len, vibe))
            else:
                return jsonify({"error": "Invalid mode"}), 400

            future_to_result = {executor.submit(check_username, user, PLATFORMS[p_name]): (p_name, user) for p_name in platform_names if p_name in PLATFORMS for user in usernames_to_check}
            
            results = []
            for future in as_completed(future_to_result):
                username_result = future.result()
                if username_result:
                    platform_name, username = future_to_result[future]
                    quality_score = calculate_quality_score(username)
                    results.append({"platform": platform_name, "username": username, "quality": quality_score})
            
            return jsonify(results)

    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid input data: {e}"}), 400
    except Exception as e:
        app.logger.error(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

@app.route('/api/chat', methods=['POST'])
def api_chat():
    api_key = os.getenv("HUGGINGFACE_API_KEY")
    if not api_key or 'PUT_YOUR_API_KEY_HERE' in api_key:
        return jsonify({"reply": "The Hugging Face API key is not configured. Please set it in the .env file."}), 500

    data = request.json
    message = data.get('message', '')
    if not message:
        return jsonify({"reply": "I can't respond to an empty message!"})

    headers = {"Authorization": f"Bearer {api_key}"}
    prompt = f"You are Najm, a helpful and friendly AI assistant for a username finder website. Your goal is to help users find cool usernames. Keep your answers short and helpful. User's message: '{message}'"
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 100, # Limit response length
            "return_full_text": False # Return only the generated response
        }
    }

    try:
        response = requests.post(HUGGINGFACE_MODEL_URL, headers=headers, json=payload, timeout=20)
        response.raise_for_status() # Raise an exception for bad status codes
        result = response.json()
        
        # Extract the generated text, handling potential variations in the response structure
        reply = result[0].get('generated_text', "Sorry, I couldn't generate a proper response.").strip()
        
        return jsonify({"reply": reply})
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Hugging Face API error: {e}")
        # Check for specific error messages from the API if available
        error_details = e.response.json() if e.response else {}
        if "is currently loading" in error_details.get("error", ""):
            return jsonify({"reply": "I'm just warming up! Please try again in a moment."}), 503
        return jsonify({"reply": "Sorry, I'm having trouble connecting to the AI service. Please try again later."}), 500
    except Exception as e:
        app.logger.error(f"An unexpected error in chat API: {e}")
        return jsonify({"reply": "Sorry, an unexpected error occurred."}), 500

if __name__ == '__main__':
    app.run(debug=True)
