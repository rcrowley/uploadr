events.photos = {

	// Event handler for clicking anywhere in the photos pane
	click: function(e) {

		// Save old metadata
		if (1 == photos.selected.length) {
			meta.save(photos.selected[0]);
		} else if (1 < photos.selected.length) {
			meta.abandon();
		}
	
		// If we clicked on an image
		if (e.target.src) {
			var img = e.target;
	
			// Figure out what photos should be in photos.selected

			// Without modifier keys, start with nothing selected
			if (!(e.shiftKey || e.ctrlKey || e.metaKey)) {
				var imgs = document.getElementById('list').getElementsByTagName('img');
				var ii = imgs.length;
				for (var i = 0; i < ii; ++i) {
					imgs[i].className = '';
				}
				photos.selected = [];
			}

			// Get the ID of the photo clicked
			var id = parseInt(img.parentNode.id.replace('photo', ''));

			// If shift is held, select every image between the image clicked and the image
			// last clicked
			if (null != photos.last && e.shiftKey) {
				var inc = id < photos.last ? 1 : -1;
				for (var i = id; i != photos.last; i += inc) {
					try {
						var p = document.getElementById('photo' + i);
						if ('' == p.firstChild.className) {
							p.firstChild.className = 'selected';
							photos.selected.push(i);
						}
					} catch (err) {}
				}
			}

			// If ctrl or command is held, select or deselect this without changing others
			else if (e.ctrlKey || e.metaKey) {
				if ('' == img.className) {
					img.className = 'selected';
					photos.selected.push(id);
				} else {
					img.className = '';
					var tmp = photos.selected;
					photos.selected = [];
					var ii = tmp.length;
					for (var i = 0; i < ii; ++i) {
						if (tmp[i] != id) {
							photos.selected.push(tmp[i]);
						}
					}
				}
			}

			// If this was just plain clicked, select it
			else {
				img.className = 'selected';
				photos.selected = [id];
			}

			// Save the image last clicked
			photos.last = id;
	
			// Update the metadata pane
			if (1 == photos.selected.length) {
				meta.load(photos.selected[0]);
				meta.enable();
			} else {
				meta.batch();
			}

			// Enable toolbar buttons for selected images
			document.getElementById('t_remove').className = 'enabled';
			document.getElementById('t_rotate_l').className = 'enabled';
			document.getElementById('t_rotate_r').className = 'enabled';
	
		}
	
		// If we clicked on whitespace, hide the thumbnail and metadata, and disable buttons
		else {
			photos.selected = [];
			var imgs = document.getElementsByTagName('img');
			var ii = imgs.length;
			for (var i = 0; i < ii; ++i) {
				imgs[i].className = '';
			}
			var meta_div = document.getElementById('meta_div');
			while (meta_div.hasChildNodes()) {
				meta_div.removeChild(meta_div.firstChild);
			}
			meta.disable();
			document.getElementById('t_remove').className = 'disabled';
			document.getElementById('t_rotate_l').className = 'disabled';
			document.getElementById('t_rotate_r').className = 'disabled';
		}

	},

	// Anchor point for drag-select
	anchor: null,

	// Indicator for the state-of-the-drag
	//   0: Not dragging
	//   1: Clicking to starting drag, but maybe just clicking
	//   2: Actually dragging
	dragging: 0,

	// References to the 4 drag followers
	followers: null,
	follower_img: null,

	// Initiate a drag
	mousedown: function(e) {

		// Clicking on a single photo will do drag-reordering
		if (e.target.src) {
			if ('selected' != e.target.className) {
				var imgs = document.getElementById('list').getElementsByTagName('img');
				var ii = imgs.length;
				for (var i = 0; i < ii; ++i) {
					imgs[i].className = '';
				}
				photos.selected = [parseInt(e.target.parentNode.id.replace('photo', ''))];
			}
			events.photos.dragging = 1;
		}

		// Clicking whitespace will start the drag-select
		else {
			events.photos.anchor = {
				x: e.clientX + uploadr.conf.OFFSET_X,
				y: e.clientY + uploadr.conf.OFFSET_Y
			};
			var ds = document.getElementById('drag_select');
			ds.style.left = events.photos.anchor.x + 'px';
			ds.style.top = events.photos.anchor.y + 'px';
			ds.style.width = '1px';
			ds.style.height = '1px';
			ds.style.display = 'block';
		}

	},

	// Keep dragging
	mousemove: function(e) {

		// If we're reordering
		if (null == events.photos.anchor) {

			// Once the user starts the drag, give feedback
			if (1 == events.photos.dragging) {

				// Make the selected photos look like they're being dragged
				for each (var id in photos.selected) {
					document.getElementById('photo' + id).getElementsByTagName(
						'img')[0].className = 'selected dragging';
				}

				events.photos.dragging = 2;
			}

			// As the user is dragging, update the feedback
			if (2 == events.photos.dragging) {

				// Get references to the followers
				if (null == events.photos.followers) {
Components.utils.reportError('followers');
					events.photos.followers = [
						document.getElementById('drag_follower_0'),
						document.getElementById('drag_follower_1'),
						document.getElementById('drag_follower_2'),
						document.getElementById('drag_follower_3')
					];
				}

				// Only set background images on the first pass
				var f = events.photos.followers;
				var img = events.photos.follower_img;
				if (null == img) {
Components.utils.reportError('follower_img');
					events.photos.follower_img = document.getElementById('photo' +
						photos.selected[0]).getElementsByTagName('img')[0];
					img = events.photos.follower_img;
					for each (var _f in f) {
//						_f.style.backgroundImage = 'url(' + img.src + ')';
					}	
				}

				// Common sizes
				var left = 	Math.floor(e.clientX + uploadr.conf.OFFSET_X - (img.width / 2));
				var middle = Math.floor(e.clientY + uploadr.conf.OFFSET_Y);
				var width = Math.ceil(img.width / 2);
				var height = Math.ceil(img.height / 2);

				f[0].style.left = left + 'px';
				f[0].style.top = Math.floor(e.clientY + uploadr.conf.OFFSET_Y -
					(img.height / 2)) + 'px';
				f[0].style.width = img.width + 'px';
				f[0].style.height = height + 'px';
				f[0].style.display = 'block';

				f[1].style.left = left + 'px';
				f[1].style.top = middle + 'px';
				f[1].style.width = (width - 1) + 'px';
				f[1].style.height = (height + 1) + 'px';
				f[1].style.display = 'block';

				f[2].style.left = Math.floor(e.clientX + uploadr.conf.OFFSET_X - 1) + 'px';
				f[2].style.top = (middle + 1) + 'px';
				f[2].style.width = '1px';
				f[2].style.height = height + 'px';
				f[2].style.display = 'block';

				f[3].style.left = Math.floor(e.clientX + uploadr.conf.OFFSET_X) + 'px';
				f[3].style.top = middle + 'px';
				f[3].style.width = (width - 1) + 'px';
				f[3].style.height = (height + 1) + 'px';
				f[3].style.display = 'block';

				// Get the list item we're hovering over
				var target;
				if ('div' == e.target.nodeName) {
					target = document.getElementById('list').lastChild;
				} else if ('img' == e.target.nodeName) {
					target = e.target.parentNode;
				} else {
					target = e.target;
				}
//Components.utils.reportError(target);

				// Don't place the target in the middle of a bunch of selected elements
				if (-1 != target.className.indexOf('selected')) {
					///
				}

				// Show indicator of drop position
//				target.style.borderRight = '2px solid black';

			}

		}

		// If we're selecting
		else {
			const OFFSET_X = uploadr.conf.OFFSET_X;
			const OFFSET_Y = uploadr.conf.OFFSET_Y;
			var ds = document.getElementById('drag_select');

			// Invert positions if necessary
			if (events.photos.anchor.x > e.clientX + OFFSET_X) {
				ds.style.left = (e.clientX + OFFSET_X) + 'px';
			}
			if (events.photos.anchor.y > e.clientY + OFFSET_Y) {
				ds.style.top = (e.clientY + OFFSET_Y) + 'px';
			}

			// New width and height
			ds.style.width = Math.abs(e.clientX + OFFSET_X - events.photos.anchor.x) + 'px';
			ds.style.height = Math.abs(e.clientY + OFFSET_Y - events.photos.anchor.y) + 'px';

			// Actually find photos in the box
			findr.bounding_box(events.photos.anchor.x, events.photos.anchor.y,
				e.clientX + OFFSET_X, e.clientY + OFFSET_Y);

		}

	},

	// Finish a drag
	mouseup: function(e) {

		// If we're reordering
		if (null == events.photos.anchor) {
			if (2 == events.photos.dragging) {

				// Stop giving drag feedback
				for each (var id in photos.selected) {
					document.getElementById('photo' + id).getElementsByTagName(
						'img')[0].className = 'selected';
				}
				for each (var f in events.photos.followers) {
					f.style.display = 'none';
				}
				events.photos.follower_img = null;

			}
			events.photos.dragging = 0;
		}

		// If we're selecting, finalize the selection
		else {

			// Kill the bounding box
			var ds = document.getElementById('drag_select');
			ds.style.width = '1px';
			ds.style.height = '1px';
			ds.style.display = 'none';

			// Save old metadata
			if (1 == photos.selected.length) {
				meta.save(photos.selected[0]);
			} else if (1 < photos.selected.length) {
				meta.abandon();
			}

			// Find new selection
			var p = photos.list;
			photos.selected = [];
			for (var i = p.length; i >= 0; --i) {
				if (null != p[i]) {
					var img = document.getElementById('photo' + i).getElementsByTagName('img')[0];
					if ('selecting' == img.className) {
						img.className = 'selected';
						photos.selected.push(i);
					} else {
						img.className = '';
					}
				}
			}
			if (0 == photos.selected.length) {
				events.photos.click({target: {}});
			} else {
				if (1 == photos.selected.length) {
					meta.load(photos.selected[0]);
					meta.enable();
				} else {
					meta.batch();
				}
				document.getElementById('t_remove').className = 'enabled';
				document.getElementById('t_rotate_l').className = 'enabled';
				document.getElementById('t_rotate_r').className = 'enabled';
			}

		}

		events.photos.anchor = null;
	},

	// Properly enable/disable the checkboxes available for private photos to be shared with
	// friends and/or family
	is_public: function(value) {
		if (1 == parseInt(value)) {
			document.getElementById('single_is_friend').checked = false;
			document.getElementById('single_is_family').checked = false;
			document.getElementById('single_is_friend').disabled = true;
			document.getElementById('single_is_family').disabled = true;
		} else {
			document.getElementById('single_is_friend').disabled = false;
			document.getElementById('single_is_family').disabled = false;
		}
	},
	batch_is_public: function(value) {
		if (1 == parseInt(value)) {
			document.getElementById('batch_is_friend').checked = false;
			document.getElementById('batch_is_family').checked = false;
			document.getElementById('batch_is_friend').disabled = true;
			document.getElementById('batch_is_family').disabled = true;
		} else {
			document.getElementById('batch_is_friend').disabled = false;
			document.getElementById('batch_is_family').disabled = false;
		}
	},

	// Display the other metadata fields
	toggle: function() {
		var primary = document.getElementById('meta_primary');
		var secondary = document.getElementById('meta_secondary');
		if ('none' == primary.style.display) {
			primary.style.display = '-moz-box';
			secondary.style.display = 'none';
		} else {
			primary.style.display = 'none';
			secondary.style.display = '-moz-box';
		}
	},
	privacy: function() {
		var prefix = '';
		if (1 < photos.selected.length) {
			prefix = 'batch_'
		}
		var privacy = document.getElementById(prefix + 'meta_privacy');
		var melons = document.getElementById(prefix + 'meta_melons');
		melons.style.display = 'none';
		if ('none' == privacy.style.display) {
			privacy.style.display = '-moz-box';
		} else {
			privacy.style.display = 'none';
		}
	},
	melons: function() {
		var prefix = '';
		if (1 < photos.selected.length) {
			prefix = 'batch_'
		}
		var privacy = document.getElementById(prefix + 'meta_privacy');
		var melons = document.getElementById(prefix + 'meta_melons');
		privacy.style.display = 'none';
		if ('none' == melons.style.display) {
			melons.style.display = '-moz-box';
		} else {
			melons.style.display = 'none';
		}
	},

	// Track whether a partial batch was changed
	batch_is_public_change: function() {
		document.getElementById('batch_is_public_unchanged').checked = false;
	},
	batch_content_type_change: function() {
		document.getElementById('batch_content_type_unchanged').checked = false;
	},
	batch_hidden_change: function() {
		document.getElementById('batch_hidden_unchanged').checked = false;
	},
	batch_safety_level_change: function() {
		document.getElementById('batch_safety_level_unchanged').checked = false;
	}

};