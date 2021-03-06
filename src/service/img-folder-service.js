const utils = require('../utils/general-utils');
const asyncShell = require('../utils/async-shell');
const path = require('path');

module.exports = {
  movePhotoToImageFolder: async function(file) {
    const command = `cp "${file}" "${getImageDirectory()}/${utils.getPhotoNameFromFile(file)}"`;
    asyncShell.exec(command).catch(err => console.log(err));;
  },

  createImageFolder: async function() {
    const command = `mkdir "${getImageDirectory()}"`;
    asyncShell.exec(command).catch(err => console.log(err));
  },

  deleteImageFolder: async function() {
    const command = `rm -R "${getImageDirectory()}"`;
    asyncShell.exec(command).catch(err => console.log(err));
  },

  isPhotoAvailable: async function(photoName) {
    const command = `[ -f "${getImageDirectory()}/${photoName}" ] && echo true`;
    const output = await asyncShell.exec(command).catch(err => console.log(err));
    return output || "false";
  },
}

function getImageDirectory() {
  return path.join(__dirname, '../../public/img');
}