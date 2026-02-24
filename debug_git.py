import subprocess

def run_git(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return f"--- Command: {cmd} ---\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}\nReturn Code: {result.returncode}\n"
    except Exception as e:
        return f"Error running {cmd}: {e}\n"

with open("git_debug_utf8.txt", "w", encoding="utf-8") as f:
    f.write(run_git("git status"))
    f.write(run_git("git ls-files backend/.env"))
    f.write(run_git("git ls-files backend/.env.example"))
    f.write(run_git("git ls-files backend/.gitignore"))
