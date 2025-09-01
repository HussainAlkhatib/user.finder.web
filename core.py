import requests
import random

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
    """Checks a single username on a single platform."""
    url = platform_info["url_template"].format(username)
    try:
        # Using a slightly longer timeout to be safe
        response = requests.get(url, headers=HEADERS, timeout=4)
        if response.status_code == 404:
            return username
    except requests.exceptions.RequestException:
        # This will catch timeouts, connection errors, etc.
        pass
    return None

def generate_smart_variations(keyword, max_length):
    """Generates a set of smart variations for a given keyword."""
    variations = {keyword}
    leetspeak = {'a': '4', 'e': '3', 'o': '0', 'l': '1', 's': '5', 't': '7'}
    leet_word = ''.join([leetspeak.get(char.lower(), char) for char in keyword])
    if leet_word != keyword: variations.add(leet_word)
    
    suffixes = ['_tv', '_gg', '_pro', 'x', 'yt', 'dev', 'xd', 'gaming']
    prefixes = ['pro_', 'im', 'the_', 'real_', 'its']
    for s in suffixes: variations.add(f"{keyword}{s}")
    for p in prefixes: variations.add(f"{p}{keyword}")
    variations.add(keyword + keyword[-1]) # Double last letter
    for _ in range(50): variations.add(f"{keyword}{random.randint(1,999)}")
    return [v for v in variations if len(v) <= max_length]