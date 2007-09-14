#include "gm_impl.h"
#include "Magick++.h"
#include <stdlib.h>
#include <iostream>
#include <sstream>
#include <string>
#include <sys/stat.h>
#include "nsCOMPtr.h"
#include "nsDirectoryServiceUtils.h"
#include "nsIFile.h"
#ifdef XP_MACOSX
#include <mach-o/dyld.h>
#endif

// Fake gettimeofday on Windows
#ifdef XP_WIN
#include <windows.h>
#if defined(_MSC_VER) || defined(_MSC_EXTENSIONS)
#define DELTA_EPOCH_IN_MICROSECS  11644473600000000Ui64
#else
#define DELTA_EPOCH_IN_MICROSECS  11644473600000000ULL
#endif
struct timezone {
	int  tz_minuteswest;
	int  tz_dsttime;
};
int gettimeofday(struct timeval *tv, struct timezone *tz) {
	FILETIME ft;
	unsigned __int64 tmpres = 0;
	static int tzflag;
	if (NULL != tv) {
		GetSystemTimeAsFileTime(&ft);
		tmpres |= ft.dwHighDateTime;
		tmpres <<= 32;
		tmpres |= ft.dwLowDateTime;
		tmpres -= DELTA_EPOCH_IN_MICROSECS;
		tmpres /= 10;
		tv->tv_sec = (long)(tmpres / 1000000UL);
		tv->tv_usec = (long)(tmpres % 1000000UL);
	}
	if (NULL != tz) {
		if (!tzflag) {
			_tzset();
			tzflag++;
		}
		tz->tz_minuteswest = _timezone / 60;
		tz->tz_dsttime = _daylight;
	}
	return 0;
}
#else
#include <sys/time.h>
#endif

#define round(n) (int)(0 <= (n) ? (n) + 0.5 : (n) - 0.5)

using namespace std;
using namespace Magick;

// Get the path as a normal std::string
//   Gotta find a better way to do this
string * conv_str(const nsAString & nsa) {
	char * s = 0;
	s = new char[nsa.Length() + 1];
	if (0 == s) return 0;
	char * tmp = s;
	const PRUnichar * start = nsa.BeginReading();
	const PRUnichar * end = nsa.EndReading();
	while (start != end) {
		*tmp++ = (char)*start++;
	}
	*tmp = 0;
	string * str = new string(s);
	delete [] s; s = 0;
	return str;
}

// Find a path for the new image file
string * find_path(string * path_str, const char * extra) {
	if (0 == path_str || 0 == extra) {
		return 0;
	}
	string * dir_str = 0;
	try {
		nsCOMPtr<nsIFile> dir_ptr;
		nsresult nsr = NS_GetSpecialDirectory("ProfD", getter_AddRefs(dir_ptr));
		if (NS_FAILED(nsr)) {
			return 0;
		}
		dir_ptr->AppendNative(NS_LITERAL_CSTRING("images"));
		PRBool dir_exists = PR_FALSE;
		dir_ptr->Exists(&dir_exists);
		if (!dir_exists) {
			dir_ptr->Create(nsIFile::DIRECTORY_TYPE, 0770);
		}
		nsString dir;
		dir_ptr->GetPath(dir);
		dir_str = conv_str(dir);
		if (0 == dir_str) {
			return 0;
		}
#ifdef XP_WIN
		dir_str->append(path_str->substr(path_str->rfind('\\')));
#else
		dir_str->append(path_str->substr(path_str->rfind('/')));
#endif
		size_t period = dir_str->rfind('.');
		dir_str->insert(period, extra);
		ostringstream index;
		string dir_str_save(*dir_str);
		int i = 0;
		struct stat st;
		while (0 == stat(dir_str->c_str(), &st)) {
			index.str("");
			index << ++i;
			*dir_str = dir_str_save;
			dir_str->insert(dir_str->rfind('.'), index.str());
		}
		return dir_str;
	} catch (Exception &) {
		delete dir_str;
		return 0;
	}
}

