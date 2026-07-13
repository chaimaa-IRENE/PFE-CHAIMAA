package com.example.usermanagement.service;

import jakarta.annotation.PostConstruct;
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.util.Base64;
import java.util.Optional;

@Service
public class FaceService {

    private static final double SIMILARITY_THRESHOLD = 0.80;
    private static final int FACE_SIZE = 160;
    private static final int TEMPLATE_MARGIN = 25;
    private static final int TEMPLATE_SIZE = FACE_SIZE - 2 * TEMPLATE_MARGIN;

    @PostConstruct
    public void init() {
        nu.pattern.OpenCV.loadLocally();
    }

    private Mat normalizeToGray(Mat src) {
        Mat gray = new Mat();
        if (src.channels() > 1) {
            Imgproc.cvtColor(src, gray, Imgproc.COLOR_BGR2GRAY);
        } else {
            src.copyTo(gray);
        }
        Imgproc.equalizeHist(gray, gray);
        Mat resized = new Mat();
        Imgproc.resize(gray, resized, new Size(FACE_SIZE, FACE_SIZE));
        Imgproc.GaussianBlur(resized, resized, new Size(5, 5), 1.2);
        return resized;
    }

    public Optional<String> detectAndNormalizeFace(String imageBase64) {
        try {
            String stripped = imageBase64;
            if (stripped.contains(",")) {
                stripped = stripped.substring(stripped.indexOf(",") + 1);
            }
            Mat img = decodeBase64ToMat(stripped);
            if (img.empty()) return Optional.empty();

            Mat normalized = normalizeToGray(img);
            img.release();

            MatOfByte buf = new MatOfByte();
            Imgcodecs.imencode(".png", normalized, buf);
            String encoded = Base64.getEncoder().encodeToString(buf.toArray());

            normalized.release();
            return Optional.of(encoded);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public double compareFaces(String storedFace, String capturedFace) {
        try {
            Mat stored = decodeBase64ToMat(storedFace);
            Mat capturedRaw = decodeBase64ToMat(capturedFace);

            if (stored.empty() || capturedRaw.empty()) {
                stored.release(); capturedRaw.release();
                return 0.0;
            }

            Mat storedNorm = normalizeToGray(stored);
            Mat capturedNorm = normalizeToGray(capturedRaw);

            Rect templateRect = new Rect(TEMPLATE_MARGIN, TEMPLATE_MARGIN, TEMPLATE_SIZE, TEMPLATE_SIZE);
            Mat template = new Mat(storedNorm, templateRect);

            Mat matchResult = new Mat();
            Imgproc.matchTemplate(capturedNorm, template, matchResult, Imgproc.TM_CCOEFF_NORMED);
            Core.MinMaxLocResult mm = Core.minMaxLoc(matchResult);
            double similarity = Math.max(0, mm.maxVal);

            stored.release(); capturedRaw.release();
            storedNorm.release(); capturedNorm.release();
            template.release(); matchResult.release();

            return similarity;
        } catch (Exception e) {
            return 0.0;
        }
    }

    public boolean isMatch(String storedFace, String capturedFace) {
        double sim = compareFaces(storedFace, capturedFace);
        return sim >= SIMILARITY_THRESHOLD;
    }

    private Mat decodeBase64ToMat(String base64) {
        try {
            byte[] decoded = Base64.getDecoder().decode(base64);
            File temp = File.createTempFile("face_", ".png");
            temp.deleteOnExit();
            try (FileOutputStream fos = new FileOutputStream(temp)) {
                fos.write(decoded);
            }
            Mat mat = Imgcodecs.imread(temp.getAbsolutePath());
            temp.delete();
            return mat;
        } catch (Exception e) {
            return new Mat();
        }
    }
}
