from flask import Flask, render_template, request, jsonify
from concurrent.futures import ThreadPoolExecutor, as_completed

# Import shared logic from the new core module
from core import check_username, generate_smart_variations, PLATFORMS

app = Flask(__name__)

# =================================================================================
#  FLASK API ENDPOINTS
# =================================================================================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/platforms')
def api_platforms():
    # New endpoint to provide the list of supported platforms to the frontend
    return jsonify(list(PLATFORMS.keys()))

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
                import random, string # Keep local imports if only used here
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