// Orient an image's pixels as EXIF instructs
int base_orient(Image & img) {
	string orientation = img.attribute("EXIF:Orientation");
	int orient = (unsigned int)*orientation.c_str() - 0x30;
	if (1 > orient || 8 < orient) {
		orient = 1;
	}
	if (2 == orient) {
		img.flop();
	} else if (3 == orient) {
		img.rotate(180);
	} else if (4 == orient) {
		img.flip();
	} else if (5 == orient) {
		img.flop();
		img.rotate(-90);
	} else if (6 == orient) {
		img.rotate(90);
	} else if (7 == orient) {
		img.flip();
		img.rotate(90);
	} else if (8 == orient) {
		img.rotate(-90);
	}
	return orient * (orient >= 5 ? -1 : 1);
}

NS_IMPL_ISUPPORTS1(CGM, IGM)

CGM::CGM() {
#ifdef XP_MACOSX
	char path[1024];
	unsigned int size = 1024;
	_NSGetExecutablePath(&path[0], &size);
	InitializeMagick(&path[0]);
#endif
}

CGM::~CGM() {
}

// Setting and getting my name
//   Required?
/*
NS_IMETHODIMP CGM::GetName(nsAString & aName) {
	aName.Assign(mName);
	return NS_OK;
}
NS_IMETHODIMP CGM::SetName(const nsAString & aName) {
	mName.Assign(aName);
	return NS_OK;
}
*/

//
// GM interface
//

// Create a thumbnail of the image, preserving aspect ratio
NS_IMETHODIMP CGM::Thumb(PRInt32 square, const nsAString & path, nsAString & _retval) {
	string * path_str = 0;
	string * thumb_str = 0;
	try {

		path_str = conv_str(path);
		if (0 == path_str) {
			return NS_ERROR_INVALID_ARG;
		}

		// Orient the image properly and return the orientation
		Image img(*path_str);
		ostringstream out;

		struct timeval first;
		gettimeofday(&first, 0);

		int orient = base_orient(img);

		struct timeval last;
		gettimeofday(&last, 0);
		double runtime = ((double)last.tv_sec + (double)last.tv_usec / 1000000) -
			((double)first.tv_sec - (double)first.tv_usec / 1000000);
		ostringstream run;
		run << runtime << "x";
		string run_str = run.str();
		char * foo = (char *)run_str.c_str();
		int i = 0;
		while (*foo) {
			_retval.Insert(*foo, i++);
			++foo;
		}

		out << orient << "x";

		// Get the original size
		int bw, bh;
		if (0 < orient) {
			bw = img.baseColumns();
			bh = img.baseRows();
		} else {
			bw = img.baseRows();
			bh = img.baseColumns();
		}
		int base = bw > bh ? bw : bh;
		out << bw << "x" << bh << "x";

		// Get EXIF date taken
		string date_taken = img.attribute("EXIF:DateTimeOriginal");
		if (0 == date_taken.size()) {
			date_taken = img.attribute("EXIF:DateTimeDigitized");
		}
		if (0 == date_taken.size()) {
			date_taken = img.attribute("EXIF:DateTime");
		}
		out << date_taken << "x";

		// Find thumbnail width and height
		float r;
		ostringstream dim;
		if (bw > bh) {
			r = (float)bh * (float)square / (float)bw;
			out << square << "x" << round(r);
			dim << square << "x" << round(r);
		} else {
			r = (float)bw * (float)square / (float)bh;
			out << round(r) << "x" << square;
			dim << round(r) << "x" << square;
		}

		// Create a new path
		thumb_str = find_path(path_str, "-thumb");
		if (0 == thumb_str) {
			return NS_ERROR_NULL_POINTER;
		}
		delete path_str; path_str = 0;
		out << *thumb_str;

		// Find the sharpen sigma as in flickr/include/daemon_new.js
		double sigma;
		if (base <= 800) {
			sigma = 1.9;
		} else if (base <= 1600) {
			sigma = 2.85;
		} else {
			sigma = 3.8;
		}

		// Create the actual thumbnail
		img.scale(dim.str());
		img.sharpen(1, sigma);
		img.compressType(NoCompression);
		img.write(*thumb_str);

		// If all went well, return stuff
		string o_str = out.str();
		delete thumb_str; thumb_str = 0;
		char * o = (char *)o_str.c_str();
		while (*o) {
			_retval.Append(*o);
			++o;
		}

		return NS_OK;
	}

	// Otherwise yell about it
	catch (Exception & e) {
		delete path_str;
		delete thumb_str;
		char * o = (char *)e.what();
		while (*o) {
			_retval.Append(*o);
			++o; 
		}
	}
	return NS_OK;

}

