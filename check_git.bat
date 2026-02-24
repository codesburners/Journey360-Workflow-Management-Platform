@echo off
set LOGFILE=c:\Users\gowth\Desktop\Samsung_Prism\Journey360\git_state.txt
echo --- CURRENT BRANCH --- > %LOGFILE%
git branch -vv >> %LOGFILE% 2>&1
echo. >> %LOGFILE%
echo --- LS REMOTE --- >> %LOGFILE%
git ls-remote origin >> %LOGFILE% 2>&1
echo. >> %LOGFILE%
echo --- FETCH --- >> %LOGFILE%
git fetch origin -v >> %LOGFILE% 2>&1
echo. >> %LOGFILE%
echo --- STATUS --- >> %LOGFILE%
git status >> %LOGFILE% 2>&1
echo. >> %LOGFILE%
echo --- LOG --- >> %LOGFILE%
git log --oneline --graph -n 5 >> %LOGFILE% 2>&1
echo DONE.
