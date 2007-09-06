var photos = {

	// Storage
	list: [],
	count: 0,
	selected: [],
	last: null,
	unsaved: false,

	// Batch size limiting
	batch_size: 0,
	reached_limit: false,

	// Upload tracking
	uploading: [],
	current: 0,
	uploaded: [],
	add_to_set: [],
	failed: [],
	total: 0,
	ok: 0,
	fail: 0,

	// Let the user select some files, thumbnail them and track them
	add: function() {
		document.getElementById('button_upload').disabled = true;
		var fp = Cc['@mozilla.org/filepicker;1'].createInstance(Ci.nsIFilePicker);
		fp.init(window, locale.getString('dialog.add'),
			Ci.nsIFilePicker.modeOpenMultiple);
		fp.appendFilters(Ci.nsIFilePicker.filterImages);
		var res = fp.show();
		if (Ci.nsIFilePicker.returnOK == res) {
			var files = fp.files;
			while (files.hasMoreElements()) {
				photos._add(files.getNext().QueryInterface(Ci.nsILocalFile).path);
			}

			// After the last file is added, sort the images by date taken
			threads.worker.dispatch(new Sort(), threads.worker.DISPATCH_NORMAL);

		} else if (photos.count) {
			document.getElementById('button_upload').disabled = false;
		}
	},
	_add: function(path) {

		// Add the original image to the list and set our status
		var id = photos.list.length;
		photos.list.push(new Photo(id, path));
		++photos.count;
		photos.unsaved = true;

		// Create a spot for the image, leaving a spinning placeholder
		//   Add images to the start of the list because this is our best guess for ordering
		//   newest to oldest
		var img = document.createElementNS(NS_HTML, 'img');
		img.className = 'loading';
		img.setAttribute('width', 32);
		img.setAttribute('height', 32);
		img.src = 'chrome://uploadr/skin/loading.gif';
		var li = document.createElementNS(NS_HTML, 'li');
		li.id = 'photo' + id;
		li.appendChild(img);
		var list = document.getElementById('list');
		list.insertBefore(li, list.firstChild);

		// Create and show the thumbnail
		threads.worker.dispatch(new Thumb(id, uploadr.conf.thumbSize, path),
			threads.worker.DISPATCH_NORMAL);

	},

	// Rotate selected files
	rotate: function(degrees) {

		// Prevent silliness
		var s = photos.selected;
		var ii = s.length;
		if (0 == ii) {
			return;
		}
		if (1 < ii && !confirm(locale.getString('rotate.confirm'),
			locale.getString('rotate.confirm.title'))) {
			return;
		}

		// For each selected image, show the loading spinner and dispatch the rotate job
		for (var i = 0; i < ii; ++i) {
			var p = photos.list[s[i]];
			var img = document.getElementById('photo' + p.id).getElementsByTagName('img')[0];
			img.className += ' loading';
			img.setAttribute('width', 32);
			img.setAttribute('height', 32);
			img.src = 'chrome://uploadr/skin/loading.gif';
			threads.worker.dispatch(new Rotate(p.id, degrees, uploadr.conf.thumbSize,
				p.path), threads.worker.DISPATCH_NORMAL);
		}

	},

	// Upload photos
	upload: function() {

		// If any photos need resizing to fit in the per-photo size limits, dispatch the
		// jobs and wait
		var resizing = false;
		for each (var p in photos.list) {
			if (null != p) {
				if (null != settings.resize && -1 != settings.resize &&
					p.square > settings.resize) {
					resizing = true;
					threads.worker.dispatch(new Resize(p.id, settings.resize, p.path),
						threads.worker.DISPATCH_NORMAL);
				} else if (uploadr.fsize(p.path) > users.filesize && p.square > settings.resize) {
					resizing = true;
					threads.worker.dispatch(new Resize(p.id, -1, p.path),
						threads.worker.DISPATCH_NORMAL);
				}
			}
		}
		if (resizing) {
			threads.worker.dispatch(new RetryUpload(), threads.worker.DISPATCH_NORMAL);
			return;
		}

		// Decide if we're already in the midst of an upload
		var not_started = 0 == photos.uploading.length;

		// Take the list of photos into upload mode and reset the UI
		for each (var p in photos.list) {
			photos.uploading.push(p);
		}
		photos.list = [];
		document.getElementById('button_upload').disabled = true;
		photos.selected = [];
		photos.last = null;
		photos.unsaved = false;
		var list = document.getElementById('list');
		while (list.hasChildNodes()) {
			list.removeChild(list.firstChild);
		}

		// Find out how many photos we actually have
		photos.total = 0;
		var ii = photos.uploading.length;
		for (var i = 0; i < ii; ++i) {
			if (null != photos.uploading[i]) {
				++photos.total;
			}
		}

		// Update the UI
		status.set(locale.getString('status.uploading'));

		// Kick off the first batch job if we haven't started
		if (not_started) {
			for (var i = 0; i < ii; ++i) {
				if (null != photos.uploading[i]) {
					upload(i);
					break;
				}
			}
		}

	}

};

// Photo properties
var Photo = function(id, path) {
	this.id = id;
	this.date_taken = '';
	this.path = path;
	var filename = path.match(/([^\/\\]*)$/);
	if (null == filename) {
		this.filename = '';
	} else {
		this.filename = filename[1];
	}
	this.square = 0;
	this.title = '';
	this.description = '';
	this.tags = '';
	this.is_public = settings.is_public;
	this.is_friend = settings.is_friend;
	this.is_family = settings.is_family;
	this.content_type = settings.content_type;
	this.safety_level = settings.safety_level;
	this.hidden = settings.hidden;
};