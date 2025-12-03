import wave
import io

def create_wav_header(sample_rate: int, channels: int = 1, bits_per_sample: int = 16) -> bytes:
    """
    Create a WAV header for the given parameters.
    Useful if we need to save raw PCM data to a WAV file.
    """
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(bits_per_sample // 8)
        wav_file.setframerate(sample_rate)
    return buffer.getvalue()[:44] # Return just the header

