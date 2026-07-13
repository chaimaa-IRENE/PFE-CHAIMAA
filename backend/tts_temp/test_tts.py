import asyncio
import edge_tts

async def test():
    text = "سلام! أنا غادي نعمر معاك التصريح ديال الحادث. واش نتا مستعد؟"
    communicate = edge_tts.Communicate(text, "ar-MA-JamalNeural")
    await communicate.save("C:/Users/EmsiC/Desktop/mon-projet/backend/tts_temp/test_ma.mp3")
    print("ar-MA Jamal saved")

    text2 = "شنو الماتريكول ديال لكاميو؟"
    communicate2 = edge_tts.Communicate(text2, "ar-MA-MounaNeural")
    await communicate2.save("C:/Users/EmsiC/Desktop/mon-projet/backend/tts_temp/test_ma2.mp3")
    print("ar-MA Mouna saved")

asyncio.run(test())