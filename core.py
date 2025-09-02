import requests
import random
import re
import whois

# --- DATA DEFINITIONS ---

PLATFORMS = {
    "TikTok": {"url_template": "https://www.tiktok.com/@{}", "error_text": "Couldn't find this account"},
    "Instagram": {"url_template": "https://www.instagram.com/{}/", "error_text": "Sorry, this page isn't available."},
    "GitHub": {"url_template": "https://www.github.com/{}", "error_text": "Not Found"},
    "Twitter": {"url_template": "https://twitter.com/{}", "error_text": "This account doesn’t exist"},
    "Twitch": {"url_template": "https://www.twitch.tv/{}", "error_text": "Sorry. Unless you've got a time machine, that content is unavailable."},
    "Reddit": {"url_template": "https://www.reddit.com/user/{}/", "error_text": "Sorry, nobody on Reddit goes by that name."},
    "Pinterest": {"url_template": "https://www.pinterest.com/{}/", "error_text": "Hmm, we can't find that page."},
    "Snapchat": {"url_template": "https://www.snapchat.com/add/{}", "error_text": "Hmm, we can't find that page."}
}

TLDS_TO_CHECK = ['.com', '.net', '.org', '.io', '.co', '.ai']

# --- VIBE-BASED WORD LISTS FOR CREATIVE ASSISTANT ---
VIBE_WORDS = {
    'gaming': {
        'prefixes': ['pro_', 'im', 'its', 'gg'],
        'suffixes': ['_gg', 'gaming', 'plays', 'tv', 'live', 'pro', 'xd'],
        'inserts': ['games', 'player', 'stream']
    },
    'tech': {
        'prefixes': ['dev_', 'tech', 'code'],
        'suffixes': ['_dev', 'tech', 'labs', 'bytes', 'codes', '.io', '.ai'],
        'inserts': ['data', 'cloud', 'logic']
    },
    'vintage': {
        'prefixes': ['the', 'retro', 'classic'],
        'suffixes': ['&co', 'works', 'supply', 'goods', 'type'],
        'inserts': ['and', 'old', 'ink']
    },
    'luxury': {
        'prefixes': ['luxe', 'elara', 'magnate'],
        'suffixes': ['_official', 'club', 'haus', 'inc', 'real'],
        'inserts': ['gold', 'velvet', 'diamond']
    }
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
}

# --- CHECKING FUNCTIONS ---

def check_username(username, platform_info):
    if not re.match("^[a-zA-Z0-9_.-]{3,30}$", username): return None
    url = platform_info["url_template"].format(username)
    try:
        response = requests.get(url, headers=HEADERS, timeout=5)
        if response.status_code == 404:
            return username
        if response.status_code == 200 and platform_info.get("error_text") in response.text:
            return username
    except requests.exceptions.Timeout:
        pass
    except requests.exceptions.RequestException:
        pass
    return None

def check_domain(domain):
    """
    Checks if a domain is available for registration using a WHOIS lookup.
    Returns the domain name if available, otherwise None.
    """
    try:
        w = whois.whois(domain)
        if not w.creation_date:
            return domain
    except whois.parser.PywhoisError:
        return domain
    except Exception:
        pass
    return None

# --- GENERATION & SCORING ---

def calculate_quality_score(username):
    score = 5.0
    if len(username) > 12: score -= 1.5
    elif len(username) > 8: score -= 0.5
    num_count = sum(c.isdigit() for c in username)
    if num_count > 2: score -= 1.5
    elif num_count > 0: score -= 0.5
    if '_' in username or '-' in username or '.' in username: score -= 0.5
    if username.islower() or username.isupper(): score += 0.5
    return max(1, min(5, round(score)))

def generate_smart_variations(keyword, max_length, vibe='default'):
    if not keyword: return []
    
    variations = {keyword}
    leetspeak = {'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7'}
    
    # --- Apply Vibe-Specific Words ---
    vibe_pack = VIBE_WORDS.get(vibe, {})
    prefixes = vibe_pack.get('prefixes', ['pro_', 'im', 'the_', 'real_', 'its'])
    suffixes = vibe_pack.get('suffixes', ['_tv', '_gg', 'pro', 'x', 'yt', 'dev'])
    inserts = vibe_pack.get('inserts', [])

    # --- Generation Logic ---
    # 1. Leetspeak
    leet_word = ''.join([leetspeak.get(char.lower(), char) for char in keyword])
    if leet_word != keyword: variations.add(leet_word)

    # 2. Prefixes & Suffixes
    for s in suffixes: variations.add(f"{keyword}{s}")
    for p in prefixes: variations.add(f"{p}{keyword}")
    
    # 3. Inserts (for vibe)
    for i in inserts: variations.add(f"{keyword}{i}{keyword}")

    # 4. Repetitive last letter
    if keyword: variations.add(keyword + keyword[-1])

    # 5. Number sequences
    for i in range(10): variations.add(f"{keyword}{i}")
    for num in [10, 100, 7, 8, 9]: variations.add(f"{keyword}{num}")

    # 6. Random numbers
    for _ in range(50): variations.add(f"{keyword}{random.randint(1, 999)}")

    return [v for v in variations if v and len(v) <= max_length]