import ICCProfile from '../icc_profile';

export default {
  initColorSpace() {
    this._colorProfiles = {};
  },

  iccProfile(label, data, channels, alternate, type) {
    const profile = new ICCProfile(label, data, channels, alternate, type);
    profile.embed(this);
    this._colorProfiles[label] = profile;
    return this;
  },

  _writeSpaceToResources(resources) {
    resources.data.ColorSpace = resources.data.ColorSpace || {};
    Object.entries(this._colorProfiles).forEach(([k, v]) => {
      resources.data.ColorSpace[k] = v.ref;
    });
  },
};
