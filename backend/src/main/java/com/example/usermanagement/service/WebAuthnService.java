package com.example.usermanagement.service;

import co.nstant.in.cbor.CborDecoder;
import co.nstant.in.cbor.model.ByteString;
import co.nstant.in.cbor.model.DataItem;
import co.nstant.in.cbor.model.NegativeInteger;
import co.nstant.in.cbor.model.UnicodeString;
import co.nstant.in.cbor.model.UnsignedInteger;
import com.example.usermanagement.model.User;
import com.example.usermanagement.model.WebAuthnCredential;
import com.example.usermanagement.repository.UserRepository;
import com.example.usermanagement.repository.WebAuthnCredentialRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.security.AlgorithmParameters;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.ECParameterSpec;
import java.security.spec.ECPoint;
import java.security.spec.ECPublicKeySpec;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class WebAuthnService {

    private static final String RP_NAME = "MonProjet";
    private static final String RP_ID = "localhost";
    private static final String ORIGIN = "http://localhost:3000";

    private final UserRepository userRepository;
    private final WebAuthnCredentialRepository credentialRepository;
    private final ObjectMapper objectMapper;
    private final java.util.Map<String, byte[]> pendingChallenges = new HashMap<>();

    public WebAuthnService(UserRepository userRepository,
                           WebAuthnCredentialRepository credentialRepository,
                           ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.credentialRepository = credentialRepository;
        this.objectMapper = objectMapper;
    }

    private static String base64urlEncode(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    private static byte[] base64urlDecode(String data) {
        return Base64.getUrlDecoder().decode(data);
    }

    public java.util.Map<String, Object> startRegistration(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        byte[] challenge = new byte[32];
        new SecureRandom().nextBytes(challenge);
        String challengeB64 = base64urlEncode(challenge);
        pendingChallenges.put("reg_" + userId, challenge);

        byte[] userIdBytes = ByteBuffer.allocate(8).putLong(userId).array();

        List<java.util.Map<String, Object>> pubKeyCredParams = List.of(
                Map.of("type", "public-key", "alg", -7),
                Map.of("type", "public-key", "alg", -257)
        );

        java.util.Map<String, Object> rp = Map.of(
                "name", RP_NAME,
                "id", RP_ID
        );

        java.util.Map<String, Object> userMap = Map.of(
                "id", base64urlEncode(userIdBytes),
                "name", user.getUsername(),
                "displayName", (user.getFirstname() != null ? user.getFirstname() : "") +
                        " " + (user.getName() != null ? user.getName() : "")
        );

        java.util.Map<String, Object> authenticatorSelection = Map.of(
                "authenticatorAttachment", "platform",
                "residentKey", "preferred",
                "userVerification", "required"
        );

        java.util.Map<String, Object> options = new LinkedHashMap<>();
        options.put("challenge", challengeB64);
        options.put("rp", rp);
        options.put("user", userMap);
        options.put("pubKeyCredParams", pubKeyCredParams);
        options.put("authenticatorSelection", authenticatorSelection);
        options.put("attestation", "none");
        options.put("timeout", 60000);

        return options;
    }

    public java.util.Map<String, Object> completeRegistration(Long userId, java.util.Map<String, Object> payload) {
        try {
            String id = (String) payload.get("id");
            String rawId = (String) payload.get("rawId");
            java.util.Map<String, Object> response = (java.util.Map<String, Object>) payload.get("response");

            String clientDataJSON = (String) response.get("clientDataJSON");
            String attestationObject = (String) response.get("attestationObject");

            byte[] expectedChallenge = pendingChallenges.remove("reg_" + userId);
            if (expectedChallenge == null) {
                throw new RuntimeException("No pending registration challenge for user " + userId);
            }

            String clientDataJsonStr = new String(base64urlDecode(clientDataJSON));
            JsonNode clientData = objectMapper.readTree(clientDataJsonStr);

            String challengeFromClient = clientData.get("challenge").asText();
            String originFromClient = clientData.get("origin").asText();

            if (!challengeFromClient.equals(base64urlEncode(expectedChallenge))) {
                throw new RuntimeException("Challenge mismatch");
            }
            if (!originFromClient.equals(ORIGIN)) {
                throw new RuntimeException("Origin mismatch: " + originFromClient);
            }

            byte[] authData = parseAttestationObject(attestationObject);
            java.util.Map<String, Object> coseKey = extractCoseKey(authData);
            String aaguid = extractAaguid(authData);
            String algorithm = coseKey.containsKey("alg") ? coseKey.get("alg").toString() : "-7";

            byte[] publicKeyBytes = coseKeyToRawPublicKey(coseKey);
            String publicKeyJwk = base64urlEncode(publicKeyBytes);

            WebAuthnCredential credential = new WebAuthnCredential(
                    userId, id, publicKeyJwk, algorithm, aaguid
            );

            String[] parts = clientDataJsonStr.split(",");
            for (String part : parts) {
                if (part.contains("\"type\"")) {
                    String type = part.split(":")[1].replaceAll("[\"\\s}]", "");
                    if (!"webauthn.create".equals(type)) {
                        throw new RuntimeException("Invalid credential type: " + type);
                    }
                }
            }

            credentialRepository.save(credential);

            java.util.Map<String, Object> result = new HashMap<>();
            result.put("credentialId", id);
            result.put("credentialIdB64", rawId);
            result.put("algorithm", algorithm);
            result.put("aaguid", aaguid);
            result.put("success", true);

            return result;
        } catch (Exception e) {
            throw new RuntimeException("WebAuthn registration failed: " + e.getMessage(), e);
        }
    }

    public java.util.Map<String, Object> startLogin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<WebAuthnCredential> credentials = credentialRepository.findByUserId(userId);
        if (credentials.isEmpty()) {
            throw new RuntimeException("No WebAuthn credentials registered for user " + userId);
        }

        byte[] challenge = new byte[32];
        new SecureRandom().nextBytes(challenge);
        pendingChallenges.put("auth_" + userId, challenge);
        String challengeB64 = base64urlEncode(challenge);

        List<java.util.Map<String, Object>> allowCredentials = credentials.stream().map(c -> {
            java.util.Map<String, Object> cred = new HashMap<>();
            cred.put("type", "public-key");
            cred.put("id", c.getCredentialId());
            return cred;
        }).toList();

        java.util.Map<String, Object> options = new LinkedHashMap<>();
        options.put("challenge", challengeB64);
        options.put("rpId", RP_ID);
        options.put("allowCredentials", allowCredentials);
        options.put("userVerification", "required");
        options.put("timeout", 60000);

        return options;
    }

    public java.util.Map<String, Object> completeLogin(Long userId, java.util.Map<String, Object> payload) {
        try {
            String id = (String) payload.get("id");
            String rawId = (String) payload.get("rawId");
            java.util.Map<String, Object> response = (java.util.Map<String, Object>) payload.get("response");

            String clientDataJSON = (String) response.get("clientDataJSON");
            String authenticatorData = (String) response.get("authenticatorData");
            String signature = (String) response.get("signature");
            String userHandle = (String) response.getOrDefault("userHandle", null);

            byte[] expectedChallenge = pendingChallenges.remove("auth_" + userId);
            if (expectedChallenge == null) {
                throw new RuntimeException("No pending login challenge for user " + userId);
            }

            String clientDataJsonStr = new String(base64urlDecode(clientDataJSON));
            JsonNode clientData = objectMapper.readTree(clientDataJsonStr);

            String challengeFromClient = clientData.get("challenge").asText();
            String originFromClient = clientData.get("origin").asText();

            if (!challengeFromClient.equals(base64urlEncode(expectedChallenge))) {
                throw new RuntimeException("Challenge mismatch");
            }
            if (!originFromClient.equals(ORIGIN)) {
                throw new RuntimeException("Origin mismatch: " + originFromClient);
            }

            String[] parts = clientDataJsonStr.split(",");
            for (String part : parts) {
                if (part.contains("\"type\"")) {
                    String type = part.split(":")[1].replaceAll("[\"\\s}]", "");
                    if (!"webauthn.get".equals(type)) {
                        throw new RuntimeException("Invalid assertion type: " + type);
                    }
                }
            }

            Optional<WebAuthnCredential> credOpt = credentialRepository.findByCredentialId(id);
            if (credOpt.isEmpty()) {
                throw new RuntimeException("Credential not found: " + id);
            }

            WebAuthnCredential credential = credOpt.get();
            if (!credential.getUserId().equals(userId)) {
                throw new RuntimeException("Credential does not belong to user " + userId);
            }

            byte[] authDataBytes = base64urlDecode(authenticatorData);
            byte[] clientDataHash = MessageDigest.getInstance("SHA-256")
                    .digest(base64urlDecode(clientDataJSON));

            byte[] signatureBase = new byte[authDataBytes.length + clientDataHash.length];
            System.arraycopy(authDataBytes, 0, signatureBase, 0, authDataBytes.length);
            System.arraycopy(clientDataHash, 0, signatureBase, authDataBytes.length, clientDataHash.length);

            byte[] publicKeyBytes = base64urlDecode(credential.getPublicKeyJwk());
            byte[] sigBytes = base64urlDecode(signature);

            boolean verified = verifySignature(publicKeyBytes, sigBytes, signatureBase,
                    Integer.parseInt(credential.getAlgorithm()));

            if (!verified) {
                throw new RuntimeException("Signature verification failed");
            }

            credential.setLastUsedAt(LocalDateTime.now());
            credentialRepository.save(credential);

            User user = userRepository.findById(userId).orElseThrow();
            user.setLastConnectionDate(LocalDateTime.now());
            userRepository.save(user);

            java.util.Map<String, Object> result = new HashMap<>();
            result.put("verified", true);
            result.put("credentialId", id);
            result.put("userId", userId);
            result.put("username", user.getUsername());

            return result;
        } catch (Exception e) {
            throw new RuntimeException("WebAuthn login failed: " + e.getMessage(), e);
        }
    }

    public boolean hasCredentials(Long userId) {
        return credentialRepository.existsByUserId(userId);
    }

    public void removeCredentials(Long userId) {
        credentialRepository.deleteByUserId(userId);
    }

    private byte[] parseAttestationObject(String attestationObjectB64) throws Exception {
        byte[] attestationBytes = base64urlDecode(attestationObjectB64);

        ByteArrayInputStream bais = new ByteArrayInputStream(attestationBytes);
        List<DataItem> items = new CborDecoder(bais).decode();
        co.nstant.in.cbor.model.Map attestationMap = (co.nstant.in.cbor.model.Map) items.get(0);

        ByteString authDataBytes = (ByteString) attestationMap.get(new UnicodeString("authData"));
        return authDataBytes.getBytes();
    }

    private String extractAaguid(byte[] authData) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 16; i++) {
            sb.append(String.format("%02x", authData[32 + i]));
            if (i == 3 || i == 5 || i == 7 || i == 9) sb.append("-");
        }
        return sb.toString();
    }

    private java.util.Map<String, Object> extractCoseKey(byte[] authData) throws Exception {
        int flags = authData[32] & 0xFF;
        boolean hasAttestedData = (flags & 0x40) != 0;

        if (!hasAttestedData) {
            throw new RuntimeException("No attested credential data in authData");
        }

        int offset = 37;
        offset += 16;
        int credIdLen = ((authData[offset] & 0xFF) << 8) | (authData[offset + 1] & 0xFF);
        offset += 2;
        offset += credIdLen;

        ByteArrayInputStream bais = new ByteArrayInputStream(authData, offset, authData.length - offset);
        List<DataItem> coseItems = new CborDecoder(bais).decode();
        co.nstant.in.cbor.model.Map coseKeyMap = (co.nstant.in.cbor.model.Map) coseItems.get(0);

        java.util.Map<String, Object> coseKey = new HashMap<>();
        for (DataItem key : coseKeyMap.getKeys()) {
            DataItem value = coseKeyMap.get(key);
            if (key instanceof NegativeInteger ni && value instanceof ByteString bs) {
                coseKey.put("x_" + ni.getValue().negate().toString(), bs.getBytes());
            } else if (key instanceof UnsignedInteger ui && value instanceof ByteString bs) {
                coseKey.put(String.valueOf(ui.getValue()), bs.getBytes());
            } else if (key instanceof NegativeInteger ni && value instanceof UnsignedInteger uiv) {
                coseKey.put("x_" + ni.getValue().negate().toString(), uiv.getValue());
            } else if (key instanceof UnsignedInteger ui && value instanceof UnsignedInteger uiv) {
                coseKey.put(String.valueOf(ui.getValue()), uiv.getValue());
            } else {
                try {
                    coseKey.put(key.toString(), value.toString());
                } catch (Exception ignored) {}
            }
        }

        return coseKey;
    }

    private byte[] coseKeyToRawPublicKey(java.util.Map<String, Object> coseKey) throws Exception {
        Object ktyObj = coseKey.get("1");
        long kty = ktyObj instanceof Number n ? n.longValue() : 2L;
        if (kty != 2) {
            throw new RuntimeException("Unsupported key type: " + kty + " (only EC2 supported)");
        }

        Object algObj = coseKey.get("3");
        long alg = algObj instanceof Number n ? n.longValue() : -7L;
        if (alg != -7 && alg != -257) {
            throw new RuntimeException("Unsupported algorithm: " + alg);
        }

        Object crvObj = coseKey.get("x_1");
        if (crvObj == null) {
            crvObj = coseKey.get("-1");
        }
        long crv = crvObj instanceof Number n ? n.longValue() : 1L;
        if (crv != 1) {
            throw new RuntimeException("Unsupported curve: " + crv + " (only P-256 supported)");
        }

        byte[] xBytes = getBytesFromCoseKey(coseKey, "x_2");
        if (xBytes == null) xBytes = getBytesFromCoseKey(coseKey, "-2");
        if (xBytes == null) throw new RuntimeException("Missing x coordinate");

        byte[] yBytes = getBytesFromCoseKey(coseKey, "x_3");
        if (yBytes == null) yBytes = getBytesFromCoseKey(coseKey, "-3");
        if (yBytes == null) throw new RuntimeException("Missing y coordinate");

        byte[] rawKey = new byte[1 + xBytes.length + yBytes.length];
        rawKey[0] = 0x04;
        System.arraycopy(xBytes, 0, rawKey, 1, xBytes.length);
        System.arraycopy(yBytes, 0, rawKey, 1 + xBytes.length, yBytes.length);

        return rawKey;
    }

    private byte[] getBytesFromCoseKey(java.util.Map<String, Object> coseKey, String key) {
        Object val = coseKey.get(key);
        if (val instanceof byte[] bytes) return bytes;
        if (val instanceof ByteString bs) return bs.getBytes();
        return null;
    }

    private boolean verifySignature(byte[] publicKeyRaw, byte[] signature,
                                     byte[] data, int algorithm) throws Exception {
        if (algorithm == -7) {
            KeyFactory keyFactory = KeyFactory.getInstance("EC");

            AlgorithmParameters params = AlgorithmParameters.getInstance("EC");
            params.init(new ECGenParameterSpec("secp256r1"));
            ECParameterSpec ecSpec = params.getParameterSpec(ECParameterSpec.class);

            ECPoint point = new ECPoint(
                    new BigInteger(1, publicKeyRaw, 1, 32),
                    new BigInteger(1, publicKeyRaw, 33, 32));
            ECPublicKeySpec pubKeySpec = new ECPublicKeySpec(point, ecSpec);
            PublicKey pubKey = keyFactory.generatePublic(pubKeySpec);

            byte[] derSig = convertRawToDerSignature(signature);

            Signature sig = Signature.getInstance("SHA256withECDSA");
            sig.initVerify(pubKey);
            sig.update(data);
            return sig.verify(derSig);
        } else if (algorithm == -257) {
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            java.security.spec.X509EncodedKeySpec keySpec =
                    new java.security.spec.X509EncodedKeySpec(publicKeyRaw);
            PublicKey pubKey = keyFactory.generatePublic(keySpec);

            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initVerify(pubKey);
            sig.update(data);
            return sig.verify(signature);
        }

        return false;
    }

    private byte[] convertRawToDerSignature(byte[] rawSig) {
        if (rawSig.length != 64) return rawSig;

        byte[] rBytes = new byte[32];
        byte[] sBytes = new byte[32];
        System.arraycopy(rawSig, 0, rBytes, 0, 32);
        System.arraycopy(rawSig, 32, sBytes, 0, 32);

        BigInteger r = new BigInteger(1, rBytes);
        BigInteger s = new BigInteger(1, sBytes);

        byte[] rDer = r.toByteArray();
        byte[] sDer = s.toByteArray();

        if (rDer[0] == 0 && rDer.length > 33) {
            byte[] tmp = new byte[rDer.length - 1];
            System.arraycopy(rDer, 1, tmp, 0, tmp.length);
            rDer = tmp;
        }
        if (sDer[0] == 0 && sDer.length > 33) {
            byte[] tmp = new byte[sDer.length - 1];
            System.arraycopy(sDer, 1, tmp, 0, tmp.length);
            sDer = tmp;
        }

        int totalLen = rDer.length + sDer.length + 4;
        byte[] derSig = new byte[totalLen + 2];
        derSig[0] = 0x30;
        derSig[1] = (byte) (totalLen & 0xFF);
        derSig[2] = 0x02;
        derSig[3] = (byte) (rDer.length & 0xFF);
        System.arraycopy(rDer, 0, derSig, 4, rDer.length);
        derSig[4 + rDer.length] = 0x02;
        derSig[5 + rDer.length] = (byte) (sDer.length & 0xFF);
        System.arraycopy(sDer, 0, derSig, 6 + rDer.length, sDer.length);

        return derSig;
    }
}
