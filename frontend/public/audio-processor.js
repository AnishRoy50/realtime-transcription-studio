class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const inputChannel = input[0];
      
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex++] = inputChannel[i];
        
        if (this.bufferIndex >= this.bufferSize) {
          this.flush();
        }
      }
    }
    return true;
  }

  flush() {
    const inputData = this.buffer;
    const buffer = new ArrayBuffer(inputData.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < inputData.length; i++) {
      let s = Math.max(-1, Math.min(1, inputData[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    this.port.postMessage(buffer, [buffer]);
    this.bufferIndex = 0;
  }
}

registerProcessor('audio-processor', AudioProcessor);