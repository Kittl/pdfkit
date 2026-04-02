import PDFDocument from '../../lib/document';
import fs from 'fs';
import JPEG from '../../lib/image/jpeg';
import { logData } from './helpers';

describe('Image', function () {
  /**
   * @type {PDFDocument}
   */
  let document;

  beforeEach(() => {
    document = new PDFDocument({
      info: { CreationDate: new Date(Date.UTC(2018, 1, 1)) },
    });
  });

  test('y position should be updated', () => {
    const originalY = document.y;
    const imageHeight = 400;
    document.image('./tests/images/bee.png');
    expect(document.y).toBe(originalY + imageHeight);
  });

  test('parse JPEG with null byte padding in EXIF (issue #1175)', () => {
    const data = fs.readFileSync('./tests/images/issue-1175.jpeg');
    const jpeg = new JPEG(data, 'test');
    expect(jpeg.width).toBe(375);
    expect(jpeg.height).toBe(500);
    expect(jpeg.orientation).toBe(1);
  });

  test('support raw images with custom properties', () => {
    const data = new Uint8Array(fs.readFileSync('./tests/images/image.raw'));
    const profileData = fs.readFileSync('tests/profiles/eciCMYK_v2.icc');
    const docData = logData(document);
    document.iccProfile('KittlCMYK', profileData, 4, 'DeviceCMYK');
    const image = document.openImage(data, {
      isBitmap: true,
      width: 651,
      height: 643,
      channels: 5,
      hasAlphaChannel: true,
      colorSpace: 'KittlCMYK',
    });
    document.image(image, 0, 0);
    document.end();

    expect(docData).toContainChunk([
      '<<\n' +
        '/Type /XObject\n' +
        '/Subtype /Image\n' +
        '/Height 643\n' +
        '/Width 651\n' +
        '/BitsPerComponent 8\n' +
        '/ColorSpace /DeviceGray\n' +
        '/Decode [0 1]\n' +
        '/Length 432\n' +
        '/Filter /FlateDecode\n' +
        '>>',
    ]);

    expect(docData).toContainChunk([
      '<<\n' +
        '/Type /XObject\n' +
        '/Subtype /Image\n' +
        '/Height 643\n' +
        '/Width 651\n' +
        '/BitsPerComponent 8\n' +
        '/ColorSpace /DeviceGray\n' +
        '/Decode [0 1]\n' +
        '/Length 432\n' +
        '/Filter /FlateDecode\n' +
        '>>',
    ]);
  });
});
