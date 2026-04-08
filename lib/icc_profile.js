class ICCProfile {
  constructor(label, data, channels, alternate, type) {
    this.label = label;
    this.data = data;
    this.channels = channels;
    this.alternate = alternate;
    this.ref = null;
    this.streamRef = null;
    this.type = type ?? (channels === 4 ? 'cmyk' : 'rgb');
  }

  embed(document) {
    if (this.ref) {
      return;
    }
    this.document = document;

    this.streamRef = this.document.ref({
      Alternate: this.alternate,
      N: this.channels,
      Length: this.data.length,
    });
    this.streamRef.end(this.data);

    this.ref = this.document.ref([`ICCBased ${this.streamRef}`]);
    this.ref.end();

    this.data = null;
  }
}

export default ICCProfile;
