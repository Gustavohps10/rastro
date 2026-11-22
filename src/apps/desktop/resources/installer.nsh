!macro customInstall
  WriteRegStr SHCTX "Software\Classes\rastro" "" "URL:Rastro"
  WriteRegStr SHCTX "Software\Classes\rastro" "URL Protocol" ""
  WriteRegStr SHCTX "Software\Classes\rastro\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
!macroend

!macro customUnInstall
  ReadRegStr $0 SHCTX "Software\Classes\rastro\shell\open\command" ""
  StrCmp $0 '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"' 0 +2
  DeleteRegKey SHCTX "Software\Classes\rastro"
!macroend
