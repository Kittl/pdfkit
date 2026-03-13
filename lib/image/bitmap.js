class BitmapImage {
  constructor(data, label, properties) {
    this.label = label;
    this.data = data;
    this.width = properties.width;
    this.height = properties.height;
    this.channels = properties.channels;
    this.colorSpace = properties.colorSpace;
    this.hasAlphaChannel = properties.hasAlphaChannel;
    this.obj = null;
  }

  embed(document) {
    if (this.obj) {
      return;
    }
    this.document = document;

    if (!(this.data instanceof Uint8Array && this.data.length === this.channels * this.width * this.height)) {
      throw Error("Invalid bitmap, data doesn't match the given properties.");
    }

    if (this.colorSpace) {
      const profile = this.document._colorProfiles[this.colorSpace];
      if (!profile) {
        throw Error("PDFDocument doesn't support bitmap color space.");
      }
      const channels = this.hasAlphaChannel ? this.channels - 1 : this.channels;
      if (profile.channels !== channels) {
        throw Error("Color profile doesn't support image channels");
      }
      this.colorSpace = profile.ref;
    } else {
      if (!this.hasAlphaChannel) {
        this.colorSpace = this.channels === 4 ? 'DeviceCMYK' : 'DeviceRGB';
      } else {
        this.colorSpace = this.channels === 5 ? 'DeviceCMYK' : 'DeviceRGB';
      }
    }

    let pixelData = this.data;
    let alphaData = undefined;
    if (this.hasAlphaChannel) {
      const pixelChannels = this.channels - 1;
      pixelData = new Uint8Array(pixelChannels * this.width * this.height);
      alphaData = new Uint8Array(this.width * this.height);
      let isOpaque = true;

      if (this.channels === 4) {
        // RGBA -> RGB + A
        for (let src = 0, dst = 0, a = 0; src < this.data.length; src += 4, dst += 3, a++) {
          pixelData[dst] = this.data[src];
          pixelData[dst + 1] = this.data[src + 1];
          pixelData[dst + 2] = this.data[src + 2];

          const alpha = this.data[src + 3];
          alphaData[a] = alpha;
          isOpaque = isOpaque && alpha === 255;
        }
      } else if (this.channels === 5) {
        // CMYKA -> CMYK + A
        for (let src = 0, dst = 0, a = 0; src < this.data.length; src += 5, dst += 4, a++) {
          pixelData[dst] = this.data[src];
          pixelData[dst + 1] = this.data[src + 1];
          pixelData[dst + 2] = this.data[src + 2];
          pixelData[dst + 3] = this.data[src + 3];

          const alpha = this.data[src + 4];
          alphaData[a] = alpha;
          isOpaque = isOpaque && alpha === 255;
        }
      } else {
        // channels > 5
        for (let src = 0, dst = 0, a = 0; src < this.data.length; src += this.channels, dst += pixelChannels, a++) {
          for (let j = 0; j < pixelChannels; j++) {
            pixelData[dst + j] = this.data[src + j];
          }
          const alpha = this.data[src + pixelChannels];
          alphaData[a] = alpha;
          isOpaque = isOpaque && alpha === 255;
        }
      }

      if (isOpaque) {
        alphaData = null;
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

    if (alphaData) {
      const sMask = this.document.ref({
        Type: 'XObject',
        Subtype: 'Image',
        Height: this.height,
        Width: this.width,
        BitsPerComponent: 8,
        ColorSpace: 'DeviceGray',
        Decode: [0, 1],
      });
      sMask.end(alphaData);
      this.obj.data['SMask'] = sMask;
    }
    this.obj.end(pixelData);

    this.data = null;
  }
}

export default BitmapImage;
