import requests
import random
import re

# Added more platforms and specific error messages to look for in page content
PLATFORMS = {
    "TikTok": {
        "url_template": "https://www.tiktok.com/@{}",
        "error_text": "Couldn't find this account"
    },
    "Instagram": {
        "url_template": "https://www.instagram.com/{}/",
        "error_text": "Sorry, this page isn't available."
    },
    "GitHub": {
        "url_template": "https://www.github.com/{}",
        "error_text": "Not Found" # GitHub sends a clear 404 page with "Not Found" in the title
    },
    "Twitter": {
        "url_template": "https://twitter.com/{}",
        "error_text": "This account doesn’t exist"
    },
    "Twitch": {
        "url_template": "https://www.twitch.tv/{}",
        "error_text": "Sorry. Unless you've got a time machine, that content is unavailable."
    },
    "Reddit": {
        "url_template": "https://www.reddit.com/user/{}/",
        "error_text": "Sorry, nobody on Reddit goes by that name."
    },
    "Pinterest": {
        "url_template": "https://www.pinterest.com/{}/",
        "error_text": "Hmm, we can't find that page." # Pinterest has a generic not found page
    },
    "Snapchat": {
        "url_template": "https://www.snapchat.com/add/{}",
        "error_text": "Hmm, we can't find that page." # Snapchat is tricky, but a 404 is a good indicator
    }
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
}

def check_username(username, platform_info):
    """
    Checks a single username on a single platform with improved logic.
    It checks for 404 status, but also for specific error text in the page content.
    """
    # Basic validation for username
    if not re.match("^[a-zA-Z0-9_.-]{3,30}$", username):
        return None

    url = platform_info["url_template"].format(username)
    try:
        response = requests.get(url, headers=HEADERS, timeout=5)
        
        # Ideal case: Platform returns a 404 status for non-existent users.
        if response.status_code == 404:
            return username
            
        # Secondary check: If status is 200, check the page content for "not found" messages.
        # This handles platforms that return 200 OK but show an error message on the page.
        if response.status_code == 200 and platform_info.get("error_text") in response.text:
            return username
            
    except requests.exceptions.RequestException:
        # This will catch timeouts, connection errors, etc. Treat as "taken" to be safe.
        pass
        
    # If neither of the above conditions are met, assume the username is taken.
    return None

def generate_smart_variations(keyword, max_length):
    """
    Generates a more extensive and creative set of smart variations.
    """
    if not keyword: return []
    
    variations = {keyword}
    leetspeak = {'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7'}
    
    # 1. Basic keyword variations
    variations.add(keyword.lower())
    variations.add(keyword.upper())
    variations.add(keyword.capitalize())

    # 2. Leetspeak
    leet_word = ''.join([leetspeak.get(char.lower(), char) for char in keyword])
    if leet_word != keyword:
        variations.add(leet_word)

    # 3. Prefixes and Suffixes (expanded list)
    suffixes = ['_tv', '_gg', 'pro', 'x', 'yt', 'dev', 'xd', 'gaming', 'live', 'official', 'real']
    prefixes = ['pro_', 'im', 'the_', 'real_', 'its', 'just', 'get']
    for s in suffixes: variations.add(f"{keyword}{s}")
    for p in prefixes: variations.add(f"{p}{keyword}")
    
    # 4. Repetitive last letter
    if keyword:
        variations.add(keyword + keyword[-1])
        variations.add(keyword + keyword[-1] * 2)

    # 5. Number sequences
    for i in range(10):
        variations.add(f"{keyword}{i}")
    for num in [123, 321, 10, 100, 101, 7, 8, 9]:
         variations.add(f"{keyword}{num}")

    # 6. Underscore/Dot variations
    if len(keyword) > 4:
        variations.add(keyword[0] + '_' + keyword[1:])
        variations.add(keyword[:-1] + '_' + keyword[-1])
        variations.add(keyword.replace('a', 'a_') if 'a' in keyword else '') # example of creative replacement

    # 7. Random numbers (more of them)
    for _ in range(100): 
        variations.add(f"{keyword}{random.randint(1, 9999)}")

    # Final filtering for length and removing empty strings
    return [v for v in variations if v and len(v) <= max_length]
