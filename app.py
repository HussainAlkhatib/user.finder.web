from flask import Flask, render_template, request, jsonify
import requests
import random
import string
from concurrent.futures import ThreadPoolExecutor, as_completed

app = Flask(__name__)

# =================================================================================
#  CORE CHECKING LOGIC
# =================================================================================

PLATFORMS = {
    "TikTok": {"name": "TikTok", "url_template": "https://www.tiktok.com/@{}"},
    "Instagram": {"name": "Instagram", "url_template": "https://www.instagram.com/{}/"},
    "GitHub": {"name": "GitHub", "url_template": "https://www.github.com/{}"},
    "Twitch": {"name": "Twitch", "url_template": "https://www.twitch.tv/{}"},
    "Reddit": {"name": "Reddit", "url_template": "https://www.reddit.com/user/{}"},
    "Pinterest": {"name": "Pinterest", "url_template": "https://www.pinterest.com/{}/"},
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def check_username(username, platform_info):
    url = platform_info["url_template"].format(username)
    try:
        response = requests.get(url, headers=HEADERS, timeout=3)
        if response.status_code == 404:
            return username
    except requests.exceptions.RequestException:
        pass
    return None

def generate_smart_variations(keyword, max_length):
    variations = {keyword}
    leetspeak = {'a': '4', 'e': '3', 'o': '0', 'l': '1', 's': '5', 't': '7'}
    leet_word = ''.join([leetspeak.get(char.lower(), char) for char in keyword])
    if leet_word != keyword: variations.add(leet_word)
    suffixes = ['_tv', '_gg', '_pro', 'x', 'yt', 'dev', 'xd', 'gaming']
    prefixes = ['pro_', 'im', 'the_', 'real_', 'its']
    for s in suffixes: variations.add(f"{keyword}{s}")
    for p in prefixes: variations.add(f"{p}{keyword}")
    variations.add(keyword + keyword[-1])
    for _ in range(50): variations.add(f"{keyword}{random.randint(1,999)}")
    return [v for v in variations if len(v) <= max_length]

# =================================================================================
#  FLASK API ENDPOINTS
# =================================================================================

@app.route('/')
def index():
    return render_template('index.html')

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

            platform_name = data.get('platform')
            if not platform_name or platform_name not in PLATFORMS: 
                return jsonify({"error": "Invalid platform"}), 400
            platform_info = PLATFORMS[platform_name]

            if mode == 'random':
                length = int(data.get('length', 5))
                count = int(data.get('count', 10))
                usernames_to_check = {''.join(random.choices(string.ascii_lowercase + string.digits, k=length)) for _ in range(count * 20)}
            
            elif mode == 'smart':
                keyword = data.get('keyword')
                max_len = int(data.get('maxLength', 15))
                if not keyword: return jsonify({"error": "Keyword is required"}), 400
                usernames_to_check = generate_smart_variations(keyword, max_len)
            
            else:
                return jsonify({"error": "Invalid mode"}), 400

            future_to_user = {executor.submit(check_username, user, platform_info): user for user in usernames_to_check}
            results = [future.result() for future in as_completed(future_to_user) if future.result()]
            return jsonify(results)

    except (ValueError, TypeError) as e:
        # This will catch errors if the frontend sends non-integer values for number fields.
        return jsonify({"error": f"Invalid input data: {e}"}), 400
    except Exception as e:
        # Generic catch-all for any other unexpected server errors.
        app.logger.error(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

if __name__ == '__main__':
    app.run(debug=True)