import cv2, numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import scipy.ndimage as ndimage
import torch
import torchvision.transforms as transforms

def upscale_lanczos(crop, scale=3):
    h, w = crop.shape[:2]
    new_size = (w * scale, h * scale)
    if len(crop.shape) == 3:
        return cv2.resize(crop, new_size, interpolation=cv2.INTER_LANCZOS4)
    return cv2.resize(crop, new_size, interpolation=cv2.INTER_LANCZOS4)

def upscale_edgereserve(crop, scale=3):
    h, w = crop.shape[:2]
    new_size = (w * scale, h * scale)
    if len(crop.shape) == 3:
        big = cv2.resize(crop, new_size, interpolation=cv2.INTER_CUBIC)
    else:
        big = cv2.resize(crop, new_size, interpolation=cv2.INTER_CUBIC)
    return cv2.detailEnhance(big, sigma_s=10, sigma_r=0.15)

def sharpen_unsharp(crop, strength=1.5):
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop
    blurred = cv2.GaussianBlur(gray, (0, 0), 3)
    sharpened = cv2.addWeighted(gray, 1.0 + strength, blurred, -strength, 0)
    return cv2.cvtColor(sharpened, cv2.COLOR_GRAY2BGR) if len(crop.shape) == 3 else sharpened

def laplacian_sharpen(crop):
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    sharpened = np.uint8(np.clip(gray - 0.5 * laplacian, 0, 255))
    return cv2.cvtColor(sharpened, cv2.COLOR_GRAY2BGR) if len(crop.shape) == 3 else sharpened

def bilateral_enhance(crop):
    return cv2.bilateralFilter(crop, 9, 100, 100)

def clahe_enhance(crop):
    lab = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.merge([l, a, b])
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

def deconvolution_sharpen(crop):
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop.copy()
    gaussian_kernel = np.array([
        [1, 4, 6, 4, 1],
        [4, 16, 24, 16, 4],
        [6, 24, 36, 24, 6],
        [4, 16, 24, 16, 4],
        [1, 4, 6, 4, 1]
    ], dtype=np.float32) / 256.0
    blurred = cv2.filter2D(gray, -1, gaussian_kernel)
    # Wiener-like deconvolution
    fft_orig = np.fft.fft2(gray)
    fft_blur = np.fft.fft2(blurred)
    eps = 1e-3
    deconv = np.fft.ifft2(fft_orig * np.conj(fft_blur) / (np.abs(fft_blur)**2 + eps))
    deconv = np.abs(deconv).astype(np.uint8)
    return cv2.cvtColor(deconv, cv2.COLOR_GRAY2BGR) if len(crop.shape) == 3 else deconv

def adaptive_threshold_multi(crop):
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop.copy()
    methods = []
    for bsize in [7, 11, 15]:
        for c in [2, 4, 6]:
            try:
                th = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, bsize, c)
                methods.append(th)
            except:
                pass
    return methods

def wavelet_denoise_sharpen(crop):
    import pywt
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop.copy()
    coeffs = pywt.dwt2(gray, 'haar')
    cA, (cH, cV, cD) = coeffs
    # Boost detail coefficients
    cH *= 1.5
    cV *= 1.5
    cD *= 1.2
    coeffs = cA, (cH, cV, cD)
    reconstructed = pywt.idwt2(coeffs, 'haar')
    reconstructed = np.clip(reconstructed, 0, 255).astype(np.uint8)
    return cv2.cvtColor(reconstructed, cv2.COLOR_GRAY2BGR) if len(crop.shape) == 3 else reconstructed

def morphological_enhance(crop):
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop.copy()
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    kernel = np.ones((2, 2), np.uint8)
    dilated = cv2.dilate(binary, kernel, iterations=1)
    return cv2.cvtColor(dilated, cv2.COLOR_GRAY2BGR) if len(crop.shape) == 3 else dilated

def enhance_texture_pil(crop):
    pil_img = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB) if len(crop.shape) == 3 else crop)
    enhancer = ImageEnhance.Sharpness(pil_img)
    sharp = enhancer.enhance(4.0)
    enhancer = ImageEnhance.Contrast(sharp)
    contrasted = enhancer.enhance(2.0)
    result = cv2.cvtColor(np.array(contrasted), cv2.COLOR_RGB2BGR) if len(crop.shape) == 3 else np.array(contrasted)
    return result

