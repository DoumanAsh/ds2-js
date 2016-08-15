#!/bin/bash

REPO=`git config remote.origin.url`
SHA=`git log -1 --format="%s(%h %cd)" --date=short`

git clone $REPO out/

cd out/

git checkout gh-pages
rm -rf *

cp -rf ../public/* .

git status
if [ -z `git status --porcelain` ]; then
    echo "No changes to the site"
    return 0
fi

git config user.name "Travis CI"
git config user.email "$COMMIT_AUTHOR_EMAIL"
echo "https://${GIT_TOKEN}:x-oauth-basic@github.com\n" > ~/.git-credentials
git config remote.origin.url "https://${GIT_TOKEN}@github.com/${TRAVIS_REPO_SLUG}.git"

git add --all .
git commit -m "Auto-update" -m "Commit: ${SHA}"
git push origin HEAD
