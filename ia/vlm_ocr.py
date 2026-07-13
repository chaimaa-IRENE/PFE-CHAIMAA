import os, base64, json, cv2, numpy as np
from io import BytesIO
from PIL import Image

try:
    import requests
    REQUESTS_AVAILABLE = True
except:
    REQUESTS_AVAILABLE = False


def _encode_image_cv2(img):
    """Encode OpenCV image to base64 JPEG."""
    success, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    if not success:
        return None
    return base64.b64encode(buf).decode('utf-8')


def _encode_image_pil(img):
    """Encode PIL image to base64 JPEG."""
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=85)
    return base64.b64encode(buf.getvalue()).decode('utf-8')


def vlm_read_plate_gpt4v(image, api_key=None, model="gpt-4o"):
    """Read license plate from image using GPT-4V."""
    api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
    if not api_key or not REQUESTS_AVAILABLE:
        return "", "no API key or requests"

    if isinstance(image, np.ndarray):
        b64 = _encode_image_cv2(image)
    elif isinstance(image, Image.Image):
        b64 = _encode_image_pil(image)
    else:
        return "", "unsupported image type"
    if not b64:
        return "", "encoding failed"

    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Read the license plate text in this image. Return ONLY the plate characters, nothing else. If no plate, return 'NONE'."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": "high"}}
                    ]
                }],
                "max_tokens": 50,
                "temperature": 0.0,
            },
            timeout=15,
        )
        data = resp.json()
        text = data["choices"][0]["message"]["content"].strip().upper()
        # Filter
        text = ''.join(c for c in text if c.isalnum())
        if text == "NONE":
            return "", "no plate seen by VLM"
        return text, f"gpt4v_{model}"
    except Exception as e:
        return "", f"gpt4v error: {e}"


def vlm_read_plate_claude(image, api_key=None, model="claude-3-5-sonnet-20241022"):
    """Read license plate from image using Claude Vision."""
    api_key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key or not REQUESTS_AVAILABLE:
        return "", "no API key or requests"

    if isinstance(image, np.ndarray):
        b64 = _encode_image_cv2(image)
    elif isinstance(image, Image.Image):
        b64 = _encode_image_pil(image)
    else:
        return "", "unsupported image type"
    if not b64:
        return "", "encoding failed"

    try:
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "Content-Type": "application/json"},
            json={
                "model": model,
                "max_tokens": 50,
                "temperature": 0.0,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Read the license plate text in this image. Return ONLY the plate characters, nothing else. If no plate, return 'NONE'."},
                        {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": b64}}
                    ]
                }]
            },
            timeout=15,
        )
        data = resp.json()
        text = data["content"][0]["text"].strip().upper()
        text = ''.join(c for c in text if c.isalnum())
        if text == "NONE":
            return "", "no plate seen by Claude"
        return text, f"claude_{model}"
    except Exception as e:
        return "", f"claude error: {e}"


def vlm_read_plate(image, provider="auto"):
    """Auto-detect available API. Prefer Claude, fallback GPT-4V."""
    if provider == "claude":
        return vlm_read_plate_claude(image)
    elif provider == "gpt4v":
        return vlm_read_plate_gpt4v(image)
    # Auto: try Claude first, then GPT-4V
    if os.environ.get("ANTHROPIC_API_KEY"):
        text, source = vlm_read_plate_claude(image)
        if text:
            return text, source
    if os.environ.get("OPENAI_API_KEY"):
        text, source = vlm_read_plate_gpt4v(image)
        if text:
            return text, source
    return "", "no VLM API key configured"
