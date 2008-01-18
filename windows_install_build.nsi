;
; Flickr Uploadr
;
; Copyright (c) 2007 Yahoo! Inc.  All rights reserved.  This library is free
; software; you can redistribute it and/or modify it under the terms of the
; GNU General Public License (GPL), version 2 only.  This library is
; distributed WITHOUT ANY WARRANTY, whether express or implied. See the GNU
; GPL for more details (http://www.gnu.org/licenses/gpl.html)
;

; Compile-Time Variables:
; VERSION_DATE - yyyy.mm.dd.##
; VERSION - #.#.#
; VERSION_SHORT - #.#

!include "MUI.nsh"
!include "LogicLib.nsh"

!define MUI_ABORTWARNING
!define MUI_HEADERIMAGE

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
Page custom CustomPageA
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH



;
; Strings and intl and burritos
;

!macro LANG_LOAD LANGLOAD
	!insertmacro MUI_LANGUAGE "${LANGLOAD}"
	!include "windows_install_lang\${LANGLOAD}.nsh"
!macroend
!macro LANG_STRING NAME VALUE
	LangString "${NAME}" "${LANG_${LANG}}" "${VALUE}"
!macroend

;!insertmacro LANG_LOAD "German"
!insertmacro LANG_LOAD "English"
;!insertmacro LANG_LOAD "Spanish"
;!insertmacro LANG_LOAD "French"
;!insertmacro LANG_LOAD "Italian"
;!insertmacro LANG_LOAD "Korean"
;!insertmacro LANG_LOAD "PortugueseBR"
;!insertmacro LANG_LOAD "TradChinese"



;
; Version-y bits
;

Name "$(title_version)"
Caption "$(title_version_short_inst)"

OutFile "FlickrUploadr-${VERSION}-XX.exe"
XPStyle on

InstallDir "$PROGRAMFILES\Flickr Uploadr"

InstallDirRegKey HKCU "Software\Flickr Uploadr" ""

VIProductVersion "${VERSION_DATE}"
VIAddVersionKey "CompanyName" "Flickr"
VIAddVersionKey "LegalCopyright" "$(copyright)"
VIAddVersionKey "FileDescription" "$(title_version)"
VIAddVersionKey "FileVersion" "${VERSION_DATE}"



ReserveFile "io-${LANG}.ini"
!insertmacro MUI_RESERVEFILE_INSTALLOPTIONS

Var INI_VALUE

Section "Install" SecInstall

	SetOutPath "$INSTDIR"

	SetOverwrite on  

	; Chrome
	CreateDirectory "$INSTDIR\chrome"
	CreateDirectory "$INSTDIR\chrome\icons"
	CreateDirectory "$INSTDIR\chrome\icons\default"
	File /oname=chrome\icons\default\main.ico MacUploadr.app\Contents\Resources\chrome\icons\default\main.ico
	File /oname=chrome\icons\default\updates.ico MacUploadr.app\Contents\Resources\chrome\icons\default\updates.ico
	File /oname=chrome\uploadr.jar MacUploadr.app\Contents\Resources\chrome\uploadr.jar
	File /oname=chrome\chrome.manifest MacUploadr.app\Contents\Resources\chrome\chrome.manifest.prod

	; XPCOM components
	CreateDirectory "$INSTDIR\components"
	File /oname=components\gm.dll MacUploadr.app\Contents\Resources\components\gm.dll
	File /oname=components\flIGM.xpt MacUploadr.app\Contents\Resources\components\flIGM.xpt
	File /oname=components\key.dll MacUploadr.app\Contents\Resources\components\key.dll
	File /oname=components\flIKey.xpt MacUploadr.app\Contents\Resources\components\flIKey.xpt
	File /oname=components\clh.js MacUploadr.app\Contents\Resources\components\clh.js
	File /oname=components\flICLH.xpt MacUploadr.app\Contents\Resources\components\flICLH.xpt

	; CRT
	File "C:\Program Files\Microsoft Visual Studio 8\SDK\v2.0\BootStrapper\Packages\vcredist_x86\vcredist_x86.exe"
	ExecWait '"$INSTDIR\vcredist_x86.exe" /q:a /c:"VCREDI~1.EXE /q:a /c:""msiexec /i vcredist.msi /qb!"" "'
	Delete "$INSTDIR\vcredist_x86.exe"

;	File /oname=components\msvcm80.dll "C:\Program Files\Microsoft Visual Studio 8\VC\redist\x86\Microsoft.VC80.CRT\msvcm80.dll"
;	File /oname=components\msvcp80.dll "C:\Program Files\Microsoft Visual Studio 8\VC\redist\x86\Microsoft.VC80.CRT\msvcp80.dll"
;	File /oname=components\msvcr80.dll "C:\Program Files\Microsoft Visual Studio 8\VC\redist\x86\Microsoft.VC80.CRT\msvcr80.dll"
;	File /oname=components\Microsoft.VC80.CRT.manifest "C:\Program Files\Microsoft Visual Studio 8\VC\redist\x86\Microsoft.VC80.CRT\Microsoft.VC80.CRT.manifest"

;	FindFirst $R1 $R0 "$WINDIR\WinSxS\x86_microsoft.vc80.crt_1fc8b3b9a1e18e3b_8.0.50727.42*"
;	${If} $R0 != ""
;		DetailPrint "MSVCRT 8.0 is installed in WinSxS."
;	${Else}
;		DetailPrint "MSVCRT 8.0 is not installed in WinSxS."
;		FindFirst $R1 $R0 "$WINDIR\system32\msvc*80.dll"
;		${If} $R0 != ""
;			DetailPrint "MSVCRT 8.0 is installed in System32."
;		${Else}

			; Copy files
;			CreateDirectory "$WINDIR\WinSxS\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd"
;			File "/oname=$WINDIR\WinSxS\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd\msvcm80.dll" "C:\WINDOWS\WinSxS\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd\msvcm80.dll"
;			File "/oname=$WINDIR\WinSxS\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd\msvcp80.dll" "C:\WINDOWS\WinSxS\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd\msvcp80.dll"
;			File "/oname=$WINDIR\WinSxS\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd\msvcr80.dll" "C:\WINDOWS\WinSxS\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd\msvcr80.dll"
;			File "/oname=$WINDIR\WinSxS\Manifests\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd.manifest" "C:\WINDOWS\WinSxS\Manifests\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd.manifest"
;			File "/oname=$WINDIR\WinSxS\Manifests\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd.cat" "C:\WINDOWS\WinSxS\Manifests\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd.cat"
;			File "/oname=$WINDIR\system32\msvcm80.dll" "C:\Program Files\Microsoft Visual Studio 8\VC\redist\x86\Microsoft.VC80.CRT\msvcm80.dll"
;			File "/oname=$WINDIR\system32\msvcp80.dll" "C:\Program Files\Microsoft Visual Studio 8\VC\redist\x86\Microsoft.VC80.CRT\msvcp80.dll"
;			File "/oname=$WINDIR\system32\msvcr80.dll" "C:\Program Files\Microsoft Visual Studio 8\VC\redist\x86\Microsoft.VC80.CRT\msvcr80.dll"
;			File "/oname=$WINDIR\system32\Microsoft.VC80.CRT.manifest" "C:\Program Files\Microsoft Visual Studio 8\VC\redist\x86\Microsoft.VC80.CRT\Microsoft.VC80.CRT.manifest"

			; Registry entries
;			WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\SideBySide\Installations\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd" "" ""
;			WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\SideBySide\Installations\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd\downlevel_manifest" "" ""
;			WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\SideBySide\Installations\x86_Microsoft.VC80.CRT_1fc8b3b9a1e18e3b_8.0.50727.42_x-ww_0de06acd\downlevel_payload" "" ""

;			File /r "C:\Program Files\Microsoft Visual Studio 8\VC\redist\x86\Microsoft.VC80.CRT"

;		${EndIf}
;	${EndIf}

	; XULRunner and friends
	File /r /x CVS MacUploadr.app\Contents\Resources\defaults
	File /r /x CVS MacUploadr.app\Contents\Resources\xulrunner
	File MacUploadr.app\Contents\Resources\application.ini
	File MacUploadr.app\Contents\Resources\LICENSE.txt
	File MacUploadr.app\Contents\Resources\icons.ico
	File MacUploadr.app\Contents\Resources\magic.mgk
	File MacUploadr.app\Contents\Resources\modules.mgk
	File MacUploadr.app\Contents\Resources\delegates.mgk
	File "MacUploadr.app\Contents\Resources\Flickr Uploadr.exe"

	WriteRegStr HKCU "Software\Flickr Uploadr" "" $INSTDIR

	WriteUninstaller "$INSTDIR\uninstall.exe"

	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr" "DisplayName" "Flickr Uploadr ${VERSION}"
	WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr" "UninstallString" '"$INSTDIR\uninstall.exe"'
	WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr" "NoModify" 1
	WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr" "NoRepair" 1

	WriteRegStr HKCR "SystemFileAssociations\image\shell\edit.FlickrUploadr" "" "$(send)"
	WriteRegStr HKCR "SystemFileAssociations\image\shell\edit.FlickrUploadr\command" "" '"$INSTDIR\Flickr Uploadr.exe" "%1"'

SectionEnd

Section "Start Menu Shortcuts"

	CreateShortCut "$SMPROGRAMS\Flickr Uploadr.lnk" "$INSTDIR\Flickr Uploadr.exe" "" "$INSTDIR\Flickr Uploadr.exe" 0

	!insertmacro MUI_INSTALLOPTIONS_READ $INI_VALUE "io-${LANG}.ini" "Field 1" "State"

	StrCmp $INI_VALUE "1" "" +2    
		CreateShortCut "$DESKTOP\Flickr Uploadr.lnk" "$INSTDIR\Flickr Uploadr.exe" "" "$INSTDIR\Flickr Uploadr.exe" 0

SectionEnd

Function .onInit
	!insertmacro MUI_INSTALLOPTIONS_EXTRACT "io-${LANG}.ini"
FunctionEnd

Function CustomPageA
	!insertmacro MUI_HEADER_TEXT "$(integ_title)" "$(integ_text)"
	!insertmacro MUI_INSTALLOPTIONS_DISPLAY "io-${LANG}.ini"
FunctionEnd

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
!insertmacro MUI_DESCRIPTION_TEXT ${SecInstall} $(inst)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

UninstallIcon ".\MacUploadr.app\Contents\Resources\icons.ico"

Section "Uninstall"

DeleteRegKey /ifempty HKCU "Software\Flickr Uploadr"

	DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Flickr Uploadr"
	DeleteRegKey HKLM "Software\Flickr Uploadr"

	DeleteRegKey HKCR "SystemFileAssociations\image\shell\edit.FlickrUploadr"
	DeleteRegKey HKCR "SystemFileAssociations\image\shell\edit.FlickrUploadr\command"

	Delete "$INSTDIR"

	Delete "$SMPROGRAMS\Flickr Uploadr.lnk"
	Delete "$DESKTOP\Flickr Uploadr.lnk" 

	RMDir /r "$SMPROGRAMS\Flickr Uploadr"
	RMDir /r "$INSTDIR"

SectionEnd  

Icon ".\MacUploadr.app\Contents\Resources\icons.ico"