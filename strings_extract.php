<?

	# Get the project name
	if (isset($argv[1])) {
		$project = preg_replace('/[^a-z0-9_]/i', '', $argv[1]);
	} else {
		die("Usage: $argv[0] <project> [<locale-path>]\n");
	}

	# Get a specific path, if passed
	$dir = dirname(__FILE__);
	if (isset($argv[2])) {
		$locale = $argv[2];
	} else {
		$locale = "$dir/MacUploadr.app/Contents/Resources/chrome/locale/en-US";
	}

	#
	# find files we care about
	#

	$dh = opendir($locale);
	while (($file = readdir($dh)) !== false){

		if (preg_match('!\.dtd!', $file)){ do_dtd($file); }
		if (preg_match('!\.properties!', $file)){ do_props($file); }
	}
	closedir($dh);

	##############################################################################################

	function do_dtd($file){

		global $locale, $str_hash, $dir, $project;

		$content = implode(file("$locale/$file"));

		$str_hash = array();

		$content = preg_replace_callback('!ENTITY ([a-z0-9._]+) "([^"]+)"!', 'markup_dtd',
			$content);

		$content .= "\n\n";

		foreach ($str_hash as $k => $v){

			$v = implode('{TOKEN}', $v);
			$content .= "<!ENTITY $k.joined \"<!! dev=\"$project\">$v</!!>\">\n";
		}

		$fh = fopen("$dir/ext_{$project}_{$file}.txt", 'w');
		fwrite($fh, $content);
		fclose($fh);

		echo "wrote $dir/ext_{$project}_{$file}.txt\n";
	}

	function markup_dtd($m){

		global $project;

		if (preg_match('!^(.*)\.(\d+)$!', $m[1], $m2)){

			if ($m2[2] < 10){

				$GLOBALS[str_hash][$m2[1]][$m2[2]] = $m[2];

				return "ENTITY $m[1] \"$m[2]\"";
			}
		}

		return "ENTITY $m[1] \"<!! dev=\"$project\">$m[2]</!!>\"";
	}

	##############################################################################################

	function do_props($file){

		global $locale, $dir, $project;

		$content = implode(file("$locale/$file"));

		$content = preg_replace('!^([a-z0-9._]+)=(.*)$!m', "$1=<!! dev=\"$project\">$2</!!>",
			$content);

		$fh = fopen("$dir/ext_{$project}_{$file}.txt", 'w');
		fwrite($fh, $content);
		fclose($fh);

		echo "wrote $dir/ext_{$project}_{$file}.txt\n";
	}

	##############################################################################################

?>
