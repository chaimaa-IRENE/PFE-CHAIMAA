import cv2, numpy as np, time

def extract_consecutive_frames(filepath, num_frames=15, target_region=None):
    """Extract consecutive frames from a specific time segment in the video."""
    cap = cv2.VideoCapture(filepath)
    if not cap.isOpened():
        return []
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = total / fps if fps > 0 else 1

    # Target the middle section of the video
    start_frame = max(0, total // 2 - num_frames // 2)
    frames = []
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    for i in range(num_frames):
        ret, frame = cap.read()
        if not ret:
            break
        if target_region:
            x1, y1, x2, y2 = target_region
            frame = frame[y1:y2, x1:x2]
        frames.append(frame)
    cap.release()
    return frames


def align_frames_ecc(frames, max_iter=50, epsilon=1e-5):
    """Align frames using ECC translation + rotation (Euclidean)."""
    if not frames:
        return []
    ref_gray = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY) if len(frames[0].shape) == 3 else frames[0]
    aligned = [frames[0]]
    warp_matrix = np.eye(2, 3, dtype=np.float32)

    for i in range(1, len(frames)):
        curr_gray = cv2.cvtColor(frames[i], cv2.COLOR_BGR2GRAY) if len(frames[i].shape) == 3 else frames[i]
        try:
            criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, max_iter, epsilon)
            _, warp = cv2.findTransformECC(ref_gray, curr_gray, warp_matrix.copy(), cv2.MOTION_EUCLIDEAN, criteria)
            aligned_frame = cv2.warpAffine(frames[i], warp, (frames[0].shape[1], frames[0].shape[0]),
                                           flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP,
                                           borderMode=cv2.BORDER_REPLICATE)
            aligned.append(aligned_frame)
        except Exception:
            aligned.append(frames[i])
    return aligned


def fuse_frames_median(frames):
    """Fuse aligned frames using median (removes outliers, preserves edges)."""
    if not frames:
        return None
    stack = np.stack(frames, axis=0)
    return np.median(stack, axis=0).astype(np.uint8)


def fuse_frames_avg(frames):
    """Fuse aligned frames using average (standard SR)."""
    if not frames or len(frames) < 2:
        return frames[0] if frames else None
    result = np.mean(frames, axis=0).astype(np.uint8)
    return result


def adaptive_sharpen(img, strength=1.0):
    """Sharpen with edge-aware strength."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img.copy()
    blur = cv2.GaussianBlur(gray, (0, 0), 2.0)
    # Edge map
    edges = cv2.Canny(gray, 30, 100)
    # Only sharpen edge regions
    sharp = cv2.addWeighted(gray, 1.0 + strength, blur, -strength, 0)
    result = np.where(edges > 0, sharp, gray)
    if len(img.shape) == 3:
        return cv2.cvtColor(result, cv2.COLOR_GRAY2BGR)
    return result


def temporal_super_resolution(filepath, num_frames=15, target_region=None, use_median=True):
    """Full temporal SR pipeline: extract → align → fuse → sharpen."""
    start = time.time()
    frames = extract_consecutive_frames(filepath, num_frames, target_region)
    if len(frames) < 2:
        return frames[0] if frames else None, 0, "not enough frames"

    aligned = align_frames_ecc(frames)
    if use_median:
        fused = fuse_frames_median(aligned)
    else:
        fused = fuse_frames_avg(aligned)
    if fused is None:
        return None, 0, "fusion failed"

    sharpened = adaptive_sharpen(fused, strength=1.5)

    # Upscale 2x for better OCR
    h, w = sharpened.shape[:2]
    upscaled = cv2.resize(sharpened, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)

    elapsed = time.time() - start
    return upscaled, elapsed, f"sr_{num_frames}f_{'median' if use_median else 'avg'}"