// Create a thumbnail of the image, preserving aspect ratio
NS_IMETHODIMP CGM::Rotate(PRInt32 degrees, const nsAString & path, nsAString & _retval) {
	string * path_str = 0;
	string * rotate_str = 0;
	try {

		// Don't rotate 0 degrees
		if (0 == degrees) {
			_retval.Append('o');
			_retval.Append('k');
			return NS_OK;
		}

		path_str = conv_str(path);
		if (0 == path_str) {
			return NS_ERROR_INVALID_ARG;
		}

		// Create a new path
		rotate_str = find_path(path_str, "-rotate");
		if (0 == rotate_str) {
			return NS_ERROR_NULL_POINTER;
		}

		// Rotate the image
		//   TODO: Save EXIF and IPTC profiles
		Image img(*path_str);
		base_orient(img);
		img.rotate(degrees);
		img.compressType(NoCompression);
		img.write(*rotate_str);
		delete path_str; path_str = 0;

		// If all went well, return stuff
		_retval.Append('o');
		_retval.Append('k');
		char * o = (char *)rotate_str->c_str();
		while (*o) {
			_retval.Append(*o);
			++o;
		}
		delete rotate_str;
		return NS_OK;
	}

	// Otherwise yell about it
	catch (Exception & e) {
		delete path_str;
		delete rotate_str;
		char * o = (char *)e.what();
		while (*o) {
			_retval.Append(*o);
			++o;
		}
	}
	return NS_OK;

}

NS_IMETHODIMP CGM::Resize(PRInt32 square, const nsAString & path, nsAString & _retval) {
	string * path_str = 0;
	string * resize_str = 0;
	try {
		path_str = conv_str(path);
		if (0 == path_str) {
			return NS_ERROR_INVALID_ARG;
		}

		// Open the image
		Image img(*path_str);
		int bw = img.baseColumns(), bh = img.baseRows();
		int base = bw > bh ? bw : bh;

		// In the special -1 case, find the next-smallest size to scale to
		if (-1 == square) {
			if (base > 2048) {
				square = 2048;
			} else if (base > 1600) {
				square = 1600;
			} else if (base > 1280) {
				square = 1280;
			} else {
				square = 800;
			}
		}

		// Don't resize if we're already that size
		if (base <= square) {
			_retval = path;
			return NS_OK;
		}

		// Find resized width and height
		float r;
		ostringstream out;
		if (bw > bh) {
			r = (float)bh * (float)square / (float)bw;
			out << square << "x" << round(r);
		} else {
			r = (float)bw * (float)square / (float)bh;
			out << round(r) << "x" << square;
		}
		string dim(out.str());

		// Create a new path
		resize_str = find_path(path_str, "-resize");
		if (0 == resize_str) {
			return NS_ERROR_NULL_POINTER;
		}
		delete path_str; path_str = 0;
		out << *resize_str;

		// Find the sharpen sigma as in flickr/include/daemon_new.js
		//   Which is dumb, because right now it's just 0.95
		double sigma = 0.95;

		// Resize the image
		//   TODO: Save EXIF and IPTC profiles
		img.scale(dim);
		img.sharpen(1, sigma);
		img.compressType(NoCompression);
		img.write(*resize_str);

		// If all went well, return stuff
		string o_str = out.str();
		delete resize_str; resize_str = 0;
		char * o = (char *)o_str.c_str();
		while (*o) {
			_retval.Append(*o);
			++o;
		}
		return NS_OK;
	}

	// Otherwise yell about it
	catch (Exception & e) {
		delete path_str;
		delete resize_str;
		char * o = (char *)e.what();
		while (*o) {
			_retval.Append(*o);
			++o;
		}
	}
	return NS_OK;

}