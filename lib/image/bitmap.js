class BitmapImage {
  constructor(data, label, properties) {
    this.label = label;
    this.data = data;
    this.width = properties.width;
    this.height = properties.height;
    this.channels = properties.channels;
    this.colorSpace = properties.colorSpace;
    this.obj = null;
  }

  embed(document) {
    if (this.obj) {
      return;
    }
    this.document = document;

    if (
      !(
        this.data instanceof Uint8Array &&
        this.data.length === this.channels * this.width * this.height
      )
    ) {
      throw Error("Invalid bitmap, data doesn't match the given properties.");
    }

    if (this.colorSpace) {
      const profile = this.document._colorProfiles[this.colorSpace];
      if (!profile) {
        throw Error("PDFDocument doesn't support bitmap color space.");
      }
      this.colorSpace = profile.ref;
    } else {
      if (this.channels === 4) {
        this.colorSpace = 'DeviceCMYK';
      } else {
        this.colorSpace = 'DeviceRGB';
      }
    }

    this.obj = this.document.ref({
      Type: 'XObject',
      Subtype: 'Image',
      BitsPerComponent: 8,
      Width: this.width,
      Height: this.height,
      ColorSpace: this.colorSpace,
    });
    this.obj.end(this.data);

    this.data = null;
  }
}

export default BitmapImage;
