from flask import Flask, render_template, request, jsonify
from concurrent.futures import ThreadPoolExecutor, as_completed

from core import check_username, generate_smart_variations, PLATFORMS

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/platforms')
def api_platforms():
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

            # Modified to accept a list of platforms
            platform_names = data.get('platforms') 
            if not isinstance(platform_names, list) or not platform_names:
                return jsonify({"error": "A list of platforms is required"}), 400

            if mode == 'random':
                length = int(data.get('length', 5))
                count = int(data.get('count', 10))
                import random, string
                usernames_to_check = {''.join(random.choices(string.ascii_lowercase + string.digits, k=length)) for _ in range(count * 20)}
            
            elif mode == 'smart':
                keyword = data.get('keyword')
                max_len = int(data.get('maxLength', 15))
                if not keyword: return jsonify({"error": "Keyword is required"}), 400
                usernames_to_check = generate_smart_variations(keyword, max_len)
            
            else:
                return jsonify({"error": "Invalid mode"}), 400

            # Submit tasks for each username on each selected platform
            future_to_result = {}
            for p_name in platform_names:
                if p_name in PLATFORMS:
                    platform_info = PLATFORMS[p_name]
                    for user in usernames_to_check:
                        future = executor.submit(check_username, user, platform_info)
                        future_to_result[future] = (p_name, user)

            # Collect results as they complete
            results = []
            for future in as_completed(future_to_result):
                res = future.result()
                if res:
                    platform_name, username = future_to_result[future]
                    results.append({"platform": platform_name, "username": username})
            
            return jsonify(results)

    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid input data: {e}"}), 400
    except Exception as e:
        app.logger.error(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred."}), 500

if __name__ == '__main__':
    app.run(debug=True)
