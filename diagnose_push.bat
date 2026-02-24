@echo off
echo "--- GIT STATUS ---" > push_log.txt
git status >> push_log.txt 2>&1
echo. >> push_log.txt
echo "--- GIT REMOTE ---" >> push_log.txt
git remote -v >> push_log.txt 2>&1
echo. >> push_log.txt
echo "--- GIT PUSH ---" >> push_log.txt
git push -u origin main >> push_log.txt 2>&1
echo "Done."