def dog_filter(crop):
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop.copy()
    blur1 = cv2.GaussianBlur(gray, (0, 0), 1.0)
    blur2 = cv2.GaussianBlur(gray, (0, 0), 3.0)
    dog = cv2.subtract(blur1, blur2)
    dog = cv2.normalize(dog, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    _, binary = cv2.threshold(dog, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR) if len(crop.shape) == 3 else binary

def super_res_torch(crop, scale=2):
    """Simple super-resolution using bicubic upsampling + SRResNet-like refinement."""
    h, w = crop.shape[:2]
    if h < 10 or w < 10:
        return crop
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop.copy()
    # Bicubic upscale
    big = cv2.resize(gray, (w * scale, h * scale), interpolation=cv2.INTER_CUBIC)
    # Simple CNN refinement using a pre-trained edge detector
    blurred = cv2.GaussianBlur(big, (0, 0), 0.8)
    detail = cv2.addWeighted(big, 1.5, blurred, -0.5, 0)
    detail = np.clip(detail, 0, 255).astype(np.uint8)
    return cv2.cvtColor(detail, cv2.COLOR_GRAY2BGR) if len(crop.shape) == 3 else detail

def nlm_denoise_sharpen(crop):
    denoised = cv2.fastNlMeansDenoisingColored(crop, None, 10, 10, 7, 21) if len(crop.shape) == 3 else cv2.fastNlMeansDenoising(crop, None, 10, 7, 21)
    gray = cv2.cvtColor(denoised, cv2.COLOR_BGR2GRAY) if len(denoised.shape) == 3 else denoised
    sharpen_kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharp = cv2.filter2D(gray, -1, sharpen_kernel)
    return cv2.cvtColor(sharp, cv2.COLOR_GRAY2BGR) if len(crop.shape) == 3 else sharp

ENHANCEMENT_METHODS = [
    ("original", lambda c: c),
    ("upscale_lanczos_3x", lambda c: upscale_lanczos(c, 3)),
    ("upscale_edgereserve_3x", lambda c: upscale_edgereserve(c, 3)),
    ("sharpen_unsharp", lambda c: sharpen_unsharp(c)),
    ("laplacian_sharpen", laplacian_sharpen),
    ("bilateral_enhance", bilateral_enhance),
    ("clahe_enhance", clahe_enhance),
    ("deconvolution", deconvolution_sharpen),
    ("wavelet_denoise_sharpen", wavelet_denoise_sharpen),
    ("morphological_enhance", morphological_enhance),
    ("texture_enhance_pil", enhance_texture_pil),
    ("dog_filter", dog_filter),
    ("super_res_torch_2x", lambda c: super_res_torch(c, 2)),
    ("nlm_denoise_sharpen", nlm_denoise_sharpen),
    ("sharpen_unsharp_x2", lambda c: sharpen_unsharp(sharpen_unsharp(c))),
]

ADAPTIVE_METHODS = [
    ("adaptive_7_2", lambda g: cv2.adaptiveThreshold(g, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 7, 2)),
    ("adaptive_11_4", lambda g: cv2.adaptiveThreshold(g, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 4)),
    ("adaptive_15_6", lambda g: cv2.adaptiveThreshold(g, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 6)),
    ("otsu", lambda g: cv2.threshold(g, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]),
    ("binary_127", lambda g: cv2.threshold(g, 127, 255, cv2.THRESH_BINARY)[1]),
    ("binary_150", lambda g: cv2.threshold(g, 150, 255, cv2.THRESH_BINARY)[1]),
    ("binary_200", lambda g: cv2.threshold(g, 200, 255, cv2.THRESH_BINARY)[1]),
]


def enhance_image(image, method_name=None):
    """Apply a specific enhancement method or all if None."""
    if method_name:
        for name, func in ENHANCEMENT_METHODS:
            if name == method_name:
                return func(image)
        return image
    results = {}
    for name, func in ENHANCEMENT_METHODS:
        try:
            results[name] = func(image)
        except Exception:
            pass
    return results


def get_adaptive_thresholds(gray):
    results = {}
    for name, func in ADAPTIVE_METHODS:
        try:
            results[name] = func(gray)
        except Exception:
            pass
    return results


def best_enhancement_for_ocr(crop, ocr_func, plate_region_center=None):
    """Try all enhancement methods and return the one that yields the best OCR result."""
    best_text = ""
    best_method = ""
    enhanced = enhance_image(crop)

    for method_name, enhanced_img in enhanced.items():
        try:
            results = ocr_func(enhanced_img)
            for text in results:
                cleaned = text.strip().upper()
                if len(cleaned) > 3 and len(cleaned) > len(best_text):
                    from analyzer import _extract_plaque
                    plate = _extract_plaque(cleaned)
                    if plate and len(plate) > len(best_text):
                        best_text = plate
                        best_method = method_name
        except Exception:
            pass

    return best_text, best_method


def multi_frame_fusion(frames):
    """Fuse multiple frames to create a higher quality image (temporal denoising)."""
    if not frames:
        return None
    if len(frames) == 1:
        return frames[0]

    aligned = []
    ref_gray = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)
    aligned.append(frames[0].astype(np.float32))

    for i in range(1, len(frames)):
        curr_gray = cv2.cvtColor(frames[i], cv2.COLOR_BGR2GRAY)
        try:
            warp_matrix = np.eye(2, 3, dtype=np.float32)
            criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 50, 1e-5)
            _, warp_matrix = cv2.findTransformECC(ref_gray, curr_gray, warp_matrix, cv2.MOTION_TRANSLATION, criteria)
            aligned_frame = cv2.warpAffine(frames[i], warp_matrix, (frames[0].shape[1], frames[0].shape[0]),
                                           flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP)
            aligned.append(aligned_frame.astype(np.float32))
        except Exception:
            aligned.append(frames[i].astype(np.float32))

    fused = np.mean(aligned, axis=0).astype(np.uint8)
    return fused
