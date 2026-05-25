PRODUCTIVE = [
    "github.com",
    "stackoverflow.com",
    "docs.python.org",
    "leetcode.com",
    "chat.openai.com"
]

DISTRACTING = [
    "youtube.com",
    "instagram.com",
    "tiktok.com",
    "facebook.com",
    "netflix.com"
]


def classify_url(url: str):

    lower = url.lower()

    for site in PRODUCTIVE:
        if site in lower:
            return "productive", 5

    for site in DISTRACTING:
        if site in lower:
            return "distracting", -5

    return "neutral", 0