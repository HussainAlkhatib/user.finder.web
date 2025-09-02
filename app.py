from flask import Flask, render_template, request, jsonify
from concurrent.futures import ThreadPoolExecutor, as_completed

from core import (
    check_username, 
    generate_smart_variations, 
    PLATFORMS, 
    check_domain, 
    TLDS_TO_CHECK,
    calculate_quality_score,
    VIBE_WORDS
)

app = Flask(__name__)

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
                vibe = data.get('vibe', 'default') # Get the vibe, default to none
                if not keyword: return jsonify({"error": "Keyword is required"}), 400
                usernames_to_check = set(generate_smart_variations(keyword, max_len, vibe))
            elif mode == 'random':
                length = int(data.get('length', 5))
                count = int(data.get('count', 10))
                import random, string
                usernames_to_check = {''.join(random.choices(string.ascii_lowercase + string.digits, k=length)) for _ in range(count * 20)}
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
    data = request.json
    message = data.get('message', '').lower()

    # Simple rule-based responses
    if 'suggest' in message or 'username' in message or 'name' in message:
        reply = "I can help with that! Try using the 'Smart Search' mode. Just enter a keyword and I can generate some ideas for you."
    elif 'hello' in message or 'hi' in message:
        reply = "Hello! How can I assist you in finding the perfect username today?"
    elif 'domain' in message:
        reply = "Looking for a domain? Switch to the 'Domain Search' mode to check for available domains based on your keyword."
    else:
        reply = "I can help you find available usernames and domains. Try asking me for suggestions or use one of the search modes!"
    
    return jsonify({"reply": reply})

if __name__ == '__main__':
    app.run(debug=True)
