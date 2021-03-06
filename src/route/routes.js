var express = require('express');
var router = express.Router();
const directoryService = require('../service/photo-directory-service');
const exifSvc = require('../service/exiftool-service');
const imgFolder = require('../service/img-folder-service');
const datetimeUtils = require('../utils/datetime-utils');
const coordinatesUtils = require('../utils/coordinates-utils');
const bingMapsApi = require('../service/bing-maps-api-service');

// Get list of all photos in a directory (with metadata optional - long load times)
// or get a single photo metadata by providing a file path
router.get('/photo', async function (req, res) {
	let directory = req.query.dir || '';
	let recursive = req.query.recursive || false;
	let file = req.query.file || '';
  let isMetaData = req.query.metadata || false;
	if (directory !== '') {
		if (isMetaData) {
			directoryService.getPhotoListWithMetaData(directory, recursive).then(photos => {
				res.send(photos);
			}).catch(err => { 
        err.includes("No such file or directory") ? res.status(400).send() : res.status(500).send({error: err});
      });
		}
		else { 
			directoryService.getPhotoList(directory, recursive).then(photos => {
				res.send(photos);
			}).catch(err => { 
        err.includes("No such file or directory") ? res.status(400).send() : res.status(500).send({error: err});
      });
		}
	}
	else if (file !== '') {
    directoryService.getPhotoMetaData(file).then(photo => {
      imgFolder.movePhotoToImageFolder(file).then(() => {
        res.status(200).send(photo);
      }).catch(err => {
        res.status(500).send({error: err});
      });
    }).catch(err => { 
      err.includes("File not found") ? res.status(400).send() : res.status(500).send({error: err});
    });
	}
	else {
		res.status(400).send({error: 'dir or file query param required'});
	}
});

// Check if photo is available in the public folder
router.get('/photo-available', async function(req, res) {
  let name = req.query.name || '';
  if (name) {
    imgFolder.isPhotoAvailable(name).then(result => {
      res.send(result);
    }).catch(err => { 
      res.status(500).send({error: err.message}); 
    });
  }
  else {
    res.status(400).send('name query parameter required');
  }
});

// Update a photos metadata
router.post('/photo', function (req, res) {
  const metadata = req.body;
  if (!datetimeUtils.isValidDate(metadata.date)) {
    res.status(400).send('invalid date');
  }
  else if (!datetimeUtils.isValidTime(metadata.time)) {
    res.status(400).send('invalid time');
  }
  else if (!datetimeUtils.isValidOffset(metadata.tzOffset)) {
    res.status(400).send('invalid timezone offset');
  }
  else if (!coordinatesUtils.isValidCoordinates(metadata.latitude, metadata.longitude)) {
    res.status(400).send('invalid coordinates');
  }
  else if (!coordinatesUtils.isValidElevation(metadata.elevation)) {
    res.status(400).send('invalid elevation');
  }
  else {
    exifSvc.setMetadata(metadata).then((response) => {
      res.status(200).send(response);
    }).catch(err => {
      res.status(500).send(err.message);
    });
  }
});

// Get map provider API key
router.get('/maps-api-key', async function (req, res) {
  const apiProvider = req.query.provider || process.env.MAPS_API || 'BING';
  let apiKey = '';
  switch (apiProvider.toUpperCase()) {
    case 'GOOGLE':
      apiKey = process.env.GOOGLE_API_KEY || '';
      break;
    default:
      apiKey = process.env.BING_API_KEY || '';
  }
  if (apiKey !== '') {
    res.status(200).send({'provider': apiProvider.toUpperCase(), 'key': apiKey});
  }
  else {
    res.status(400).send('No maps API key for '+apiProvider+' in .env file!');
  }
});

// Calculate timezone offset from coordinates and datetime info
router.get('/calculate-timezone', async function (req, res) {
  const long = req.query.lon;
  const lati = req.query.lat;
  const date = req.query.date;
  const time = req.query.time;

  if (!datetimeUtils.isValidDate(date)) {
    res.status(400).send('invalid date');
  }
  else if (!datetimeUtils.isValidTime(time)) {
    res.status(400).send('invalid time');
  }
  else if (!coordinatesUtils.isValidCoordinates(lati, long)) {
    res.status(400).send('invalid coordinates');
  }
  else {
    bingMapsApi.getTzOffsetFromCoordinates(lati, long, date, time).then(offset => {
      res.status(200).send(datetimeUtils.encodeOffset(offset));
    }).catch(err => {
      res.status(500).send(err.message);
    });
  }
});

module.exports = router;